from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


NAVY = "0B2545"
BLUE = "1F5D9B"
GOLD = "C7922F"
LIGHT = "F3F6FA"
BORDER = "B8C9DC"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_borders(cell, color: str = BORDER, size: int = 8) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        node = borders.find(tag)
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), str(size))
        node.set(qn("w:color"), color)


def set_cell_width(cell, width_twips: int) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width_twips))
    tc_w.set(qn("w:type"), "dxa")


def format_table(table, widths: list[int]) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            if idx < len(widths):
                set_cell_width(cell, widths[idx])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_borders(cell)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.space_before = Pt(2)
                paragraph.paragraph_format.space_after = Pt(2)
                for run in paragraph.runs:
                    run.font.name = "Aptos"
                    run.font.size = Pt(9.2)


def style_header_row(row) -> None:
    for cell in row.cells:
        set_cell_shading(cell, NAVY)
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(9.2)


def add_table_before(target, headers: list[str], rows: list[list[str]], widths: list[int]) -> None:
    document = target.part.document
    table = document.add_table(rows=1, cols=len(headers))
    for idx, header in enumerate(headers):
        table.cell(0, idx).text = header
    for row_values in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row_values):
            cells[idx].text = value
    format_table(table, widths)
    style_header_row(table.rows[0])
    for row_index, row in enumerate(table.rows[1:], start=1):
        if row_index % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, LIGHT)
    target._p.addprevious(table._tbl)


def add_heading_before(target, text: str, style: str = "Heading 3"):
    paragraph = target.insert_paragraph_before(text)
    paragraph.style = style
    paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.keep_together = True
    return paragraph


def add_body_before(target, text: str, style: str = "Body Text"):
    paragraph = target.insert_paragraph_before(text)
    paragraph.style = style
    paragraph.paragraph_format.widow_control = True
    paragraph.paragraph_format.space_after = Pt(6)
    return paragraph


def add_bullet_before(target, text: str):
    paragraph = target.insert_paragraph_before(text)
    paragraph.style = "List Paragraph"
    paragraph.paragraph_format.left_indent = Inches(0.25)
    paragraph.paragraph_format.first_line_indent = Inches(-0.14)
    paragraph.paragraph_format.space_after = Pt(3)
    return paragraph


def add_image_before(target, image_path: Path, width: float, alt_text: str) -> None:
    paragraph = target.insert_paragraph_before()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_with_next = True
    run = paragraph.add_run()
    shape = run.add_picture(str(image_path), width=Inches(width))
    shape._inline.docPr.set("descr", alt_text)
    shape._inline.docPr.set("title", alt_text)


def add_caption_before(target, text: str) -> None:
    paragraph = target.insert_paragraph_before(text)
    if "PFA Caption" in [style.name for style in target.part.document.styles]:
        paragraph.style = "PFA Caption"
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.keep_together = True
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(6)
    for run in paragraph.runs:
        run.font.name = "Aptos"
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(11, 37, 69)
    return paragraph


def find_paragraph(document: Document, starts_with: str):
    for paragraph in document.paragraphs:
        if " ".join(paragraph.text.split()).startswith(starts_with):
            return paragraph
    raise ValueError(f"Paragraph not found: {starts_with}")


def find_heading(document: Document, starts_with: str, style_name: str):
    for paragraph in document.paragraphs:
        if paragraph.style and paragraph.style.name == style_name and " ".join(paragraph.text.split()).startswith(starts_with):
            return paragraph
    raise ValueError(f"Heading not found: {starts_with}")


def replace_in_paragraphs(document: Document, old: str, new: str) -> None:
    for paragraph in document.paragraphs:
        if old in paragraph.text:
            for run in paragraph.runs:
                run.text = run.text.replace(old, new)


def replace_full_paragraph_text(document: Document, starts_with: str, new_text: str) -> None:
    for paragraph in document.paragraphs:
        if " ".join(paragraph.text.split()).startswith(starts_with):
            if paragraph.runs:
                paragraph.runs[0].text = new_text
                for run in paragraph.runs[1:]:
                    run.text = ""
            else:
                paragraph.text = new_text
            return


def replace_in_tables(document: Document, old: str, new: str) -> None:
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                if old in cell.text:
                    cell.text = cell.text.replace(old, new)


def remove_paragraph(paragraph) -> None:
    element = paragraph._element
    element.getparent().remove(element)


def clear_paragraph(paragraph) -> None:
    for child in list(paragraph._p):
        if child.tag != qn("w:pPr"):
            paragraph._p.remove(child)


def paragraph_index(document: Document, target) -> int:
    for index, paragraph in enumerate(document.paragraphs):
        if paragraph._p is target._p:
            return index
    raise ValueError("Target paragraph is no longer in the document")


def insert_image_in_existing_paragraph(paragraph, image_path: Path, width: float, alt_text: str) -> None:
    clear_paragraph(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_with_next = True
    shape = paragraph.add_run().add_picture(str(image_path), width=Inches(width))
    shape._inline.docPr.set("descr", alt_text)
    shape._inline.docPr.set("title", alt_text)


def enable_field_updates(document: Document) -> None:
    settings = document.settings.element
    update_fields = settings.find(qn("w:updateFields"))
    if update_fields is None:
        update_fields = OxmlElement("w:updateFields")
        settings.append(update_fields)
    update_fields.set(qn("w:val"), "true")


def insert_chapter3_tools_and_specs(document: Document) -> None:
    target = find_heading(document, "3.2. Authentification, sécurité et utilisateurs", "Heading 2")

    add_heading_before(target, "3.1.3. Outils et environnement de développement")
    add_body_before(
        target,
        "La réalisation de la plateforme Park Auto MEF s'appuie sur un ensemble d'outils cohérents couvrant le développement backend, l'interface web, la persistance, la sécurité, la documentation des API et la production de documents. Les versions ci-dessous correspondent aux dépendances déclarées dans les projets livrés.",
    )
    add_table_before(
        target,
        ["Domaine", "Outil / version", "Utilisation dans le projet"],
        [
            ["Backend", "Java 17; Spring Boot 3.3.0; Maven", "API REST, injection de dépendances, validation et packaging."],
            ["Persistance", "Spring Data JPA; Hibernate; PostgreSQL", "Modèle relationnel, transactions ACID, requêtes paginées et intégrité référentielle."],
            ["Sécurité", "Spring Security 6; JJWT 0.12.5", "Authentification stateless, Access Token / Refresh Token et contrôle RBAC."],
            ["Frontend", "React 19.2.7; Vite 8.1.1; JavaScript/JSX", "Application SPA réactive, navigation et composants métier."],
            ["UI et expérience", "Tailwind CSS 3.4.19; Lucide React; Framer Motion", "Charte institutionnelle, icônes cohérentes et interactions fluides."],
            ["Données et graphiques", "Axios; Recharts", "Consommation des endpoints et visualisation des indicateurs."],
            ["Documentation", "Springdoc OpenAPI 2.5.0; Swagger UI", "Contrat et test interactif des endpoints REST."],
            ["Documents et exports", "OpenPDF 1.3.39; Apache POI 5.2.5", "Ordres de mission PDF et exports Excel."],
            ["Tests", "JUnit 5; Spring Boot Test; H2", "Tests unitaires, intégration et validation sans PostgreSQL."],
        ],
        [1750, 3000, 4470],
    )

    add_heading_before(target, "3.1.4. Spécifications fonctionnelles du site web")
    add_body_before(
        target,
        "Le site web est une application monopage destinée aux agents du MEF. Il centralise les données du parc automobile et expose des écrans spécialisés selon le rôle de l'utilisateur. Les échanges entre l'interface React et le backend Spring Boot sont réalisés au moyen d'API REST protégées par JWT.",
    )
    add_table_before(
        target,
        ["Périmètre", "Fonctionnalités couvertes", "Résultat attendu"],
        [
            ["Accès et administration", "Connexion, rafraîchissement de session, changement obligatoire du mot de passe, profils, rôles, verrouillage et audit.", "Accès contrôlé, traçable et adapté au périmètre de chaque agent."],
            ["Parc automobile", "Création, modification, recherche, filtres, fiche véhicule, kilométrage, statuts et archivage logique.", "Référentiel fiable des véhicules et historique des changements."],
            ["Missions", "Demandes de déplacement, validations hiérarchiques, affectation d'un véhicule et d'un conducteur, restitution.", "Workflow complet de réservation et émission de l'ordre de mission."],
            ["Exploitation", "Cartes et pleins de carburant, prévisions, maintenance préventive/curative, pannes, garages et pièces.", "Réduction des immobilisations et maîtrise des coûts d'exploitation."],
            ["Risques et conformité", "Assurances, sinistres, infractions, visites techniques, taxes et réforme.", "Suivi réglementaire, alertes d'échéance et sécurisation des décisions."],
            ["Pilotage", "Budget par direction, TCO, tableaux de bord, indicateurs, exports PDF/Excel et rapports.", "Aide à la décision fondée sur des données consolidées."],
            ["GED et notifications", "Dépôt de pièces justificatives, téléchargement contrôlé, alertes applicatives et emails SMTP.", "Dossiers complets et circulation rapide de l'information."],
        ],
        [1750, 4470, 3000],
    )

    add_heading_before(target, "3.1.5. Spécifications non fonctionnelles et critères de qualité")
    add_bullet_before(target, "Sécurité : aucun endpoint métier sensible n'est accessible sans authentification et autorisation ; les actions critiques sont journalisées avec l'utilisateur, l'horodatage et l'adresse IP.")
    add_bullet_before(target, "Intégrité : les contraintes d'unicité, la validation des DTO, les transactions et l'archivage logique évitent les suppressions incohérentes.")
    add_bullet_before(target, "Ergonomie : les écrans proposent une navigation latérale stable, des filtres, des tableaux lisibles, des modales de saisie et des indicateurs synthétiques.")
    add_bullet_before(target, "Maintenabilité : la séparation Controller / Service / Repository / DTO / Mapper réduit le couplage et facilite l'ajout de nouveaux chapitres fonctionnels.")
    add_bullet_before(target, "Interopérabilité : la documentation OpenAPI, les exports Excel/PDF et les réponses JSON standardisées facilitent l'intégration avec les systèmes du MEF.")
    add_bullet_before(target, "Évolutivité : les modules sont isolés par domaine et peuvent évoluer sans remettre en cause le socle d'authentification, d'audit et de reporting.")


def insert_chapter3_figures(document: Document, assets: Path) -> None:
    figure_assets = {
        "Figure 13 -": [("CH3_Asset_05_UseCase_Securite.png", "Cas d'utilisation de la sécurité et de l'administration")],
        "Figure 14 -": [("CH3_Asset_06_Classes_Securite.png", "Modèle de classes des habilitations")],
        "Figure 16 -": [("CH3_Asset_11_UseCase_Vehicules.png", "Cas d'utilisation de la gestion des véhicules")],
        "Figure 17 -": [("CH3_Asset_12_Classes_Vehicules.png", "Modèle de classes du module véhicules")],
        "Figure 18 -": [("CH3_Asset_13_Sequence_Enregistrement_Vehicule.png", "Séquence d'enregistrement d'un véhicule")],
        "Figure 20 -": [("CH3_Asset_14_UseCase_Missions.png", "Cas d'utilisation des missions")],
        "Figure 21 -": [("CH3_Asset_15_Classes_Missions.png", "Modèle de classes des missions")],
        "Figure 22 -": [("CH3_Asset_16_Sequence_Reservation_Affectation.png", "Séquence de réservation et d'affectation")],
        "Figure 24 -": [("CH3_Asset_17_UseCase_Carburant_Maintenance.png", "Cas d'utilisation du carburant et de la maintenance")],
        "Figure 25 -": [("CH3_Asset_18_Classes_Carburant_Maintenance.png", "Modèle de classes du carburant et de la maintenance")],
        "Figure 26 -": [("CH3_Asset_19_Sequence_Plein_Carburant.png", "Séquence de saisie d'un plein")],
        "Figure 27 -": [("CH3_Asset_20_UseCase_Assurances_Budget.png", "Cas d'utilisation des assurances, sinistres et budget")],
        "Figure 29 -": [("CH3_Asset_22_Sequence_Sinistre.png", "Séquence de déclaration et de traitement d'un sinistre")],
    }
    for caption_prefix, entries in figure_assets.items():
        target = find_paragraph(document, caption_prefix)
        for filename, alt in entries:
            add_image_before(target, assets / "chapter3" / "rendered" / filename, 6.15, alt)

    # Security flow: retain the single Figure 15 caption while showing its three concrete sequences.
    target = find_paragraph(document, "Figure 15 -")
    for filename, alt in [
        ("CH3_Asset_07_Sequence_Login_JWT.png", "Séquence d'authentification JWT"),
        ("CH3_Asset_08_Sequence_Refresh_Token.png", "Séquence de rafraîchissement du token"),
        ("CH3_Asset_09_Sequence_Changement_MDP.png", "Séquence de changement obligatoire du mot de passe"),
    ]:
        add_image_before(target, assets / "chapter3" / "rendered" / filename, 6.15, alt)

    # Add the security MPD immediately before its explanatory paragraph.
    target = find_paragraph(document, "Le schéma de la base de données relationnelle")
    add_image_before(target, assets / "chapter3" / "rendered" / "CH3_Asset_10_MPD_Securite.png", 6.15, "Modèle physique des données de sécurité")
    add_caption_before(target, "Figure 15D - Modèle physique des données de sécurité")

    # Insert representative UI captures for the website-specific sections.
    ui_assets = {
        "Figure 19 -": (assets / "all_extracted_screenshots" / "Sprint_2_Gestion_des_Vehicules_img4.png", "Formulaire React de création d'un véhicule"),
        "Figure 30 -": (assets / "all_extracted_screenshots" / "Rapport_Sprint_5_Assurances_Sinistres_Budget_Securite_img14.png", "Interface de déclaration d'un sinistre"),
        "Figure 32 -": (assets / "all_extracted_screenshots" / "Rapport_Sprint_5_Assurances_Sinistres_Budget_Securite_img12.png", "Tableau de bord budgétaire du site web"),
    }
    for caption_prefix, (path, alt) in ui_assets.items():
        target = find_paragraph(document, caption_prefix)
        # Some legacy captions are followed by an existing image paragraph. Reuse it
        # so the caption and the screenshot remain semantically paired.
        paragraphs = document.paragraphs
        idx = paragraph_index(document, target)
        if idx > 0 and paragraphs[idx - 1]._p.xpath(".//a:blip"):
            insert_image_in_existing_paragraph(paragraphs[idx - 1], path, 6.15, alt)
        else:
            add_image_before(target, path, 6.15, alt)

    replace_full_paragraph_text(document, "Figure 30 - Interface de suivi des assurances", "Figure 30 - Interface de déclaration et de suivi des sinistres")

    # Repair legacy figure pairings for captions that were already present in the baseline.
    budget_caption = find_paragraph(document, "Figure 32 -")
    budget_image = assets / "all_extracted_screenshots" / "Rapport_Sprint_5_Assurances_Sinistres_Budget_Securite_img12.png"
    paragraphs = document.paragraphs
    idx = paragraph_index(document, budget_caption)
    if idx > 0 and paragraphs[idx - 1]._p.xpath(".//a:blip"):
        insert_image_in_existing_paragraph(paragraphs[idx - 1], budget_image, 6.15, "Tableau de bord budgétaire du site web")

    # The legacy Figure 31 caption had no corresponding image in the baseline.
    # Remove it instead of leaving a dangling caption after the chapter synthesis.
    orphan_caption = find_paragraph(document, "Figure 31 -")
    remove_paragraph(orphan_caption)

    replace_full_paragraph_text(
        document,
        "L'application permet d'affecter une enveloppe budgétaire annuelle",
        "Cette interface guide l'agent lors de la déclaration d'un sinistre : sélection du véhicule et du conducteur, date et lieu de l'accident, nature, estimation des dommages, police associée, statut du dossier et référence d'expertise. La règle métier informe clairement que la déclaration entraîne la mise à jour du statut administratif du véhicule.",
    )

    # Place the budget dashboard before the chapter synthesis, then explain its role.
    synth_heading = find_heading(document, "3.7. Synthèse du chapitre", "Heading 2")
    budget_caption = find_paragraph(document, "Figure 32 -")
    idx = paragraph_index(document, budget_caption)
    budget_picture = document.paragraphs[idx - 1]
    synth_heading._p.addprevious(budget_picture._p)
    synth_heading._p.addprevious(budget_caption._p)
    add_body_before(
        synth_heading,
        "Le tableau de bord budgétaire consolide les montants alloués, engagés, réalisés et disponibles par direction et par nature de dépense. Les indicateurs, taux de consommation et prévisions carburant permettent au responsable financier d'identifier rapidement les dépassements et d'arbitrer les enveloppes annuelles.",
    )


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source = root / "rapports" / "Rapport_PFA_Gestion_Parc_Automobile_Version_Professionnelle.docx"
    output = root / "rapports" / "Rapport_PFA_Gestion_Parc_Automobile_Final.docx"
    assets = root / "assets"
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, output)
    document = Document(output)

    replace_in_paragraphs(document, "React 18 avec TypeScript et Vite", "React 19.2.7 avec JavaScript/JSX et Vite 8.1.1")
    replace_in_paragraphs(document, "React 18 / TypeScript / Vite", "React 19.2.7 / JavaScript- JSX / Vite 8.1.1")
    replace_in_tables(document, "React 18 / TypeScript / Vite", "React 19.2.7 / JavaScript- JSX / Vite 8.1.1")
    replace_in_tables(document, "PostgreSQL / SQL Server", "PostgreSQL 12+ / H2 (tests)")
    replace_full_paragraph_text(
        document,
        "Développement d'une API REST de gestion du parc automobile",
        "Conception et développement d'une plateforme web intégrée de gestion du parc automobile du Ministère de l'Économie et des Finances",
    )
    insert_chapter3_tools_and_specs(document)
    insert_chapter3_figures(document, assets)
    enable_field_updates(document)
    document.core_properties.title = "Rapport PFA - Gestion du Parc Automobile MEF"
    document.core_properties.subject = "Rapport principal editable - outils, specifications et realisation du site web"
    document.core_properties.author = "EL KHATOURY Hassan"
    document.core_properties.keywords = "PFA, Park Auto MEF, Spring Boot, React, gestion de parc automobile"
    document.save(output)
    print(output)


if __name__ == "__main__":
    main()

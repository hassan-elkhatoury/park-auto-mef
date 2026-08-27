import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

DOCX_OUTPUT_PLANNING = "planning/Planning_Sprint_8_Finalisation_Recette_Et_Livraison_Finale.docx"
DOCX_OUTPUT_ROOT = "Planning_Sprint_8_Finalisation_Recette_Et_Livraison_Finale.docx"
PDF_OUTPUT_PLANNING = "planning/Planning_Sprint_8_Finalisation_Recette_Et_Livraison_Finale.pdf"

# ==============================================================================
# 1. HELPERS DOCX
# ==============================================================================
def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

# ==============================================================================
# 2. GENERATION DU PLANNING SPRINT 8 DOCX
# ==============================================================================
def build_docx_planning():
    doc = docx.Document()

    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    NAVY = RGBColor(15, 29, 50)          # #0F1D32
    GOLD = RGBColor(197, 160, 89)        # #C5A059
    BLUE_ACCENT = RGBColor(37, 99, 235)  # #2563EB
    DARK_GRAY = RGBColor(51, 65, 85)     # #334155
    EMERALD = RGBColor(5, 150, 105)      # #059669

    # Institution Header
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("ROYAUME DU MAROC\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\n")
    r_inst.bold = True
    r_inst.font.size = Pt(11)
    r_inst.font.color.rgb = NAVY

    r_div = p_inst.add_run("Direction des Affaires Administratives et Générales — Division du Parc Automobile\n")
    r_div.font.size = Pt(9.5)
    r_div.font.color.rgb = GOLD
    p_inst.paragraph_format.space_after = Pt(4)

    # Main Title
    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t1 = p_t.add_run("PLANNING DU SPRINT 8 (LIVRAISON FINALE & CLÔTURE)\n")
    r_t1.bold = True
    r_t1.font.size = Pt(16)
    r_t1.font.color.rgb = NAVY

    r_t2 = p_t.add_run("Finalisation, Recette Globale UAT, Moteur d'Exports de Données & Corrections de Bugs\n")
    r_t2.bold = True
    r_t2.font.size = Pt(11.5)
    r_t2.font.color.rgb = BLUE_ACCENT

    r_t3 = p_t.add_run("Période prévisionnelle : 31/08/2026 au 04/09/2026 — Conforme CdC MEF & Recommandations Agile")
    r_t3.font.size = Pt(9.5)
    r_t3.italic = True
    r_t3.font.color.rgb = DARK_GRAY
    p_t.paragraph_format.space_after = Pt(12)

    # --- 1. Informations Générales ---
    h1 = doc.add_heading("1. Informations Générales du Sprint 8", level=1)
    h1.runs[0].font.color.rgb = NAVY
    h1.runs[0].font.size = Pt(12.5)

    info_table = doc.add_table(rows=6, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_table.autofit = False

    info_data = [
        ("Projet & Application", "Park Auto MEF — Système Intégré de Gestion du Parc Automobile"),
        ("Sprint & Périmètre", "Sprint 8 — Finalisation, Recette Globale (UAT), Exports de Données & Livraison"),
        ("Période d'Exécution", "31/08/2026 au 04/09/2026 (5 jours ouvrés)"),
        ("Conformité CdC MEF", "Sections 24 (Exports & Reporting), 25 (Sécurité & Audit Trail), 26 (Recette & Déploiement)"),
        ("Statut d'Avancement Global", "Sprints 1 à 7 réalisés avec succès (100% des règles de gestion métier implémentées)"),
        ("Objectif Principal", "Conduire la recette fonctionnelle et technique globale de bout en bout, stabiliser le moteur d'exports de données massives (Excel, PDF, CSV), corriger les anomalies résiduelles, optimiser les performances et préparer le package de déploiement en production.")
    ]

    for idx, (lbl, val) in enumerate(info_data):
        row = info_table.rows[idx]
        row.cells[0].width = Inches(2.2)
        row.cells[1].width = Inches(4.6)

        row.cells[0].text = lbl
        row.cells[0].paragraphs[0].runs[0].font.bold = True
        row.cells[0].paragraphs[0].runs[0].font.size = Pt(9)
        row.cells[0].paragraphs[0].runs[0].font.color.rgb = NAVY
        set_cell_background(row.cells[0], "F1F5F9")
        set_cell_margins(row.cells[0], 60, 60, 100, 100)

        row.cells[1].text = val
        row.cells[1].paragraphs[0].runs[0].font.size = Pt(9)
        row.cells[1].paragraphs[0].runs[0].font.color.rgb = DARK_GRAY
        set_cell_background(row.cells[1], "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_margins(row.cells[1], 60, 60, 100, 100)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- 2. Contenu Détaillé du Sprint 8 ---
    h2 = doc.add_heading("2. Contenu Détaillé et Backlog du Sprint 8", level=1)
    h2.runs[0].font.color.rgb = NAVY
    h2.runs[0].font.size = Pt(12.5)

    h2_1 = doc.add_heading("2.1. Backlog Fonctionnel & Technique (Exigences CdC MEF)", level=2)
    h2_1.runs[0].font.color.rgb = BLUE_ACCENT
    h2_1.runs[0].font.size = Pt(11)

    features = [
        ("1. Recette Fonctionnelle Globale de Bout en Bout (UAT MEF)", [
            "Validation intégrale des scénarios transversaux : Création Véhicule ➔ Affectation / Mission ➔ Consommation Carburant ➔ Maintenance Préventive / Panne ➔ Sinistre & Assurance ➔ Imputation Budgétaire (RG01) ➔ Calcul TCO (RG02) ➔ Clôture d'Exercice (RG04).",
            "Vérification de la non-régression sur l'ensemble des 8 modules du système.",
            "Contrôle d'étanchéité des rôles utilisateurs et de la matrice des habilitations RBAC (ADMIN, GESTIONNAIRE_PARC, GESTIONNAIRE_FINANCIER, CONDUCTEUR, DIRECTION_GENERALE)."
        ]),
        ("2. Moteur d'Exportation Massive de Données Multi-Formats (CdC Section 24)", [
            "Finalisation des exports Excel (.xlsx) avec Apache POI : classeurs multi-onglets (Parc, Missions, Carburant, Maintenance, Sinistres, Budget, TCO) avec formules de synthèse comptable.",
            "Consolidation des exports PDF exécutifs via OpenPDF : mise en page officielle, en-tête institutionnel du MEF, tableaux dynamiques et scellement d'authenticité.",
            "Génération d'extractions au format CSV standardisé pour l'interopérabilité avec les systèmes d'information décisionnels (SID) du Ministère."
        ]),
        ("3. Corrections d'Anomalies, Polissage UX/UI & Optimisation des Performances", [
            "Traitement systématique des retours utilisateurs et corrections de bugs mineurs identifiés lors des démonstrations des sprints 6 et 7.",
            "Polissage ergonomique du Frontend React/Vite : uniformisation visuelle (palette MEF), responsive design sur tablettes et écrans de contrôle, gestion fluide du scrolling horizontal sur tables volumineuses.",
            "Optimisation des temps de réponse (< 200 ms) via l'indexation SQL PostgreSQL et la mise en cache des calculs de KPIs volumineux."
        ]),
        ("4. Sécurité, Audit Trail & Conformité Réglementaire (CdC Section 25)", [
            "Vérification de la traçabilité complète : journalisation immuable de chaque opération sensible dans l'AuditLog (action, utilisateur, entité impactée, adresse IP, horodatage).",
            "Contrôle de conformité avec les directives de la DGSSI (sécurisation des endpoints REST, hachage BCrypt, tokens JWT avec expiration maîtrisée).",
            "Purge et sécurisation des documents GED confidentiels (contrats d'assurance, PV de constat, factures)."
        ]),
        ("5. Packaging de Déploiement & Préparation à la Mise en Production (CdC Section 26)", [
            "Finalisation de la configuration Docker et Docker-Compose pour l'orchestration multi-conteneurs (Spring Boot Backend, React Frontend, PostgreSQL Database, Nginx Reverse Proxy).",
            "Validation des scripts d'initialisation et de migration de base de données avec jeu de données démo MEF complet.",
            "Rédaction du Manuel d'Exploitation Technique et du Guide Utilisateur Final."
        ])
    ]

    for title, points in features:
        p_feat = doc.add_paragraph()
        r_f = p_feat.add_run(f"• {title}\n")
        r_f.bold = True
        r_f.font.size = Pt(9.5)
        r_f.font.color.rgb = NAVY
        for pt in points:
            p_pt = doc.add_paragraph()
            p_pt.paragraph_format.left_indent = Inches(0.2)
            p_pt.paragraph_format.space_after = Pt(2)
            rpt = p_pt.add_run(f"- {pt}")
            rpt.font.size = Pt(8.8)
            rpt.font.color.rgb = DARK_GRAY

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2.2 Priorisation MoSCoW & Règles de Gestion
    h2_2 = doc.add_heading("2.2. Priorisation MoSCoW et Règles de Gestion Métier du Sprint 8", level=2)
    h2_2.runs[0].font.color.rgb = BLUE_ACCENT
    h2_2.runs[0].font.size = Pt(11)

    moscow_items = [
        ("MoSCoW - Must Have (Priorité 1 — Impératif)", "Recette UAT de bout en bout validée à 100%, Exports Excel POI et PDF OpenPDF fonctionnels sur l'ensemble des modules, Zéro bug bloquant ou majeur, Sécurisation complète RBAC/JWT et Journalisation d'Audit."),
        ("MoSCoW - Should Have (Priorité 2 — Essentiel)", "Exports de données au format CSV standardisé, Optimisation des requêtes SQL et indexation de la base PostgreSQL, Documentation complète d'exploitation."),
        ("MoSCoW - Could Have (Priorité 3 — Optionnel)", "Génération automatique d'un rapport synthétique d'audit de recette téléchargeable en 1 clic.")
    ]

    for cat, desc in moscow_items:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.left_indent = Inches(0.1)
        p_m.paragraph_format.space_after = Pt(2)
        r_mb = p_m.add_run(f"📌 {cat} : ")
        r_mb.bold = True
        r_mb.font.size = Pt(8.8)
        r_mb.font.color.rgb = NAVY
        r_md = p_m.add_run(desc)
        r_md.font.size = Pt(8.8)
        r_md.font.color.rgb = DARK_GRAY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table des Règles de Gestion Métier Sprint 8
    tbl_rg = doc.add_table(rows=6, cols=3)
    tbl_rg.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_rg.autofit = False

    hdr_cells = tbl_rg.rows[0].cells
    hdr_cells[0].width = Inches(1.1)
    hdr_cells[1].width = Inches(2.2)
    hdr_cells[2].width = Inches(3.5)
    for c_idx, title in enumerate(["Règle", "Intitulé Métier", "Description & Comportement Système"]):
        hdr_cells[c_idx].text = title
        hdr_cells[c_idx].paragraphs[0].runs[0].font.bold = True
        hdr_cells[c_idx].paragraphs[0].runs[0].font.size = Pt(9)
        hdr_cells[c_idx].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(hdr_cells[c_idx], "0F1D32")
        set_cell_margins(hdr_cells[c_idx], 80, 80, 100, 100)

    rules_sprint8 = [
        ("RG01", "Intégrité des Données & Non-Répudiation", "Toute création, modification ou suppression d'entité métier (Véhicule, Mission, Intervention, Sinistre, Engagement) génère un AuditLog horodaté et inaltérable contenant l'identité de l'opérateur et l'adresse IP."),
        ("RG02", "Conformité des Formats d'Exportation", "Les fichiers Excel (.xlsx) et PDF (.pdf) générés doivent être scellés, lisibles sans avertissement de corruption sur tous les environnements bureautiques MEF et intégrer la charte graphique institutionnelle."),
        ("RG03", "Critère Zéro Défaut Bloquant (Recette UAT)", "Aucun bogue de sévérité 'Bloquante' (crash, blocage de flux) ou 'Majeure' (erreur de calcul financier) ne doit subsister à la clôture de la recette fonctionnelle."),
        ("RG04", "Garantie de Performance & Temps de Réponse", "Les temps de réponse sur les calculs de consolidation budgétaire et de reporting TCO doivent demeurer strictement inférieurs à 300 millisecondes sous charge nominale."),
        ("RG05", "Validation Formelle & PV de Recette Finale", "La clôture définitive du projet Park Auto MEF est conditionnée par la signature formelle du Procès-Verbal de Recette Finale (PV) par les représentants mandatés du Ministère.")
    ]

    for idx, (rg, intit, desc) in enumerate(rules_sprint8):
        row = tbl_rg.rows[idx + 1]
        row.cells[0].width = Inches(1.1)
        row.cells[1].width = Inches(2.2)
        row.cells[2].width = Inches(3.5)

        row.cells[0].text = rg
        row.cells[0].paragraphs[0].runs[0].font.bold = True
        row.cells[0].paragraphs[0].runs[0].font.size = Pt(8.5)
        row.cells[0].paragraphs[0].runs[0].font.color.rgb = BLUE_ACCENT
        set_cell_background(row.cells[0], "EFF6FF")
        set_cell_margins(row.cells[0], 60, 60, 80, 80)

        row.cells[1].text = intit
        row.cells[1].paragraphs[0].runs[0].font.bold = True
        row.cells[1].paragraphs[0].runs[0].font.size = Pt(8.5)
        row.cells[1].paragraphs[0].runs[0].font.color.rgb = NAVY
        set_cell_background(row.cells[1], "F8FAFC")
        set_cell_margins(row.cells[1], 60, 60, 80, 80)

        row.cells[2].text = desc
        row.cells[2].paragraphs[0].runs[0].font.size = Pt(8.2)
        row.cells[2].paragraphs[0].runs[0].font.color.rgb = DARK_GRAY
        set_cell_background(row.cells[2], "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_margins(row.cells[2], 60, 60, 80, 80)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- 3. Organisation & Calendrier Jour par Jour ---
    h3 = doc.add_heading("3. Organisation du Sprint 8 et Calendrier Jour par Jour", level=1)
    h3.runs[0].font.color.rgb = NAVY
    h3.runs[0].font.size = Pt(12.5)

    tbl_cal = doc.add_table(rows=6, cols=3)
    tbl_cal.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_cal.autofit = False

    cal_hdrs = ["Jour & Date", "Phase & Activités Clés", "Résultats & Livrables Attendus"]
    for c_idx, title in enumerate(cal_hdrs):
        cell = tbl_cal.rows[0].cells[c_idx]
        cell.text = title
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(8.5)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "0F1D32")
        set_cell_margins(cell, 60, 60, 80, 80)

    calendar_data = [
        ("Jour 1 — Lundi 31/08/2026", "Lancement de la Recette Fonctionnelle UAT Globale", "Exécution des scénarios de test sur les 8 modules métier (Parc, Missions, Carburant, Maintenance, Sinistres, Budget, TCO, GED). Établissement du journal des anomalies."),
        ("Jour 2 — Mardi 01/09/2026", "Validation & Stabilisation du Moteur d'Exports", "Tests de charge sur la génération des classeurs Excel Apache POI multi-onglets et des PDF institutionnels OpenPDF. Validation des extractions CSV."),
        ("Jour 3 — Mercredi 02/09/2026", "Correction des Anomalies & Polissage UX/UI", "Résolution de tous les bogues identifiés lors de la recette. Polissage de l'interface Frontend (responsive, styles MEF, filtres de recherche et pagination fluide)."),
        ("Jour 4 — Jeudi 03/09/2026", "Audits de Sécurité, Audit Trail & Performance", "Vérification des habilitations RBAC, validation de la journalisation des actions dans AuditLog, indexation SQL et tests de temps de réponse sous 200 ms."),
        ("Jour 5 — Vendredi 04/09/2026", "Packaging de Déploiement & Démonstration Finale", "Finalisation des conteneurs Docker/Compose, guides d'exploitation, démonstration officielle finale devant la commission du MEF et signature du PV de Recette.")
    ]

    for idx, (j_date, phase, res) in enumerate(calendar_data):
        row = tbl_cal.rows[idx + 1]
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(2.3)
        row.cells[2].width = Inches(2.7)

        row.cells[0].text = j_date
        row.cells[0].paragraphs[0].runs[0].font.bold = True
        row.cells[0].paragraphs[0].runs[0].font.size = Pt(8)
        row.cells[0].paragraphs[0].runs[0].font.color.rgb = BLUE_ACCENT
        set_cell_background(row.cells[0], "F8FAFC")
        set_cell_margins(row.cells[0], 50, 50, 60, 60)

        row.cells[1].text = phase
        row.cells[1].paragraphs[0].runs[0].font.bold = True
        row.cells[1].paragraphs[0].runs[0].font.size = Pt(8)
        row.cells[1].paragraphs[0].runs[0].font.color.rgb = NAVY
        set_cell_background(row.cells[1], "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_margins(row.cells[1], 50, 50, 60, 60)

        row.cells[2].text = res
        row.cells[2].paragraphs[0].runs[0].font.size = Pt(8)
        row.cells[2].paragraphs[0].runs[0].font.color.rgb = DARK_GRAY
        set_cell_background(row.cells[2], "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_margins(row.cells[2], 50, 50, 60, 60)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- 4. Livrables Attendus ---
    h4 = doc.add_heading("4. Livrables Attendus du Sprint 8 et Clôture du Projet", level=1)
    h4.runs[0].font.color.rgb = NAVY
    h4.runs[0].font.size = Pt(12.5)

    deliverables = [
        "Code Source Final Consolidé & Testé : Backend Java 17 / Spring Boot sécurisé (100% tests JUnit 5 validés) et Frontend React / Tailwind / Vite sans aucune erreur de build.",
        "Moteur d'Exportation Décisionnel Validé : Services d'exportation Excel POI (.xlsx), PDF exécutifs scellés OpenPDF (.pdf) et extractions structurées (.csv).",
        "Cahier de Recette UAT & Rapport de Tests : Document officiel consignant les résultats de recette fonctionnelle de bout en bout avec zéro anomalie bloquante.",
        "Package de Déploiement & Conteneurisation : Dockerfile multi-stage, docker-compose.yml complet (Backend, Frontend, PostgreSQL, Nginx) et scripts d'amorçage BDD.",
        "Documentation Technique & Guide Utilisateur : Manuel d'exploitation technique, spécifications complètes des APIs REST (Swagger UI) et guide utilisateur illustré du MEF.",
        "Séance de Démonstration & Recette Finale : Vendredi 4 septembre 2026 à 11h00 au Ministère de l'Économie et des Finances."
    ]

    for dev in deliverables:
        p_d = doc.add_paragraph()
        p_d.paragraph_format.left_indent = Inches(0.1)
        p_d.paragraph_format.space_after = Pt(3)
        r_b = p_d.add_run("✔ ")
        r_b.bold = True
        r_b.font.color.rgb = EMERALD
        r_t = p_d.add_run(dev)
        r_t.font.size = Pt(8.8)
        r_t.font.color.rgb = DARK_GRAY

    doc.save(DOCX_OUTPUT_PLANNING)
    doc.save(DOCX_OUTPUT_ROOT)
    print("[OK] Planning Sprint 8 DOCX genere avec succes :", DOCX_OUTPUT_PLANNING)

# ==============================================================================
# 3. GENERATION DU PLANNING SPRINT 8 PDF
# ==============================================================================
class NumberedCanvasMEF(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvasMEF, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvasMEF, self).showPage()
        super(NumberedCanvasMEF, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header
        self.drawString(54, 800, "Royaume du Maroc — MEF | Park Auto MEF")
        self.drawRightString(A4[0] - 54, 800, "Planning Sprint 8 (Livraison Finale & Recette)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 792, A4[0] - 54, 792)

        # Footer
        self.line(54, 45, A4[0] - 54, 45)
        self.drawString(54, 32, "Ministère de l'Économie et des Finances — Application de Gestion du Parc Automobile")
        page_text = f"Page {self._pageNumber} sur {page_count}"
        self.drawRightString(A4[0] - 54, 32, page_text)
        self.restoreState()

def build_pdf_planning():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PLANNING,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    NAVY_HEX = "#0F1D32"
    GOLD_HEX = "#C5A059"
    BLUE_HEX = "#2563EB"
    DARK_HEX = "#334155"
    EMERALD_HEX = "#059669"

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=14, leading=17,
        textColor=colors.HexColor(NAVY_HEX), alignment=1, spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=12,
        textColor=colors.HexColor(BLUE_HEX), alignment=1, spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'H1', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=13,
        textColor=colors.HexColor(NAVY_HEX), spaceBefore=8, spaceAfter=4, keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2', parent=styles['Heading3'],
        fontName='Helvetica-Bold', fontSize=9, leading=11.5,
        textColor=colors.HexColor(BLUE_HEX), spaceBefore=6, spaceAfter=2, keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.8, leading=10.5,
        textColor=colors.HexColor(DARK_HEX), spaceAfter=2
    )

    story = []

    # Title Banner
    story.append(Paragraph("ROYAUME DU MAROC — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES", ParagraphStyle('Inst', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=10, textColor=colors.HexColor(NAVY_HEX), alignment=1)))
    story.append(Paragraph("Direction des Affaires Administratives et Générales — Division du Parc Automobile", ParagraphStyle('SubInst', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=9, textColor=colors.HexColor(GOLD_HEX), alignment=1, spaceAfter=4)))
    story.append(Paragraph("PLANNING DU SPRINT 8 (LIVRAISON FINALE & CLÔTURE DU PROJET)", title_style))
    story.append(Paragraph("Recette Globale UAT, Moteur d'Exports de Données, Sécurité Audit & Déploiement Final", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(NAVY_HEX), spaceAfter=6))

    # 1. Informations Générales
    story.append(Paragraph("1. Informations Générales du Sprint 8", h1_style))
    info_rows = [
        [Paragraph("<b>Projet & Application</b>", body_style), Paragraph("Park Auto MEF — Système Intégré de Gestion du Parc Automobile", body_style)],
        [Paragraph("<b>Sprint & Périmètre</b>", body_style), Paragraph("Sprint 8 — Finalisation, Recette Globale (UAT), Exports de Données & Livraison", body_style)],
        [Paragraph("<b>Période d'Exécution</b>", body_style), Paragraph("31/08/2026 au 04/09/2026 (5 jours ouvrés)", body_style)],
        [Paragraph("<b>Conformité CdC MEF</b>", body_style), Paragraph("Sections 24 (Exports & Reporting), 25 (Sécurité & Audit), 26 (Recette & Déploiement)", body_style)],
        [Paragraph("<b>Statut d'Avancement</b>", body_style), Paragraph("Sprints 1 à 7 réalisés avec succès (100% des règles de gestion métier implémentées)", body_style)],
        [Paragraph("<b>Objectif Principal</b>", body_style), Paragraph("Recette fonctionnelle globale, stabilisation des exports massifs (Excel, PDF, CSV), correction des anomalies et packaging de production.", body_style)]
    ]
    t_info = Table(info_rows, colWidths=[130, 375])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#FFFFFF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_info)
    story.append(Spacer(1, 6))

    # 2. Contenu Détaillé du Sprint 8
    story.append(Paragraph("2. Contenu Détaillé du Sprint 8", h1_style))
    story.append(Paragraph("2.1. Backlog Fonctionnel & Technique", h2_style))
    
    b_pts = [
        ("Recette UAT de Bout en Bout :", "Validation intégrale des flux transversaux (Véhicule ➔ Mission ➔ Carburant ➔ Maintenance ➔ Sinistre ➔ Budget RG01 ➔ TCO RG02 ➔ Clôture RG04)."),
        ("Moteur d'Exports Multi-Formats :", "Exports Excel POI multi-onglets avec formules comptables, PDF exécutifs scellés OpenPDF et extractions CSV pour le SID ministériel."),
        ("Corrections de Bugs & UX :", "Résolution de tous les retours d'anomalies, polissage graphique responsive React/Vite et temps de réponse sous 200 ms."),
        ("Sécurité & Audit Trail :", "Journalisation immuable dans AuditLog, conformité directives DGSSI, sécurisation des endpoints REST et tokens JWT."),
        ("Packaging & Déploiement :", "Images Docker multi-stage, orchestration Docker-Compose (Backend, Frontend, PostgreSQL, Nginx) et documentation complète.")
    ]
    for tag, desc in b_pts:
        story.append(Paragraph(f"• <b>{tag}</b> {desc}", body_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("2.2. Règles de Gestion Métier du Sprint 8", h2_style))
    rg_rows = [
        [Paragraph("<b>Règle</b>", body_style), Paragraph("<b>Intitulé Métier</b>", body_style), Paragraph("<b>Description & Comportement Système</b>", body_style)],
        [Paragraph("<b>RG01</b>", body_style), Paragraph("Intégrité & Audit Trail", body_style), Paragraph("Toute opération métier sensible génère un AuditLog horodaté et inaltérable avec IP et identité de l'opérateur.", body_style)],
        [Paragraph("<b>RG02</b>", body_style), Paragraph("Conformité des Exports", body_style), Paragraph("Les fichiers générés (.xlsx, .pdf, .csv) sont scellés et conformes à la charte institutionnelle du MEF.", body_style)],
        [Paragraph("<b>RG03</b>", body_style), Paragraph("Zéro Défaut Bloquant", body_style), Paragraph("Aucune anomalie de sévérité bloquante ou majeure ne subsiste à l'issue de la recette fonctionnelle UAT.", body_style)],
        [Paragraph("<b>RG04</b>", body_style), Paragraph("Performance & Débit", body_style), Paragraph("Temps de réponse strictement inférieurs à 300 ms sur l'ensemble des calculs analytiques et KPIs.", body_style)],
        [Paragraph("<b>RG05</b>", body_style), Paragraph("PV de Recette Finale", body_style), Paragraph("Clôture définitive du projet conditionnée par la signature du Procès-Verbal de Recette officiel du MEF.", body_style)]
    ]
    t_rg = Table(rg_rows, colWidths=[50, 135, 320])
    t_rg.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F1D32")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor("#EFF6FF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5)
    ]))
    story.append(t_rg)
    story.append(Spacer(1, 6))

    # 3. Calendrier Jour par Jour
    story.append(Paragraph("3. Calendrier Jour par Jour (31/08 – 04/09/2026)", h1_style))
    cal_rows = [
        [Paragraph("<b>Jour & Date</b>", body_style), Paragraph("<b>Phase & Activités Clés</b>", body_style), Paragraph("<b>Résultats & Livrables Attendus</b>", body_style)],
        [Paragraph("<b>Lundi 31/08</b>", body_style), Paragraph("Recette Fonctionnelle UAT", body_style), Paragraph("Exécution des scénarios transversaux sur les 8 modules métier.", body_style)],
        [Paragraph("<b>Mardi 01/09</b>", body_style), Paragraph("Moteur d'Exports de Données", body_style), Paragraph("Validation des classeurs Excel POI, PDF OpenPDF et CSV.", body_style)],
        [Paragraph("<b>Mercredi 02/09</b>", body_style), Paragraph("Corrections & Polissage UX", body_style), Paragraph("Résolution des anomalies et perfectionnement du frontend React.", body_style)],
        [Paragraph("<b>Jeudi 03/09</b>", body_style), Paragraph("Sécurité, Audit & Hardening", body_style), Paragraph("Audits RBAC, validation de l'AuditLog et indexation SQL PostgreSQL.", body_style)],
        [Paragraph("<b>Vendredi 04/09</b>", body_style), Paragraph("Packaging & Démonstration Finale", body_style), Paragraph("Docker-Compose, documentation et signature du PV de Recette MEF.", body_style)]
    ]
    t_cal = Table(cal_rows, colWidths=[80, 160, 265])
    t_cal.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F1D32")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5)
    ]))
    story.append(t_cal)
    story.append(Spacer(1, 6))

    # 4. Livrables Attendus
    story.append(Paragraph("4. Livrables Attendus du Sprint 8", h1_style))
    devs = [
        "Code Source Final Stabilisé : Backend Spring Boot (tests JUnit 5 100% OK) & Frontend React/Vite sans erreur.",
        "Moteur d'Exports Validé : Fichiers Excel POI (.xlsx), PDF exécutifs scellés (.pdf) et extractions CSV conformes.",
        "Cahier de Recette UAT & Rapport de Tests : Document consignant les résultats de recette avec zéro bogue bloquant.",
        "Package Docker de Déploiement : Dockerfile multi-stage, docker-compose.yml complet et scripts d'initialisation BDD.",
        "Documentation & Guide Utilisateur : Manuel d'exploitation technique et guide utilisateur illustré du MEF.",
        "Démonstration & Validation Finale : Vendredi 4 septembre 2026 à 11h00 au MEF avec signature du PV de Recette."
    ]
    for d in devs:
        story.append(Paragraph(f"✔ <font color='{EMERALD_HEX}'><b>[Livrable]</b></font> {d}", body_style))

    doc.build(story, canvasmaker=NumberedCanvasMEF)
    print("[OK] Planning Sprint 8 PDF genere avec succes :", PDF_OUTPUT_PLANNING)

if __name__ == '__main__':
    build_docx_planning()
    build_pdf_planning()
    print("=== PLANNING SPRINT 8 GENERE AVEC SUCCES EN DOCX ET PDF ===")

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header
        self.drawString(54, 800, "Royaume du Maroc — MEF | Park Auto MEF")
        self.drawRightString(A4[0] - 54, 800, "Planning Sprint 6 (Maintenance, Pannes & Sinistres)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 792, A4[0] - 54, 792)

        # Footer
        self.line(54, 45, A4[0] - 54, 45)
        self.drawString(54, 32, "Ministère de l'Économie et des Finances — Application de Gestion du Parc Automobile")
        page_text = f"Page {self._pageNumber} sur {page_count}"
        self.drawRightString(A4[0] - 54, 32, page_text)
        self.restoreState()

def generate_pdf_for_path(pdf_filename):
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    NAVY_HEX = "#0F1D32"
    BLUE_HEX = "#4F81BD"
    DARK_HEX = "#2D3748"

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor(NAVY_HEX),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor(BLUE_HEX),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor(NAVY_HEX),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor(BLUE_HEX),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor(DARK_HEX),
        spaceAfter=3
    )

    bold_feat_style = ParagraphStyle(
        'BoldFeat',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor(NAVY_HEX),
        spaceBefore=4,
        spaceAfter=2
    )

    rule_style = ParagraphStyle(
        'RuleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12,
        textColor=colors.HexColor(DARK_HEX),
        leftIndent=10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=14,
        spaceAfter=3
    )

    story = []

    # Title Banner
    story.append(Paragraph("Planning du Sprint 6 (Conforme CdC MEF & Recommandations Agile)", title_style))
    story.append(Paragraph("Gestion de la Maintenance, des Pannes & Traitement des Sinistres (17/08 – 21/08/2026)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor(BLUE_HEX), spaceAfter=10))

    # 1. Informations Générales
    story.append(Paragraph("1. Informations Générales du Sprint 6", h1_style))

    info_data = [
        [Paragraph("<b>Sprint</b>", body_style), Paragraph("Sprint 6 — Maintenance, Pannes & Sinistres", body_style)],
        [Paragraph("<b>Période prévisionnelle</b>", body_style), Paragraph("17/08/2026 au 21/08/2026 (5 jours ouvrés)", body_style)],
        [Paragraph("<b>Conformité CdC MEF</b>", body_style), Paragraph("<b>Sections 14 (Sinistres), 15 (Entretiens) & 16 (Pannes/Réparations)</b>", body_style)],
        [Paragraph("<b>Objectif</b>", body_style), Paragraph(
            "Spécifier, concevoir et développer le système global de suivi des entretiens préventifs, des interventions curatives sur pannes, de la gestion des garages agréés, du remplacement des pièces détachées et du processus complet de traitement et suivi des sinistres/accidents du parc automobile MEF.",
            body_style
        )]
    ]

    t_info = Table(info_data, colWidths=[130, 354])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#FFFFFF")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor(DARK_HEX)),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94A3B8")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 8))

    # 2. Contenu du Sprint 6
    story.append(Paragraph("2. Contenu Détaillé du Sprint 6", h1_style))
    story.append(Paragraph("2.1. Backlog Fonctionnel (Exigences CdC MEF)", h2_style))

    features = [
        ("1. Maintenance Préventive & Planification des Entretiens (CdC Section 15)", [
            "Programmation des révisions périodiques par seuil kilométrique (ex: 10 000 km, 20 000 km) ou fréquence temporelle.",
            "Déclenchement automatique d'alerte de maintenance préventive lorsque le véhicule atteint 90% du seuil kilométrique.",
            "Gestion des types d'entretiens : vidange, remplacement de filtres, contrôle des freins, remplacement pneumatiques, entretien batterie, climatisation et révision générale.",
            "Enregistrement de la réalisation : date réelle, kilométrage effectif, prestataire/garage agréé, détail des pièces remplacées, coût main d'œuvre, coût pièces, facture et calcul de la prochaine échéance."
        ]),
        ("2. Gestion des Pannes & Réparations Curatives (CdC Section 16)", [
            "Déclaration de panne : enregistrement des pannes par le conducteur/gestionnaire (véhicule, conducteur, date, lieu, kilométrage, nature de la panne, urgence, possibilité de déplacement/remorquage).",
            "Diagnostic atelier & Devis : enregistrement du diagnostic du garage agréé, origines de la panne, durée d'immobilisation prévue, coût estimé et avis technique.",
            "Exécution & Clôture de réparation : suivi des travaux réalisés, des pièces détachées remplacées, bon de sortie d'atelier, coût réel TTC, attachement de la facture et garantie accordée.",
            "Mise à jour automatique du statut du véhicule (passage à EN_MAINTENANCE / EN_REPARATION puis retour automatique à DISPONIBLE lors de la clôture)."
        ]),
        ("3. Traitement et Suivi Intégral des Sinistres Automobile (CdC Section 14)", [
            "Déclaration de sinistre/accident : enregistrement immédiat (date, heure, lieu, véhicule, conducteur, circonstances, tiers impliqués, constat amiable/PV de police, photographies, estimation des dommages).",
            "Suivi du dossier auprès de la compagnie d'assurance : gestion du workflow des statuts (DECLARE, TRANSMIS, EN_COURS_D_EXPERTISE, ACCEPTE, REJETE, INDEMNISE, CLOTURE).",
            "Gestion financière du sinistre : suivi des montants des expertises, devis de réparation, montant de la franchise restée à charge, montant remboursé par l'assurance et clôture finale.",
            "Bascule automatique du véhicule au statut ACCIDENTE ou EN_REPARATION avec blocage des nouvelles affectations tant que le sinistre n'est pas clôturé."
        ]),
        ("4. Intégration Budgétaire, Alertes & Gestion Documentaire (CdC Section 19, 21 & 22)", [
            "Impact budgétaire automatique : comptabilisation des dépenses d'entretien, de réparation et de sinistre dans le budget alloué à la Direction/Service concerné.",
            "Alertes multi-canaux (Dashboard In-App & Email SMTP via JavaMailSender) pour dépassement de délais d'immobilisation, retard d'expertise ou coût de réparation anormal.",
            "Attachement systématique des pièces justificatives via le module GED (devis, factures, PV de constat, rapports d'expertise, photos de dommages)."
        ])
    ]

    for title, points in features:
        story.append(Paragraph(f"• <b>{title}</b>", bold_feat_style))
        for pt in points:
            story.append(Paragraph(f"- {pt}", rule_style))

    story.append(Spacer(1, 6))

    # 2.2 Priorisation MoSCoW & Règles de Gestion
    story.append(Paragraph("2.2. Priorisation MoSCoW & Règles de Gestion Métier", h2_style))

    moscow_text = [
        "MoSCoW - Must Have (Priorité 1 — Impératif) : Déclaration/Clôture des Pannes, Planification Préventive (seuil 90%), Gestion des Sinistres & Bascule automatique des statuts (EN_REPARATION, ACCIDENTE, DISPONIBLE).",
        "MoSCoW - Should Have (Priorité 2 — Essentiel) : Répertoire centralisé des Garages Agréés, Saisie détaillée du catalogue de pièces détachées et gestion des factures via GED.",
        "MoSCoW - Could Have (Priorité 3 — Optionnel) : Ordre de réparation automatique déclenché sur détection de contre-visite technique sous 15 jours."
    ]

    for m in moscow_text:
        story.append(Paragraph(f"📌 {m}", rule_style))

    rules = [
        "RG01 — Un déclenchement d'entretien préventif s'active automatiquement dès que le kilométrage atteint 90% du seuil fixé (ex: 9 000 km pour un seuil à 10 000 km).",
        "RG02 — La création d'une intervention de maintenance lourde ou la déclaration d'une panne immobilisante passe immédiatement le véhicule au statut EN_MAINTENANCE ou EN_REPARATION et interdit toute nouvelle affectation.",
        "RG03 — Une déclaration de sinistre grave passe le véhicule au statut ACCIDENTE. La remise en circulation nécessite la clôture de l'expertise et un PV de réparation.",
        "RG04 — Contrôle du Kilométrage Croissant : Le kilométrage réel de clôture ne peut être inférieur au kilométrage actuel du véhicule (if (kmReel < vehicule.getKilometrageActuel()) throw Exception).",
        "RG05 — Tout coût de réparation dépassant le budget restant alloué à la Direction du MEF requiert une alerte automatique et une validation hiérarchique."
    ]

    for r in rules:
        story.append(Paragraph(f"<font color='{BLUE_HEX}'>✔</font> {r}", rule_style))

    story.append(Spacer(1, 8))

    # 3. Recommandations Techniques & Plan d'Action Agile
    story.append(Paragraph("3. Recommandations Techniques & Plan d'Action Agile", h1_style))

    recs = [
        ("💡 1. Validation du Schéma Relationnel Unique (@ManyToOne)", [
            "S'assurer que Sinistre et InterventionMaintenance possèdent des relations directes @ManyToOne vers Vehicule, Conducteur et GarageAgree.",
            "Garantir l'intégrité référentielle en base de données et la traçabilité immédiate du conducteur au moment du sinistre ou de la panne."
        ]),
        ("💡 2. Validation Stricte du Kilométrage Croissant dans le Service Java (RG04)", [
            "Implémenter dans MaintenanceService et PanneService le contrôle d'invariabilité :",
            "<code>if (kmReel &lt; vehicule.getKilometrageActuel()) { throw new IllegalArgumentException(\"Le kilométrage de clôture ne peut pas être inférieur au kilométrage actuel du véhicule.\"); }</code>",
            "Mise à jour atomique de vehicule.setKilometrageActuel(kmReel) lors de la clôture de l'intervention."
        ]),
        ("💡 3. Priorisation MoSCoW Appliquée au Codage Agile", [
            "Must Have (P1) : Focus immédiat sur la déclaration/clôture des pannes, la planification préventive (seuil 90%), la gestion des sinistres et la bascule dynamique des statuts (EN_REPARATION, ACCIDENTE, DISPONIBLE).",
            "Should Have (P2) : Implémentation du répertoire des garages agréés, de la saisie détaillée des pièces détachées et des factures rattachées à la GED."
        ])
    ]

    for title, points in recs:
        story.append(Paragraph(f"<b>{title}</b>", bold_feat_style))
        for pt in points:
            if pt.startswith("<code>"):
                story.append(Paragraph(pt, code_style))
            else:
                story.append(Paragraph(f"- {pt}", rule_style))

    story.append(Spacer(1, 8))

    # 4. Livrables Attendus
    story.append(Paragraph("4. Livrables Attendus du Sprint 6", h1_style))

    deliverables = [
        "Base de Données PostgreSQL : Entités JPA InterventionMaintenance, PlanificationEntretien, Panne, RepairOrder, Sinistre, GarageAgree, PieceRemplacement avec liaisons @ManyToOne vers Vehicule, Conducteur et GarageAgree.",
        "Services & Logic Métier Java : Services Spring Boot MaintenanceService, PanneService, SinistreService, GarageService avec contrôle de kilométrage croissant (kmReel >= kmActuel), alerte 90% km et notifications SMTP JavaMailSender.",
        "Endpoints API REST & Swagger UI : Controllers sécurisés /api/maintenance, /api/pannes, /api/reparations, /api/sinistres et /api/garages.",
        "Interface Frontend React : Vues /maintenance (planification & suivi entretiens), /pannes (déclarations & diagnostics), /sinistres (dossiers & expertises) et modales de clôture avec GED.",
        "Jeu de Données de Test & Documentation : Scripts d'insertion de jeux de tests d'entretiens/sinistres, guides utilisateurs et cahier de recette UAT des modules Maintenance & Sinistres.",
        "Démonstration & Validation : Vendredi 21 août 2026 à 11h00 au Ministère de l'Économie et des Finances."
    ]

    for dev in deliverables:
        story.append(Paragraph(f"<font color='{NAVY_HEX}'>✔</font> {dev}", rule_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF généré avec succès : {pdf_filename}")

def main():
    paths = [
        r"c:\Users\Hassan\Desktop\park auto MEF\planning\Planning_Sprint_6.pdf",
        r"c:\Users\Hassan\Desktop\park auto MEF\scripts\Planning_Sprint_6.pdf",
        r"c:\Users\Hassan\Desktop\park auto MEF\Planning_Sprint_6.pdf"
    ]
    for p in paths:
        generate_pdf_for_path(p)

if __name__ == "__main__":
    main()

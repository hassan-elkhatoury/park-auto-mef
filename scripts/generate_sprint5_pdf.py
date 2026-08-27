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
        self.drawRightString(A4[0] - 54, 800, "Planning Sprint 5 (Version Finale 100% CdC)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 792, A4[0] - 54, 792)

        # Footer
        self.line(54, 45, A4[0] - 54, 45)
        self.drawString(54, 32, "Ministère de l'Économie et des Finances — Application de Gestion du Parc Automobile")
        page_text = f"Page {self._pageNumber} sur {page_count}"
        self.drawRightString(A4[0] - 54, 32, page_text)
        self.restoreState()

def build_pdf():
    pdf_filename = r"c:\Users\Hassan\Desktop\park auto MEF\Planning_Sprint_5.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    NAVY_HEX = "#070D1B"
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

    story = []

    # Title Banner
    story.append(Paragraph("Planning du Sprint 5 (Version Finale — 100% CdC MEF)", title_style))
    story.append(Paragraph("Assurances & Sinistres, Visites & Réforme, Budget & Prévisions, Infractions, Sécurité & Notifications (10/08 – 14/08)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor(BLUE_HEX), spaceAfter=10))

    # 1. Informations Générales
    story.append(Paragraph("1. Informations Générales", h1_style))

    info_data = [
        [Paragraph("<b>Sprint</b>", body_style), Paragraph("Sprint 5 (Sprint Final de Clôture du Périmètre CdC)", body_style)],
        [Paragraph("<b>Période prévisionnelle</b>", body_style), Paragraph("10/08/2026 au 14/08/2026 (5 jours ouvrés)", body_style)],
        [Paragraph("<b>Conformité CdC</b>", body_style), Paragraph("<b>100% des exigences fonctionnelles du CdC MEF couvertes</b>", body_style)],
        [Paragraph("<b>Objectif</b>", body_style), Paragraph(
            "Finaliser les modules d'Assurances, Sinistres, Infractions/PV, Visites Techniques, Taxes, Procédure de Réforme des véhicules, Prévisions de consommation de carburant, Suivi Budgétaire Analytique, Sécurité RBAC/Audit, Service d'Alertes Email (JavaMailSender) et GED Sécurisée.",
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

    # 2. Contenu du Sprint 5
    story.append(Paragraph("2. Contenu du Sprint 5", h1_style))
    story.append(Paragraph("2.1. Fonctionnalités Prévues (Backlog 100% CdC MEF)", h2_style))

    features = [
        ("1. Assurances, Traitement des Sinistres & Infractions Routières (PV/Amendes)", [
            "Assurances : Suivi des contrats d'assurance, polices, compagnies (AXA, RMA, Wafa), garanties (tous risques, tiers, vol), primes, franchises et alertes J-30 avant expiration.",
            "Sinistres : Déclaration des accidents (date, lieu, conducteur, tiers impliqués, constats, photos, dommages), expertises d'assurance, indemnisations et clôture du dossier.",
            "Infractions & Contraventions (CdC Section 4 & 9) : Saisie des PV/amendes radar rattachés aux véhicules et aux conducteurs lors de leurs missions, suivi des paiements et régularisation."
        ]),
        ("2. Visites Techniques, Taxes Automobiles & Workflow de Réforme des Véhicules", [
            "Visites Techniques & Taxes : Contrôles réglementaires, PV de visite (favorable, contre-visite sous 15j), vignettes automobiles et suivi des statuts (payé, exonéré, en retard).",
            "Procédure de Réforme & Sortie d'Inventaire (CdC Section 6.4 & 7.1) : Workflow de déclassement des véhicules vétustes/réformés (EN_COURS_DE_REFORME, REFORME, VENDU), attachement du PV de commission de réforme et sortie formelle de l'inventaire actif du MEF."
        ]),
        ("3. Suivi Budgétaire Analytique & Moteur de Prévisions Carburant", [
            "Gestion Budgétaire MEF : Allocation annuelle par Direction/Service et nature de dépense (Carburant, Assurance, Entretien, Réparation, Taxes, Visites), suivi Prévu vs Engagé vs Réalisé vs Restant.",
            "Prévisions de Consommation Carburant (CdC Section 10) : Calcul automatique des besoins futurs (Quantité Prévue = km_prévu × conso_moyenne / 100 ; Montant Prévu = Quantité × Prix_prévu) par Direction et par mois."
        ]),
        ("4. Administration RBAC, Audit Logs, NotificationService (Email) & GED Sécurisée", [
            "Sécurité & Enums Harmonises : Rôles RBAC (Admin, Gestionnaire Central/Local, Financier, Conducteur) et harmonisation de l'Enum StatutVehicule (DISPONIBLE, AFFECTE, RESERVE, IMMOBILISE, EN_ENTRETIEN, EN_REPARATION, ACCIDENTE, EN_COURS_DE_REFORME, REFORME, VENDU, RESTITUE, ARCHIVE).",
            "Moteur de Notifications Multi-canaux (CdC Section 21) : Configuration de JavaMailSender (SMTP) pour l'envoi automatique de courriels d'alerte (Assurance J-30, Contrôle technique, Permis expirant, Dépassement budget).",
            "GED Sécurisée & Audit Logs : Stockage sécurisé sur disque avec validation MIME (PDF, PNG, JPG), prévisualisation native React et journalisation immutable des actions sensibles (AuditLog)."
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
        "Must Have (Impératif) : Assurances, Sinistres, Visites Techniques/Contre-visites, Taxes, Procédure de Réforme, Sécurité RBAC/Audit & Notifications Email (JavaMailSender).",
        "Should Have (Essentiel) : Suivi Budgétaire analytique, Moteur de Prévision Carburant, Gestion des Infractions/PV & GED Sécurisée.",
        "Could Have (Optionnel) : Prévisualisation native des fichiers Word/Excel complexes dans le navigateur web."
    ]

    for m in moscow_text:
        story.append(Paragraph(f"📌 {m}", rule_style))

    rules = [
        "RG01 — Une déclaration de sinistre ou le passage en réforme passe automatiquement le véhicule aux statuts ACCIDENTE, EN_REPARATION ou EN_COURS_DE_REFORME et alerte le Gestionnaire Central.",
        "RG02 — Aucun véhicule ne peut être affecté sans contrat d'assurance actif ; un blocage strict et une notification email SMTP sont émis à J-30 avant expiration.",
        "RG03 — Un résultat de visite technique CONTRE_VISITE_OBLIGATOIRE génère automatiquement un ordre de réparation sous 15 jours.",
        "RG04 — Toute réforme de véhicule exige le téléversement obligatoire du Procès-Verbal de la Commission de Réforme avant validation finale.",
        "RG05 — Toute action de création, modification ou suppression sur des données budgétaires ou administratives est journalisée de façon immutable dans AuditLog."
    ]

    for r in rules:
        story.append(Paragraph(f"<font color='{BLUE_HEX}'>✔</font> {r}", rule_style))

    story.append(Spacer(1, 8))

    # 3. Livrables Attendus
    story.append(Paragraph("3. Livrables Attendus (Périmètre Final)", h1_style))

    deliverables = [
        "Base de Données PostgreSQL : Entités JPA Assurance, Sinistre, Infraction, VisiteTechnique, TaxeAutomobile, ReframeVehicule, PrevisionCarburant, BudgetDirection, Utilisateur, Role, DocumentGED et AuditLog avec migration Liquibase/Flyway de Enum StatutVehicule.",
        "Repositories & Services Java : Services métiers incluant NotificationService (JavaMailSender), PrevisionCarburantService, ReframeService, InfractionService, BudgetService, AuditLogService, DocumentGEDService.",
        "Contrôleurs REST & API Swagger UI : Endpoints sécurisés /api/assurances, /api/sinistres, /api/infractions, /api/visites-techniques, /api/reformes, /api/previsions-carburant, /api/budgets, /api/users, /api/notifications et /api/documents.",
        "Frontend React : Vues /assurances, /sinistres, /infractions, /visites-techniques, /reforme, /previsions, /budget, /administration et viewer /documents.",
        "Démonstration & Recette Finale Complète : Vendredi 14 août 2026 à 11h30 (Couverture 100% Cahier des Charges MEF)."
    ]

    for dev in deliverables:
        story.append(Paragraph(f"<font color='{NAVY_HEX}'>✔</font> {dev}", rule_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Sprint 5 (100% CdC) via ReportLab généré avec succès : {pdf_filename}")

if __name__ == "__main__":
    build_pdf()

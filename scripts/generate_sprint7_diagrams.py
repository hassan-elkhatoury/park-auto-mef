import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon
import numpy as np

OUTPUT_DIR = "rapports/diagrams_sprint7"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. DIAGRAMME DE CAS D'UTILISATION UML — SPRINT 7
# -------------------------------------------------------------
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background canvas
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # System boundary box
    sys_box = FancyBboxPatch((24, 4), 52, 90, boxstyle="round,pad=0.8,rounding_size=1.5",
                             facecolor='#F8FAFC', edgecolor='#0F1D32', linewidth=2.5, zorder=1)
    ax.add_patch(sys_box)

    # Title Banner
    title_box = FancyBboxPatch((28, 86), 44, 6.5, boxstyle="round,pad=0.5,rounding_size=0.8",
                               facecolor='#0F1D32', edgecolor='#C5A059', linewidth=1.5, zorder=2)
    ax.add_patch(title_box)
    ax.text(50, 89.2, "SYSTÈME PARK AUTO MEF — SPRINT 7", color='#FFFFFF', fontsize=13,
            fontweight='bold', ha='center', va='center', zorder=3)
    ax.text(50, 87.2, "Contrôle Budgétaire, Moteur TCO (MAD/km) & Tableaux de Bord Exécutifs",
            color='#C5A059', fontsize=9, ha='center', va='center', zorder=3)

    # Actors (Left & Right)
    actors = [
        ("Responsable Financier MEF", "Gestion Budgétaire\n& Engagements", 11, 75, '#1E40AF'),
        ("Chef de Parc Automobile", "Suivi Opérationnel\n& Flotte", 11, 45, '#047857'),
        ("Direction Générale MEF", "Pilotage Stratégique\n& Décisionnel", 11, 18, '#7C2D12'),
        ("Système & Cron MEF", "Alertes Automatiques\n& Notifications", 89, 65, '#4338CA'),
        ("Comptabilité Publique", "Rapprochement\n& Audit Fiscal", 89, 30, '#334155')
    ]

    def draw_actor(x, y, name, sub, col):
        head = Circle((x, y + 4), 1.8, facecolor='#FFFFFF', edgecolor=col, linewidth=2, zorder=4)
        ax.add_patch(head)
        ax.plot([x, x], [y + 2.2, y - 1.8], color=col, linewidth=2.2, zorder=4)
        ax.plot([x - 2.2, x + 2.2], [y + 0.8, y + 0.8], color=col, linewidth=2.2, zorder=4)
        ax.plot([x, x - 1.8], [y - 1.8, y - 5], color=col, linewidth=2.2, zorder=4)
        ax.plot([x, x + 1.8], [y - 1.8, y - 5], color=col, linewidth=2.2, zorder=4)
        lbl_box = FancyBboxPatch((x - 8.5, y - 9.5), 17, 3.8, boxstyle="round,pad=0.2",
                                facecolor='#F1F5F9', edgecolor=col, linewidth=1, zorder=4)
        ax.add_patch(lbl_box)
        ax.text(x, y - 7.5, name, fontsize=8.2, fontweight='bold', color='#0F1D32', ha='center', va='center', zorder=5)
        ax.text(x, y - 8.8, sub, fontsize=6.8, color='#64748B', ha='center', va='center', zorder=5)

    for act in actors:
        draw_actor(act[2], act[3], act[0], act[1], act[4])

    # Use Cases (Ellipses / Rounded Boxes)
    use_cases = [
        ("UC1", "Allouer & Ventiler Enveloppes Budgétaires\n(Par Direction, Service & 11 Natures)", 50, 78, 22, 5.2, '#EFF6FF', '#2563EB'),
        ("UC2", "Engager une Dépense & Contrôle Solde (RG01)\n(Vérification automatique du disponible)", 50, 69.5, 22, 5.2, '#EFF6FF', '#2563EB'),
        ("UC3", "Liquider Engagement & Imputation Facture\n(Passage au statut Réalisé)", 50, 61, 22, 5.2, '#EFF6FF', '#2563EB'),
        ("UC4", "Détecter & Notifier Seuils 80% et 95% (RG03)\n(Alertes In-App & Emails SMTP)", 50, 52.5, 22, 5.2, '#FEF2F2', '#DC2626'),
        ("UC5", "Clôturer Exercice Fiscal & Verrouillage (RG04)\n(Passage en lecture seule & non-rétroactivité)", 50, 44, 22, 5.2, '#FFFBEB', '#D97706'),
        ("UC6", "Calculer TCO & Coût Kilométrique MAD/km (RG02)\n(TCO = Acq + Carburant + Maint + Assur + Taxes + Sin)", 50, 35.5, 22, 5.2, '#ECFDF5', '#059669'),
        ("UC7", "Consolider Dépenses Multi-Directions (RG05)\n(Agrégation Direction Centrale & Régionales)", 50, 27, 22, 5.2, '#ECFDF5', '#059669'),
        ("UC8", "Consulter Dashboards Exécutifs & KPIs Flotte\n(Disponibilité, Immobilisation, Coûts)", 50, 18.5, 22, 5.2, '#F5F3FF', '#7C3AED'),
        ("UC9", "Générer & Exporter Rapports Décisionnels\n(Excel multi-onglets POI & PDF OpenPDF)", 50, 10, 22, 5.2, '#F0FDF4', '#16A34A')
    ]

    uc_map = {}
    for uc in use_cases:
        uc_map[uc[0]] = (uc[2], uc[3])
        box = FancyBboxPatch((uc[2] - uc[4]/2, uc[3] - uc[5]/2), uc[4], uc[5],
                             boxstyle="round,pad=0.3,rounding_size=1.2",
                             facecolor=uc[6], edgecolor=uc[7], linewidth=1.5, zorder=2)
        ax.add_patch(box)
        tag = FancyBboxPatch((uc[2] - uc[4]/2 + 0.6, uc[3] + uc[5]/2 - 1.6), 2.8, 1.2,
                             boxstyle="round,pad=0.1", facecolor=uc[7], edgecolor=uc[7], zorder=3)
        ax.add_patch(tag)
        ax.text(uc[2] - uc[4]/2 + 2.0, uc[3] + uc[5]/2 - 1.0, uc[0], color='#FFFFFF',
                fontsize=6.5, fontweight='bold', ha='center', va='center', zorder=4)
        ax.text(uc[2], uc[3], uc[1], fontsize=7.4, fontweight='bold', color='#0F1D32',
                ha='center', va='center', zorder=3)

    def connect_actor_uc(x_act, y_act, uc_id, col='#64748B', style='-'):
        x_uc, y_uc = uc_map[uc_id]
        if x_act < x_uc:
            ax.annotate('', xy=(x_uc - 11, y_uc), xytext=(x_act + 8.5, y_act),
                        arrowprops=dict(arrowstyle='-', color=col, lw=1.2, linestyle=style), zorder=2)
        else:
            ax.annotate('', xy=(x_uc + 11, y_uc), xytext=(x_act - 8.5, y_act),
                        arrowprops=dict(arrowstyle='-', color=col, lw=1.2, linestyle=style), zorder=2)

    connect_actor_uc(11, 75, "UC1", '#1E40AF')
    connect_actor_uc(11, 75, "UC2", '#1E40AF')
    connect_actor_uc(11, 75, "UC3", '#1E40AF')
    connect_actor_uc(11, 75, "UC4", '#1E40AF')
    connect_actor_uc(11, 75, "UC5", '#1E40AF')

    connect_actor_uc(11, 45, "UC2", '#047857')
    connect_actor_uc(11, 45, "UC6", '#047857')
    connect_actor_uc(11, 45, "UC7", '#047857')
    connect_actor_uc(11, 45, "UC8", '#047857')

    connect_actor_uc(11, 18, "UC6", '#7C2D12')
    connect_actor_uc(11, 18, "UC7", '#7C2D12')
    connect_actor_uc(11, 18, "UC8", '#7C2D12')
    connect_actor_uc(11, 18, "UC9", '#7C2D12')

    connect_actor_uc(89, 65, "UC4", '#4338CA', '--')
    connect_actor_uc(89, 65, "UC6", '#4338CA', '--')

    connect_actor_uc(89, 30, "UC5", '#334155')
    connect_actor_uc(89, 30, "UC9", '#334155')

    ax.annotate('<<include>>\nRG03', xy=(61.5, 55.3), xytext=(61.5, 66.8),
                arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#DC2626', lw=1.2, linestyle=':'),
                fontsize=6.8, color='#DC2626', fontweight='bold', ha='left', va='center', zorder=4)

    ax.annotate('<<include>>\nRG05', xy=(61.5, 29.8), xytext=(61.5, 32.8),
                arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#059669', lw=1.2, linestyle=':'),
                fontsize=6.8, color='#059669', fontweight='bold', ha='left', va='center', zorder=4)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "diagramme_use_case_sprint7.png")
    fig.savefig(path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("[OK] Diagramme Use Case genere :", path)

# -------------------------------------------------------------
# 2. DIAGRAMME DE CLASSES UML — SPRINT 7
# -------------------------------------------------------------
def generate_class_diagram():
    fig, ax = plt.subplots(figsize=(18, 12), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    title_box = FancyBboxPatch((25, 93), 50, 5.5, boxstyle="round,pad=0.5,rounding_size=0.8",
                               facecolor='#0F1D32', edgecolor='#C5A059', linewidth=1.5, zorder=2)
    ax.add_patch(title_box)
    ax.text(50, 95.7, "DIAGRAMME DE CLASSES UML — MODÈLE DE DONNÉES SPRINT 7", color='#FFFFFF',
            fontsize=13, fontweight='bold', ha='center', va='center', zorder=3)

    def draw_uml_class(x, y, w, h, stereotype, name, attrs, methods, header_col='#0F1D32', bg_col='#F8FAFC'):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=0.8",
                             facecolor=bg_col, edgecolor=header_col, linewidth=1.8, zorder=2)
        ax.add_patch(box)
        header_h = 2.4
        hdr = FancyBboxPatch((x, y + h - header_h), w, header_h, boxstyle="round,pad=0.1,rounding_size=0.6",
                             facecolor=header_col, edgecolor=header_col, zorder=3)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - 0.7, f"<<{stereotype}>>", color='#C5A059', fontsize=6.8, ha='center', va='center', zorder=4)
        ax.text(x + w/2, y + h - 1.7, name, color='#FFFFFF', fontsize=9.2, fontweight='bold', ha='center', va='center', zorder=4)

        curr_y = y + h - header_h - 0.6
        for attr in attrs:
            ax.text(x + 0.8, curr_y, attr, color='#1E293B', fontsize=6.8, fontfamily='monospace', va='top', zorder=4)
            curr_y -= 1.15

        if methods:
            ax.plot([x + 0.4, x + w - 0.4], [curr_y, curr_y], color='#CBD5E1', lw=1, zorder=3)
            curr_y -= 0.5
            for m in methods:
                ax.text(x + 0.8, curr_y, m, color='#0369A1', fontsize=6.8, fontfamily='monospace', fontweight='bold', va='top', zorder=4)
                curr_y -= 1.15

    # 1. ExerciceBudgetaire
    draw_uml_class(
        4, 60, 22, 28,
        "Entity", "ExerciceBudgetaire",
        [
            "- id : Long",
            "- annee : Integer [UNIQUE]",
            "- statut : StatutExercice",
            "- dateOuverture : LocalDate",
            "- dateCloture : LocalDate",
            "- cloturePar : String",
            "- observations : String",
            "- budgetTotalAlloue : BigDecimal",
            "- budgetTotalEngage : BigDecimal",
            "- budgetTotalRealise : BigDecimal"
        ],
        [
            "+ isCloture() : boolean",
            "+ verifierOuvert() : void",
            "+ getTauxConsommation() : Double"
        ],
        header_col='#0F1D32', bg_col='#F8FAFC'
    )

    # 2. BudgetDirection
    draw_uml_class(
        39, 60, 25, 28,
        "Entity", "BudgetDirection",
        [
            "- id : Long",
            "- annee : Integer",
            "- direction : String",
            "- service : String",
            "- centreCout : String",
            "- natureDepense : NatureDepense",
            "- montantAlloue : BigDecimal",
            "- montantEngage : BigDecimal",
            "- montantRealise : BigDecimal",
            "- alerte80Atteinte : Boolean",
            "- alerte95Atteinte : Boolean"
        ],
        [
            "+ getMontantDisponible() : BigDecimal",
            "+ getTauxConsommation() : Double",
            "+ isAlerte80() : boolean",
            "+ isAlerte95() : boolean"
        ],
        header_col='#1E3A8A', bg_col='#EFF6FF'
    )

    # 3. EngagementBudgetaire
    draw_uml_class(
        74, 60, 23, 28,
        "Entity", "EngagementBudgetaire",
        [
            "- id : Long",
            "- numeroEngagement : String [UQ]",
            "- numeroBonCommande : String",
            "- dateEngagement : LocalDate",
            "- montantEngage : BigDecimal",
            "- montantLiquide : BigDecimal",
            "- statut : StatutEngagement",
            "- fournisseur : String",
            "- motif : String",
            "- dateLiquidation : LocalDate",
            "- refFacture : String"
        ],
        [
            "+ liquider(montant, ref) : void",
            "+ annuler() : void",
            "+ isLiquide() : boolean"
        ],
        header_col='#065F46', bg_col='#ECFDF5'
    )

    # 4. NatureDepense (Enum)
    draw_uml_class(
        4, 15, 22, 38,
        "Enumeration", "NatureDepense",
        [
            "CARBURANT",
            "LUBRIFIANTS",
            "ASSURANCE",
            "ENTRETIEN",
            "REPARATION",
            "PIECES_RECHANGE",
            "PNEUS",
            "VISITE_TECHNIQUE",
            "TAXES",
            "LOCATION",
            "AUTRES"
        ],
        [
            "+ getLibelle() : String",
            "+ isCritique() : boolean"
        ],
        header_col='#78350F', bg_col='#FEF3C7'
    )

    # 5. Vehicule (Reference entity)
    draw_uml_class(
        39, 15, 25, 38,
        "Entity (Sprint 1-6)", "Vehicule",
        [
            "- immatriculation : String [PK]",
            "- numeroChassis : String [UQ]",
            "- marque : String",
            "- modele : String",
            "- direction : String",
            "- typeCarburant : TypeCarburant",
            "- kilometrageActuel : Long",
            "- montantAcquisition : BigDecimal",
            "- statutAdministratif : StatutAdmin"
        ],
        [
            "+ getTcoTotal() : BigDecimal",
            "+ getCoutKilometrique() : BigDecimal"
        ],
        header_col='#312E81', bg_col='#EEF2FF'
    )

    # 6. TCO / Reporting DTOs & Services
    draw_uml_class(
        74, 15, 23, 38,
        "DTO / Service", "ReportingDecisionnel",
        [
            "«DTO» TcoVehiculeDto :",
            "  - tcoTotal : BigDecimal",
            "  - coutKilometriqueMadKm : Double",
            "«DTO» TcoConsolidationDto :",
            "  - totalAcquisition : BigDecimal",
            "  - totalExploitation : BigDecimal",
            "«DTO» TcoMotorisationDto :",
            "  - motorisation : TypeCarburant",
            "  - empreinteCarboneKg : Double"
        ],
        [
            "+ getTcoParVehicule() : List",
            "+ getTcoConsolidation() : Conso",
            "+ generateExcelReport() : byte[]",
            "+ generatePdfReport() : byte[]"
        ],
        header_col='#831843', bg_col='#FDF2F8'
    )

    # Associations
    ax.annotate('', xy=(39, 74), xytext=(26, 74), arrowprops=dict(arrowstyle='-', color='#0F1D32', lw=2))
    ax.text(27, 75, "1", fontsize=8, fontweight='bold', color='#0F1D32')
    ax.text(37, 75, "0..*", fontsize=8, fontweight='bold', color='#0F1D32')
    ax.text(32.5, 75.5, "contient", fontsize=7.5, color='#64748B', ha='center')

    ax.annotate('', xy=(74, 74), xytext=(64, 74), arrowprops=dict(arrowstyle='-', color='#0F1D32', lw=2))
    ax.text(65, 75, "1", fontsize=8, fontweight='bold', color='#0F1D32')
    ax.text(72, 75, "0..*", fontsize=8, fontweight='bold', color='#0F1D32')
    ax.text(69, 75.5, "impute", fontsize=7.5, color='#64748B', ha='center')

    ax.annotate('', xy=(26, 45), xytext=(39, 65), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#78350F', lw=1.5, linestyle='--'))
    ax.text(31, 55, "ventile par (1)", fontsize=7, color='#78350F', fontweight='bold')

    ax.annotate('', xy=(74, 34), xytext=(64, 34), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#831843', lw=1.8))
    ax.text(69, 35.2, "agrégé dans", fontsize=7.5, color='#831843', fontweight='bold', ha='center')

    ax.annotate('', xy=(51.5, 53), xytext=(85, 60), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#065F46', lw=1.5, linestyle=':'))
    ax.text(68, 56, "référence (0..1)", fontsize=7, color='#065F46', fontweight='bold')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "diagramme_classes_sprint7.png")
    fig.savefig(path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("[OK] Diagramme de Classes genere :", path)

# -------------------------------------------------------------
# 3. DIAGRAMME DE SÉQUENCE UML 1 — ENGAGEMENT & CONTRÔLE SOLDE (RG01, RG03, RG04)
# -------------------------------------------------------------
def generate_sequence_engagement():
    fig, ax = plt.subplots(figsize=(17, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    title_box = FancyBboxPatch((15, 93), 70, 5.5, boxstyle="round,pad=0.5,rounding_size=0.8",
                               facecolor='#0F1D32', edgecolor='#C5A059', linewidth=1.5, zorder=2)
    ax.add_patch(title_box)
    ax.text(50, 95.7, "DIAGRAMME DE SÉQUENCE UML : WORKFLOW D'ENGAGEMENT & CONTRÔLE DE SOLDE (RG01, RG03, RG04)",
            color='#FFFFFF', fontsize=11.5, fontweight='bold', ha='center', va='center', zorder=3)

    participants = [
        ("Gestionnaire\nFinancier", 10, '#1E40AF'),
        ("Budget\nController", 28, '#0F1D32'),
        ("Budget\nService", 46, '#0F1D32'),
        ("Exercice / Budget\nRepositories", 64, '#065F46'),
        ("Engagement\nRepository", 82, '#065F46'),
        ("Notification /\nEmailService", 94, '#DC2626')
    ]

    for name, x, col in participants:
        box = FancyBboxPatch((x - 6, 83), 12, 6, boxstyle="round,pad=0.2,rounding_size=0.5",
                             facecolor=col, edgecolor='#CBD5E1', linewidth=1.2, zorder=3)
        ax.add_patch(box)
        ax.text(x, 86, name, color='#FFFFFF', fontsize=7.8, fontweight='bold', ha='center', va='center', zorder=4)
        ax.plot([x, x], [83, 10], color='#94A3B8', linestyle='--', linewidth=1.2, zorder=1)

    def draw_msg(y, x_from, x_to, text, is_ret=False, col='#0F1D32', note=None):
        style = '--' if is_ret else '-'
        arrow = '->,head_width=0.3,head_length=0.4' if not is_ret else '->,head_width=0.25,head_length=0.35'
        ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                    arrowprops=dict(arrowstyle=arrow, color=col, lw=1.3, linestyle=style), zorder=3)
        mid_x = (x_from + x_to) / 2
        ax.text(mid_x, y + 0.8, text, fontsize=7.2, fontweight='bold' if not is_ret else 'normal',
                color=col, ha='center', va='bottom', zorder=4)
        if note:
            tag_box = FancyBboxPatch((mid_x - 4, y - 2.2), 8, 1.8, boxstyle="round,pad=0.1",
                                     facecolor='#FEF3C7', edgecolor='#D97706', linewidth=0.8, zorder=4)
            ax.add_patch(tag_box)
            ax.text(mid_x, y - 1.3, note, fontsize=6.2, color='#78350F', fontweight='bold', ha='center', va='center', zorder=5)

    draw_msg(78, 10, 28, "1: POST /api/budgets/engagements (EngagementRequest)", col='#1E40AF')
    draw_msg(74, 28, 46, "2: creerEngagement(request)", col='#0F1D32')
    draw_msg(70, 46, 64, "3: findByAnnee(2026)", col='#0F1D32')
    draw_msg(66, 64, 46, "4: ExerciceBudgetaire (statut=OUVERT)", is_ret=True, col='#065F46', note="RG04 Validé")
    draw_msg(60, 46, 64, "5: findByDirectionAndNature(DIR_BUDGET, CARBURANT)", col='#0F1D32')
    draw_msg(56, 64, 46, "6: BudgetDirection (Alloué: 500k, Engagé: 350k, Dispo: 150k)", is_ret=True, col='#065F46')

    ax.text(46, 52, "[Contrôle RG01 : Montant Demande (25k) <= Dispo (150k)] -> OK",
            fontsize=7, color='#047857', fontweight='bold', ha='center',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#ECFDF5', edgecolor='#10B981', lw=1))

    draw_msg(46, 46, 82, "7: save(EngagementBudgetaire, statut=ENGAGE)", col='#0F1D32')
    draw_msg(42, 82, 46, "8: Engagement enregistré (ENG-2026-0042)", is_ret=True, col='#065F46')
    draw_msg(37, 46, 64, "9: updateBudget(montantEngage += 25k -> Taux = 75% -> 80%)", col='#0F1D32')
    draw_msg(33, 46, 94, "10: sendBudgetAlertEmail(Direction, 80%, Vigilance)", col='#DC2626', note="RG03 Alerte Déclenchée")
    draw_msg(28, 94, 46, "11: Notification SMTP envoyée avec succès", is_ret=True, col='#DC2626')
    draw_msg(23, 46, 28, "12: EngagementBudgetaireDto", is_ret=True, col='#0F1D32')
    draw_msg(18, 28, 10, "13: HTTP 201 CREATED (Engagement Validé)", is_ret=True, col='#1E40AF')

    alt_box = FancyBboxPatch((2, 9), 96, 6, boxstyle="round,pad=0.3",
                             facecolor='#FFF1F2', edgecolor='#E11D48', linewidth=1, linestyle=':', zorder=2)
    ax.add_patch(alt_box)
    ax.text(4, 13.5, "[Cas d'exception RG01 / Solde Insuffisant]", fontsize=7, fontweight='bold', color='#BE123C')
    ax.text(50, 11.5, "Si montantDemande > montantDisponible ➔ Levée d'exception SoldeBudgetaireInsuffisantException ➔ HTTP 400 Bad Request",
            fontsize=7.2, color='#9F1239', ha='center', va='center')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "diagramme_sequence_engagement_sprint7.png")
    fig.savefig(path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("[OK] Diagramme de Sequence 1 genere :", path)

# -------------------------------------------------------------
# 4. DIAGRAMME DE SÉQUENCE UML 2 — CALCUL TCO, MAD/km & EXPORT (RG02, RG05)
# -------------------------------------------------------------
def generate_sequence_tco_export():
    fig, ax = plt.subplots(figsize=(17, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    title_box = FancyBboxPatch((15, 93), 70, 5.5, boxstyle="round,pad=0.5,rounding_size=0.8",
                               facecolor='#0F1D32', edgecolor='#C5A059', linewidth=1.5, zorder=2)
    ax.add_patch(title_box)
    ax.text(50, 95.7, "DIAGRAMME DE SÉQUENCE UML : MOTEUR TCO (MAD/km) & EXPORTS DÉCISIONNELS (RG02, RG05)",
            color='#FFFFFF', fontsize=11.5, fontweight='bold', ha='center', va='center', zorder=3)

    participants = [
        ("Chef de Parc /\nDirecteur MEF", 10, '#047857'),
        ("Reporting\nController", 28, '#0F1D32'),
        ("Reporting\nService", 48, '#0F1D32'),
        ("Entités & Repos\n(Carb, Maint, Assur, Taxe)", 70, '#1E3A8A'),
        ("Export Engine\n(Apache POI / OpenPDF)", 90, '#831843')
    ]

    for name, x, col in participants:
        box = FancyBboxPatch((x - 6.5, 83), 13, 6, boxstyle="round,pad=0.2,rounding_size=0.5",
                             facecolor=col, edgecolor='#CBD5E1', linewidth=1.2, zorder=3)
        ax.add_patch(box)
        ax.text(x, 86, name, color='#FFFFFF', fontsize=7.8, fontweight='bold', ha='center', va='center', zorder=4)
        ax.plot([x, x], [83, 10], color='#94A3B8', linestyle='--', linewidth=1.2, zorder=1)

    def draw_msg(y, x_from, x_to, text, is_ret=False, col='#0F1D32', note=None):
        style = '--' if is_ret else '-'
        arrow = '->,head_width=0.3,head_length=0.4' if not is_ret else '->,head_width=0.25,head_length=0.35'
        ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                    arrowprops=dict(arrowstyle=arrow, color=col, lw=1.3, linestyle=style), zorder=3)
        mid_x = (x_from + x_to) / 2
        ax.text(mid_x, y + 0.8, text, fontsize=7.2, fontweight='bold' if not is_ret else 'normal',
                color=col, ha='center', va='bottom', zorder=4)
        if note:
            tag_box = FancyBboxPatch((mid_x - 5, y - 2.2), 10, 1.8, boxstyle="round,pad=0.1",
                                     facecolor='#ECFDF5', edgecolor='#059669', linewidth=0.8, zorder=4)
            ax.add_patch(tag_box)
            ax.text(mid_x, y - 1.3, note, fontsize=6.2, color='#065F46', fontweight='bold', ha='center', va='center', zorder=5)

    draw_msg(78, 10, 28, "1: GET /api/reporting/tco/vehicules", col='#047857')
    draw_msg(74, 28, 48, "2: getTcoParVehicule()", col='#0F1D32')
    draw_msg(70, 48, 70, "3: findAllVehiculesActifs()", col='#0F1D32')
    draw_msg(66, 70, 48, "4: List<Vehicule>", is_ret=True, col='#1E3A8A')
    draw_msg(62, 48, 70, "5: sumCoutsByVehicule(Carburant, Maintenance, Assur, Taxes, Sinistres)", col='#0F1D32')
    draw_msg(57, 70, 48, "6: Données brutes de coûts consolidées", is_ret=True, col='#1E3A8A')

    ax.text(48, 52, "[Formule RG02 : TCO = Acquisition + Σ(Exploitation) | MAD/km = TCO / KilometrageActuel]",
            fontsize=7, color='#0F1D32', fontweight='bold', ha='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2))

    draw_msg(46, 48, 28, "7: List<TcoVehiculeDto> (TCO, MAD/km, Consommation)", is_ret=True, col='#0F1D32')
    draw_msg(42, 28, 10, "8: HTTP 200 OK (Données TCO pour affichage Recharts)", is_ret=True, col='#047857')

    draw_msg(36, 10, 28, "9: GET /api/reporting/export/excel?annee=2026", col='#831843')
    draw_msg(32, 28, 48, "10: generateExcelReport(2026)", col='#0F1D32')
    draw_msg(27, 48, 90, "11: buildMultiSheetWorkbook(PoiEngine, styles, formules SUM)", col='#831843')
    draw_msg(22, 90, 48, "12: ByteArrayOutputStream (.xlsx binaire généré)", is_ret=True, col='#831843')
    draw_msg(17, 48, 28, "13: Resource (application/vnd.openxmlformats-officedocument)", is_ret=True, col='#0F1D32')
    draw_msg(12, 28, 10, "14: HTTP 200 File Download (Rapport_TCO_MEF_2026.xlsx)", is_ret=True, col='#831843', note="Export Décisionnel Scellé")

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "diagramme_sequence_tco_reporting_sprint7.png")
    fig.savefig(path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("[OK] Diagramme de Sequence 2 genere :", path)

# -------------------------------------------------------------
# 5. DIAGRAMME D'ACTIVITÉ / WORKFLOW MÉTIER DU CYCLE BUDGÉTAIRE
# -------------------------------------------------------------
def generate_activity_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    title_box = FancyBboxPatch((15, 93), 70, 5.5, boxstyle="round,pad=0.5,rounding_size=0.8",
                               facecolor='#0F1D32', edgecolor='#C5A059', linewidth=1.5, zorder=2)
    ax.add_patch(title_box)
    ax.text(50, 95.7, "DIAGRAMME D'ACTIVITÉ UML : CYCLE DE VIE BUDGÉTAIRE ET PILOTAGE TCO MEF",
            color='#FFFFFF', fontsize=12, fontweight='bold', ha='center', va='center', zorder=3)

    start = Circle((10, 80), 1.8, facecolor='#0F1D32', edgecolor='#0F1D32', zorder=3)
    ax.add_patch(start)
    ax.text(10, 84, "Début d'Exercice\n(1er Janvier)", fontsize=7.5, fontweight='bold', ha='center', color='#0F1D32')

    def draw_activity_step(x, y, w, h, text, code=None, bg='#EFF6FF', border='#2563EB'):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.3,rounding_size=1.0",
                             facecolor=bg, edgecolor=border, linewidth=1.5, zorder=3)
        ax.add_patch(box)
        if code:
            tag = FancyBboxPatch((x - w/2 + 0.5, y + h/2 - 1.5), 4, 1.2, boxstyle="round,pad=0.1",
                                 facecolor=border, edgecolor=border, zorder=4)
            ax.add_patch(tag)
            ax.text(x - w/2 + 2.5, y + h/2 - 0.9, code, color='#FFFFFF', fontsize=6.2, fontweight='bold', ha='center', va='center', zorder=5)
        ax.text(x, y, text, fontsize=7.5, fontweight='bold', color='#0F1D32', ha='center', va='center', zorder=4)

    draw_activity_step(30, 80, 22, 6, "Ouverture Formelle de l'Exercice\n(Statut OUVERT en base)", "INIT", '#EFF6FF', '#2563EB')
    ax.annotate('', xy=(19, 80), xytext=(12, 80), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))

    draw_activity_step(65, 80, 24, 6, "Allocation & Ventilation des Crédits\n(Par Direction, Service & 11 Natures)", "DOTATION", '#EFF6FF', '#2563EB')
    ax.annotate('', xy=(53, 80), xytext=(41, 80), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))

    draw_activity_step(65, 60, 24, 6, "Saisie Demande d'Engagement\n(Bon de commande ou Ordre de Réparation)", "DEMANDE", '#F8FAFC', '#475569')
    ax.annotate('', xy=(65, 63), xytext=(65, 77), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))

    diamond = Polygon([(30, 60), (35, 63.5), (40, 60), (35, 56.5)], facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.5, zorder=3)
    ax.add_patch(diamond)
    ax.text(35, 60, "Solde\nDispo ?\n(RG01)", fontsize=6.8, fontweight='bold', ha='center', va='center', color='#78350F', zorder=4)

    ax.annotate('', xy=(40, 60), xytext=(53, 60), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))

    draw_activity_step(10, 60, 16, 6, "Rejet Engagement\n& Notification Rejet", "BLOQUÉ", '#FFF1F2', '#E11D48')
    ax.annotate('', xy=(18, 60), xytext=(30, 60), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#E11D48', lw=1.5))
    ax.text(24, 61.2, "[Non]", fontsize=7, color='#E11D48', fontweight='bold', ha='center')

    draw_activity_step(35, 40, 24, 6, "Validation & Réservation Crédits\n(Statut ENGAGE + MAJ Solde)", "RG01 OK", '#ECFDF5', '#059669')
    ax.annotate('', xy=(35, 43), xytext=(35, 56.5), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#059669', lw=1.5))
    ax.text(36.5, 49, "[Oui]", fontsize=7, color='#059669', fontweight='bold', ha='left')

    draw_activity_step(75, 40, 24, 6, "Contrôle Automatique des Seuils\n(Alerte 80% Vigilance / 95% Critique)", "RG03", '#FEF2F2', '#DC2626')
    ax.annotate('', xy=(63, 40), xytext=(47, 40), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#DC2626', lw=1.5, linestyle='--'))
    ax.text(55, 41.5, "Consommation >= 80%", fontsize=6.8, color='#DC2626', ha='center')

    draw_activity_step(35, 22, 24, 6, "Service Fait & Liquidation Facture\n(Passage au statut REALISE)", "LIQUIDATION", '#F0FDF4', '#16A34A')
    ax.annotate('', xy=(35, 25), xytext=(35, 37), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))

    draw_activity_step(75, 22, 24, 6, "Consolidation TCO & MAD/km\n(Mise à jour Dashboards & KPIs)", "RG02", '#F5F3FF', '#7C3AED')
    ax.annotate('', xy=(63, 22), xytext=(47, 22), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#7C3AED', lw=1.5))

    draw_activity_step(35, 6, 24, 5.5, "Clôture de l'Exercice Fiscal (RG04)\n(Verrouillage en lecture seule)", "CLÔTURE", '#FFFBEB', '#D97706')
    ax.annotate('', xy=(35, 9), xytext=(35, 19), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))
    ax.text(36.5, 14, "Fin d'année (31 Déc)", fontsize=6.8, color='#64748B', ha='left')

    end_outer = Circle((75, 6), 2.2, facecolor='#FFFFFF', edgecolor='#0F1D32', linewidth=2, zorder=3)
    end_inner = Circle((75, 6), 1.4, facecolor='#0F1D32', edgecolor='#0F1D32', zorder=4)
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)
    ax.annotate('', xy=(72.5, 6), xytext=(47, 6), arrowprops=dict(arrowstyle='->,head_width=0.3,head_length=0.4', color='#0F1D32', lw=1.5))
    ax.text(75, 10, "Exercice Archivé\n& Livrables Scellés", fontsize=7.5, fontweight='bold', ha='center', color='#0F1D32')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "diagramme_activite_cycle_budgetaire_sprint7.png")
    fig.savefig(path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("[OK] Diagramme d'Activite genere :", path)

if __name__ == '__main__':
    generate_use_case_diagram()
    generate_class_diagram()
    generate_sequence_engagement()
    generate_sequence_tco_export()
    generate_activity_diagram()
    print("=== TOUS LES DIAGRAMMES SPRINT 7 ONT ETE GENERES AVEC SUCCES ===")

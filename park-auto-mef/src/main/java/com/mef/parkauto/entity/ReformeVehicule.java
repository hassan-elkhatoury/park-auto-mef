package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Procédure de réforme d'un véhicule (RG07).
 * <p>
 * Cycle de vie contrôlé côté serveur :
 * INITIE → EN_COURS_DE_REFORME → VALIDE → REFORME → VENDU.
 * La validation exige le PV de la Commission de Réforme ET le PV des Domaines.
 */
@Entity @Table(name="reformes_vehicules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReformeVehicule extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;

    /** Sinistre à l'origine de la réforme (perte totale / épave), le cas échéant. */
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="sinistre_id")
    private Sinistre sinistre;

    @Column(length=1000) private String motifReforme;
    private LocalDate dateDecision;

    /** Référence / numéro du PV de la Commission de Réforme (obligatoire pour la validation). */
    @Column(length=500) private String pvCommission;
    private LocalDate datePvCommission;

    /** Référence / numéro du PV de la Direction des Domaines (obligatoire pour la validation). */
    @Column(length=500) private String pvDomaines;
    private LocalDate datePvDomaines;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutReforme statut = StatutReforme.INITIE;

    @Column(precision=12, scale=2) private BigDecimal prixCession;
    private LocalDate dateCession;
    @Column(length=200) private String acquereur;

    /** Date de sortie définitive du parc (renseignée à la validation). */
    private LocalDate dateSortieParc;

    @Column(length=1000) private String observation;
}

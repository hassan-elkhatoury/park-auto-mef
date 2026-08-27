package com.mef.parkauto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "pieces_remplacement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PieceRemplacement extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String referencePiece;

    @Column(nullable = false, length = 200)
    private String designation;

    @Column(length = 100)
    private String categorie; // Filtres, Freinage, Moteur, Électrique, Suspension, etc.

    @Column(nullable = false)
    private Integer quantite = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal montantTotal = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intervention_id")
    private InterventionMaintenance intervention;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "panne_id")
    private PanneVehicule panne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id")
    private GarageAgree garage;

    @PrePersist
    @PreUpdate
    public void calculerMontantTotal() {
        if (prixUnitaire != null && quantite != null) {
            this.montantTotal = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}

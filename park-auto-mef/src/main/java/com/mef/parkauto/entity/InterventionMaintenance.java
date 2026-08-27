package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "interventions_maintenance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterventionMaintenance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_agree_id")
    private GarageAgree garageAgree;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeMaintenance typeMaintenance = TypeMaintenance.PREVENTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NatureMaintenance natureOperation = NatureMaintenance.REVISION_PERIODIQUE;

    private LocalDate datePrevisionnelle;

    private LocalDate dateRealisation;

    private Long kilometragePrevu;

    private Long kilometrageRealise;

    @Column(length = 100)
    private String prestataire; // Garage agréé

    @Column(precision = 10, scale = 2)
    private BigDecimal coutMainOeuvre;

    @Column(precision = 10, scale = 2)
    private BigDecimal coutPieces;

    @Column(precision = 10, scale = 2)
    private BigDecimal montantTotal;

    @Column(length = 255)
    private String piecesRemplacees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutMaintenance statut = StatutMaintenance.PROGRAMMEE;

    private Boolean immobilisation = false;

    @Column(length = 500)
    private String description;
}

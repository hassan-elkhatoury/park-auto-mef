package com.mef.parkauto.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pannes_vehicules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PanneVehicule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducteur_id")
    private Conducteur conducteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_agree_id")
    private GarageAgree garageAgree;

    @Column(nullable = false)
    private LocalDateTime dateDeclaration = LocalDateTime.now();

    @Column(length = 200)
    private String lieuPanne;

    private Long kilometragePanne;

    @Column(nullable = false, length = 500)
    private String naturePanne;

    @Column(length = 1000)
    private String descriptionSymptomes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UrgencePanne degreUrgence = UrgencePanne.MOYENNE;

    private Boolean immobilisante = true;

    private Boolean remorquageRequis = false;

    @Column(length = 150)
    private String societeRemorquage;

    @Column(length = 1000)
    private String diagnosticAtelier;

    private Integer dureeImmobilisationJours;

    @Column(precision = 10, scale = 2)
    private BigDecimal coutEstimeDevis = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal coutReelReparation = BigDecimal.ZERO;

    private Long kilometrageCloture;

    private LocalDateTime dateReparation;

    private LocalDateTime dateCloture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutPanne statut = StatutPanne.DECLAREE;

    @Column(length = 100)
    private String referenceBonSortie;

    @Column(length = 100)
    private String referenceFacture;

    @Column(length = 255)
    private String garantieAccordee;

    @Column(length = 500)
    private String observations;
}

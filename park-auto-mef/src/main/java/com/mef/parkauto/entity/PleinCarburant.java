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
import java.time.LocalDateTime;

@Entity
@Table(name = "pleins_carburant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PleinCarburant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducteur_id")
    private Conducteur conducteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carte_carburant_id")
    private CarteCarburant carteCarburant;

    @Column(nullable = false)
    private LocalDateTime datePlein;

    @Column(length = 100)
    private String stationService;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeCarburant typeCarburant = TypeCarburant.DIESEL;

    @Column(nullable = false)
    private Double quantiteLitres;

    @Column(precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montantTTC;

    @Column(nullable = false)
    private Long kilometrage;

    private Double consommationMoyenne; // L/100km

    private Boolean anomalieSurconsommation = false;

    @Column(length = 50)
    private String referenceTicket;

    @Column(length = 50)
    private String referenceFacture;

    @Column(length = 255)
    private String observation;
}

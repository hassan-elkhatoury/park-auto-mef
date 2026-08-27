package com.mef.parkauto.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "sinistres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sinistre extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducteur_id")
    private Conducteur conducteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assurance_id")
    private Assurance assurance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_agree_id")
    private GarageAgree garageAgree;

    @Column(nullable = false)
    private LocalDate dateAccident;

    @Column(length = 200)
    private String lieuAccident;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String tiersImpliques;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NatureAccident natureAccident = NatureAccident.COLLISION;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantDommages = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantFranchise = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantRembourse = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutSinistre statut = StatutSinistre.DECLARE;

    @Column(length = 100)
    private String referenceExpertise;

    @Column(length = 100)
    private String numeroConstat;

    @Column(length = 100)
    private String refPvPolice;

    private LocalDate dateExpertise;

    private LocalDate dateCloture;

    private Boolean remorquageRequis = false;

    @Column(length = 500)
    private String observations;
}

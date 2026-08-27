package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "garages_agrees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GarageAgree extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String nomGarage;

    @Column(length = 100)
    private String raisonSociale;

    @Column(length = 100)
    private String ville;

    @Column(length = 255)
    private String adresse;

    @Column(length = 50)
    private String telephone;

    @Column(length = 100)
    private String email;

    @Column(length = 100)
    private String contactNom;

    @Column(length = 100)
    private String referenceConvention; // Ex: CONV-MEF-2026-01

    private Boolean agreeMEF = true;

    @Column(length = 255)
    private String specialites; // Ex: "Mécanique générale, Électricité, Tôlerie, Climatisation, Pneumatiques"

    @Column(precision = 10, scale = 2)
    private BigDecimal tarifHoraireMo; // Taux horaire négocié MEF (DH)

    @Column(precision = 5, scale = 2)
    private BigDecimal remisePiecesPct; // Remise sur pièces de rechange (%)

    @Column(precision = 3, scale = 2)
    private BigDecimal noteEvaluation; // Note qualité MEF sur 5

    @Column(length = 500)
    private String observations;

    private Boolean actif = true;
}

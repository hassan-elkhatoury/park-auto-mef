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
@Table(name = "cartes_carburant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarteCarburant extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String numeroCarte;

    @Column(nullable = false, length = 50)
    private String fournisseur; // TotalEnergies, Afriquia, Winxo, Shell...

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    @Column(length = 100)
    private String serviceAttribue;

    @Column(precision = 10, scale = 2)
    private BigDecimal plafondMensuel;

    @Column(precision = 10, scale = 2)
    private BigDecimal solde;

    private LocalDate dateActivation;

    private LocalDate dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CarteCarburantStatut statut = CarteCarburantStatut.ACTIVE;

    @Column(length = 255)
    private String observation;
}

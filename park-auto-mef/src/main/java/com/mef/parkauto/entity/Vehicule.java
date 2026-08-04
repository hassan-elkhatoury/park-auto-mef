package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entité représentant un véhicule du parc automobile du MEF.
 * Hérite des champs techniques d'audit via {@link BaseEntity}.
 */
@Entity
@Table(name = "vehicules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vehicule extends BaseEntity {

    // --- Identification ---
    @Column(unique = true, nullable = false, length = 50)
    private String immatriculation;

    @Column(length = 50)
    private String ancienneImmatriculation;

    @Column(unique = true, nullable = false, length = 50)
    private String numeroInventaire;

    @Column(unique = true, nullable = false, length = 50)
    private String numeroChassis;

    @Column(length = 50)
    private String numeroMoteur;

    @Column(nullable = false, length = 50)
    private String marque;

    @Column(nullable = false, length = 50)
    private String modele;

    @Column(length = 50)
    private String version;

    @Column(length = 50)
    private String categorie;

    @Column(length = 50)
    private String typeVehicule;

    @Column(length = 30)
    private String couleur;

    private Integer anneeFabrication;

    private LocalDate datePremiereMiseCirculation;

    // --- Caractéristiques techniques ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeCarburant typeCarburant = TypeCarburant.DIESEL;

    private Integer puissanceFiscale;

    private Integer puissanceReelle;

    private Integer cylindree;

    private Integer nombrePlaces;

    @Column(length = 30)
    private String typeBoiteVitesses;

    private Double capaciteReservoir;

    private Double consommationTheorique;

    @Column(nullable = false)
    private Long kilometrageInitial = 0L;

    @Column(nullable = false)
    private Long kilometrageActuel = 0L;

    // --- Acquisition ---
    @Column(length = 50)
    private String modeAcquisition;

    @Column(length = 100)
    private String fournisseur;

    private LocalDate dateAcquisition;

    private LocalDate dateReception;

    private BigDecimal montantAcquisition;

    @Column(length = 50)
    private String numeroMarche;

    @Column(length = 50)
    private String numeroBonCommande;

    @Column(length = 50)
    private String referenceFacture;

    private Integer dureeGarantie; // en mois

    private LocalDate dateFinGarantie;

    // --- Échéances légales & Maintenance ---
    private LocalDate dateFinAssurance;

    private LocalDate dateVisiteTechnique;

    private LocalDate dateVignette;

    private Long prochainSeuilEntretienKm = 10000L;

    // --- Rattachement administratif ---
    @Column(length = 100)
    private String organisme = "Ministère de l'Économie et des Finances";

    @Column(length = 100)
    private String direction;

    @Column(length = 100)
    private String division;

    @Column(length = 100)
    private String service;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String provincePrefecture;

    @Column(length = 100)
    private String commune;

    @Column(length = 50)
    private String centreCout;

    @Column(length = 100)
    private String responsable;

    // --- Statuts ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutAdministratif statutAdministratif = StatutAdministratif.DISPONIBLE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EtatTechnique etatTechnique = EtatTechnique.NEUF;
}

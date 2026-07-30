package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité représentant l'affectation d'un véhicule et d'un conducteur à une demande de déplacement.
 */
@Entity
@Table(name = "affectations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Affectation extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String reference; // e.g. AFF-2026-0001

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    private DemandeDeplacement demandeDeplacement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducteur_id", nullable = false)
    private Conducteur conducteur;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    @Column(nullable = false)
    private LocalDateTime dateFinPrevisionnelle;

    private LocalDateTime dateFinReelle;

    @Column(nullable = false)
    private Long kilometrageDepart;

    private Long kilometrageRetour;

    @Column(length = 50)
    private String niveauCarburantRetour; // e.g. "Plein", "3/4", "1/2", "1/4", "Réserve"

    @Column(length = 500)
    private String remarquesRestitution;

    @Column(length = 500)
    private String anomaliesConstatees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutAffectation statut = StatutAffectation.EN_COURS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id", nullable = false)
    private Utilisateur createur;
}

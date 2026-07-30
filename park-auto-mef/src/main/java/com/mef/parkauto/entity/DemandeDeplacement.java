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

import java.time.LocalDateTime;

/**
 * Entité représentant une demande de réservation / déplacement de mission.
 */
@Entity
@Table(name = "demandes_deplacement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandeDeplacement extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String reference; // e.g. DEM-2026-0001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Utilisateur demandeur;

    @Column(nullable = false, length = 255)
    private String motif;

    @Column(nullable = false, length = 150)
    private String destination; // Ville, région ou site destination

    @Column(nullable = false)
    private LocalDateTime dateHeureDepart;

    @Column(nullable = false)
    private LocalDateTime dateHeureRetourEstimee;

    private Integer nombrePassagers = 1;

    @Column(length = 500)
    private String listePassagers; // Noms des accompagnateurs

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutDemande statut = StatutDemande.EN_ATTENTE_VALIDATION;

    @Column(length = 500)
    private String motifRejet; // Motif obligatoire en cas de rejet N1

    // Validation Niveau 1 (Responsable de Service)
    private LocalDateTime dateValidationService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valideur_service_id")
    private Utilisateur valideurService;

    // Validation Niveau 2 & Affectation (Gestionnaire du Parc)
    private LocalDateTime dateApprobationParc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approbateur_parc_id")
    private Utilisateur approbateurParc;
}

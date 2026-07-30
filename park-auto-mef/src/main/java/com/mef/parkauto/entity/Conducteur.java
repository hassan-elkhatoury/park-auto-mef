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

import java.time.LocalDate;

/**
 * Entité représentant un conducteur / chauffeur habilité du MEF.
 * Le lien avec un Utilisateur du système est optionnel (nullable = true)
 * pour permettre la gestion de chauffeurs dédiés qui n'ont pas de compte applicatif.
 */
@Entity
@Table(name = "conducteurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conducteur extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String matricule;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(unique = true, nullable = false, length = 30)
    private String cin;

    @Column(length = 100)
    private String direction;

    @Column(length = 100)
    private String service;

    @Column(length = 30)
    private String telephone;

    @Column(length = 150)
    private String email;

    @Column(unique = true, nullable = false, length = 50)
    private String numeroPermis;

    @Column(nullable = false, length = 50)
    private String categoriePermis; // e.g. "B", "B, C", "B, C, D"

    private LocalDate dateDelivrancePermis;

    @Column(nullable = false)
    private LocalDate dateExpirationPermis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutConducteur statut = StatutConducteur.ACTIF;

    @Column(length = 255)
    private String habilitationsSpeciales; // e.g. "VIP, Conduite 4x4, Mission Spéciale"

    // Lien optionnel vers un compte utilisateur du système
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = true)
    private Utilisateur utilisateur;
}

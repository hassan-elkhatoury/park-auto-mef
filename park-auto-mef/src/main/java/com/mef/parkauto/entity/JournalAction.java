package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité générique de journalisation des actions.
 * Conçue pour être réutilisée par tous les modules (véhicules, assurances, entretiens, etc.).
 * <p>
 * Ne hérite PAS de BaseEntity car un journal d'audit ne doit pas avoir ses propres champs d'audit.
 */
@Entity
@Table(name = "journal_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JournalAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom d'utilisateur ayant effectué l'action */
    @Column(nullable = false, length = 150)
    private String username;

    /** Date et heure de l'action */
    @Column(nullable = false)
    private LocalDateTime timestamp;

    /** Module concerné (AUTH, UTILISATEUR, VEHICULE, ASSURANCE, etc.) */
    @Column(nullable = false, length = 50)
    private String module;

    /** Type d'action (CREATE, UPDATE, DELETE, LOGIN, etc.) */
    @Column(nullable = false, length = 50)
    private String action;

    /** Nom de l'entité concernée (Utilisateur, Vehicule, etc.) */
    @Column(length = 100)
    private String entityName;

    /** Identifiant de l'entité concernée */
    private Long entityId;

    /** Ancienne valeur (snapshot JSON) */
    @Column(columnDefinition = "TEXT")
    private String oldValue;

    /** Nouvelle valeur (snapshot JSON) */
    @Column(columnDefinition = "TEXT")
    private String newValue;

    /** Adresse IP du client */
    @Column(length = 50)
    private String ipAddress;
}

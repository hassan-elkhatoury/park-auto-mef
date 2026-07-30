package com.mef.parkauto.entity;

/**
 * Statuts possibles d'une demande de déplacement (Sprint 3).
 */
public enum StatutDemande {
    EN_ATTENTE_VALIDATION, // Initialisée par l'agent, en attente de l'avis du Responsable de Service (Niveau 1)
    VALIDEE_SERVICE,       // Approuvée par le Responsable de Service, en attente d'affectation par le Parc (Niveau 2)
    REJETEE,               // Rejetée par le Responsable de Service (avec motif obligatoire)
    APPROUVEE_AFFECTEE,   // Affectée à un véhicule et un conducteur par le Gestionnaire du Parc
    EN_COURS,              // Mission en cours d'exécution
    TERMINEE,              // Restitution effectuée avec succès
    ANNULEE                // Demande annulée
}

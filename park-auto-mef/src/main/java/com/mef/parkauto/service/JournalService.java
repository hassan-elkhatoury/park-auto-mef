package com.mef.parkauto.service;

import com.mef.parkauto.entity.JournalAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service pour la journalisation des actions sensibles (audit trail).
 */
public interface JournalService {

    /**
     * Enregistre une action dans le journal d'audit.
     * Le nom d'utilisateur est automatiquement extrait de la session courante si possible.
     * Le timestamp est généré automatiquement.
     *
     * @param module         le module concerné (ex: VEHICULE, UTILISATEUR, etc.)
     * @param action         le type d'action (ex: CREATE, UPDATE, DELETE, etc.)
     * @param entityName     le nom de l'entité concernée (ex: Utilisateur, Vehicule)
     * @param entityId       l'identifiant technique de l'entité
     * @param oldValue       l'état précédent de l'entité (snapshot JSON ou texte)
     * @param newValue       le nouvel état de l'entité (snapshot JSON ou texte)
     * @param ipAddress      l'adresse IP de l'appelant
     */
    void log(String module, String action, String entityName, Long entityId,
             String oldValue, String newValue, String ipAddress);

    /**
     * Recherche les entrées du journal par module avec pagination.
     *
     * @param module   le module de filtrage
     * @param pageable la configuration de pagination
     * @return une page de JournalAction
     */
    Page<JournalAction> findByModule(String module, Pageable pageable);

    /**
     * Recherche les entrées du journal par nom d'utilisateur avec pagination.
     *
     * @param username le nom d'utilisateur de filtrage
     * @param pageable la configuration de pagination
     * @return une page de JournalAction
     */
    Page<JournalAction> findByUsername(String username, Pageable pageable);
}

package com.mef.parkauto.service;

import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.user.UpdateRolesRequest;
import com.mef.parkauto.dto.user.UtilisateurRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service pour la gestion CRUD des utilisateurs.
 */
public interface UtilisateurService {

    /**
     * Récupère la liste de tous les utilisateurs sous forme paginée.
     *
     * @param pageable les critères de pagination et de tri
     * @return une page de UtilisateurResponse
     */
    Page<UtilisateurResponse> findAll(Pageable pageable);

    /**
     * Récupère un utilisateur par son identifiant technique.
     *
     * @param id l'identifiant technique de l'utilisateur
     * @return le DTO correspondant
     */
    UtilisateurResponse findById(Long id);

    /**
     * Crée un nouvel utilisateur en base de données.
     * Encode son mot de passe et lui associe ses rôles par défaut.
     *
     * @param request le DTO d'inscription ou de création
     * @return le DTO de l'utilisateur créé
     */
    UtilisateurResponse create(RegisterRequest request);

    /**
     * Met à jour les informations d'un utilisateur existant (mise à jour partielle).
     *
     * @param id      l'identifiant de l'utilisateur à modifier
     * @param request le DTO contenant les nouvelles valeurs
     * @return le DTO mis à jour
     */
    UtilisateurResponse update(Long id, UtilisateurRequest request);

    /**
     * Désactive un utilisateur (Soft Delete en modifiant le statut à INACTIVE).
     *
     * @param id l'identifiant de l'utilisateur à désactiver
     */
    void deactivate(Long id);

    /**
     * Met à jour le rôle associé à un utilisateur.
     *
     * @param id      l'identifiant de l'utilisateur concerné
     * @param request le nouveau rôle à affecter
     * @return le DTO de l'utilisateur avec son nouveau rôle
     */
    UtilisateurResponse updateRole(Long id, UpdateRolesRequest request);
}

package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.user.UpdateRolesRequest;
import com.mef.parkauto.dto.user.UtilisateurRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrôleur REST pour la gestion CRUD des utilisateurs.
 * <p>
 * Sécurisé par token JWT (Bearer Token) avec autorisations basées sur les rôles.
 */
@RestController
@RequestMapping("/api/utilisateurs")
@Tag(name = "Utilisateurs", description = "Endpoints de gestion CRUD des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Récupère la liste de tous les utilisateurs (paginée)")
    public ResponseEntity<ApiResponse<Page<UtilisateurResponse>>> getAllUtilisateurs(
            @PageableDefault(size = 10, sort = "id") Pageable pageable
    ) {
        log.info("Requête GET paginée reçue pour les utilisateurs");
        Page<UtilisateurResponse> page = utilisateurService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Liste des utilisateurs récupérée"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL') or (isAuthenticated() and principal.id == #id)")
    @Operation(summary = "Récupère les détails d'un utilisateur par son ID")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> getUtilisateurById(@PathVariable Long id) {
        log.info("Requête GET reçue pour l'utilisateur ID: {}", id);
        UtilisateurResponse response = utilisateurService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Utilisateur trouvé"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crée un nouvel utilisateur")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> createUtilisateur(
            @Valid @RequestBody RegisterRequest request
    ) {
        log.info("Requête POST reçue pour créer l'utilisateur email: {}", request.email());
        UtilisateurResponse response = utilisateurService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Utilisateur créé avec succès"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Met à jour les informations d'un utilisateur existant (partiel)")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> updateUtilisateur(
            @PathVariable Long id,
            @Valid @RequestBody UtilisateurRequest request
    ) {
        log.info("Requête PUT reçue pour mettre à jour l'utilisateur ID: {}", id);
        UtilisateurResponse response = utilisateurService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Utilisateur mis à jour avec succès"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Désactive un utilisateur (Soft Delete en modifiant le statut à INACTIVE)")
    public ResponseEntity<ApiResponse<Void>> deactivateUtilisateur(@PathVariable Long id) {
        log.info("Requête DELETE reçue pour désactiver l'utilisateur ID: {}", id);
        utilisateurService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Utilisateur désactivé avec succès"));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Met à jour le rôle associé à un utilisateur")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> updateUtilisateurRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRolesRequest request
    ) {
        log.info("Requête PUT reçue pour mettre à jour le rôle de l'utilisateur ID: {}", id);
        UtilisateurResponse response = utilisateurService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Rôle de l'utilisateur mis à jour avec succès"));
    }
}

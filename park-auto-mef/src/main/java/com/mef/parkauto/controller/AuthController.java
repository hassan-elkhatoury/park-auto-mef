package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.auth.LoginRequest;
import com.mef.parkauto.dto.auth.LoginResponse;
import com.mef.parkauto.dto.auth.RefreshTokenRequest;
import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mef.parkauto.dto.auth.ChangePasswordRequest;
import com.mef.parkauto.dto.auth.UpdatePhotoRequest;
import com.mef.parkauto.dto.auth.UpdateProfilRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

/**
 * Contrôleur REST pour l'authentification et la gestion de session.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "Endpoints d'authentification et de gestion de session")
@Slf4j
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authentifie un utilisateur et retourne les tokens d'accès et de rafraîchissement")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Requête de connexion reçue pour l'email: {}", request.email());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Connexion réussie"));
    }

    @PostMapping("/register")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enregistre un nouvel utilisateur (réservé à l'Administrateur)")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Requête d'inscription reçue pour l'email: {}", request.email());
        UtilisateurResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Utilisateur enregistré avec succès"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Génère de nouveaux tokens JWT à partir d'un token de rafraîchissement")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Requête de rafraîchissement de token reçue");
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tokens rafraîchis avec succès"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnecte l'utilisateur et révoque ses tokens (access + refresh)")
    public ResponseEntity<ApiResponse<Void>> logout(
            @org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) RefreshTokenRequest request) {
        String accessToken = (authorization != null && authorization.startsWith("Bearer "))
                ? authorization.substring(7) : null;
        authService.logout(accessToken, request != null ? request.refreshToken() : null);
        return ResponseEntity.ok(ApiResponse.success(null, "Déconnexion réussie"));
    }

    @GetMapping("/me")
    @Operation(summary = "Récupère les informations du profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> getCurrentUser() {
        log.info("Requête de récupération du profil de l'utilisateur connecté reçue");
        UtilisateurResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response, "Profil utilisateur récupéré"));
    }

    @PutMapping("/me")
    @Operation(summary = "Met à jour les informations personnelles de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> updateCurrentUser(
            @Valid @RequestBody UpdateProfilRequest request
    ) {
        log.info("Requête de mise à jour du profil de l'utilisateur connecté reçue");
        UtilisateurResponse response = authService.updateCurrentProfile(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Profil mis à jour avec succès"));
    }

    @PutMapping(value = "/me/photo", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Enregistre un portrait officiel MEF comme photo de profil")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> updateCurrentPhoto(
            @Valid @RequestBody UpdatePhotoRequest request
    ) {
        log.info("Requête de mise à jour de la photo de profil (portrait) reçue");
        UtilisateurResponse response = authService.updateCurrentPhoto(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Photo de profil mise à jour"));
    }

    @PutMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Téléverse une photo de profil personnalisée")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> updateCurrentPhotoFile(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("Requête de téléversement de photo de profil reçue");
        UtilisateurResponse response = authService.updateCurrentPhotoFile(file);
        return ResponseEntity.ok(ApiResponse.success(response, "Photo de profil mise à jour"));
    }

    @GetMapping("/me/photo")
    @Operation(summary = "Télécharge la photo uploadée de l'utilisateur connecté")
    public ResponseEntity<Resource> getCurrentPhoto() {
        UtilisateurResponse current = authService.getCurrentUser();
        return servePhoto(authService.getPhotoFile(current.id()));
    }

    @GetMapping("/photos/{userId}")
    @Operation(summary = "Télécharge la photo uploadée d'un utilisateur")
    public ResponseEntity<Resource> getUserPhoto(@PathVariable Long userId) {
        return servePhoto(authService.getPhotoFile(userId));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Modifie le mot de passe obligatoire au premier login")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        log.info("Requête de changement de mot de passe obligatoire reçue");
        authService.changerMotDePasse(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe modifié avec succès"));
    }

    private ResponseEntity<Resource> servePhoto(AuthService.PhotoFile photo) {
        return ResponseEntity.ok()
                .contentType(photo.mediaType())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + photo.filename() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(photo.resource());
    }
}

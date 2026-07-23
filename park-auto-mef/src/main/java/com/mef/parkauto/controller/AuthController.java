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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mef.parkauto.dto.auth.ChangePasswordRequest;

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
    @Operation(summary = "Enregistre un nouvel utilisateur")
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

    @GetMapping("/me")
    @Operation(summary = "Récupère les informations du profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UtilisateurResponse>> getCurrentUser() {
        log.info("Requête de récupération du profil de l'utilisateur connecté reçue");
        UtilisateurResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response, "Profil utilisateur récupéré"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Modifie le mot de passe obligatoire au premier login")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        log.info("Requête de changement de mot de passe obligatoire reçue");
        authService.changerMotDePasse(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe modifié avec succès"));
    }
}

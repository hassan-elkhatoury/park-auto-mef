package com.mef.parkauto.service;

import com.mef.parkauto.dto.auth.LoginRequest;
import com.mef.parkauto.dto.auth.LoginResponse;
import com.mef.parkauto.dto.auth.RefreshTokenRequest;
import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;

import com.mef.parkauto.dto.auth.ChangePasswordRequest;

/**
 * Service pour la gestion de l'authentification et des jetons de session.
 */
public interface AuthService {

    /**
     * Authentifie un utilisateur à partir de ses identifiants.
     *
     * @param request la demande de connexion contenant email et mot de passe
     * @return les jetons d'accès et de rafraîchissement avec les détails utilisateur
     */
    LoginResponse login(LoginRequest request);

    /**
     * Enregistre un nouvel utilisateur.
     *
     * @param request les données d'inscription de l'utilisateur
     * @return les détails de l'utilisateur créé
     */
    UtilisateurResponse register(RegisterRequest request);

    /**
     * Génère un nouveau couple de tokens JWT à partir d'un token de rafraîchissement valide.
     *
     * @param request la requête contenant le token de rafraîchissement actuel
     * @return la nouvelle paire de tokens JWT
     */
    LoginResponse refreshToken(RefreshTokenRequest request);

    /**
     * Déconnecte l'utilisateur : révoque l'access token courant et le refresh token fourni.
     *
     * @param accessToken  le token d'accès Bearer courant (peut être null)
     * @param refreshToken le refresh token à révoquer (peut être null)
     */
    void logout(String accessToken, String refreshToken);

    /**
     * Récupère l'utilisateur connecté de la session courante.
     *
     * @return les détails de l'utilisateur connecté
     */
    UtilisateurResponse getCurrentUser();

    /**
     * Modifie le mot de passe de l'utilisateur connecté.
     *
     * @param request la demande de changement de mot de passe
     */
    void changerMotDePasse(ChangePasswordRequest request);
}

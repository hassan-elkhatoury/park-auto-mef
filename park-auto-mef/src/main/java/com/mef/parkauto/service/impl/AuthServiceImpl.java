package com.mef.parkauto.service.impl;

import com.mef.parkauto.dto.auth.LoginRequest;
import com.mef.parkauto.dto.auth.LoginResponse;
import com.mef.parkauto.dto.auth.RefreshTokenRequest;
import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.auth.ChangePasswordRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.UnauthorizedException;
import com.mef.parkauto.mapper.UtilisateurMapper;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.security.JwtService;
import com.mef.parkauto.service.AuthService;
import com.mef.parkauto.service.JournalService;
import com.mef.parkauto.service.UtilisateurService;
import com.mef.parkauto.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation du service {@link AuthService} d'authentification.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurMapper utilisateurMapper;
    private final PasswordEncoder passwordEncoder;
    private final JournalService journalService;
    private final HttpServletRequest httpServletRequest;

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Tentative de connexion de l'utilisateur : {}", request.email());

        // Check if user exists and is active before authenticating
        Utilisateur existingUser = utilisateurRepository.findByEmail(request.email()).orElse(null);
        if (existingUser != null && existingUser.getStatut() == com.mef.parkauto.entity.UserStatus.INACTIVE) {
            log.warn("Tentative de connexion sur un compte désactivé : {}", request.email());
            throw new UnauthorizedException("Ce compte agent est désactivé. Accès refusé par l'Administrateur MEF.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.motDePasse())
            );

            Utilisateur user = (Utilisateur) authentication.getPrincipal();

            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            UtilisateurResponse userResponse = utilisateurMapper.toResponse(user);

            // Log l'action dans le journal d'audit
            journalService.log(
                    AppConstants.MODULE_AUTH,
                    AppConstants.ACTION_LOGIN,
                    "Utilisateur",
                    user.getId(),
                    null,
                    "Connexion réussie",
                    httpServletRequest.getRemoteAddr()
            );

            log.info("Connexion réussie pour l'utilisateur : {}", request.email());
            return new LoginResponse(accessToken, refreshToken, userResponse);

        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.warn("Échec de connexion pour l'utilisateur {} : {}", request.email(), e.getMessage());
            throw new UnauthorizedException("Adresse email ou mot de passe incorrect");
        }
    }

    @Override
    public UtilisateurResponse register(RegisterRequest request) {
        log.info("Inscription d'un nouvel utilisateur : {}", request.email());
        return utilisateurService.create(request);
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();
        String email = jwtService.extractUsername(token);

        if (email != null) {
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

            if (jwtService.isTokenValid(token, user)) {
                String accessToken = jwtService.generateAccessToken(user);
                String newRefreshToken = jwtService.generateRefreshToken(user);
                UtilisateurResponse userResponse = utilisateurMapper.toResponse(user);

                log.info("Mise à jour des tokens JWT pour l'utilisateur : {}", email);
                return new LoginResponse(accessToken, newRefreshToken, userResponse);
            }
        }
        
        log.warn("Tentative de rafraîchissement avec un token invalide");
        throw new UnauthorizedException("Token de rafraîchissement invalide ou expiré");
    }

    @Override
    @Transactional(readOnly = true)
    public UtilisateurResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("Aucun utilisateur connecté");
        }

        String email = authentication.getName();
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return utilisateurMapper.toResponse(user);
    }

    @Override
    public void changerMotDePasse(ChangePasswordRequest request) {
        log.info("Changement de mot de passe demandé");

        UtilisateurResponse currentUser = getCurrentUser();
        Utilisateur user = utilisateurRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        // Vérification de l'ancien mot de passe
        if (!passwordEncoder.matches(request.ancienMotDePasse(), user.getMotDePasse())) {
            throw new UnauthorizedException("L'ancien mot de passe est incorrect");
        }

        // Encodage du nouveau mot de passe (le custom encoder va générer un nouveau sel)
        String encoded = passwordEncoder.encode(request.nouveauMotDePasse());
        String[] parts = encoded.split("\\$");
        user.setSel(parts[0]);
        user.setMotDePasse(encoded);
        user.setDoitChangerMotDePasse(false); // Le mot de passe a été changé

        utilisateurRepository.save(user);

        // Audit log
        journalService.log(
                AppConstants.MODULE_AUTH,
                "CHANGE_PASSWORD",
                "Utilisateur",
                user.getId(),
                "doitChangerMotDePasse: true",
                "doitChangerMotDePasse: false",
                httpServletRequest.getRemoteAddr()
        );
        log.info("Mot de passe mis à jour avec succès pour : {}", user.getEmail());
    }
}

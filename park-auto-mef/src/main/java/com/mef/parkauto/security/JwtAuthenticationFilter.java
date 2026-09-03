package com.mef.parkauto.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre d'authentification JWT exécuté une fois par requête.
 * <p>
 * Extrait le token Bearer de l'en-tête Authorization, valide le JWT
 * via {@link JwtService}, charge les détails utilisateur et alimente
 * le {@link SecurityContextHolder}.
 */
import com.mef.parkauto.entity.Utilisateur;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        // Pas d'en-tête Authorization ou pas de préfixe Bearer → on passe au filtre suivant
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(BEARER_PREFIX.length());
            final String username = jwtService.extractUsername(jwt);

            // Si un username est extrait et qu'aucune authentification n'est déjà en place
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                // Seul un token de type "access" non révoqué, pour un compte actif, ouvre une session
                if (jwtService.isAccessTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                     userDetails,
                                     null,
                                     userDetails.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Authentification JWT réussie pour l'utilisateur: {}", username);

                    // Bloquer l'accès aux autres endpoints si le mot de passe doit être changé
                    if (userDetails instanceof Utilisateur utilisateur &&
                            utilisateur.isDoitChangerMotDePasse() &&
                            !request.getRequestURI().contains("/api/auth/change-password") &&
                            !request.getRequestURI().contains("/api/auth/refresh") &&
                            !request.getRequestURI().contains("/api/auth/me")) {

                        log.warn("L'utilisateur {} doit changer son mot de passe", username);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write("{\"status\":403,\"message\":\"Changement de mot de passe obligatoire\"}");
                        return;
                    }
                } else {
                    log.debug("Token JWT invalide pour l'utilisateur: {}", username);
                }
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.debug("Token JWT expiré: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Erreur lors de la validation du token JWT: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}

package com.mef.parkauto.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * Service de gestion des tokens JWT (génération, validation, extraction).
 * <p>
 * Utilise l'API jjwt 0.12.x. Les paramètres de configuration (secret,
 * durées d'expiration) sont externalisés dans {@code application.properties}.
 */
@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * Génère un access token JWT pour l'utilisateur donné.
     *
     * @param userDetails les détails de l'utilisateur authentifié
     * @return le token JWT signé
     */
    public String generateAccessToken(UserDetails userDetails) {
        log.debug("Génération d'un access token pour l'utilisateur: {}", userDetails.getUsername());
        return buildToken(userDetails, accessTokenExpiration);
    }

    /**
     * Génère un refresh token JWT pour l'utilisateur donné.
     *
     * @param userDetails les détails de l'utilisateur authentifié
     * @return le refresh token JWT signé
     */
    public String generateRefreshToken(UserDetails userDetails) {
        log.debug("Génération d'un refresh token pour l'utilisateur: {}", userDetails.getUsername());
        return buildToken(userDetails, refreshTokenExpiration);
    }

    /**
     * Extrait le nom d'utilisateur (subject) du token JWT.
     *
     * @param token le token JWT
     * @return le nom d'utilisateur extrait
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Vérifie si le token est valide pour l'utilisateur donné.
     *
     * @param token       le token JWT à valider
     * @param userDetails les détails de l'utilisateur à vérifier
     * @return {@code true} si le token est valide, {@code false} sinon
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        boolean isValid = username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        log.debug("Validation du token pour l'utilisateur {}: {}", userDetails.getUsername(), isValid);
        return isValid;
    }

    // ========================================================================
    // Méthodes privées
    // ========================================================================

    private String buildToken(UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}

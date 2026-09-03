package com.mef.parkauto.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * Service de gestion des tokens JWT (génération, validation, extraction).
 * <p>
 * Utilise l'API jjwt 0.12.x. Les paramètres de configuration (secret,
 * durées d'expiration) sont externalisés dans {@code application.properties}.
 * <p>
 * Chaque token porte :
 * <ul>
 *   <li>un claim {@code type} = {@code access} | {@code refresh} — un refresh token
 *       ne peut jamais être utilisé comme Bearer d'accès et inversement ;</li>
 *   <li>un identifiant unique {@code jti} permettant la révocation (logout,
 *       désactivation de compte) via {@link TokenRevocationService}.</li>
 * </ul>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class JwtService {

    public static final String CLAIM_TYPE = "type";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private final TokenRevocationService revocationService;

    public String generateAccessToken(UserDetails userDetails) {
        log.debug("Génération d'un access token pour l'utilisateur: {}", userDetails.getUsername());
        return buildToken(userDetails, accessTokenExpiration, TYPE_ACCESS);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        log.debug("Génération d'un refresh token pour l'utilisateur: {}", userDetails.getUsername());
        return buildToken(userDetails, refreshTokenExpiration, TYPE_REFRESH);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, c -> c.get(CLAIM_TYPE, String.class));
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Valide un token d'ACCÈS : signature, expiration, sujet, type et non-révocation.
     */
    public boolean isAccessTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, TYPE_ACCESS);
    }

    /**
     * Valide un token de RAFRAÎCHISSEMENT : signature, expiration, sujet, type et non-révocation.
     */
    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, TYPE_REFRESH);
    }

    /**
     * @deprecated conservé pour compatibilité ; préférer {@link #isAccessTokenValid} /
     * {@link #isRefreshTokenValid} qui vérifient également le type du token.
     */
    @Deprecated
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isAccessTokenValid(token, userDetails);
    }

    /**
     * Révoque un token (logout, rotation de refresh token, désactivation de compte).
     */
    public void revoke(String token) {
        try {
            String jti = extractJti(token);
            Date exp = extractExpiration(token);
            if (jti != null && exp != null) {
                revocationService.revoke(jti, exp.toInstant());
            }
        } catch (Exception e) {
            log.debug("Révocation ignorée (token illisible) : {}", e.getMessage());
        }
    }

    // ========================================================================
    // Méthodes privées
    // ========================================================================

    private boolean isTokenValid(String token, UserDetails userDetails, String expectedType) {
        final Claims claims = extractAllClaims(token);
        final String username = claims.getSubject();
        final String type = claims.get(CLAIM_TYPE, String.class);
        final String jti = claims.getId();

        boolean subjectOk = username != null && username.equals(userDetails.getUsername());
        boolean notExpired = claims.getExpiration() != null && claims.getExpiration().after(new Date());
        boolean typeOk = expectedType.equals(type);
        boolean notRevoked = jti != null && !revocationService.isRevoked(jti);
        boolean accountOk = userDetails.isEnabled() && userDetails.isAccountNonLocked();

        boolean isValid = subjectOk && notExpired && typeOk && notRevoked && accountOk;
        if (!isValid) {
            log.debug("Token refusé pour {} (subject={}, expiré={}, type={}, révoqué={}, compteActif={})",
                    userDetails.getUsername(), subjectOk, !notExpired, type, !notRevoked, accountOk);
        }
        return isValid;
    }

    private String buildToken(UserDetails userDetails, long expiration, String type) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userDetails.getUsername())
                .claim(CLAIM_TYPE, type)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET absent ou trop court (minimum 256 bits). Configurez la variable d'environnement JWT_SECRET.");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}

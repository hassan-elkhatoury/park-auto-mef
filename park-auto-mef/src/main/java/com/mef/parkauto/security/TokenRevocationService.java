package com.mef.parkauto.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Liste de révocation des tokens JWT (par identifiant {@code jti}).
 * <p>
 * Un token révoqué (déconnexion explicite, rotation du refresh token,
 * désactivation de compte) est refusé jusqu'à sa date d'expiration naturelle,
 * après quoi il est purgé automatiquement.
 * <p>
 * Implémentation en mémoire (suffisante pour un déploiement mono-instance).
 * Pour un déploiement multi-instances, remplacer le store par Redis/PostgreSQL
 * en conservant la même interface.
 */
@Service
@Slf4j
public class TokenRevocationService {

    private final Map<String, Instant> revoked = new ConcurrentHashMap<>();

    public void revoke(String jti, Instant expiresAt) {
        if (jti == null) return;
        revoked.put(jti, expiresAt != null ? expiresAt : Instant.now().plusSeconds(86_400));
        log.debug("Token révoqué (jti={})", jti);
    }

    public boolean isRevoked(String jti) {
        if (jti == null) return true;
        Instant exp = revoked.get(jti);
        if (exp == null) return false;
        if (exp.isBefore(Instant.now())) {
            revoked.remove(jti);
            return false;
        }
        return true;
    }

    /** Purge horaire des entrées expirées. */
    @Scheduled(fixedDelay = 3_600_000)
    public void purgeExpired() {
        Instant now = Instant.now();
        revoked.entrySet().removeIf(e -> e.getValue().isBefore(now));
    }
}

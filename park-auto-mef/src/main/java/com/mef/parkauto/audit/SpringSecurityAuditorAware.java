package com.mef.parkauto.audit;

import org.springframework.data.domain.AuditorAware;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Implémentation de {@link AuditorAware} qui récupère l'utilisateur
 * courant depuis le {@link SecurityContextHolder} de Spring Security.
 * <p>
 * Retourne "SYSTEM" lorsque aucune authentification n'est disponible
 * (par exemple lors de l'initialisation des données au démarrage).
 */
public class SpringSecurityAuditorAware implements AuditorAware<String> {

    private static final String SYSTEM_USER = "SYSTEM";

    @Override
    @NonNull
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.of(SYSTEM_USER);
        }

        return Optional.of(authentication.getName());
    }
}

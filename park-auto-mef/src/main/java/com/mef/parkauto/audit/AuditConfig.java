package com.mef.parkauto.audit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Configuration de l'audit JPA.
 * <p>
 * Active le remplissage automatique des champs d'audit
 * ({@code dateCreation}, {@code dateModification}, {@code createdBy}, {@code updatedBy})
 * définis dans {@link com.mef.parkauto.entity.BaseEntity}.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    /**
     * Fournit l'identité de l'auditeur courant à Spring Data JPA.
     *
     * @return l'implémentation {@link AuditorAware} basée sur Spring Security
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return new SpringSecurityAuditorAware();
    }
}

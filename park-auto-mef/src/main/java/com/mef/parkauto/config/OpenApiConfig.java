package com.mef.parkauto.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration OpenAPI / Swagger UI pour la documentation de l'API.
 * <p>
 * Définit les métadonnées de l'API et le schéma de sécurité
 * Bearer JWT pour permettre l'authentification depuis Swagger UI.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    /**
     * Configure l'objet OpenAPI avec les informations de l'API
     * et le schéma de sécurité JWT Bearer.
     *
     * @return la configuration OpenAPI
     */
    @Bean
    public OpenAPI parkAutoOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Park Auto MEF API")
                        .version("1.0")
                        .description("API de gestion du parc automobile du Ministère de l'Économie et des Finances. "
                                + "Cette API permet la gestion des véhicules, des utilisateurs, des missions "
                                + "et de toutes les opérations liées au parc automobile.")
                        .contact(new Contact()
                                .name("MEF - Direction des Systèmes d'Information")
                                .email("support-parkauto@mef.gov"))
                )
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Insérez votre token JWT ici. "
                                        + "Obtenez-le via l'endpoint POST /api/auth/login.")
                        )
                );
    }
}

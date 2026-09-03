package com.mef.parkauto.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuration de sécurité Spring Security.
 * <p>
 * Définit une architecture stateless basée sur JWT :
 * <ul>
 *   <li>CSRF désactivé (API REST stateless)</li>
 *   <li>CORS avec la configuration par défaut de Spring</li>
 *   <li>Sessions en mode STATELESS</li>
 *   <li>Endpoints publics : authentification, documentation Swagger</li>
 *   <li>Tous les autres endpoints requièrent une authentification</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    /**
     * Configure la chaîne de filtres de sécurité HTTP.
     *
     * @param http le builder HttpSecurity
     * @return la chaîne de filtres configurée
     * @throws Exception en cas d'erreur de configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                        .contentTypeOptions(cto -> {})
                        .referrerPolicy(rp -> rp.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/css/**",
                                "/js/**",
                                "/assets/**",
                                "/favicon.ico",
                                "/error",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/swagger-ui/**",
                                "/api-docs",
                                "/api-docs/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Session expirée ou non authentifiée\"}");
                        })
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Fournisseur d'authentification basé sur la base de données.
     *
     * @return le DaoAuthenticationProvider configuré
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        // Migration transparente SHA-256 → BCrypt à la première connexion réussie
        authProvider.setUserDetailsPasswordService(customUserDetailsService);
        return authProvider;
    }

    /**
     * Gestionnaire d'authentification Spring Security.
     *
     * @param config la configuration d'authentification
     * @return le gestionnaire d'authentification
     * @throws Exception en cas d'erreur de configuration
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Encodeur de mots de passe : BCrypt (coût 12) par défaut, conformément aux exigences
     * DGSSI de hachage adaptatif. Les anciens hachages SHA-256 salés (format {@code sel$hash},
     * sans préfixe {@code {id}}) restent vérifiables et sont automatiquement ré-encodés en
     * BCrypt lors de la prochaine authentification réussie
     * (cf. {@link CustomUserDetailsService#updatePassword}).
     *
     * @return l'encodeur délégué
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        String defaultId = "bcrypt";
        java.util.Map<String, PasswordEncoder> encoders = new java.util.HashMap<>();
        encoders.put(defaultId, new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12));
        encoders.put("sha256", new Sha256PasswordEncoder());
        org.springframework.security.crypto.password.DelegatingPasswordEncoder delegating =
                new org.springframework.security.crypto.password.DelegatingPasswordEncoder(defaultId, encoders);
        // Hachages historiques sans préfixe {id} → vérifiés avec l'ancien algorithme SHA-256 salé
        delegating.setDefaultPasswordEncoderForMatches(new Sha256PasswordEncoder());
        return delegating;
    }

    /**
     * Politique CORS explicite : seules les origines du frontend MEF déclarées dans
     * {@code app.cors.allowed-origins} sont autorisées.
     */
    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource(
            @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:80,http://localhost}") String allowedOrigins) {
        org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();
        config.setAllowedOrigins(java.util.Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        config.setExposedHeaders(java.util.List.of("Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public org.springframework.boot.web.server.WebServerFactoryCustomizer<org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory> tomcatHeaderCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setProperty("maxHttpRequestHeaderSize", "65536");
        });
    }
}

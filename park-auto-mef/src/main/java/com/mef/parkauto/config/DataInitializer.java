package com.mef.parkauto.config;

import com.mef.parkauto.entity.Role;
import com.mef.parkauto.entity.RoleType;
import com.mef.parkauto.entity.UserStatus;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.repository.RoleRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Initialisation des données de référence au démarrage de l'application.
 * <p>
 * Crée les rôles définis dans {@link RoleType} et un utilisateur
 * administrateur par défaut si ils n'existent pas encore en base.
 * <p>
 * Les identifiants de l'administrateur sont externalisés dans la
 * configuration (propriétés {@code app.admin.email} et {@code app.admin.password}).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    /**
     * Descriptions par défaut de chaque rôle.
     */
    private static final Map<RoleType, String> ROLE_DESCRIPTIONS = Map.of(
            RoleType.ADMIN, "Administrateur système avec accès complet",
            RoleType.GESTIONNAIRE_CENTRAL, "Gestionnaire central du parc automobile",
            RoleType.GESTIONNAIRE_LOCAL, "Gestionnaire local du parc automobile",
            RoleType.RESPONSABLE_FINANCIER, "Responsable des aspects financiers du parc",
            RoleType.RESPONSABLE_SERVICE, "Responsable de service",
            RoleType.CONDUCTEUR, "Conducteur de véhicule",
            RoleType.CONSULTATION, "Accès en consultation uniquement"
    );

    @Override
    public void run(String... args) {
        log.info("=== Démarrage de l'initialisation des données ===");

        initializeRoles();
        initializeAdminUser();

        log.info("=== Initialisation des données terminée ===");
    }

    /**
     * Crée les rôles manquants en base de données.
     */
    private void initializeRoles() {
        log.info("Vérification et création des rôles...");

        for (RoleType roleType : RoleType.values()) {
            roleRepository.findByNom(roleType).ifPresentOrElse(
                    existingRole -> log.debug("Rôle déjà existant: {}", roleType),
                    () -> {
                        Role role = new Role();
                        role.setNom(roleType);
                        role.setDescription(ROLE_DESCRIPTIONS.getOrDefault(roleType, roleType.name()));
                        roleRepository.save(role);
                        log.info("Rôle créé: {} — {}", roleType, role.getDescription());
                    }
            );
        }

        log.info("Initialisation des rôles terminée. Total: {} rôles en base.",
                roleRepository.count());
    }

    /**
     * Crée l'utilisateur administrateur par défaut s'il n'existe pas.
     */
    private void initializeAdminUser() {
        log.info("Vérification de l'utilisateur administrateur par défaut...");

        if (utilisateurRepository.existsByEmail(adminEmail)) {
            log.info("L'utilisateur administrateur existe déjà (email: {}). Aucune action nécessaire.",
                    adminEmail);
            return;
        }

        Role adminRole = roleRepository.findByNom(RoleType.ADMIN)
                .orElseThrow(() -> new IllegalStateException(
                        "Le rôle ADMIN est introuvable. L'initialisation des rôles a échoué."
                ));

        Utilisateur admin = new Utilisateur();
        admin.setMatricule("ADMIN001");
        admin.setNom("Administrateur");
        admin.setPrenom("Système");
        admin.setEmail(adminEmail);
        
        String encoded = passwordEncoder.encode(adminPassword);
        String[] parts = encoded.split("\\$");
        admin.setSel(parts[0]);
        admin.setMotDePasse(encoded);
        
        admin.setStatut(UserStatus.ACTIVE);
        admin.setDoitChangerMotDePasse(false); // Admin d'init ne change pas obligatoirement
        admin.setRole(adminRole);

        utilisateurRepository.save(admin);
        log.info("Utilisateur administrateur créé avec succès — email: {}, matricule: ADMIN001",
                adminEmail);
    }
}

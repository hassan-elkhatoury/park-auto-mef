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
        initializeSampleSprint3Data();

        log.info("=== Initialisation des données terminée ===");
    }

    private final com.mef.parkauto.repository.ConducteurRepository conducteurRepository;
    private final com.mef.parkauto.repository.DemandeDeplacementRepository demandeRepository;
    private final com.mef.parkauto.repository.AffectationRepository affectationRepository;
    private final com.mef.parkauto.repository.VehiculeRepository vehiculeRepository;

    private void initializeSampleSprint3Data() {
        if (conducteurRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des données de test pour le Sprint 3 (Conducteurs & Demandes)...");

        // Retrieve CONDUCTEUR role
        Role driverRole = roleRepository.findByNom(RoleType.CONDUCTEUR).orElse(null);

        // 1. Conducteur 1 & User Account: Karim El Mansouri
        Utilisateur user1 = utilisateurRepository.findByEmail("k.elmansouri@mef.gov.ma").orElseGet(() -> {
            Utilisateur u = new Utilisateur();
            u.setMatricule("USR-CND-001");
            u.setNom("El Mansouri");
            u.setPrenom("Karim");
            u.setEmail("k.elmansouri@mef.gov.ma");
            String encoded = passwordEncoder.encode("Driver123!");
            String[] parts = encoded.split("\\$");
            u.setSel(parts[0]);
            u.setMotDePasse(encoded);
            u.setStatut(UserStatus.ACTIVE);
            u.setDoitChangerMotDePasse(false);
            u.setRole(driverRole);
            return utilisateurRepository.save(u);
        });

        com.mef.parkauto.entity.Conducteur c1 = new com.mef.parkauto.entity.Conducteur();
        c1.setMatricule("CND-001");
        c1.setNom("El Mansouri");
        c1.setPrenom("Karim");
        c1.setCin("A123456");
        c1.setDirection("Direction du Budget");
        c1.setService("Service de la Gestion du Parc");
        c1.setTelephone("0661122334");
        c1.setEmail("k.elmansouri@mef.gov.ma");
        c1.setNumeroPermis("PERM-B-998877");
        c1.setCategoriePermis("B, C");
        c1.setDateDelivrancePermis(java.time.LocalDate.of(2018, 5, 12));
        c1.setDateExpirationPermis(java.time.LocalDate.of(2028, 5, 12));
        c1.setStatut(com.mef.parkauto.entity.StatutConducteur.ACTIF);
        c1.setHabilitationsSpeciales("Conduite 4x4, VIP");
        c1.setUtilisateur(user1);
        conducteurRepository.save(c1);

        // 2. Conducteur 2 & User Account: Rachid Bennani
        Utilisateur user2 = utilisateurRepository.findByEmail("r.bennani@mef.gov.ma").orElseGet(() -> {
            Utilisateur u = new Utilisateur();
            u.setMatricule("USR-CND-002");
            u.setNom("Bennani");
            u.setPrenom("Rachid");
            u.setEmail("r.bennani@mef.gov.ma");
            String encoded = passwordEncoder.encode("Driver123!");
            String[] parts = encoded.split("\\$");
            u.setSel(parts[0]);
            u.setMotDePasse(encoded);
            u.setStatut(UserStatus.ACTIVE);
            u.setDoitChangerMotDePasse(false);
            u.setRole(driverRole);
            return utilisateurRepository.save(u);
        });

        com.mef.parkauto.entity.Conducteur c2 = new com.mef.parkauto.entity.Conducteur();
        c2.setMatricule("CND-002");
        c2.setNom("Bennani");
        c2.setPrenom("Rachid");
        c2.setCin("B789012");
        c2.setDirection("Direction Générale des Impôts");
        c2.setService("Service Transport & Logistique");
        c2.setTelephone("0665544332");
        c2.setEmail("r.bennani@mef.gov.ma");
        c2.setNumeroPermis("PERM-BD-554433");
        c2.setCategoriePermis("B, C, D");
        c2.setDateDelivrancePermis(java.time.LocalDate.of(2015, 3, 20));
        c2.setDateExpirationPermis(java.time.LocalDate.of(2027, 3, 20));
        c2.setStatut(com.mef.parkauto.entity.StatutConducteur.ACTIF);
        c2.setHabilitationsSpeciales("Transport de personnel");
        c2.setUtilisateur(user2);
        conducteurRepository.save(c2);

        // 3. Sample Demande de déplacement
        Utilisateur adminUser = utilisateurRepository.findByEmail(adminEmail).orElse(null);
        if (adminUser != null) {
            com.mef.parkauto.entity.DemandeDeplacement d1 = new com.mef.parkauto.entity.DemandeDeplacement();
            d1.setReference("DEM-2026-0001");
            d1.setDemandeur(adminUser);
            d1.setMotif("Mission d'inspection budgétaire régionale");
            d1.setDestination("Rabat -> Tanger");
            d1.setDateHeureDepart(java.time.LocalDateTime.now().plusDays(2).withHour(8).withMinute(0));
            d1.setDateHeureRetourEstimee(java.time.LocalDateTime.now().plusDays(4).withHour(18).withMinute(0));
            d1.setNombrePassagers(3);
            d1.setListePassagers("A. Alami, M. Chraibi, S. Benjelloun");
            d1.setStatut(com.mef.parkauto.entity.StatutDemande.EN_ATTENTE_VALIDATION);
            demandeRepository.save(d1);
        }

        log.info("Initialisation des données du Sprint 3 terminée.");
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
            utilisateurRepository.findByEmail(adminEmail).ifPresent(existingAdmin -> {
                String encoded = passwordEncoder.encode(adminPassword);
                String[] parts = encoded.split("\\$");
                existingAdmin.setSel(parts[0]);
                existingAdmin.setMotDePasse(encoded);
                existingAdmin.setStatut(UserStatus.ACTIVE);
                existingAdmin.setDoitChangerMotDePasse(false);
                utilisateurRepository.save(existingAdmin);
                log.info("Compte administrateur réinitialisé avec succès (email: {}).", adminEmail);
            });
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

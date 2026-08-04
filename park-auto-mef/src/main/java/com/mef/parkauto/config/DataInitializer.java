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
        initializeSampleSprint4Data();

        log.info("=== Initialisation des données terminée ===");
    }

    private final com.mef.parkauto.repository.ConducteurRepository conducteurRepository;
    private final com.mef.parkauto.repository.DemandeDeplacementRepository demandeRepository;
    private final com.mef.parkauto.repository.AffectationRepository affectationRepository;
    private final com.mef.parkauto.repository.VehiculeRepository vehiculeRepository;
    private final com.mef.parkauto.repository.PleinCarburantRepository pleinCarburantRepository;
    private final com.mef.parkauto.repository.CarteCarburantRepository carteCarburantRepository;
    private final com.mef.parkauto.repository.InterventionMaintenanceRepository maintenanceRepository;

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

    private void initializeSampleSprint4Data() {
        if (carteCarburantRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des données de démonstration pour le Sprint 4 (Carburant, Maintenance & Alertes)...");

        java.util.List<com.mef.parkauto.entity.Vehicule> vehicules = vehiculeRepository.findAll();
        if (vehicules.isEmpty()) {
            return;
        }

        com.mef.parkauto.entity.Vehicule v1 = vehicules.get(0);
        com.mef.parkauto.entity.Vehicule v2 = vehicules.size() > 1 ? vehicules.get(1) : v1;

        // Set legal dates & maintenance threshold for v1 & v2
        v1.setDateFinAssurance(java.time.LocalDate.now().plusDays(12)); // Expiration imminente
        v1.setDateVisiteTechnique(java.time.LocalDate.now().plusDays(45));
        v1.setDateVignette(java.time.LocalDate.now().plusDays(5));
        v1.setProchainSeuilEntretienKm(10000L);
        v1.setKilometrageActuel(9400L); // >90% -> triggers preventive alert
        vehiculeRepository.save(v1);

        v2.setDateFinAssurance(java.time.LocalDate.now().plusMonths(6));
        v2.setDateVisiteTechnique(java.time.LocalDate.now().minusDays(3)); // Expired!
        v2.setDateVignette(java.time.LocalDate.now().plusMonths(4));
        v2.setProchainSeuilEntretienKm(15000L);
        v2.setKilometrageActuel(14200L); // >90% -> triggers preventive alert
        vehiculeRepository.save(v2);

        // 1. Create Sample Fuel Cards
        com.mef.parkauto.entity.CarteCarburant card1 = new com.mef.parkauto.entity.CarteCarburant();
        card1.setNumeroCarte("7001-9988-1234-0001");
        card1.setFournisseur("TotalEnergies");
        card1.setVehicule(v1);
        card1.setServiceAttribue("Service Transport DAG");
        card1.setPlafondMensuel(java.math.BigDecimal.valueOf(3500));
        card1.setSolde(java.math.BigDecimal.valueOf(2150));
        card1.setDateActivation(java.time.LocalDate.of(2025, 1, 1));
        card1.setDateExpiration(java.time.LocalDate.of(2027, 12, 31));
        card1.setStatut(com.mef.parkauto.entity.CarteCarburantStatut.ACTIVE);
        card1.setObservation("Carte principale véhicule de fonction");
        carteCarburantRepository.save(card1);

        com.mef.parkauto.entity.CarteCarburant card2 = new com.mef.parkauto.entity.CarteCarburant();
        card2.setNumeroCarte("7001-9988-1234-0002");
        card2.setFournisseur("Afriquia");
        card2.setVehicule(v2);
        card2.setServiceAttribue("Direction du Budget");
        card2.setPlafondMensuel(java.math.BigDecimal.valueOf(5000));
        card2.setSolde(java.math.BigDecimal.valueOf(4200));
        card2.setDateActivation(java.time.LocalDate.of(2025, 3, 1));
        card2.setDateExpiration(java.time.LocalDate.of(2026, 8, 20)); // Expiring soon
        card2.setStatut(com.mef.parkauto.entity.CarteCarburantStatut.ACTIVE);
        card2.setObservation("Dotation carburant mission");
        carteCarburantRepository.save(card2);

        // 2. Create Sample Refuels (Pleins Carburant)
        com.mef.parkauto.entity.PleinCarburant p1 = new com.mef.parkauto.entity.PleinCarburant();
        p1.setVehicule(v1);
        p1.setCarteCarburant(card1);
        p1.setDatePlein(java.time.LocalDateTime.now().minusDays(5));
        p1.setStationService("TotalEnergies Agdal Rabat");
        p1.setTypeCarburant(com.mef.parkauto.entity.TypeCarburant.DIESEL);
        p1.setQuantiteLitres(55.0);
        p1.setPrixUnitaire(java.math.BigDecimal.valueOf(12.80));
        p1.setMontantTTC(java.math.BigDecimal.valueOf(704.00));
        p1.setKilometrage(9400L);
        p1.setConsommationMoyenne(7.8);
        p1.setAnomalieSurconsommation(false);
        p1.setReferenceTicket("TCK-99881");
        p1.setReferenceFacture("FAC-2026-081");
        pleinCarburantRepository.save(p1);

        com.mef.parkauto.entity.PleinCarburant p2 = new com.mef.parkauto.entity.PleinCarburant();
        p2.setVehicule(v2);
        p2.setCarteCarburant(card2);
        p2.setDatePlein(java.time.LocalDateTime.now().minusDays(2));
        p2.setStationService("Afriquia Autoroute Casa-Rabat");
        p2.setTypeCarburant(com.mef.parkauto.entity.TypeCarburant.ESSENCE);
        p2.setQuantiteLitres(68.0);
        p2.setPrixUnitaire(java.math.BigDecimal.valueOf(14.50));
        p2.setMontantTTC(java.math.BigDecimal.valueOf(986.00));
        p2.setKilometrage(14200L);
        p2.setConsommationMoyenne(14.2); // Overconsumption!
        p2.setAnomalieSurconsommation(true); // Trigger badge
        p2.setReferenceTicket("TCK-99895");
        p2.setReferenceFacture("FAC-2026-095");
        p2.setObservation("Consommation anormalement élevée relevée sur trajet autoroutier");
        pleinCarburantRepository.save(p2);

        // 3. Create Sample Maintenance Interventions
        com.mef.parkauto.entity.InterventionMaintenance m1 = new com.mef.parkauto.entity.InterventionMaintenance();
        m1.setVehicule(v1);
        m1.setTypeMaintenance(com.mef.parkauto.entity.TypeMaintenance.PREVENTIVE);
        m1.setNatureOperation(com.mef.parkauto.entity.NatureMaintenance.VIDANGE);
        m1.setDatePrevisionnelle(java.time.LocalDate.now().plusDays(3));
        m1.setKilometragePrevu(10000L);
        m1.setPrestataire("Auto Hall Service Rabat");
        m1.setCoutMainOeuvre(java.math.BigDecimal.valueOf(350));
        m1.setCoutPieces(java.math.BigDecimal.valueOf(850));
        m1.setMontantTotal(java.math.BigDecimal.valueOf(1200));
        m1.setPiecesRemplacees("Filtre à huile, Filtre à air, Huile 5W30 Synthetic");
        m1.setStatut(com.mef.parkauto.entity.StatutMaintenance.PROGRAMMEE);
        m1.setImmobilisation(false);
        m1.setDescription("Vidange périodique des 10 000 km");
        maintenanceRepository.save(m1);

        com.mef.parkauto.entity.InterventionMaintenance m2 = new com.mef.parkauto.entity.InterventionMaintenance();
        m2.setVehicule(v2);
        m2.setTypeMaintenance(com.mef.parkauto.entity.TypeMaintenance.CURATIVE);
        m2.setNatureOperation(com.mef.parkauto.entity.NatureMaintenance.REPARATION_PANNE);
        m2.setDatePrevisionnelle(java.time.LocalDate.now().minusDays(1));
        m2.setDateRealisation(java.time.LocalDate.now());
        m2.setKilometragePrevu(14000L);
        m2.setKilometrageRealise(14200L);
        m2.setPrestataire("Garage Central MEF Rabat");
        m2.setCoutMainOeuvre(java.math.BigDecimal.valueOf(600));
        m2.setCoutPieces(java.math.BigDecimal.valueOf(1850));
        m2.setMontantTotal(java.math.BigDecimal.valueOf(2450));
        m2.setPiecesRemplacees("Plaquettes de frein avant, Disques ventilés");
        m2.setStatut(com.mef.parkauto.entity.StatutMaintenance.EN_COURS);
        m2.setImmobilisation(true); // Immobilizes vehicle!
        m2.setDescription("Remplacement freins suite à grincement au freinage");
        maintenanceRepository.save(m2);

        // Update v2 status due to heavy maintenance immobilization
        v2.setStatutAdministratif(com.mef.parkauto.entity.StatutAdministratif.EN_MAINTENANCE);
        vehiculeRepository.save(v2);

        log.info("Initialisation des données de démonstration du Sprint 4 terminée avec succès.");
    }
}

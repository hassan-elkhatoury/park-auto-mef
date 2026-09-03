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
        initializeSampleSprint5Data();
        initializeSampleSprint6Data();
        initializeSampleSprint7Data();
        initializeAuditJournal();

        log.info("=== Initialisation des données terminée ===");
    }

    private final com.mef.parkauto.repository.ConducteurRepository conducteurRepository;
    private final com.mef.parkauto.repository.DemandeDeplacementRepository demandeRepository;
    private final com.mef.parkauto.repository.AffectationRepository affectationRepository;
    private final com.mef.parkauto.repository.VehiculeRepository vehiculeRepository;
    private final com.mef.parkauto.repository.PleinCarburantRepository pleinCarburantRepository;
    private final com.mef.parkauto.repository.CarteCarburantRepository carteCarburantRepository;
    private final com.mef.parkauto.repository.InterventionMaintenanceRepository maintenanceRepository;
    private final com.mef.parkauto.repository.AssuranceRepository assuranceRepository;
    private final com.mef.parkauto.repository.SinistreRepository sinistreRepository;
    private final com.mef.parkauto.repository.InfractionRepository infractionRepository;
    private final com.mef.parkauto.repository.VisiteTechniqueRepository visiteTechniqueRepository;
    private final com.mef.parkauto.repository.TaxeAutomobileRepository taxeAutomobileRepository;
    private final com.mef.parkauto.repository.ReformeVehiculeRepository reformeVehiculeRepository;
    private final com.mef.parkauto.repository.BudgetDirectionRepository budgetDirectionRepository;
    private final com.mef.parkauto.repository.PrevisionCarburantRepository previsionCarburantRepository;
    private final com.mef.parkauto.repository.GarageAgreeRepository garageAgreeRepository;
    private final com.mef.parkauto.repository.PanneRepository panneRepository;
    private final com.mef.parkauto.repository.PieceRemplacementRepository pieceRemplacementRepository;
    private final com.mef.parkauto.repository.ExerciceBudgetaireRepository exerciceBudgetaireRepository;
    private final com.mef.parkauto.repository.EngagementBudgetaireRepository engagementBudgetaireRepository;
    private final com.mef.parkauto.repository.JournalActionRepository journalActionRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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
        p2.setTypeCarburant(com.mef.parkauto.entity.TypeCarburant.DIESEL);
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

    private void initializeSampleSprint5Data() {
        if (assuranceRepository.count() > 0 || budgetDirectionRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des données de démonstration pour le Sprint 5 (Assurances, Sinistres, Visites, Budget)...");

        java.util.List<com.mef.parkauto.entity.Vehicule> vehicules = vehiculeRepository.findAll();
        if (vehicules.isEmpty()) {
            return;
        }

        com.mef.parkauto.entity.Vehicule v1 = vehicules.get(0);
        com.mef.parkauto.entity.Vehicule v2 = vehicules.size() > 1 ? vehicules.get(1) : v1;

        // 1. Assurances
        com.mef.parkauto.entity.Assurance ass1 = new com.mef.parkauto.entity.Assurance();
        ass1.setVehicule(v1);
        ass1.setNumeroPolice("POL-AXA-2026-9901");
        ass1.setCompagnie(com.mef.parkauto.entity.CompagnieAssurance.AXA);
        ass1.setTypeGarantie(com.mef.parkauto.entity.TypeGarantie.TOUS_RISQUES);
        ass1.setDateDebut(java.time.LocalDate.of(2025, 1, 1));
        ass1.setDateFin(java.time.LocalDate.now().plusDays(25)); // Expirant sous J-30
        ass1.setMontantPrime(java.math.BigDecimal.valueOf(8500.00));
        ass1.setFranchise(java.math.BigDecimal.valueOf(1500.00));
        ass1.setStatut(com.mef.parkauto.entity.StatutAssurance.ACTIVE);
        ass1.setObservations("Police flotte tous risques avec assistance 24/7");
        assuranceRepository.save(ass1);

        com.mef.parkauto.entity.Assurance ass2 = new com.mef.parkauto.entity.Assurance();
        ass2.setVehicule(v2);
        ass2.setNumeroPolice("POL-RMA-2026-4412");
        ass2.setCompagnie(com.mef.parkauto.entity.CompagnieAssurance.RMA);
        ass2.setTypeGarantie(com.mef.parkauto.entity.TypeGarantie.TIERS);
        ass2.setDateDebut(java.time.LocalDate.of(2025, 6, 1));
        ass2.setDateFin(java.time.LocalDate.of(2026, 5, 31));
        ass2.setMontantPrime(java.math.BigDecimal.valueOf(5200.00));
        ass2.setFranchise(java.math.BigDecimal.valueOf(1000.00));
        ass2.setStatut(com.mef.parkauto.entity.StatutAssurance.ACTIVE);
        ass2.setObservations("Assurance responsabilité civile et défense");
        assuranceRepository.save(ass2);

        // 2. Sinistres
        java.util.List<com.mef.parkauto.entity.Conducteur> conducteurs = conducteurRepository.findAll();
        com.mef.parkauto.entity.Conducteur c1 = conducteurs.isEmpty() ? null : conducteurs.get(0);

        com.mef.parkauto.entity.Sinistre sin1 = new com.mef.parkauto.entity.Sinistre();
        sin1.setVehicule(v1);
        sin1.setConducteur(c1);
        sin1.setAssurance(ass1);
        sin1.setDateAccident(java.time.LocalDate.now().minusDays(10));
        sin1.setLieuAccident("Avenue Mohammed V, Rabat");
        sin1.setDescription("Accrochage léger lors d'un stationnement, aile arrière gauche enfoncée.");
        sin1.setTiersImpliques("Véhicule tiers 12345-A-1");
        sin1.setNatureAccident(com.mef.parkauto.entity.NatureAccident.COLLISION);
        sin1.setMontantDommages(java.math.BigDecimal.valueOf(4500.00));
        sin1.setStatut(com.mef.parkauto.entity.StatutSinistre.EN_EXPERTISE);
        sin1.setReferenceExpertise("EXP-AXA-2026-089");
        sinistreRepository.save(sin1);

        // 3. Infractions
        com.mef.parkauto.entity.Infraction inf1 = new com.mef.parkauto.entity.Infraction();
        inf1.setVehicule(v1);
        inf1.setConducteur(c1);
        inf1.setDateInfraction(java.time.LocalDate.now().minusDays(15));
        inf1.setLieuInfraction("Autoroute Rabat-Casablanca (Km 42)");
        inf1.setTypeInfraction("Excès de vitesse (radar fixe)");
        inf1.setMontantAmende(java.math.BigDecimal.valueOf(300.00));
        inf1.setStatut(com.mef.parkauto.entity.StatutInfraction.PAYEE);
        inf1.setReferenceContravention("RAD-2026-88712");
        inf1.setObservations("Amende réglée sur le portail de la TGR");
        infractionRepository.save(inf1);

        // 4. Visites Techniques
        com.mef.parkauto.entity.VisiteTechnique vt1 = new com.mef.parkauto.entity.VisiteTechnique();
        vt1.setVehicule(v1);
        vt1.setDateVisite(java.time.LocalDate.now().minusMonths(3));
        vt1.setCentre("Centre Dekra Technival Rabat");
        vt1.setResultat(com.mef.parkauto.entity.ResultatVisite.FAVORABLE);
        vt1.setDateProchaine(java.time.LocalDate.now().plusMonths(9));
        vt1.setObservations("Contrôle vierge, état mécanique satisfaisant.");
        visiteTechniqueRepository.save(vt1);

        // 5. Taxes Automobiles
        com.mef.parkauto.entity.TaxeAutomobile t1 = new com.mef.parkauto.entity.TaxeAutomobile();
        t1.setVehicule(v1);
        t1.setAnnee(2026);
        t1.setType(com.mef.parkauto.entity.TypeTaxe.VIGNETTE);
        t1.setMontant(java.math.BigDecimal.valueOf(1500.00));
        t1.setStatut(com.mef.parkauto.entity.StatutTaxe.PAYEE);
        t1.setDateEcheance(java.time.LocalDate.of(2026, 1, 31));
        t1.setReferencePaiement("VIG-2026-009812");
        taxeAutomobileRepository.save(t1);

        // 6. Réformes Véhicules
        com.mef.parkauto.entity.ReformeVehicule ref1 = new com.mef.parkauto.entity.ReformeVehicule();
        ref1.setVehicule(v2);
        ref1.setMotifReforme("Usure prononcée du groupe motopropulseur, coût de réparation supérieur à la valeur vénale.");
        ref1.setDateDecision(java.time.LocalDate.now().minusDays(5));
        ref1.setPvCommission("PV_Commission_Reforme_2026_04.pdf");
        ref1.setStatut(com.mef.parkauto.entity.StatutReforme.EN_COURS_DE_REFORME);
        ref1.setPrixCession(java.math.BigDecimal.valueOf(35000.00));
        reformeVehiculeRepository.save(ref1);

        // 7. Budgets Direction (2026)
        String[] directions = {"Direction du Budget", "Direction Générale des Impôts", "Administration des Douanes", "Trésorerie Générale du Royaume"};
        com.mef.parkauto.entity.NatureDepense[] natures = com.mef.parkauto.entity.NatureDepense.values();

        for (int i = 0; i < directions.length; i++) {
            String dir = directions[i];
            com.mef.parkauto.entity.BudgetDirection bCarburant = new com.mef.parkauto.entity.BudgetDirection();
            bCarburant.setAnnee(2026);
            bCarburant.setDirection(dir);
            bCarburant.setNatureDepense(com.mef.parkauto.entity.NatureDepense.CARBURANT);
            bCarburant.setMontantAlloue(java.math.BigDecimal.valueOf(250000 + i * 50000));
            bCarburant.setMontantEngage(java.math.BigDecimal.valueOf(180000 + i * 30000));
            bCarburant.setMontantRealise(java.math.BigDecimal.valueOf(150000 + i * 25000));
            budgetDirectionRepository.save(bCarburant);

            com.mef.parkauto.entity.BudgetDirection bEntretien = new com.mef.parkauto.entity.BudgetDirection();
            bEntretien.setAnnee(2026);
            bEntretien.setDirection(dir);
            bEntretien.setNatureDepense(com.mef.parkauto.entity.NatureDepense.ENTRETIEN);
            bEntretien.setMontantAlloue(java.math.BigDecimal.valueOf(120000 + i * 20000));
            bEntretien.setMontantEngage(java.math.BigDecimal.valueOf(75000 + i * 10000));
            bEntretien.setMontantRealise(java.math.BigDecimal.valueOf(60000 + i * 10000));
            budgetDirectionRepository.save(bEntretien);

            com.mef.parkauto.entity.BudgetDirection bAssurance = new com.mef.parkauto.entity.BudgetDirection();
            bAssurance.setAnnee(2026);
            bAssurance.setDirection(dir);
            bAssurance.setNatureDepense(com.mef.parkauto.entity.NatureDepense.ASSURANCE);
            bAssurance.setMontantAlloue(java.math.BigDecimal.valueOf(80000 + i * 15000));
            bAssurance.setMontantEngage(java.math.BigDecimal.valueOf(80000 + i * 15000));
            bAssurance.setMontantRealise(java.math.BigDecimal.valueOf(80000 + i * 15000));
            budgetDirectionRepository.save(bAssurance);
        }

        // 8. Prévisions Carburant (2026)
        for (int m = 1; m <= 12; m++) {
            com.mef.parkauto.entity.PrevisionCarburant prev = new com.mef.parkauto.entity.PrevisionCarburant();
            prev.setVehicule(v1);
            prev.setDirection("Direction du Budget");
            prev.setMois(m);
            prev.setAnnee(2026);
            prev.setKmPrevus(2500.0);
            prev.setConsoMoyenne(8.0); // 200 Litres prévus
            prev.setPrixUnitairePrevus(java.math.BigDecimal.valueOf(13.50));
            if (m <= 7) {
                prev.setQuantiteReelle(195.0 + (m % 3) * 10);
                prev.setMontantReel(java.math.BigDecimal.valueOf(prev.getQuantiteReelle() * 13.20));
            }
            previsionCarburantRepository.save(prev);
        }

        log.info("Initialisation des données du Sprint 5 terminée avec succès.");
    }

    private void initializeSampleSprint6Data() {
        if (garageAgreeRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des données de test pour le Sprint 6 (Garages, Pièces, Pannes & Sinistres)...");

        // 1. Garages Agréés MEF
        com.mef.parkauto.entity.GarageAgree g1 = new com.mef.parkauto.entity.GarageAgree();
        g1.setNomGarage("Garage Central MEF Rabat");
        g1.setRaisonSociale("Société Centrale de Maintenance Automobile SARL");
        g1.setVille("Rabat");
        g1.setAdresse("Zone Industrielle Takaddoum, N° 45, Rabat");
        g1.setTelephone("0537-75-12-34");
        g1.setEmail("contact@garagecentral-mef.ma");
        g1.setContactNom("M. Rachid Benani");
        g1.setReferenceConvention("CONV-MEF-2026-01");
        g1.setAgreeMEF(true);
        g1.setSpecialites("Mécanique générale, Diagnostic électronique, Révision périodique");
        g1.setTarifHoraireMo(java.math.BigDecimal.valueOf(180.00));
        g1.setRemisePiecesPct(java.math.BigDecimal.valueOf(15.00));
        g1.setNoteEvaluation(java.math.BigDecimal.valueOf(4.8));
        g1.setObservations("Garage pilote principal du Ministère pour la région de Rabat-Salé-Kénitra.");
        g1.setActif(true);
        g1 = garageAgreeRepository.save(g1);

        com.mef.parkauto.entity.GarageAgree g2 = new com.mef.parkauto.entity.GarageAgree();
        g2.setNomGarage("Auto Performance Hay Riad");
        g2.setRaisonSociale("Auto Performance Maroc");
        g2.setVille("Rabat");
        g2.setAdresse("Avenue Annakhil, Hay Riad, Rabat");
        g2.setTelephone("0537-56-78-90");
        g2.setEmail("service@autoperformance.ma");
        g2.setContactNom("Mme. Samira El Fassi");
        g2.setReferenceConvention("CONV-MEF-2026-02");
        g2.setAgreeMEF(true);
        g2.setSpecialites("Pneumatiques, Géométrie, Freinage, Climatisation");
        g2.setTarifHoraireMo(java.math.BigDecimal.valueOf(200.00));
        g2.setRemisePiecesPct(java.math.BigDecimal.valueOf(12.00));
        g2.setNoteEvaluation(java.math.BigDecimal.valueOf(4.6));
        g2.setObservations("Centre rapide pour révisions légères et pneumatiques.");
        g2.setActif(true);
        g2 = garageAgreeRepository.save(g2);

        com.mef.parkauto.entity.GarageAgree g3 = new com.mef.parkauto.entity.GarageAgree();
        g3.setNomGarage("Garage Royal Casa Port");
        g3.setRaisonSociale("Ateliers Royal Auto Casa");
        g3.setVille("Casablanca");
        g3.setAdresse("Boulevard des Almohades, Port de Casablanca");
        g3.setTelephone("0522-30-40-50");
        g3.setEmail("contact@royalauto-casa.ma");
        g3.setContactNom("M. Youssef Chaoui");
        g3.setReferenceConvention("CONV-MEF-2026-03");
        g3.setAgreeMEF(true);
        g3.setSpecialites("Tôlerie, Peinture au four, Réparation gros sinistres");
        g3.setTarifHoraireMo(java.math.BigDecimal.valueOf(190.00));
        g3.setRemisePiecesPct(java.math.BigDecimal.valueOf(10.00));
        g3.setNoteEvaluation(java.math.BigDecimal.valueOf(4.7));
        g3.setObservations("Atelier agréé assurances pour le traitement des sinistres lourds.");
        g3.setActif(true);
        g3 = garageAgreeRepository.save(g3);

        // 2. Catalogue de Pièces de Rechange
        com.mef.parkauto.entity.PieceRemplacement p1 = new com.mef.parkauto.entity.PieceRemplacement();
        p1.setReferencePiece("FLT-OIL-5W30");
        p1.setDesignation("Filtre à huile synthétique OEM");
        p1.setCategorie("Filtration");
        p1.setQuantite(25);
        p1.setPrixUnitaire(java.math.BigDecimal.valueOf(120.00));
        p1.setGarage(g1);
        p1.calculerMontantTotal();
        pieceRemplacementRepository.save(p1);

        com.mef.parkauto.entity.PieceRemplacement p2 = new com.mef.parkauto.entity.PieceRemplacement();
        p2.setReferencePiece("BRK-PAD-AV");
        p2.setDesignation("Plaquettes de frein avant céramique");
        p2.setCategorie("Freinage");
        p2.setQuantite(10);
        p2.setPrixUnitaire(java.math.BigDecimal.valueOf(650.00));
        p2.setGarage(g1);
        p2.calculerMontantTotal();
        pieceRemplacementRepository.save(p2);

        com.mef.parkauto.entity.PieceRemplacement p3 = new com.mef.parkauto.entity.PieceRemplacement();
        p3.setReferencePiece("BAT-12V-70AH");
        p3.setDesignation("Batterie 12V 70Ah Varta Blue Dynamic");
        p3.setCategorie("Électrique");
        p3.setQuantite(8);
        p3.setPrixUnitaire(java.math.BigDecimal.valueOf(1100.00));
        p3.setGarage(g2);
        p3.calculerMontantTotal();
        pieceRemplacementRepository.save(p3);

        com.mef.parkauto.entity.PieceRemplacement p4 = new com.mef.parkauto.entity.PieceRemplacement();
        p4.setReferencePiece("PNEU-205-55R16");
        p4.setDesignation("Pneu Michelin Primacy 4 205/55 R16 91V");
        p4.setCategorie("Pneumatique");
        p4.setQuantite(16);
        p4.setPrixUnitaire(java.math.BigDecimal.valueOf(950.00));
        p4.setGarage(g2);
        p4.calculerMontantTotal();
        pieceRemplacementRepository.save(p4);

        // 3. Pannes Curatives (Sprint 6)
        java.util.List<com.mef.parkauto.entity.Vehicule> vehicules = vehiculeRepository.findAll();
        java.util.List<com.mef.parkauto.entity.Conducteur> conducteurs = conducteurRepository.findAll();

        if (!vehicules.isEmpty()) {
            com.mef.parkauto.entity.Vehicule vPanne = vehicules.get(0);
            com.mef.parkauto.entity.Conducteur cPanne = conducteurs.isEmpty() ? null : conducteurs.get(0);

            com.mef.parkauto.entity.PanneVehicule panne1 = new com.mef.parkauto.entity.PanneVehicule();
            panne1.setVehicule(vPanne);
            panne1.setConducteur(cPanne);
            panne1.setGarageAgree(g1);
            panne1.setDateDeclaration(java.time.LocalDateTime.now().minusDays(2));
            panne1.setLieuPanne("Avenue Mohammed V, Rabat");
            panne1.setKilometragePanne(vPanne.getKilometrageActuel());
            panne1.setNaturePanne("Défaillance alternateur & Batterie à plat");
            panne1.setDescriptionSymptomes("Le voyant batterie est allumé rouge, arrêt complet du moteur au feu rouge avec impossibilité de redémarrer.");
            panne1.setDegreUrgence(com.mef.parkauto.entity.UrgencePanne.ELEVEE);
            panne1.setImmobilisante(true);
            panne1.setRemorquageRequis(true);
            panne1.setSocieteRemorquage("SOS Remorquage Rabat Assistance");
            panne1.setDiagnosticAtelier("Alternateur HS nécessitant remplacement + batterie déchargée profondément.");
            panne1.setDureeImmobilisationJours(3);
            panne1.setCoutEstimeDevis(java.math.BigDecimal.valueOf(3200.00));
            panne1.setStatut(com.mef.parkauto.entity.StatutPanne.EN_REPARATION);
            panne1.setObservations("Pièces commandées chez le fournisseur agréé.");
            panneRepository.save(panne1);

            if (vehicules.size() > 1) {
                com.mef.parkauto.entity.Vehicule vPanne2 = vehicules.get(1);
                com.mef.parkauto.entity.PanneVehicule panne2 = new com.mef.parkauto.entity.PanneVehicule();
                panne2.setVehicule(vPanne2);
                panne2.setGarageAgree(g2);
                panne2.setDateDeclaration(java.time.LocalDateTime.now().minusDays(10));
                panne2.setLieuPanne("Autoroute Casa-Rabat PK 42");
                panne2.setKilometragePanne(vPanne2.getKilometrageActuel() != null ? vPanne2.getKilometrageActuel() - 250 : 35000L);
                panne2.setNaturePanne("Crevaison multiple & vibration direction");
                panne2.setDescriptionSymptomes("Éclatement pneu avant droit suite à débris métallique sur autoroute.");
                panne2.setDegreUrgence(com.mef.parkauto.entity.UrgencePanne.CRITIQUE);
                panne2.setImmobilisante(true);
                panne2.setRemorquageRequis(true);
                panne2.setSocieteRemorquage("Autoroutes du Maroc Dépannage");
                panne2.setDiagnosticAtelier("Remplacement 2 pneus avant + parallélisme complet du train avant.");
                panne2.setDureeImmobilisationJours(1);
                panne2.setCoutEstimeDevis(java.math.BigDecimal.valueOf(2300.00));
                panne2.setCoutReelReparation(java.math.BigDecimal.valueOf(2250.00));
                panne2.setKilometrageCloture(vPanne2.getKilometrageActuel());
                panne2.setDateReparation(java.time.LocalDateTime.now().minusDays(8));
                panne2.setDateCloture(java.time.LocalDateTime.now().minusDays(8));
                panne2.setStatut(com.mef.parkauto.entity.StatutPanne.REPAREE);
                panne2.setReferenceBonSortie("BS-2026-0881");
                panne2.setReferenceFacture("FAC-GAR-2026-1142");
                panne2.setGarantieAccordee("Garantie 12 mois constructeur sur pneumatiques");
                panneRepository.save(panne2);
            }
        }

        // 4. Sinistres Automobile avec Workflow complet (Sprint 6)
        if (vehicules.size() > 2) {
            com.mef.parkauto.entity.Vehicule vSinistre = vehicules.get(2);
            com.mef.parkauto.entity.Conducteur cSinistre = conducteurs.size() > 1 ? conducteurs.get(1) : null;

            com.mef.parkauto.entity.Sinistre sin1 = new com.mef.parkauto.entity.Sinistre();
            sin1.setVehicule(vSinistre);
            sin1.setConducteur(cSinistre);
            sin1.setGarageAgree(g3);
            sin1.setDateAccident(java.time.LocalDate.now().minusDays(5));
            sin1.setLieuAccident("Rond-point Bab Rouah, Rabat");
            sin1.setDescription("Accrochage latéral à basse vitesse avec un véhicule tiers n'ayant pas respecté la priorité à droite.");
            sin1.setTiersImpliques("Véhicule Renault Clio immatriculé 45892-A-1, conduit par M. Amine Tazi.");
            sin1.setNatureAccident(com.mef.parkauto.entity.NatureAccident.COLLISION);
            sin1.setMontantDommages(java.math.BigDecimal.valueOf(8500.00));
            sin1.setMontantFranchise(java.math.BigDecimal.valueOf(1500.00));
            sin1.setMontantRembourse(java.math.BigDecimal.valueOf(7000.00));
            sin1.setStatut(com.mef.parkauto.entity.StatutSinistre.EN_COURS_D_EXPERTISE);
            sin1.setReferenceExpertise("EXP-WAFA-2026-9921");
            sin1.setNumeroConstat("CONST-2026-0412");
            sin1.setDateExpertise(java.time.LocalDate.now().minusDays(2));
            sin1.setRemorquageRequis(false);
            sin1.setObservations("Expertise réalisée, attente de validation du devis par la compagnie d'assurance.");
            sinistreRepository.save(sin1);
        }

        log.info("Initialisation des données du Sprint 6 terminée avec succès.");
    }

    private void initializeSampleSprint7Data() {
        try {
            jdbcTemplate.execute("ALTER TABLE budgets_direction ADD COLUMN IF NOT EXISTS seuil_alerte80atteint BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE budgets_direction ADD COLUMN IF NOT EXISTS seuil_alerte95atteint BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE budgets_direction ADD COLUMN IF NOT EXISTS centre_cout VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE budgets_direction ADD COLUMN IF NOT EXISTS service VARCHAR(100)");
        } catch (Exception e) {
            log.debug("Migration colonnes budgets_direction: {}", e.getMessage());
        }

        if (exerciceBudgetaireRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des données du Sprint 7 (Exercices budgétaires, Engagements & Suivi analytique)...");

        // 1. Exercices Budgétaires (RG04)
        com.mef.parkauto.entity.ExerciceBudgetaire ex2025 = com.mef.parkauto.entity.ExerciceBudgetaire.builder()
                .annee(2025)
                .statut(com.mef.parkauto.entity.StatutExercice.CLOTURE)
                .dateCloture(java.time.LocalDateTime.now().minusMonths(2))
                .cloturePar("admin@mef.gov.ma")
                .observations("Clôture de l'exercice fiscal 2025 approuvée par la Commission Budgétaire du MEF.")
                .build();
        exerciceBudgetaireRepository.save(ex2025);

        com.mef.parkauto.entity.ExerciceBudgetaire ex2026 = com.mef.parkauto.entity.ExerciceBudgetaire.builder()
                .annee(2026)
                .statut(com.mef.parkauto.entity.StatutExercice.OUVERT)
                .observations("Exercice budgétaire 2026 en cours d'exécution.")
                .build();
        exerciceBudgetaireRepository.save(ex2026);

        // 2. Alertes Budgétaires (RG03) sur Budgets existants
        java.util.List<com.mef.parkauto.entity.BudgetDirection> budgets = budgetDirectionRepository.findAll();
        for (com.mef.parkauto.entity.BudgetDirection b : budgets) {
            if ("Direction du Budget".equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == com.mef.parkauto.entity.NatureDepense.CARBURANT) {
                b.setMontantAlloue(java.math.BigDecimal.valueOf(300000.00));
                b.setMontantEngage(java.math.BigDecimal.valueOf(250000.00)); // ~83.3% -> Alerte 80%
                b.setMontantRealise(java.math.BigDecimal.valueOf(220000.00));
                b.setSeuilAlerte80Atteint(true);
                b.setSeuilAlerte95Atteint(false);
                budgetDirectionRepository.save(b);
            } else if ("Direction Générale des Impôts".equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == com.mef.parkauto.entity.NatureDepense.ENTRETIEN) {
                b.setMontantAlloue(java.math.BigDecimal.valueOf(140000.00));
                b.setMontantEngage(java.math.BigDecimal.valueOf(135000.00)); // ~96.4% -> Alerte 95%
                b.setMontantRealise(java.math.BigDecimal.valueOf(120000.00));
                b.setSeuilAlerte80Atteint(true);
                b.setSeuilAlerte95Atteint(true);
                budgetDirectionRepository.save(b);
            }
        }

        // 3. Engagements Budgétaires (Sprint 7)
        com.mef.parkauto.entity.EngagementBudgetaire eng1 = com.mef.parkauto.entity.EngagementBudgetaire.builder()
                .numeroEngagement("ENG-2026-0012")
                .dateEngagement(java.time.LocalDate.now().minusDays(20))
                .annee(2026)
                .direction("Direction du Budget")
                .service("Division du Parc Automobile")
                .centreCout("CC-PARC-01")
                .natureDepense(com.mef.parkauto.entity.NatureDepense.CARBURANT)
                .montantEngage(java.math.BigDecimal.valueOf(45000.00))
                .montantLiquide(java.math.BigDecimal.valueOf(45000.00))
                .statutEngagement(com.mef.parkauto.entity.StatutEngagement.LIQUIDE)
                .beneficiaire("Afriquia SMDC S.A.")
                .objet("Dotation cartes carburant T1 - Véhicules de liaison")
                .referencePiece("FAC-AFR-2026-0992")
                .build();
        engagementBudgetaireRepository.save(eng1);

        com.mef.parkauto.entity.EngagementBudgetaire eng2 = com.mef.parkauto.entity.EngagementBudgetaire.builder()
                .numeroEngagement("ENG-2026-0035")
                .dateEngagement(java.time.LocalDate.now().minusDays(10))
                .annee(2026)
                .direction("Direction Générale des Impôts")
                .service("Service Logistique")
                .centreCout("CC-DGI-LOG")
                .natureDepense(com.mef.parkauto.entity.NatureDepense.ENTRETIEN)
                .montantEngage(java.math.BigDecimal.valueOf(28000.00))
                .montantLiquide(java.math.BigDecimal.ZERO)
                .statutEngagement(com.mef.parkauto.entity.StatutEngagement.ENGAGE)
                .beneficiaire("Garage Central Hassan II - Rabat")
                .objet("Contrat de révision semestrielle flotte DGI (15 véhicules)")
                .referencePiece("BC-2026-DGI-044")
                .build();
        engagementBudgetaireRepository.save(eng2);

        com.mef.parkauto.entity.EngagementBudgetaire eng3 = com.mef.parkauto.entity.EngagementBudgetaire.builder()
                .numeroEngagement("ENG-2026-0048")
                .dateEngagement(java.time.LocalDate.now().minusDays(3))
                .annee(2026)
                .direction("Administration des Douanes")
                .service("Service Moyens Généraux")
                .centreCout("CC-ADII-MG")
                .natureDepense(com.mef.parkauto.entity.NatureDepense.ASSURANCE)
                .montantEngage(java.math.BigDecimal.valueOf(95000.00))
                .montantLiquide(java.math.BigDecimal.valueOf(95000.00))
                .statutEngagement(com.mef.parkauto.entity.StatutEngagement.LIQUIDE)
                .beneficiaire("Wafa Assurance S.A.")
                .objet("Renouvellement police flotte automobile 2026 - ADII")
                .referencePiece("POL-WAFA-2026-ADII")
                .build();
        engagementBudgetaireRepository.save(eng3);

        log.info("Initialisation des données du Sprint 7 terminée avec succès.");
    }

    private void initializeAuditJournal() {
        if (journalActionRepository.count() > 15) {
            return;
        }
        log.info("Initialisation des données du Journal d'Audit Système (Traçabilité multi-modules)...");

        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        java.util.List<com.mef.parkauto.entity.JournalAction> actions = java.util.List.of(
            createJournal("VEHICULE", "CREATE", "Vehicule", 1L, null, "Immatriculation: 12345-A-1, Marque: Toyota Land Cruiser Prado, Direction: DGI", "admin@mef.gov.ma", now.minusDays(25), "192.168.1.10"),
            createJournal("VEHICULE", "CREATE", "Vehicule", 2L, null, "Immatriculation: 67890-B-2, Marque: Peugeot 508 Allure, Direction: DTFE", "admin@mef.gov.ma", now.minusDays(24), "192.168.1.10"),
            createJournal("VEHICULE", "CREATE", "Vehicule", 3L, null, "Immatriculation: 11223-C-3, Marque: Dacia Duster 4x4, Direction: DGT", "admin@mef.gov.ma", now.minusDays(24), "192.168.1.10"),
            createJournal("VEHICULE", "UPDATE", "Vehicule", 1L, "Statut: DISPONIBLE", "Statut: AFFECTE", "gestionnaire.central@mef.gov.ma", now.minusDays(20), "192.168.1.15"),
            
            createJournal("CONDUCTEUR", "CREATE", "Conducteur", 1L, null, "Matricule: CND-001, Nom: Ahmed Tazi, Permis: B (Exp: 12/2028)", "admin@mef.gov.ma", now.minusDays(22), "192.168.1.10"),
            createJournal("CONDUCTEUR", "CREATE", "Conducteur", 2L, null, "Matricule: CND-002, Nom: Karim El Mansouri, Permis: B, C", "admin@mef.gov.ma", now.minusDays(22), "192.168.1.10"),
            createJournal("CONDUCTEUR", "UPDATE", "Conducteur", 1L, null, "Visite médicale aptitude validée jusqu'en 2028", "gestionnaire.central@mef.gov.ma", now.minusDays(18), "192.168.1.15"),

            createJournal("DEMANDE_DEPLACEMENT", "CREATE", "DemandeDeplacement", 1L, null, "Destination: Marrakech, Motif: Audit régional Trésorerie, Véhicule sollicité: Berline", "conducteur@mef.gov.ma", now.minusDays(17), "192.168.1.42"),
            createJournal("DEMANDE_DEPLACEMENT", "VALIDATION_N1", "DemandeDeplacement", 1L, "Statut: EN_ATTENTE_VALIDATION", "Statut: VALIDEE_SERVICE", "responsable.service@mef.gov.ma", now.minusDays(16), "192.168.1.25"),
            createJournal("DEMANDE_DEPLACEMENT", "APPROBATION_N2", "DemandeDeplacement", 1L, "Statut: VALIDEE_SERVICE", "Statut: APPROUVEE", "gestionnaire.central@mef.gov.ma", now.minusDays(16), "192.168.1.15"),

            createJournal("AFFECTATION", "CREATE", "Affectation", 1L, null, "Affectation Véhicule 12345-A-1 au Conducteur Karim El Mansouri pour mission Marrakech", "gestionnaire.central@mef.gov.ma", now.minusDays(15), "192.168.1.15"),
            createJournal("AFFECTATION", "RESTITUTION", "Affectation", 1L, "Kilométrage départ: 44,200 km", "Kilométrage retour: 45,210 km, Anomalies: Aucune, Niveau carburant: 3/4", "gestionnaire.central@mef.gov.ma", now.minusDays(12), "192.168.1.15"),

            createJournal("CARBURANT", "CREATE", "CarteCarburant", 1L, null, "Carte TotalEnergies N° 7001-4458-9921, Plafond: 3000 MAD, Direction: DGI", "responsable.financier@mef.gov.ma", now.minusDays(19), "192.168.1.18"),
            createJournal("CARBURANT", "CREATE", "PleinCarburant", 1L, null, "Plein 55.0L Gasoil (715.00 MAD) - Station Total Agdal - Véhicule: 12345-A-1", "conducteur@mef.gov.ma", now.minusDays(14), "192.168.1.42"),
            createJournal("CARBURANT", "CONTROLE", "PleinCarburant", 2L, null, "Contrôle RG05 — Surconsommation détectée sur 11223-C-3 : 9.8 L/100km (référence 7.2 L/100km)", "SYSTEM", now.minusDays(8), "127.0.0.1"),

            createJournal("MAINTENANCE", "CREATE", "InterventionMaintenance", 1L, null, "Vidange moteur + remplacement filtre à huile 60 000 km - Véhicule: 67890-B-2", "gestionnaire.central@mef.gov.ma", now.minusDays(11), "192.168.1.15"),
            createJournal("MAINTENANCE", "CLOTURE", "InterventionMaintenance", 1L, "Statut: EN_COURS", "Statut: CLOTUREE, Coût TTC: 1,450 MAD, Facture acquittée", "responsable.financier@mef.gov.ma", now.minusDays(9), "192.168.1.18"),

            createJournal("PANNE", "DECLARE", "PanneVehicule", 1L, null, "Panne d'alternateur et batterie à plat signalée sur véhicule Dacia Duster", "conducteur@mef.gov.ma", now.minusDays(7), "192.168.1.42"),
            createJournal("PANNE", "CLOTURE_REPARATION", "PanneVehicule", 1L, "Statut: EN_DIAGNOSTIC", "Statut: REPAREE - Batterie remplacée par Garage Central Rabat", "gestionnaire.central@mef.gov.ma", now.minusDays(5), "192.168.1.15"),

            createJournal("SINISTRE", "DECLARE", "Sinistre", 1L, null, "Accrochage pare-chocs arrière parking MEF Rabat - Tiers identifié - Constat n° 2026-881", "conducteur@mef.gov.ma", now.minusDays(6), "192.168.1.42"),
            createJournal("SINISTRE", "UPDATE", "Sinistre", 1L, "Statut: EN_ATTENTE", "Statut: EN_COURS_D_EXPERTISE, Dossier transmis à la compagnie d'assurance", "gestionnaire.central@mef.gov.ma", now.minusDays(4), "192.168.1.15"),

            createJournal("ASSURANCE", "CREATE", "Assurance", 1L, null, "Police Flotte Tous Risques Wafa Assurance N° POL-MEF-2026-001 (Prime: 120 000 MAD)", "responsable.financier@mef.gov.ma", now.minusDays(20), "192.168.1.18"),
            createJournal("TAXE", "CREATE", "TaxeAutomobile", 1L, null, "Vignette automobile 2026 acquittée pour flotte centrale (15 véhicules - 18 500 MAD)", "responsable.financier@mef.gov.ma", now.minusDays(18), "192.168.1.18"),

            createJournal("BUDGET", "CREATE_EXERCICE", "ExerciceBudgetaire", 1L, null, "Ouverture de l'Exercice Budgétaire 2026 - Dotation globale: 1 500 000 MAD", "responsable.financier@mef.gov.ma", now.minusDays(26), "192.168.1.18"),
            createJournal("BUDGET", "ENGAGEMENT", "EngagementBudgetaire", 1L, null, "Engagement N° ENG-2026-0012 - Dotation carburant T1 (Montant: 150 000 MAD)", "responsable.financier@mef.gov.ma", now.minusDays(21), "192.168.1.18"),
            createJournal("BUDGET", "LIQUIDATION", "EngagementBudgetaire", 2L, null, "Liquidation facture semestrielle révisions ateliers (28 000 MAD)", "responsable.financier@mef.gov.ma", now.minusDays(10), "192.168.1.18"),

            createJournal("GARAGE", "CREATE", "GarageAgree", 1L, null, "Agrément Garage Central Hassan II - Rabat (Spécialité: Révision & Diagnostic multimarques)", "gestionnaire.central@mef.gov.ma", now.minusDays(23), "192.168.1.15"),
            createJournal("DOCUMENT_GED", "UPLOAD", "DocumentGED", 1L, null, "Téléversement Carte Grise & Visite Technique pour véhicule 12345-A-1", "gestionnaire.central@mef.gov.ma", now.minusDays(13), "192.168.1.15"),

            createJournal("AUTH", "LOGIN", "Utilisateur", 1L, null, "Authentification réussie via portail MEF", "admin@mef.gov.ma", now.minusHours(2), "192.168.1.10"),
            createJournal("AUTH", "CHANGE_PASSWORD", "Utilisateur", 1L, null, "Mise à jour sécurisée du mot de passe selon politique DGSSI", "admin@mef.gov.ma", now.minusMinutes(45), "192.168.1.10")
        );

        journalActionRepository.saveAll(actions);
        log.info("Journal d'Audit initialisé avec succès ({} entrées multi-modules enregistrées).", actions.size());
    }

    private com.mef.parkauto.entity.JournalAction createJournal(String module, String action, String entityName,
                                                               Long entityId, String oldValue, String newValue,
                                                               String username, java.time.LocalDateTime timestamp,
                                                               String ipAddress) {
        com.mef.parkauto.entity.JournalAction a = new com.mef.parkauto.entity.JournalAction();
        a.setModule(module);
        a.setAction(action);
        a.setEntityName(entityName);
        a.setEntityId(entityId);
        a.setOldValue(oldValue);
        a.setNewValue(newValue);
        a.setUsername(username);
        a.setTimestamp(timestamp);
        a.setIpAddress(ipAddress);
        return a;
    }
}

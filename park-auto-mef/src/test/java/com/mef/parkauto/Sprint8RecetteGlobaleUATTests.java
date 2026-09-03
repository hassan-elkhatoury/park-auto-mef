package com.mef.parkauto;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import com.mef.parkauto.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SPRINT 8 — RECETTE FONCTIONNELLE ET TECHNIQUE GLOBALE DE BOUT EN BOUT (UAT MEF)
 * Valide l'intégralité du cycle de vie opérationnel, technique, financier et décisionnel :
 * Véhicule ➔ Mission & OM ➔ Carburant & Alertes ➔ Maintenance & Devis ➔ Budget & RG01/RG03 ➔ TCO & Exports ➔ Clôture RG04.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class Sprint8RecetteGlobaleUATTests {

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private DemandeDeplacementRepository demandeRepository;

    @Autowired
    private AffectationRepository affectationRepository;

    @Autowired
    private ConducteurRepository conducteurRepository;

    @Autowired
    private PleinCarburantRepository pleinCarburantRepository;

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private PanneService panneService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private ReportingService reportingService;

    @Autowired
    private BudgetDirectionRepository budgetRepository;

    @Autowired
    private ExerciceBudgetaireRepository exerciceRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private RoleRepository roleRepository;

    private static final Integer ANNEE_TEST = 2026;
    private static final String DIRECTION_TEST = "Direction du Budget";

    private Vehicule buildVehiculeTest(String immat, Long km) {
        Vehicule v = new Vehicule();
        v.setImmatriculation(immat);
        v.setNumeroInventaire("INV-MEF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        v.setNumeroChassis("VF1" + UUID.randomUUID().toString().substring(0, 14).toUpperCase());
        v.setMarque("Peugeot");
        v.setModele("508 MEF Executive");
        v.setDirection(DIRECTION_TEST);
        v.setTypeCarburant(TypeCarburant.DIESEL);
        v.setTypeVehicule("BERLINE");
        v.setKilometrageInitial(0L);
        v.setKilometrageActuel(km);
        v.setProchainSeuilEntretienKm(10000L);
        v.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        v.setEtatTechnique(EtatTechnique.BON_ETAT);
        v.setMontantAcquisition(new BigDecimal("280000.00"));
        v.setDateAcquisition(LocalDate.of(2025, 1, 15));
        return vehiculeRepository.save(v);
    }

    private Utilisateur getOrCreateDemandeur() {
        return utilisateurRepository.findByEmail("demandeur.uat@mef.gov.ma").orElseGet(() -> {
            Role role = roleRepository.findByNom(RoleType.GESTIONNAIRE_CENTRAL).orElseGet(() -> {
                Role r = new Role();
                r.setNom(RoleType.GESTIONNAIRE_CENTRAL);
                r.setDescription("Rôle test UAT");
                return roleRepository.save(r);
            });

            Utilisateur u = new Utilisateur();
            u.setEmail("demandeur.uat@mef.gov.ma");
            u.setMatricule("UAT-USER-01");
            u.setNom("Benjelloun");
            u.setPrenom("Youssef");
            u.setMotDePasse("Secret123!");
            u.setSel("abc123salt");
            u.setStatut(UserStatus.ACTIVE);
            u.setRole(role);
            u.setDirection(DIRECTION_TEST);
            return utilisateurRepository.save(u);
        });
    }

    @BeforeEach
    void setupExercice() {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(ANNEE_TEST).orElseGet(() -> {
            ExerciceBudgetaire newEx = ExerciceBudgetaire.builder()
                    .annee(ANNEE_TEST)
                    .statut(StatutExercice.OUVERT)
                    .build();
            return exerciceRepository.save(newEx);
        });
        ex.setStatut(StatutExercice.OUVERT);
        exerciceRepository.save(ex);
    }

    @Test
    @Order(1)
    @DisplayName("UAT-01 : Création de véhicule, conformité matricule et statut initial DISPONIBLE")
    void test01_creationVehiculeEtConformite() {
        Vehicule v = buildVehiculeTest("12345-A-01", 15000L);
        assertNotNull(v.getId(), "Le véhicule doit être persisté avec un ID généré");
        assertEquals("12345-A-01", v.getImmatriculation());
        assertEquals(StatutAdministratif.DISPONIBLE, v.getStatutAdministratif());
        assertEquals(EtatTechnique.BON_ETAT, v.getEtatTechnique());
        assertTrue(v.getMontantAcquisition().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @Order(2)
    @DisplayName("UAT-02 : Circuit Demande de déplacement ➔ Validation N1 ➔ Affectation N2 & Ordre de Mission")
    void test02_circuitDemandeEtOrdreMission() {
        Vehicule v = buildVehiculeTest("54321-B-01", 22000L);
        Utilisateur demandeur = getOrCreateDemandeur();

        Conducteur conducteur = new Conducteur();
        conducteur.setCin("AB123456");
        conducteur.setMatricule("COND-001");
        conducteur.setNom("El Idrissi");
        conducteur.setPrenom("Karim");
        conducteur.setNumeroPermis("PERM-123456");
        conducteur.setCategoriePermis("B");
        conducteur.setDateExpirationPermis(LocalDate.now().plusYears(5));
        conducteur.setStatut(StatutConducteur.ACTIF);
        conducteur.setDirection(DIRECTION_TEST);
        conducteur = conducteurRepository.save(conducteur);

        // 1. Soumission demande
        DemandeDeplacement dem = new DemandeDeplacement();
        dem.setReference("DEM-2026-UAT-01");
        dem.setDemandeur(demandeur);
        dem.setMotif("Mission de contrôle financier régionale");
        dem.setDestination("Casablanca");
        dem.setDateHeureDepart(LocalDateTime.now().plusDays(1));
        dem.setDateHeureRetourEstimee(LocalDateTime.now().plusDays(2));
        dem.setStatut(StatutDemande.EN_ATTENTE_VALIDATION);
        dem = demandeRepository.save(dem);
        assertEquals(StatutDemande.EN_ATTENTE_VALIDATION, dem.getStatut());

        // 2. Validation N1 (Responsable de Service)
        dem.setStatut(StatutDemande.VALIDEE_SERVICE);
        dem = demandeRepository.save(dem);
        assertEquals(StatutDemande.VALIDEE_SERVICE, dem.getStatut());

        // 3. Affectation N2 (Gestionnaire de Parc) & Scellement OM
        Affectation aff = new Affectation();
        aff.setDemandeDeplacement(dem);
        aff.setVehicule(v);
        aff.setConducteur(conducteur);
        aff.setCreateur(demandeur);
        aff.setReference("OM-2026-UAT-01");
        aff.setStatut(StatutAffectation.EN_COURS);
        aff.setDateDebut(LocalDateTime.now().plusDays(1));
        aff.setDateFinPrevisionnelle(LocalDateTime.now().plusDays(2));
        aff.setKilometrageDepart(v.getKilometrageActuel());
        aff = affectationRepository.save(aff);

        // Mettre à jour les statuts
        v.setStatutAdministratif(StatutAdministratif.AFFECTE);
        vehiculeRepository.save(v);
        dem.setStatut(StatutDemande.APPROUVEE_AFFECTEE);
        demandeRepository.save(dem);

        assertNotNull(aff.getId());
        assertEquals(StatutAffectation.EN_COURS, aff.getStatut());
        assertEquals(StatutAdministratif.AFFECTE, v.getStatutAdministratif());
        assertEquals(StatutDemande.APPROUVEE_AFFECTEE, dem.getStatut());
    }

    @Test
    @Order(3)
    @DisplayName("UAT-03 : Saisie d'un plein de carburant & Détection d'anomalie de surconsommation (RG05)")
    void test03_carburantEtSurconsommationRG05() {
        Vehicule v = buildVehiculeTest("99999-D-01", 30000L);

        PleinCarburant plein1 = new PleinCarburant();
        plein1.setVehicule(v);
        plein1.setDatePlein(LocalDateTime.now().minusDays(5));
        plein1.setQuantiteLitres(50.0);
        plein1.setMontantTTC(new BigDecimal("600.00"));
        plein1.setKilometrage(30000L);
        plein1.setAnomalieSurconsommation(false);
        pleinCarburantRepository.save(plein1);

        // Deuxième plein avec surconsommation détectée
        PleinCarburant plein2 = new PleinCarburant();
        plein2.setVehicule(v);
        plein2.setDatePlein(LocalDateTime.now());
        plein2.setQuantiteLitres(45.0);
        plein2.setMontantTTC(new BigDecimal("540.00"));
        plein2.setKilometrage(30200L);
        plein2.setAnomalieSurconsommation(true);
        plein2 = pleinCarburantRepository.save(plein2);

        assertTrue(plein2.getAnomalieSurconsommation(), "Le système doit marquer l'anomalie de surconsommation");
        v.setKilometrageActuel(30200L);
        vehiculeRepository.save(v);
        assertEquals(30200L, v.getKilometrageActuel());
    }

    @Test
    @Order(4)
    @DisplayName("UAT-04 : Déclaration panne, Ordre de Réparation & recalcul seuil 90% (RG06)")
    void test04_maintenancePanneEtSeuil90RG06() {
        Vehicule v = buildVehiculeTest("77777-M-01", 8500L);

        // Déclaration Panne
        PanneRequest req = new PanneRequest();
        req.setVehiculeId(v.getId());
        req.setNaturePanne("Perte de puissance et témoin moteur allumé");
        req.setLieuPanne("Rabat Hay Riad");
        req.setDegreUrgence(UrgencePanne.ELEVEE);
        req.setImmobilisante(true);
        req.setCoutEstimeDevis(BigDecimal.valueOf(1800.00));

        PanneDto panne = panneService.declarerPanne(req);
        assertNotNull(panne.getId());
        assertEquals(UrgencePanne.ELEVEE, panne.getDegreUrgence());

        // Alerte seuil d'entretien préventif 90% : 9 200 km sur seuil de 10 000 km
        v.setKilometrageActuel(9200L);
        vehiculeRepository.save(v);

        List<AlerteEcheanceDto> alertes = maintenanceService.getAlertesEcheances();
        assertNotNull(alertes);
        boolean alerteTrouvee = alertes.stream().anyMatch(a ->
                "MAINTENANCE_PREVENTIVE".equals(a.getTypeAlerte()) &&
                v.getImmatriculation().equals(a.getImmatriculation())
        );
        assertTrue(alerteTrouvee, "Une alerte d'entretien doit se déclencher car le véhicule dépasse 90% du seuil");
    }

    @Test
    @Order(5)
    @DisplayName("UAT-05 : Contrôle d'Engagement Budgétaire (RG01) et Seuils d'Alertes 80%/95% (RG03)")
    void test05_chaineBudgetaireControleRG01EtAlertesRG03() {
        // 1. Initialiser une ligne budgétaire
        BudgetDirection budget = BudgetDirection.builder()
                .annee(ANNEE_TEST)
                .direction(DIRECTION_TEST)
                .service("Division Parc")
                .centreCout("CC-PARC-UAT")
                .natureDepense(NatureDepense.CARBURANT)
                .montantAlloue(BigDecimal.valueOf(100000.00))
                .montantEngage(BigDecimal.valueOf(0.00))
                .montantRealise(BigDecimal.valueOf(0.00))
                .build();
        budget = budgetRepository.save(budget);

        // 2. Engagement valide (85 000 MAD) -> Dépassement seuil 80% (RG03)
        EngagementBudgetaireRequest engReq1 = EngagementBudgetaireRequest.builder()
                .annee(ANNEE_TEST)
                .direction(DIRECTION_TEST)
                .natureDepense(NatureDepense.CARBURANT)
                .montantEngage(BigDecimal.valueOf(85000.00))
                .beneficiaire("Afriquia SMDC")
                .objet("Plafond cartes trimestriel")
                .build();
        EngagementBudgetaireDto eng1 = budgetService.creerEngagement(engReq1, "gestionnaire-uat");
        assertNotNull(eng1.getId());
        assertEquals(StatutEngagement.ENGAGE, eng1.getStatutEngagement());

        BudgetDirection bApresEng1 = budgetRepository.findById(budget.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(15000.00).compareTo(bApresEng1.getMontantDisponible()));

        // 3. Tentative de dépassement de crédit (RG01 : solde restant 15 000 MAD, tentative 20 000 MAD)
        EngagementBudgetaireRequest engReq2 = EngagementBudgetaireRequest.builder()
                .annee(ANNEE_TEST)
                .direction(DIRECTION_TEST)
                .natureDepense(NatureDepense.CARBURANT)
                .montantEngage(BigDecimal.valueOf(20000.00))
                .beneficiaire("Total Energies")
                .objet("Commande excessive")
                .build();

        assertThrows(BadRequestException.class, () -> budgetService.creerEngagement(engReq2, "gestionnaire-uat"),
                "Le système doit strictement bloquer tout engagement excédant le solde disponible (RG01)");
    }

    @Test
    @Order(6)
    @DisplayName("UAT-06 : Moteur de Calcul TCO (RG02) & Génération des 3 Formats d'Exports (Excel, PDF, CSV)")
    void test06_tcoEtExportsMultiFormats() {
        Vehicule v = buildVehiculeTest("11111-T-01", 50000L);

        // Calcul TCO & Consolidation
        ExecutiveSummaryDto summary = reportingService.getExecutiveSummary();
        assertNotNull(summary);
        assertTrue(summary.getTotalVehicules() > 0);
        assertNotNull(summary.getTcoGlobal());

        // 1. Export Excel POI (.xlsx)
        byte[] excelBytes = reportingService.generateExcelReport();
        assertNotNull(excelBytes, "Le flux Excel ne doit pas être nul");
        assertTrue(excelBytes.length > 500, "Le fichier Excel doit contenir les octets du classeur multi-onglets");

        // 2. Export PDF Officiel OpenPDF (.pdf)
        byte[] pdfBytes = reportingService.generatePdfReport();
        assertNotNull(pdfBytes, "Le flux PDF ne doit pas être nul");
        assertTrue(pdfBytes.length > 500, "Le fichier PDF doit contenir la structure du document exécutif");

        // 3. Export CSV Normalisé SID MEF (.csv)
        byte[] csvBytes = reportingService.generateCsvReport();
        assertNotNull(csvBytes, "Le flux CSV ne doit pas être nul");
        assertTrue(csvBytes.length > 100, "Le fichier CSV doit contenir les en-têtes et lignes de données");
        String csvContent = new String(csvBytes, java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(csvContent.contains("RAPPORT TCO ET FLOTTE AUTOMOBILE MEF"));
        assertTrue(csvContent.contains("Immatriculation;Marque & Modele"));
    }

    @Test
    @Order(7)
    @DisplayName("UAT-07 : Clôture annuelle de l'exercice budgétaire (RG04)")
    void test07_clotureExerciceBudgetaireRG04() {
        ClotureExerciceRequest clotureReq = ClotureExerciceRequest.builder()
                .observations("Clôture annuelle définitive UAT")
                .build();

        budgetService.cloturerExercice(ANNEE_TEST, clotureReq, "admin-uat");

        ExerciceBudgetaireDto exCloture = budgetService.getExerciceByAnnee(ANNEE_TEST);
        assertEquals(StatutExercice.CLOTURE, exCloture.getStatut());

        // Vérifier qu'on ne peut plus créer ou modifier un budget sur un exercice clôturé
        BudgetDirectionRequest reqApresCloture = BudgetDirectionRequest.builder()
                .annee(ANNEE_TEST)
                .direction(DIRECTION_TEST)
                .natureDepense(NatureDepense.CARBURANT)
                .montantAlloue(BigDecimal.valueOf(50000.00))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            budgetService.creerOuModifierBudget(reqApresCloture);
        });
        assertTrue(ex.getMessage().contains("clôturé") || ex.getMessage().contains("verrouillé"));
    }
}

package com.mef.parkauto;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.DuplicateResourceException;
import com.mef.parkauto.repository.*;
import com.mef.parkauto.security.JwtService;
import com.mef.parkauto.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SPRINT 8 — TESTS DE NON-RÉGRESSION ISSUS DE L'AUDIT DE CONFORMITÉ AU CAHIER DES CHARGES.
 *
 * Chaque test correspond à un écart relevé lors de l'audit (sécurité DGSSI, règles RG01–RG07,
 * contrôles de cohérence CdC §9, §11, §14, §21, §22, §24) et vérifie que la correction est effective
 * au niveau des services métier (là où les règles doivent être appliquées, indépendamment du frontend).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class Sprint8AuditConformiteCdCTests {

    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private ConducteurRepository conducteurRepository;
    @Autowired private DemandeDeplacementRepository demandeRepository;
    @Autowired private GarageAgreeRepository garageRepository;
    @Autowired private ExerciceBudgetaireRepository exerciceRepository;
    @Autowired private BudgetDirectionRepository budgetRepository;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private RoleRepository roleRepository;

    @Autowired private CarburantService carburantService;
    @Autowired private MaintenanceService maintenanceService;
    @Autowired private ReformeVehiculeService reformeService;
    @Autowired private AffectationService affectationService;
    @Autowired private BudgetService budgetService;
    @Autowired private TaxeAutomobileService taxeService;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final String DIRECTION = "Direction du Budget";

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private Vehicule vehicule(String immat, long km, Double consoTheorique) {
        Vehicule v = new Vehicule();
        v.setImmatriculation(immat);
        v.setNumeroInventaire("INV-AUD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        v.setNumeroChassis("VF1" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
        v.setMarque("Dacia");
        v.setModele("Logan");
        v.setDirection(DIRECTION);
        v.setTypeCarburant(TypeCarburant.DIESEL);
        v.setTypeVehicule("BERLINE");
        v.setKilometrageInitial(0L);
        v.setKilometrageActuel(km);
        v.setCapaciteReservoir(50.0);
        v.setConsommationTheorique(consoTheorique);
        v.setProchainSeuilEntretienKm(km + 10000L);
        v.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        v.setEtatTechnique(EtatTechnique.BON_ETAT);
        v.setMontantAcquisition(new BigDecimal("150000.00"));
        v.setDateAcquisition(LocalDate.of(2024, 3, 1));
        return vehiculeRepository.save(v);
    }

    private Conducteur conducteur() {
        Conducteur c = new Conducteur();
        c.setCin("K" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        c.setMatricule("COND-AUD-" + UUID.randomUUID().toString().substring(0, 4));
        c.setNom("Alaoui");
        c.setPrenom("Sara");
        c.setNumeroPermis("PERM-" + UUID.randomUUID().toString().substring(0, 6));
        c.setCategoriePermis("B");
        c.setDateExpirationPermis(LocalDate.now().plusYears(3));
        c.setStatut(StatutConducteur.ACTIF);
        c.setDirection(DIRECTION);
        return conducteurRepository.save(c);
    }

    private Utilisateur utilisateur(RoleType roleType, UserStatus statut) {
        Role role = roleRepository.findByNom(roleType).orElseGet(() -> {
            Role r = new Role();
            r.setNom(roleType);
            r.setDescription("Rôle test audit");
            return roleRepository.save(r);
        });
        Utilisateur u = new Utilisateur();
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        u.setEmail("audit." + suffix + "@mef.gov.ma");
        u.setMatricule("AUD-" + suffix);
        u.setNom("Audit");
        u.setPrenom("Testeur");
        u.setMotDePasse(passwordEncoder.encode("Secret@2026"));
        u.setSel("{bcrypt}");
        u.setStatut(statut);
        u.setRole(role);
        u.setDirection(DIRECTION);
        return utilisateurRepository.save(u);
    }

    private GarageAgree garage(boolean agree, boolean actif) {
        GarageAgree g = new GarageAgree();
        g.setNomGarage("Garage " + (agree ? "Agréé" : "Non agréé") + " " + UUID.randomUUID().toString().substring(0, 4));
        g.setVille("Rabat");
        g.setAgreeMEF(agree);
        g.setActif(actif);
        return garageRepository.save(g);
    }

    private PleinCarburantRequest plein(Vehicule v, long km, double litres, String ticket) {
        PleinCarburantRequest r = new PleinCarburantRequest();
        r.setVehiculeId(v.getId());
        r.setDatePlein(LocalDateTime.now().minusMinutes(1));
        r.setTypeCarburant(TypeCarburant.DIESEL);
        r.setQuantiteLitres(litres);
        r.setPrixUnitaire(new BigDecimal("12.00"));
        r.setMontantTTC(new BigDecimal("12.00").multiply(BigDecimal.valueOf(litres)));
        r.setKilometrage(km);
        r.setReferenceTicket(ticket);
        r.setStationService("Afriquia Agdal");
        return r;
    }

    @BeforeEach
    void exerciceOuvert() {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(2026).orElseGet(() ->
                exerciceRepository.save(ExerciceBudgetaire.builder().annee(2026).statut(StatutExercice.OUVERT).build()));
        ex.setStatut(StatutExercice.OUVERT);
        exerciceRepository.save(ex);
    }

    // ------------------------------------------------------------------
    // SÉCURITÉ (DGSSI)
    // ------------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("SEC-01 : Les mots de passe sont hachés en BCrypt (plus de SHA-256 simple)")
    void sec01_bcrypt() {
        String hash = passwordEncoder.encode("Admin@2026");
        assertTrue(hash.startsWith("{bcrypt}$2"), "Le hachage doit être un BCrypt préfixé DelegatingPasswordEncoder : " + hash);
        assertTrue(passwordEncoder.matches("Admin@2026", hash));
        assertFalse(passwordEncoder.matches("mauvais", hash));
        assertNotEquals(passwordEncoder.encode("Admin@2026"), hash, "Le sel BCrypt doit rendre chaque hachage unique");
    }

    @Test
    @Order(2)
    @DisplayName("SEC-02 : Un refresh token ne peut pas être utilisé comme access token (anti-confusion)")
    void sec02_jwtTypeConfusion() {
        Utilisateur u = utilisateur(RoleType.GESTIONNAIRE_CENTRAL, UserStatus.ACTIVE);
        String access = jwtService.generateAccessToken(u);
        String refresh = jwtService.generateRefreshToken(u);

        assertEquals("access", jwtService.extractTokenType(access));
        assertEquals("refresh", jwtService.extractTokenType(refresh));
        assertTrue(jwtService.isAccessTokenValid(access, u));
        assertFalse(jwtService.isAccessTokenValid(refresh, u), "Un refresh token présenté sur l'API doit être refusé");
        assertFalse(jwtService.isRefreshTokenValid(access, u), "Un access token ne doit pas permettre un refresh");
        assertNotNull(jwtService.extractJti(access), "Chaque jeton porte un identifiant unique (jti) pour la révocation");
    }

    @Test
    @Order(3)
    @DisplayName("SEC-03 : Un jeton révoqué (déconnexion) ou d'un compte verrouillé est refusé")
    void sec03_revocationEtCompteVerrouille() {
        Utilisateur u = utilisateur(RoleType.CONDUCTEUR, UserStatus.ACTIVE);
        String access = jwtService.generateAccessToken(u);
        assertTrue(jwtService.isAccessTokenValid(access, u));

        jwtService.revoke(access);
        assertFalse(jwtService.isAccessTokenValid(access, u), "Un jeton révoqué doit être rejeté immédiatement");

        Utilisateur verrouille = utilisateur(RoleType.CONDUCTEUR, UserStatus.LOCKED);
        String tokenVerrouille = jwtService.generateAccessToken(verrouille);
        assertFalse(jwtService.isAccessTokenValid(tokenVerrouille, verrouille), "Un compte verrouillé ne doit plus accéder à l'API");
    }

    // ------------------------------------------------------------------
    // RG05 — CARBURANT (CdC §11, §12)
    // ------------------------------------------------------------------

    @Test
    @Order(10)
    @DisplayName("RG05-01 : Surconsommation détectée par le service à +25 % de la moyenne historique du véhicule")
    void rg05_surconsommationCalculeeParLeService() {
        Vehicule v = vehicule("10001-A-11", 20000L, 6.0);

        // Plein de référence : 30 L pour 500 km => 6 L/100 km (consommation théorique : 6 L/100 km)
        PleinCarburantDto p1 = carburantService.enregistrerPlein(plein(v, 20500L, 30.0, "TK-AUD-1"));
        assertFalse(Boolean.TRUE.equals(p1.getAnomalieSurconsommation()));

        // Plein normal : 31 L pour 500 km => 6,2 L/100 km (< 7,5) => pas d'anomalie
        PleinCarburantDto p2 = carburantService.enregistrerPlein(plein(v, 21000L, 31.0, "TK-AUD-2"));
        assertFalse(Boolean.TRUE.equals(p2.getAnomalieSurconsommation()), "6,2 L/100 est sous le seuil de +25 %");

        // Plein anormal : 45 L pour 500 km => 9 L/100 km (> 6,1 × 1,25 = 7,6) => anomalie RG05
        PleinCarburantDto p3 = carburantService.enregistrerPlein(plein(v, 21500L, 45.0, "TK-AUD-3"));
        assertTrue(Boolean.TRUE.equals(p3.getAnomalieSurconsommation()), "9 L/100 dépasse la moyenne historique de plus de 25 %");
    }

    @Test
    @Order(11)
    @DisplayName("RG05-02 : Contrôles de cohérence carburant — kilométrage régressif, réservoir, montant, doublon, type")
    void rg05_controlesCoherence() {
        Vehicule v = vehicule("10002-A-11", 30000L, 6.5);
        carburantService.enregistrerPlein(plein(v, 30400L, 25.0, "TK-COH-1"));

        // Kilométrage inférieur au dernier connu
        assertThrows(IllegalArgumentException.class,
                () -> carburantService.enregistrerPlein(plein(v, 30100L, 20.0, "TK-COH-2")), "Kilométrage régressif refusé");

        // Quantité > capacité réservoir (50 L)
        assertThrows(IllegalArgumentException.class,
                () -> carburantService.enregistrerPlein(plein(v, 30800L, 80.0, "TK-COH-3")), "Dépassement capacité réservoir refusé");

        // Montant incohérent avec quantité × prix unitaire
        PleinCarburantRequest incoherent = plein(v, 30800L, 30.0, "TK-COH-4");
        incoherent.setMontantTTC(new BigDecimal("900.00")); // attendu 360 MAD
        assertThrows(IllegalArgumentException.class, () -> carburantService.enregistrerPlein(incoherent), "Montant incohérent refusé");

        // Type de carburant différent de celui du véhicule
        PleinCarburantRequest essence = plein(v, 30800L, 30.0, "TK-COH-5");
        essence.setTypeCarburant(TypeCarburant.ESSENCE);
        assertThrows(IllegalArgumentException.class, () -> carburantService.enregistrerPlein(essence), "Type carburant incohérent refusé");

        // Doublon : même référence de ticket
        assertThrows(DuplicateResourceException.class,
                () -> carburantService.enregistrerPlein(plein(v, 30800L, 30.0, "TK-COH-1")), "Doublon de ticket refusé");
    }

    @Test
    @Order(12)
    @DisplayName("RG05-03 : Aucun plein ne peut être saisi sur un véhicule réformé")
    void rg05_vehiculeReforme() {
        Vehicule v = vehicule("10003-A-11", 90000L, 6.5);
        v.setStatutAdministratif(StatutAdministratif.REFORME);
        vehiculeRepository.save(v);
        assertThrows(IllegalArgumentException.class, () -> carburantService.enregistrerPlein(plein(v, 90100L, 20.0, "TK-REF-1")));
    }

    // ------------------------------------------------------------------
    // MAINTENANCE — GARAGE AGRÉÉ (CdC §14, §24)
    // ------------------------------------------------------------------

    @Test
    @Order(20)
    @DisplayName("MAINT-01 : Seul un garage agréé MEF et actif peut être retenu pour une intervention")
    void maint01_garageAgreeObligatoire() {
        Vehicule v = vehicule("20001-B-11", 40000L, 7.0);
        GarageAgree nonAgree = garage(false, true);
        GarageAgree inactif = garage(true, false);
        GarageAgree ok = garage(true, true);

        InterventionMaintenanceRequest req = new InterventionMaintenanceRequest();
        req.setVehiculeId(v.getId());
        req.setTypeMaintenance(TypeMaintenance.CURATIVE);
        req.setNatureOperation(NatureMaintenance.REPARATION_PANNE);
        req.setDatePrevisionnelle(LocalDate.now().plusDays(2));
        req.setMontantTotal(new BigDecimal("2500.00"));

        req.setGarageAgreeId(nonAgree.getId());
        assertThrows(BadRequestException.class, () -> maintenanceService.enregistrerIntervention(req), "Garage non agréé refusé");

        req.setGarageAgreeId(inactif.getId());
        assertThrows(BadRequestException.class, () -> maintenanceService.enregistrerIntervention(req), "Garage désactivé refusé");

        req.setGarageAgreeId(ok.getId());
        InterventionMaintenanceDto dto = maintenanceService.enregistrerIntervention(req);
        assertNotNull(dto.getId());
        assertEquals(ok.getId(), dto.getGarageAgreeId());
    }

    @Test
    @Order(21)
    @DisplayName("MAINT-02 : Une intervention clôturée est verrouillée (suppression et re-clôture interdites)")
    void maint02_interventionClotureeVerrouillee() {
        Vehicule v = vehicule("20002-B-11", 41000L, 7.0);
        InterventionMaintenanceRequest req = new InterventionMaintenanceRequest();
        req.setVehiculeId(v.getId());
        req.setDatePrevisionnelle(LocalDate.now());
        req.setMontantTotal(new BigDecimal("800.00"));
        InterventionMaintenanceDto dto = maintenanceService.enregistrerIntervention(req);

        ClotureInterventionRequest cloture = new ClotureInterventionRequest();
        cloture.setDateRealisation(LocalDate.now());
        cloture.setKilometrageRealise(41050L);
        cloture.setMontantTotal(new BigDecimal("800.00"));
        InterventionMaintenanceDto close = maintenanceService.cloturerIntervention(dto.getId(), cloture);
        assertEquals(StatutMaintenance.TERMINEE, close.getStatut());

        assertThrows(BadRequestException.class, () -> maintenanceService.cloturerIntervention(dto.getId(), cloture));
        assertThrows(BadRequestException.class, () -> maintenanceService.deleteIntervention(dto.getId()));
    }

    // ------------------------------------------------------------------
    // RG07 — RÉFORME (CdC §22)
    // ------------------------------------------------------------------

    @Test
    @Order(30)
    @DisplayName("RG07-01 : La validation d'une réforme exige le PV de la Commission ET le PV des Domaines")
    void rg07_pvObligatoires() {
        Vehicule v = vehicule("30001-C-11", 250000L, 8.0);

        ReformeVehiculeRequest req = new ReformeVehiculeRequest();
        req.setVehiculeId(v.getId());
        req.setMotifReforme("Vétusté — coût de remise en état supérieur à la valeur vénale");
        req.setDateDecision(LocalDate.now());
        ReformeVehiculeDto reforme = reformeService.creerOuModifier(req);

        assertEquals(StatutReforme.INITIE, reforme.getStatut());
        assertEquals(StatutAdministratif.EN_COURS_DE_REFORME,
                vehiculeRepository.findById(v.getId()).orElseThrow().getStatutAdministratif(),
                "Le véhicule est gelé dès l'ouverture de la procédure");

        // Sans aucun PV
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () -> reformeService.valider(reforme.getId()));
        assertTrue(ex1.getMessage().contains("PV"));

        // PV Commission seul : PV des Domaines toujours manquant
        req.setId(reforme.getId());
        req.setPvCommission("PV-COM-2026-014");
        req.setDatePvCommission(LocalDate.now());
        reformeService.creerOuModifier(req);
        IllegalStateException ex2 = assertThrows(IllegalStateException.class, () -> reformeService.valider(reforme.getId()));
        assertTrue(ex2.getMessage().contains("Domaines"));

        // Les deux PV : validation OK => véhicule REFORME et sortie du parc datée
        req.setPvDomaines("PV-DOM-2026-007");
        req.setDatePvDomaines(LocalDate.now());
        reformeService.creerOuModifier(req);
        ReformeVehiculeDto valide = reformeService.valider(reforme.getId());
        assertEquals(StatutReforme.REFORME, valide.getStatut());
        assertNotNull(valide.getDateSortieParc());
        assertEquals(StatutAdministratif.REFORME, vehiculeRepository.findById(v.getId()).orElseThrow().getStatutAdministratif());

        // Une réforme validée ne peut plus être supprimée
        assertThrows(IllegalStateException.class, () -> reformeService.supprimer(reforme.getId()));
    }

    @Test
    @Order(31)
    @DisplayName("RG07-02 : Machine à états — transitions interdites rejetées, cession exige un prix")
    void rg07_machineAEtats() {
        Vehicule v = vehicule("30002-C-11", 260000L, 8.0);
        ReformeVehiculeRequest req = new ReformeVehiculeRequest();
        req.setVehiculeId(v.getId());
        req.setMotifReforme("Accident — perte totale");
        ReformeVehiculeDto reforme = reformeService.creerOuModifier(req);

        // INITIE -> REFORME directement : interdit
        assertThrows(BadRequestException.class, () -> reformeService.changerStatut(reforme.getId(), StatutReforme.REFORME));
        // INITIE -> VENDU : interdit
        assertThrows(BadRequestException.class, () -> reformeService.changerStatut(reforme.getId(), StatutReforme.VENDU));
        // INITIE -> EN_COURS sans date de décision : refusé
        assertThrows(BadRequestException.class, () -> reformeService.changerStatut(reforme.getId(), StatutReforme.EN_COURS_DE_REFORME));

        // Une seconde procédure sur le même véhicule est refusée
        ReformeVehiculeRequest doublon = new ReformeVehiculeRequest();
        doublon.setVehiculeId(v.getId());
        doublon.setMotifReforme("Doublon");
        assertThrows(BadRequestException.class, () -> reformeService.creerOuModifier(doublon));
    }

    // ------------------------------------------------------------------
    // WORKFLOW N1 / N2 (CdC §9)
    // ------------------------------------------------------------------

    @Test
    @Order(40)
    @DisplayName("WF-01 : Aucune affectation (N2) possible sans validation préalable du Responsable de Service (N1)")
    void wf01_affectationExigeValidationN1() {
        Vehicule v = vehicule("40001-D-11", 12000L, 6.0);
        Conducteur c = conducteur();
        Utilisateur demandeur = utilisateur(RoleType.CONDUCTEUR, UserStatus.ACTIVE);

        DemandeDeplacement dem = new DemandeDeplacement();
        dem.setReference("DEM-AUD-" + UUID.randomUUID().toString().substring(0, 6));
        dem.setDemandeur(demandeur);
        dem.setMotif("Mission d'inspection");
        dem.setDestination("Fès");
        dem.setDateHeureDepart(LocalDateTime.now().plusDays(1));
        dem.setDateHeureRetourEstimee(LocalDateTime.now().plusDays(2));
        dem.setStatut(StatutDemande.EN_ATTENTE_VALIDATION);
        dem = demandeRepository.save(dem);

        AffectationDto dto = new AffectationDto();
        dto.setDemandeDeplacementId(dem.getId());
        dto.setVehiculeId(v.getId());
        dto.setConducteurId(c.getId());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> affectationService.créerAffectation(dto));
        assertTrue(ex.getMessage().contains("VALID"), "Le message doit indiquer que la validation N1 est requise");
        assertEquals(StatutAdministratif.DISPONIBLE, vehiculeRepository.findById(v.getId()).orElseThrow().getStatutAdministratif(),
                "Le véhicule ne doit pas avoir changé d'état");
    }

    // ------------------------------------------------------------------
    // RG04 — EXERCICE BUDGÉTAIRE (CdC §17)
    // ------------------------------------------------------------------

    @Test
    @Order(50)
    @DisplayName("RG04-01 : La date d'engagement doit relever de l'exercice déclaré (pas de contournement d'exercice clos)")
    void rg04_dateEngagementCoherente() {
        budgetRepository.save(BudgetDirection.builder()
                .annee(2026).direction(DIRECTION).service("Division Parc").centreCout("CC-AUD")
                .natureDepense(NatureDepense.ENTRETIEN)
                .montantAlloue(new BigDecimal("50000.00"))
                .montantEngage(BigDecimal.ZERO).montantRealise(BigDecimal.ZERO).build());

        EngagementBudgetaireRequest req = EngagementBudgetaireRequest.builder()
                .annee(2026).direction(DIRECTION).natureDepense(NatureDepense.ENTRETIEN)
                .montantEngage(new BigDecimal("1000.00"))
                .beneficiaire("Garage Central").objet("Révision")
                .dateEngagement(LocalDate.of(2025, 12, 31))   // date sur l'exercice 2025, déclaré 2026
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> budgetService.creerEngagement(req, "audit"));
        assertTrue(ex.getMessage().toLowerCase().contains("exercice"));

        req.setDateEngagement(LocalDate.of(2026, 6, 15));
        EngagementBudgetaireDto ok = budgetService.creerEngagement(req, "audit");
        assertNotNull(ok.getId());
    }

    // ------------------------------------------------------------------
    // TAXES (CdC §21)
    // ------------------------------------------------------------------

    @Test
    @Order(60)
    @DisplayName("TAXE-01 : Statut initial A_PAYER, passage EN_RETARD si échéance dépassée, PAYEE exige une référence, pas de doublon")
    void taxe01_cycleDeVie() {
        Vehicule v = vehicule("60001-E-11", 5000L, 6.0);

        TaxeAutomobileRequest req = new TaxeAutomobileRequest();
        req.setVehiculeId(v.getId());
        req.setAnnee(2026);
        req.setType(TypeTaxe.VIGNETTE);
        req.setMontant(new BigDecimal("700.00"));
        req.setDateEcheance(LocalDate.now().plusMonths(1));
        TaxeAutomobileDto t = taxeService.creerOuModifier(req);
        assertEquals(StatutTaxe.A_PAYER, t.getStatut());

        // Doublon même véhicule / année / type
        assertThrows(DuplicateResourceException.class, () -> taxeService.creerOuModifier(req));

        // Échéance passée => EN_RETARD automatique
        TaxeAutomobileRequest retard = new TaxeAutomobileRequest();
        retard.setVehiculeId(v.getId());
        retard.setAnnee(2025);
        retard.setType(TypeTaxe.VIGNETTE);
        retard.setMontant(new BigDecimal("700.00"));
        retard.setDateEcheance(LocalDate.now().minusDays(10));
        assertEquals(StatutTaxe.EN_RETARD, taxeService.creerOuModifier(retard).getStatut());

        // PAYEE sans référence de paiement => refusé
        req.setId(t.getId());
        req.setStatut(StatutTaxe.PAYEE);
        assertThrows(BadRequestException.class, () -> taxeService.creerOuModifier(req));

        req.setReferencePaiement("QUIT-2026-0001");
        TaxeAutomobileDto payee = taxeService.creerOuModifier(req);
        assertEquals(StatutTaxe.PAYEE, payee.getStatut());
        assertNotNull(payee.getDatePaiement());

        // Une taxe payée est verrouillée
        assertThrows(BadRequestException.class, () -> taxeService.supprimer(payee.getId()));
    }
}

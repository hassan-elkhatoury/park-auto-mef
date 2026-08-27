package com.mef.parkauto;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import com.mef.parkauto.service.BudgetService;
import com.mef.parkauto.service.ReportingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Sprint7BudgetDashboardTests {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private ReportingService reportingService;

    @Autowired
    private BudgetDirectionRepository budgetRepository;

    @Autowired
    private ExerciceBudgetaireRepository exerciceRepository;

    @Autowired
    private EngagementBudgetaireRepository engagementRepository;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    private Integer anneeTest = 2026;

    @BeforeEach
    void setUp() {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(anneeTest).orElseGet(() -> {
            ExerciceBudgetaire newEx = ExerciceBudgetaire.builder()
                    .annee(anneeTest)
                    .statut(StatutExercice.OUVERT)
                    .build();
            return exerciceRepository.save(newEx);
        });
        ex.setStatut(StatutExercice.OUVERT);
        exerciceRepository.save(ex);
    }

    @Test
    @DisplayName("RG01 : Verrouillage d'engagement budgétaire si solde insuffisant")
    void testRG01_VerrouillageEngagement_SoldeInsuffisant() {
        BudgetDirection budget = BudgetDirection.builder()
                .annee(anneeTest)
                .direction("Direction du Trésor")
                .service("Division Monétaire")
                .natureDepense(NatureDepense.CARBURANT)
                .montantAlloue(BigDecimal.valueOf(100000.00))
                .montantEngage(BigDecimal.valueOf(90000.00))
                .montantRealise(BigDecimal.valueOf(80000.00))
                .build();
        budgetRepository.save(budget);

        // Tentative d'engagement de 15 000 MAD -> DOIT ÉCHOUER (RG01)
        EngagementBudgetaireRequest reqTropGrand = EngagementBudgetaireRequest.builder()
                .annee(anneeTest)
                .direction("Direction du Trésor")
                .natureDepense(NatureDepense.CARBURANT)
                .montantEngage(BigDecimal.valueOf(15000.00))
                .beneficiaire("TotalEnergies")
                .objet("Cartes carburant dépassement")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            budgetService.creerEngagement(reqTropGrand, "test-user");
        });
        assertTrue(ex.getMessage().contains("insuffisants") || ex.getMessage().contains("Solde disponible"));

        // Tentative d'engagement de 5 000 MAD -> DOIT RÉUSSIR
        EngagementBudgetaireRequest reqValide = EngagementBudgetaireRequest.builder()
                .annee(anneeTest)
                .direction("Direction du Trésor")
                .natureDepense(NatureDepense.CARBURANT)
                .montantEngage(BigDecimal.valueOf(5000.00))
                .beneficiaire("TotalEnergies")
                .objet("Cartes carburant autorisées")
                .build();

        EngagementBudgetaireDto engDto = budgetService.creerEngagement(reqValide, "test-user");
        assertNotNull(engDto.getId());
        assertNotNull(engDto.getNumeroEngagement());
        assertEquals(StatutEngagement.ENGAGE, engDto.getStatutEngagement());

        // Vérifier que le montant engagé a été mis à jour (90 000 + 5 000 = 95 000)
        BudgetDirection bUpdated = budgetRepository.findById(budget.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(95000.00).compareTo(bUpdated.getMontantEngage()));
    }

    @Test
    @DisplayName("RG02 : Calcul automatique du TCO et ratio MAD / km")
    void testRG02_CalculTCO_Et_CoutKilometriqueMadKm() {
        Vehicule v = new Vehicule();
        v.setImmatriculation("TEST-TCO-001");
        v.setNumeroChassis("VF3-CHASSIS-TEST-9988");
        v.setNumeroInventaire("INV-TEST-TCO-001");
        v.setMarque("Peugeot");
        v.setModele("508");
        v.setDirection("Direction du Budget");
        v.setTypeCarburant(TypeCarburant.DIESEL);
        v.setKilometrageActuel(50000L);
        v.setMontantAcquisition(BigDecimal.valueOf(250000.00));
        v.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        v.setCategorie("LIAISON");
        v.setTypeVehicule("BERLINE");
        vehiculeRepository.save(v);

        List<TcoVehiculeDto> tcoList = reportingService.getTcoParVehicule();
        assertFalse(tcoList.isEmpty());

        TcoVehiculeDto dto = tcoList.stream()
                .filter(item -> "TEST-TCO-001".equals(item.getImmatriculation()))
                .findFirst()
                .orElse(null);

        assertNotNull(dto, "Le véhicule créé doit être présent dans le rapport TCO");
        assertTrue(dto.getTcoTotal().compareTo(BigDecimal.valueOf(250000.00)) >= 0);
        assertNotNull(dto.getCoutKilometriqueMadKm());
        // 250 000 / 50 000 = 5.0 MAD / km
        assertEquals(5.0, dto.getCoutKilometriqueMadKm(), 0.1);
    }

    @Test
    @DisplayName("RG03 : Détection des alertes budgétaires aux seuils 80% (Vigilance) et 95% (Critique)")
    void testRG03_DetectionAlertesBudgetaires_80_Et_95() {
        BudgetDirection b80 = BudgetDirection.builder()
                .annee(anneeTest)
                .direction("Direction des Domaines")
                .natureDepense(NatureDepense.ENTRETIEN)
                .montantAlloue(BigDecimal.valueOf(100000.00))
                .montantEngage(BigDecimal.valueOf(85000.00))
                .montantRealise(BigDecimal.valueOf(80000.00))
                .seuilAlerte80Atteint(true)
                .build();
        budgetRepository.save(b80);

        BudgetDirection b95 = BudgetDirection.builder()
                .annee(anneeTest)
                .direction("Administration des Douanes")
                .natureDepense(NatureDepense.REPARATION)
                .montantAlloue(BigDecimal.valueOf(100000.00))
                .montantEngage(BigDecimal.valueOf(97000.00))
                .montantRealise(BigDecimal.valueOf(97000.00))
                .seuilAlerte80Atteint(true)
                .seuilAlerte95Atteint(true)
                .build();
        budgetRepository.save(b95);

        List<AlerteBudgetaireDto> alertes = budgetService.getAlertesActives(anneeTest);
        assertNotNull(alertes);
        assertTrue(alertes.size() >= 2);

        boolean a80Found = alertes.stream().anyMatch(a -> "VIGILANCE_80".equals(a.getNiveauAlerte()) && "Direction des Domaines".equals(a.getDirection()));
        boolean a95Found = alertes.stream().anyMatch(a -> "CRITIQUE_95".equals(a.getNiveauAlerte()) && "Administration des Douanes".equals(a.getDirection()));

        assertTrue(a80Found, "L'alerte 80% doit être détectée");
        assertTrue(a95Found, "L'alerte 95% doit être détectée");
    }

    @Test
    @DisplayName("RG04 : Clôture de l'exercice budgétaire et verrouillage en lecture seule")
    void testRG04_ClotureExercice_Et_VerrouillageLectureSeule() {
        Integer anneePasse = 2024;
        ExerciceBudgetaire ex2024 = exerciceRepository.findByAnnee(anneePasse).orElseGet(() -> {
            return exerciceRepository.save(ExerciceBudgetaire.builder()
                    .annee(anneePasse)
                    .statut(StatutExercice.OUVERT)
                    .build());
        });

        ClotureExerciceRequest clotureReq = ClotureExerciceRequest.builder()
                .observations("Clôture annuelle définitive")
                .build();
        budgetService.cloturerExercice(anneePasse, clotureReq, "admin-test");

        ExerciceBudgetaireDto exDto = budgetService.getExerciceByAnnee(anneePasse);
        assertEquals(StatutExercice.CLOTURE, exDto.getStatut());
        assertNotNull(exDto.getDateCloture());

        BudgetDirectionRequest reqModif = BudgetDirectionRequest.builder()
                .annee(anneePasse)
                .direction("Direction du Budget")
                .natureDepense(NatureDepense.CARBURANT)
                .montantAlloue(BigDecimal.valueOf(50000.00))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            budgetService.creerOuModifierBudget(reqModif);
        });
        assertTrue(ex.getMessage().contains("clôturé") || ex.getMessage().contains("verrouillé"));
    }

    @Test
    @DisplayName("RG05 : Consolidation financière multi-directions et moteur d'export POI / OpenPDF")
    void testRG05_ConsolidationMultiDirectionsMEF() {
        TcoConsolidationDto conso = reportingService.getTcoConsolidation();
        assertNotNull(conso);
        assertNotNull(conso.getTcoGlobalTotal());
        assertNotNull(conso.getParDirection());
        assertNotNull(conso.getParMotorisation());

        byte[] excelBytes = reportingService.generateExcelReport();
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 1000, "Le fichier Excel généré doit contenir les données consolidées");

        byte[] pdfBytes = reportingService.generatePdfReport();
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000, "Le fichier PDF généré doit être non vide");
    }
}

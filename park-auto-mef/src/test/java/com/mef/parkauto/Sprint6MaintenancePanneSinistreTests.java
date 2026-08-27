package com.mef.parkauto;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.BudgetDirectionRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import com.mef.parkauto.service.MaintenanceService;
import com.mef.parkauto.service.PanneService;
import com.mef.parkauto.service.SinistreService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class Sprint6MaintenancePanneSinistreTests {

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private PanneService panneService;

    @Autowired
    private SinistreService sinistreService;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private BudgetDirectionRepository budgetDirectionRepository;

    private Vehicule buildVehicule(String immat, String marque, String modele, String direction, Long km) {
        Vehicule v = new Vehicule();
        v.setImmatriculation(immat);
        v.setNumeroInventaire("INV-" + UUID.randomUUID().toString().substring(0, 8));
        v.setNumeroChassis("CHS-" + UUID.randomUUID().toString().substring(0, 12));
        v.setMarque(marque);
        v.setModele(modele);
        v.setDirection(direction);
        v.setTypeCarburant(TypeCarburant.DIESEL);
        v.setTypeVehicule("BERLINE");
        v.setKilometrageInitial(0L);
        v.setKilometrageActuel(km);
        v.setProchainSeuilEntretienKm(10000L);
        v.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        v.setEtatTechnique(EtatTechnique.BON_ETAT);
        v.setDateAcquisition(LocalDate.now());
        return vehiculeRepository.save(v);
    }

    @Test
    @DisplayName("RG01 : Déclenchement automatique d'alerte préventive à 90% du seuil kilométrique")
    void testRg01_AlerteMaintenance90Pourcent() {
        Vehicule v = buildVehicule("TEST-RG01-90", "Renault", "Clio", "Direction du Budget", 9200L);

        List<AlerteEcheanceDto> alertes = maintenanceService.getAlertesEcheances();
        boolean alerteTrouvee = alertes.stream().anyMatch(a ->
                "MAINTENANCE_PREVENTIVE".equals(a.getTypeAlerte()) &&
                v.getImmatriculation().equals(a.getImmatriculation()) &&
                ("ATTENTION".equals(a.getNiveauSeverite()) || "CRITIQUE".equals(a.getNiveauSeverite()))
        );

        assertTrue(alerteTrouvee, "L'alerte à 90% du seuil kilométrique (9200/10000 km) doit être déclenchée");
    }

    @Test
    @DisplayName("RG02 : Immobilisation automatique du véhicule lors d'une panne lourde (passage à EN_REPARATION)")
    void testRg02_ImmobilisationSurPanne() {
        Vehicule v = buildVehicule("TEST-RG02-PANNE", "Peugeot", "308", "Administration des Douanes", 45000L);

        PanneRequest req = new PanneRequest();
        req.setVehiculeId(v.getId());
        req.setNaturePanne("Défaillance alternateur et batterie HS");
        req.setLieuPanne("Autoroute Rabat-Casa");
        req.setDegreUrgence(UrgencePanne.ELEVEE);
        req.setImmobilisante(true);
        req.setRemorquageRequis(true);
        req.setCoutEstimeDevis(BigDecimal.valueOf(2500));

        PanneDto dto = panneService.declarerPanne(req);
        assertNotNull(dto.getId());

        Vehicule vApresPanne = vehiculeRepository.findById(v.getId()).orElseThrow();
        assertEquals(StatutAdministratif.EN_REPARATION, vApresPanne.getStatutAdministratif(),
                "Le véhicule doit automatiquement basculer au statut EN_REPARATION");
    }

    @Test
    @DisplayName("RG03 : Verrouillage pour sinistre grave (ACCIDENTE) et remise en circulation à la clôture (DISPONIBLE)")
    void testRg03_WorkflowSinistreEtDeblocage() {
        Vehicule v = buildVehicule("TEST-RG03-SIN", "Toyota", "Corolla", "Trésorerie Générale du Royaume", 60000L);

        // 1. Déclaration Sinistre -> ACCIDENTE
        SinistreRequest sinReq = new SinistreRequest();
        sinReq.setVehiculeId(v.getId());
        sinReq.setDateAccident(LocalDate.now());
        sinReq.setLieuAccident("Rabat Agdal");
        sinReq.setNatureAccident(NatureAccident.COLLISION);
        sinReq.setMontantDommages(BigDecimal.valueOf(8000));
        sinReq.setMontantFranchise(BigDecimal.valueOf(1500));
        sinReq.setMontantRembourse(BigDecimal.valueOf(6500));

        SinistreDto sinDto = sinistreService.declarer(sinReq);
        assertEquals(StatutSinistre.DECLARE, sinDto.getStatut());

        Vehicule vAccidente = vehiculeRepository.findById(v.getId()).orElseThrow();
        assertEquals(StatutAdministratif.ACCIDENTE, vAccidente.getStatutAdministratif(),
                "Le véhicule doit automatiquement basculer au statut ACCIDENTE suite au sinistre");

        // 2. Clôture Sinistre -> DISPONIBLE
        sinReq.setId(sinDto.getId());
        sinReq.setStatut(StatutSinistre.CLOTURE);
        sinReq.setDateCloture(LocalDate.now());
        sinistreService.modifier(sinDto.getId(), sinReq);

        Vehicule vCloture = vehiculeRepository.findById(v.getId()).orElseThrow();
        assertEquals(StatutAdministratif.DISPONIBLE, vCloture.getStatutAdministratif(),
                "Le véhicule doit automatiquement revenir au statut DISPONIBLE lors de la clôture du sinistre");
    }

    @Test
    @DisplayName("RG04 : Contrôle strict du kilométrage croissant (interdiction de régression kilométrique)")
    void testRg04_ControleKilometrageCroissant() {
        Vehicule v = buildVehicule("TEST-RG04-KM", "Dacia", "Duster", "Direction du Budget", 50000L);
        v.setStatutAdministratif(StatutAdministratif.EN_REPARATION);
        vehiculeRepository.save(v);

        PanneRequest req = new PanneRequest();
        req.setVehiculeId(v.getId());
        req.setNaturePanne("Remplacement plaquettes de frein");
        req.setCoutEstimeDevis(BigDecimal.valueOf(800));
        PanneDto panneDto = panneService.declarerPanne(req);

        // 1. Tentative de clôture avec kilométrage inférieur (ex: 48000 < 50000) -> doit lever BadRequestException
        CloturePanneRequest clotureInvalide = new CloturePanneRequest();
        clotureInvalide.setKilometrageReel(48000L);
        clotureInvalide.setCoutReelReparation(BigDecimal.valueOf(800));

        assertThrows(BadRequestException.class, () -> {
            panneService.cloturerReparation(panneDto.getId(), clotureInvalide);
        }, "Une tentative de clôture avec un kilométrage inférieur au compteur actuel doit lever une BadRequestException");

        // 2. Clôture avec kilométrage valide (ex: 50500 >= 50000) -> Succès et mise à jour
        CloturePanneRequest clotureValide = new CloturePanneRequest();
        clotureValide.setKilometrageReel(50500L);
        clotureValide.setCoutReelReparation(BigDecimal.valueOf(800));
        clotureValide.setDateReparation(LocalDateTime.now());
        clotureValide.setReferenceBonSortie("BS-2026-TEST");

        PanneDto panneCloturee = panneService.cloturerReparation(panneDto.getId(), clotureValide);
        assertEquals(StatutPanne.REPAREE, panneCloturee.getStatut());

        Vehicule vApresCloture = vehiculeRepository.findById(v.getId()).orElseThrow();
        assertEquals(50500L, vApresCloture.getKilometrageActuel(), "Le compteur du véhicule doit être mis à jour à 50500 km");
        assertEquals(StatutAdministratif.DISPONIBLE, vApresCloture.getStatutAdministratif(), "Le véhicule doit être DISPONIBLE");
    }

    @Test
    @DisplayName("RG05 : Imputation budgétaire automatique sur la Direction du véhicule")
    void testRg05_ImpactBudgetaireAutomatique() {
        Vehicule v = buildVehicule("TEST-RG05-BUDGET", "Volkswagen", "Passat", "Direction du Budget", 30000L);

        // Récupérer le budget réparation ou entretien de la direction
        int annee = LocalDate.now().getYear();
        BudgetDirection bInitial = budgetDirectionRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(annee)
                .stream()
                .filter(b -> "Direction du Budget".equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == NatureDepense.ENTRETIEN)
                .findFirst()
                .orElseGet(() -> {
                    BudgetDirection bd = new BudgetDirection();
                    bd.setAnnee(annee);
                    bd.setDirection("Direction du Budget");
                    bd.setNatureDepense(NatureDepense.ENTRETIEN);
                    bd.setMontantAlloue(BigDecimal.valueOf(100000));
                    bd.setMontantRealise(BigDecimal.valueOf(10000));
                    return budgetDirectionRepository.save(bd);
                });

        BigDecimal realiseAvant = bInitial.getMontantRealise() != null ? bInitial.getMontantRealise() : BigDecimal.ZERO;

        // Clôture d'une intervention de 1500 DH
        InterventionMaintenanceRequest maintReq = new InterventionMaintenanceRequest();
        maintReq.setVehiculeId(v.getId());
        maintReq.setTypeMaintenance(TypeMaintenance.PREVENTIVE);
        maintReq.setNatureOperation(NatureMaintenance.VIDANGE);
        maintReq.setCoutMainOeuvre(BigDecimal.valueOf(500));
        maintReq.setCoutPieces(BigDecimal.valueOf(1000));
        maintReq.setMontantTotal(BigDecimal.valueOf(1500));
        InterventionMaintenanceDto maintDto = maintenanceService.enregistrerIntervention(maintReq);

        ClotureInterventionRequest clotureReq = new ClotureInterventionRequest();
        clotureReq.setKilometrageRealise(30500L);
        clotureReq.setMontantTotal(BigDecimal.valueOf(1500));
        maintenanceService.cloturerIntervention(maintDto.getId(), clotureReq);

        BudgetDirection bApres = budgetDirectionRepository.findById(bInitial.getId()).orElseThrow();
        assertEquals(realiseAvant.add(BigDecimal.valueOf(1500)), bApres.getMontantRealise(),
                "Le montant réalisé du budget Direction doit être automatiquement incrémenté de 1500 DH");
    }
}

package com.mef.parkauto.service;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final InterventionMaintenanceRepository maintenanceRepository;
    private final VehiculeRepository vehiculeRepository;
    private final GarageAgreeRepository garageRepository;
    private final PieceRemplacementRepository pieceRepository;
    private final CarteCarburantRepository carteCarburantRepository;
    private final BudgetService budgetService;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<InterventionMaintenanceDto> getAllInterventions() {
        return maintenanceRepository.findAllByOrderByDatePrevisionnelleDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InterventionMaintenanceDto> getInterventionsByVehicule(Long vehiculeId) {
        return maintenanceRepository.findByVehiculeIdOrderByDatePrevisionnelleDesc(vehiculeId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterventionMaintenanceDto getInterventionById(Long id) {
        return maintenanceRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée avec l'id : " + id));
    }

    @Transactional
    public InterventionMaintenanceDto enregistrerIntervention(InterventionMaintenanceRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé avec l'id : " + request.getVehiculeId()));

        InterventionMaintenance intervention = (request.getId() != null)
                ? maintenanceRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée avec l'id : " + request.getId()))
                : new InterventionMaintenance();

        intervention.setVehicule(vehicule);
        if (request.getGarageAgreeId() != null) {
            garageRepository.findById(request.getGarageAgreeId()).ifPresent(intervention::setGarageAgree);
        }
        intervention.setTypeMaintenance(request.getTypeMaintenance() != null ? request.getTypeMaintenance() : TypeMaintenance.PREVENTIVE);
        intervention.setNatureOperation(request.getNatureOperation() != null ? request.getNatureOperation() : NatureMaintenance.REVISION_PERIODIQUE);
        intervention.setDatePrevisionnelle(request.getDatePrevisionnelle() != null ? request.getDatePrevisionnelle() : LocalDate.now());
        intervention.setDateRealisation(request.getDateRealisation());
        intervention.setKilometragePrevu(request.getKilometragePrevu() != null ? request.getKilometragePrevu() : vehicule.getKilometrageActuel());
        intervention.setKilometrageRealise(request.getKilometrageRealise());
        intervention.setPrestataire(request.getPrestataire() != null ? request.getPrestataire() : (intervention.getGarageAgree() != null ? intervention.getGarageAgree().getNomGarage() : "Garage Agréé MEF"));
        intervention.setCoutMainOeuvre(request.getCoutMainOeuvre() != null ? request.getCoutMainOeuvre() : BigDecimal.ZERO);
        intervention.setCoutPieces(request.getCoutPieces() != null ? request.getCoutPieces() : BigDecimal.ZERO);

        BigDecimal total = request.getMontantTotal();
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            total = intervention.getCoutMainOeuvre().add(intervention.getCoutPieces());
        }
        intervention.setMontantTotal(total);

        intervention.setPiecesRemplacees(request.getPiecesRemplacees());
        intervention.setStatut(request.getStatut() != null ? request.getStatut() : StatutMaintenance.PROGRAMMEE);
        intervention.setImmobilisation(Boolean.TRUE.equals(request.getImmobilisation()));
        intervention.setDescription(request.getDescription());

        // RG02 : Immobilisation bascule automatiquement le statut du véhicule
        if (Boolean.TRUE.equals(request.getImmobilisation()) &&
                (intervention.getStatut() == StatutMaintenance.EN_COURS || intervention.getStatut() == StatutMaintenance.PROGRAMMEE)) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_MAINTENANCE);
            vehiculeRepository.save(vehicule);
            log.info("RG02 — Véhicule {} passé à EN_MAINTENANCE suite à planification lourde.", vehicule.getImmatriculation());
        } else if (intervention.getStatut() == StatutMaintenance.TERMINEE || intervention.getStatut() == StatutMaintenance.ANNULEE) {
            if (vehicule.getStatutAdministratif() == StatutAdministratif.EN_MAINTENANCE ||
                vehicule.getStatutAdministratif() == StatutAdministratif.EN_ENTRETIEN ||
                vehicule.getStatutAdministratif() == StatutAdministratif.IMMOBILISE) {
                vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
                vehiculeRepository.save(vehicule);
            }
        }

        InterventionMaintenance saved = maintenanceRepository.save(intervention);
        journalService.log("MAINTENANCE", request.getId() == null ? "CREATE" : "UPDATE", "InterventionMaintenance", saved.getId(), null,
                saved.getNatureOperation() + " sur " + vehicule.getImmatriculation(), null);

        return mapToDto(saved);
    }

    /**
     * Clôture formelle d'une intervention avec application de RG04 (Contrôle du kilométrage croissant) et RG05.
     */
    @Transactional
    public InterventionMaintenanceDto cloturerIntervention(Long id, ClotureInterventionRequest request) {
        InterventionMaintenance intervention = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée avec l'id : " + id));

        Vehicule vehicule = intervention.getVehicule();
        Long kmActuel = vehicule.getKilometrageActuel() != null ? vehicule.getKilometrageActuel() : 0L;
        Long kmRealise = request.getKilometrageRealise();

        // Contrôle strict du kilométrage croissant
        if (kmRealise == null) {
            throw new BadRequestException("Le kilométrage réel de clôture est obligatoire.");
        }
        if (kmRealise < kmActuel) {
            throw new BadRequestException(String.format(
                    "Le kilométrage de clôture (%d km) ne peut pas être inférieur au kilométrage actuel du véhicule (%d km).",
                    kmRealise, kmActuel));
        }

        intervention.setDateRealisation(request.getDateRealisation() != null ? request.getDateRealisation() : LocalDate.now());
        intervention.setKilometrageRealise(kmRealise);
        if (request.getCoutMainOeuvre() != null) intervention.setCoutMainOeuvre(request.getCoutMainOeuvre());
        if (request.getCoutPieces() != null) intervention.setCoutPieces(request.getCoutPieces());

        BigDecimal total = request.getMontantTotal();
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal mo = intervention.getCoutMainOeuvre() != null ? intervention.getCoutMainOeuvre() : BigDecimal.ZERO;
            BigDecimal pieces = intervention.getCoutPieces() != null ? intervention.getCoutPieces() : BigDecimal.ZERO;
            total = mo.add(pieces);
        }
        intervention.setMontantTotal(total);

        if (request.getPiecesRemplacees() != null) intervention.setPiecesRemplacees(request.getPiecesRemplacees());
        if (request.getPrestataire() != null) intervention.setPrestataire(request.getPrestataire());
        if (request.getGarageAgreeId() != null) {
            garageRepository.findById(request.getGarageAgreeId()).ifPresent(intervention::setGarageAgree);
        }
        if (request.getDescription() != null) intervention.setDescription(request.getDescription());
        intervention.setStatut(StatutMaintenance.TERMINEE);
        intervention.setImmobilisation(false);

        // Mise à jour atomique du compteur kilométrique et statut véhicule
        vehicule.setKilometrageActuel(kmRealise);
        // Calcul du prochain seuil d'entretien (+10 000 km par exemple)
        if (vehicule.getProchainSeuilEntretienKm() == null || vehicule.getProchainSeuilEntretienKm() <= kmRealise) {
            vehicule.setProchainSeuilEntretienKm(kmRealise + 10000L);
        }
        vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        vehiculeRepository.save(vehicule);

        // Enregistrement des pièces remplacées
        if (request.getPieces() != null && !request.getPieces().isEmpty()) {
            for (PieceRemplacementRequest prReq : request.getPieces()) {
                PieceRemplacement pr = new PieceRemplacement();
                pr.setReferencePiece(prReq.getReferencePiece());
                pr.setDesignation(prReq.getDesignation());
                pr.setCategorie(prReq.getCategorie());
                pr.setQuantite(prReq.getQuantite() != null ? prReq.getQuantite() : 1);
                pr.setPrixUnitaire(prReq.getPrixUnitaire() != null ? prReq.getPrixUnitaire() : BigDecimal.ZERO);
                pr.calculerMontantTotal();
                pr.setIntervention(intervention);
                if (intervention.getGarageAgree() != null) {
                    pr.setGarage(intervention.getGarageAgree());
                }
                pieceRepository.save(pr);
            }
        }

        // RG05 : Imputation budgétaire automatique sur la Direction du véhicule
        if (intervention.getMontantTotal() != null && intervention.getMontantTotal().compareTo(BigDecimal.ZERO) > 0) {
            NatureDepense nd = (intervention.getTypeMaintenance() == TypeMaintenance.CURATIVE)
                    ? NatureDepense.REPARATION : NatureDepense.ENTRETIEN;
            budgetService.imputerDepense(vehicule.getDirection(), nd, intervention.getMontantTotal(),
                    "Clôture maintenance " + vehicule.getImmatriculation() + " (" + intervention.getNatureOperation() + ")");
        }

        InterventionMaintenance saved = maintenanceRepository.save(intervention);
        journalService.log("MAINTENANCE", "CLOTURE", "InterventionMaintenance", saved.getId(), null,
                "Clôture intervention " + vehicule.getImmatriculation() + " (" + kmRealise + " km / " + saved.getMontantTotal() + " DH)", null);

        return mapToDto(saved);
    }

    @Transactional
    public void deleteIntervention(Long id) {
        maintenanceRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<AlerteEcheanceDto> getAlertesEcheances() {
        List<AlerteEcheanceDto> alertes = new ArrayList<>();
        LocalDate aujourdhui = LocalDate.now();

        List<Vehicule> vehicules = vehiculeRepository.findAll();
        for (Vehicule v : vehicules) {
            Long kmActuel = v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L;
            Long seuil = v.getProchainSeuilEntretienKm() != null ? v.getProchainSeuilEntretienKm() : 10000L;

            // RG01 : Alerte Maintenance Préventive à 90% du seuil (ex: 9000 km pour un seuil à 10000 km)
            if (seuil > 0 && kmActuel >= (seuil * 0.90)) {
                boolean depasse = kmActuel >= seuil;
                alertes.add(AlerteEcheanceDto.builder()
                        .id("MAINT-" + v.getId())
                        .vehiculeId(v.getId())
                        .immatriculation(v.getImmatriculation())
                        .marqueModele(v.getMarque() + " " + v.getModele())
                        .direction(v.getDirection())
                        .typeAlerte("MAINTENANCE_PREVENTIVE")
                        .titre(depasse ? "Seuil d'entretien Dépassé !" : "Alerte Entretien Préventif (90%)")
                        .message(String.format("Kilométrage actuel : %d km / Seuil fixé : %d km (Taux d'usure : %.1f%%)",
                                kmActuel, seuil, (double) kmActuel / seuil * 100))
                        .niveauSeverite(depasse ? "CRITIQUE" : "ATTENTION")
                        .kilometrageActuel(kmActuel)
                        .kilometrageSeuil(seuil)
                        .joursRestants(0)
                        .build());
            }

            // Alerte Assurance (moins de 30 jours ou expirée)
            if (v.getDateFinAssurance() != null) {
                long jours = ChronoUnit.DAYS.between(aujourdhui, v.getDateFinAssurance());
                if (jours <= 30) {
                    alertes.add(AlerteEcheanceDto.builder()
                            .id("ASSUR-" + v.getId())
                            .vehiculeId(v.getId())
                            .immatriculation(v.getImmatriculation())
                            .marqueModele(v.getMarque() + " " + v.getModele())
                            .direction(v.getDirection())
                            .typeAlerte("ASSURANCE")
                            .titre(jours < 0 ? "Contrat d'Assurance Expiré !" : "Expiration Assurance Prochaine")
                            .message("Assurance finissant le " + v.getDateFinAssurance())
                            .niveauSeverite(jours < 0 ? "CRITIQUE" : (jours <= 7 ? "ATTENTION" : "INFO"))
                            .dateEcheance(v.getDateFinAssurance())
                            .joursRestants((int) jours)
                            .build());
                }
            }

            // Alerte Visite Technique (moins de 30 jours ou expirée)
            if (v.getDateVisiteTechnique() != null) {
                long jours = ChronoUnit.DAYS.between(aujourdhui, v.getDateVisiteTechnique());
                if (jours <= 30) {
                    alertes.add(AlerteEcheanceDto.builder()
                            .id("VT-" + v.getId())
                            .vehiculeId(v.getId())
                            .immatriculation(v.getImmatriculation())
                            .marqueModele(v.getMarque() + " " + v.getModele())
                            .direction(v.getDirection())
                            .typeAlerte("CONTROLE_TECHNIQUE")
                            .titre(jours < 0 ? "Visite Technique Échue !" : "Visite Technique Imminente")
                            .message("Visite technique à réaliser avant le " + v.getDateVisiteTechnique())
                            .niveauSeverite(jours < 0 ? "CRITIQUE" : (jours <= 7 ? "ATTENTION" : "INFO"))
                            .dateEcheance(v.getDateVisiteTechnique())
                            .joursRestants((int) jours)
                            .build());
                }
            }

            // Alerte Vignette
            if (v.getDateVignette() != null) {
                long jours = ChronoUnit.DAYS.between(aujourdhui, v.getDateVignette());
                if (jours <= 30) {
                    alertes.add(AlerteEcheanceDto.builder()
                            .id("VIGN-" + v.getId())
                            .vehiculeId(v.getId())
                            .immatriculation(v.getImmatriculation())
                            .marqueModele(v.getMarque() + " " + v.getModele())
                            .direction(v.getDirection())
                            .typeAlerte("VIGNETTE")
                            .titre(jours < 0 ? "Vignette Automobile Expirée !" : "Renouvellement Vignette")
                            .message("Échéance de la vignette : " + v.getDateVignette())
                            .niveauSeverite(jours < 0 ? "CRITIQUE" : "ATTENTION")
                            .dateEcheance(v.getDateVignette())
                            .joursRestants((int) jours)
                            .build());
                }
            }
        }

        // Alertes Cartes Carburant Expirées
        List<CarteCarburant> cartes = carteCarburantRepository.findAll();
        for (CarteCarburant c : cartes) {
            if (c.getDateExpiration() != null) {
                long jours = ChronoUnit.DAYS.between(aujourdhui, c.getDateExpiration());
                if (jours <= 30) {
                    alertes.add(AlerteEcheanceDto.builder()
                            .id("CARTE-" + c.getId())
                            .vehiculeId(c.getVehicule() != null ? c.getVehicule().getId() : null)
                            .immatriculation(c.getVehicule() != null ? c.getVehicule().getImmatriculation() : "N/A")
                            .marqueModele(c.getNumeroCarte() + " (" + c.getFournisseur() + ")")
                            .typeAlerte("CARTE_CARBURANT")
                            .titre(jours < 0 ? "Carte Carburant Expirée !" : "Expiration Carte Carburant")
                            .message("Carte n° " + c.getNumeroCarte() + " expire le " + c.getDateExpiration())
                            .niveauSeverite(jours < 0 ? "CRITIQUE" : "INFO")
                            .dateEcheance(c.getDateExpiration())
                            .joursRestants((int) jours)
                            .build());
                }
            }
        }

        return alertes;
    }

    private InterventionMaintenanceDto mapToDto(InterventionMaintenance i) {
        Vehicule v = i.getVehicule();
        GarageAgree g = i.getGarageAgree();

        List<PieceRemplacementDto> piecesDto = pieceRepository.findByInterventionId(i.getId()).stream()
                .map(pr -> PieceRemplacementDto.builder()
                        .id(pr.getId())
                        .referencePiece(pr.getReferencePiece())
                        .designation(pr.getDesignation())
                        .categorie(pr.getCategorie())
                        .quantite(pr.getQuantite())
                        .prixUnitaire(pr.getPrixUnitaire())
                        .montantTotal(pr.getMontantTotal())
                        .interventionId(i.getId())
                        .garageId(pr.getGarage() != null ? pr.getGarage().getId() : null)
                        .garageNom(pr.getGarage() != null ? pr.getGarage().getNomGarage() : null)
                        .build())
                .collect(Collectors.toList());

        return InterventionMaintenanceDto.builder()
                .id(i.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .kilometrageActuelVehicule(v != null ? v.getKilometrageActuel() : null)
                .prochainSeuilEntretienKm(v != null ? v.getProchainSeuilEntretienKm() : null)
                .garageAgreeId(g != null ? g.getId() : null)
                .garageNom(g != null ? g.getNomGarage() : i.getPrestataire())
                .typeMaintenance(i.getTypeMaintenance())
                .natureOperation(i.getNatureOperation())
                .datePrevisionnelle(i.getDatePrevisionnelle())
                .dateRealisation(i.getDateRealisation())
                .kilometragePrevu(i.getKilometragePrevu())
                .kilometrageRealise(i.getKilometrageRealise())
                .prestataire(i.getPrestataire())
                .coutMainOeuvre(i.getCoutMainOeuvre())
                .coutPieces(i.getCoutPieces())
                .montantTotal(i.getMontantTotal())
                .piecesRemplacees(i.getPiecesRemplacees())
                .statut(i.getStatut())
                .immobilisation(i.getImmobilisation())
                .description(i.getDescription())
                .pieces(piecesDto)
                .build();
    }
}

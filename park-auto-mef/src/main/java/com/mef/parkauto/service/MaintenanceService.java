package com.mef.parkauto.service;

import com.mef.parkauto.dto.AlerteEcheanceDto;
import com.mef.parkauto.dto.InterventionMaintenanceDto;
import com.mef.parkauto.dto.InterventionMaintenanceRequest;
import com.mef.parkauto.entity.CarteCarburant;
import com.mef.parkauto.entity.InterventionMaintenance;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.StatutMaintenance;

import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.CarteCarburantRepository;
import com.mef.parkauto.repository.InterventionMaintenanceRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
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
public class MaintenanceService {

    private final InterventionMaintenanceRepository maintenanceRepository;
    private final VehiculeRepository vehiculeRepository;
    private final CarteCarburantRepository carteCarburantRepository;

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

    @Transactional
    public InterventionMaintenanceDto enregistrerIntervention(InterventionMaintenanceRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé avec l'id : " + request.getVehiculeId()));

        InterventionMaintenance intervention = new InterventionMaintenance();
        if (request.getId() != null) {
            intervention = maintenanceRepository.findById(request.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée avec l'id : " + request.getId()));
        }
        intervention.setVehicule(vehicule);
        intervention.setTypeMaintenance(request.getTypeMaintenance());
        intervention.setNatureOperation(request.getNatureOperation());
        intervention.setDatePrevisionnelle(request.getDatePrevisionnelle() != null ? request.getDatePrevisionnelle() : LocalDate.now());
        intervention.setDateRealisation(request.getDateRealisation());
        intervention.setKilometragePrevu(request.getKilometragePrevu() != null ? request.getKilometragePrevu() : vehicule.getKilometrageActuel());
        intervention.setKilometrageRealise(request.getKilometrageRealise());
        intervention.setPrestataire(request.getPrestataire() != null ? request.getPrestataire() : "Garage Agréé MEF");
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

        // Règle métier : Immobilisation bascule automatiquement le statut du véhicule
        if (Boolean.TRUE.equals(request.getImmobilisation()) &&
                (intervention.getStatut() == StatutMaintenance.EN_COURS || intervention.getStatut() == StatutMaintenance.PROGRAMMEE)) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_MAINTENANCE);
            vehiculeRepository.save(vehicule);
        } else if (intervention.getStatut() == StatutMaintenance.TERMINEE || intervention.getStatut() == StatutMaintenance.ANNULEE) {
            if (vehicule.getStatutAdministratif() == StatutAdministratif.EN_MAINTENANCE ||
                vehicule.getStatutAdministratif() == StatutAdministratif.EN_ENTRETIEN ||
                vehicule.getStatutAdministratif() == StatutAdministratif.IMMOBILISE) {
                vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
                vehiculeRepository.save(vehicule);
            }
        }

        InterventionMaintenance saved = maintenanceRepository.save(intervention);
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

            // Alerte Maintenance Préventive à 90% du seuil (ex: 9000 km)
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
                        .message("Kilométrage actuel : " + kmActuel + " km / Seuil : " + seuil + " km")
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
        return InterventionMaintenanceDto.builder()
                .id(i.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
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
                .build();
    }
}

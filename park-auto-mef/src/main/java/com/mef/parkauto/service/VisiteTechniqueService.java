package com.mef.parkauto.service;

import com.mef.parkauto.dto.VisiteTechniqueDto;
import com.mef.parkauto.dto.VisiteTechniqueRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisiteTechniqueService {

    private final VisiteTechniqueRepository vtRepository;
    private final VehiculeRepository vehiculeRepository;
    private final InterventionMaintenanceRepository maintenanceRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<VisiteTechniqueDto> getAll() {
        return vtRepository.findAllByOrderByDateVisiteDesc()
                .stream().map(vt -> mapToDto(vt, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisiteTechniqueDto> getByVehicule(Long vehiculeId) {
        return vtRepository.findByVehiculeIdOrderByDateVisiteDesc(vehiculeId)
                .stream().map(vt -> mapToDto(vt, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisiteTechniqueDto getById(Long id) {
        return vtRepository.findById(id)
                .map(vt -> mapToDto(vt, null))
                .orElseThrow(() -> new ResourceNotFoundException("Visite technique non trouvée : " + id));
    }

    @Transactional
    public VisiteTechniqueDto creerOuModifier(VisiteTechniqueRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getDateVisite() == null) throw new BadRequestException("La date de visite est obligatoire.");
        if (request.getResultat() == null) throw new BadRequestException("Le résultat de la visite est obligatoire.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        VisiteTechnique vt = request.getId() != null
                ? vtRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée : " + request.getId()))
                : new VisiteTechnique();

        vt.setVehicule(vehicule);
        vt.setDateVisite(request.getDateVisite());
        vt.setCentre(request.getCentre());
        vt.setResultat(request.getResultat());
        vt.setDateProchaine(request.getDateProchaine());
        vt.setPvVisite(request.getPvVisite());
        vt.setObservations(request.getObservations());

        // Sync dateVisiteTechnique on vehicule
        if (request.getDateProchaine() != null) {
            vehicule.setDateVisiteTechnique(request.getDateProchaine());
            vehiculeRepository.save(vehicule);
        }

        VisiteTechnique saved = vtRepository.save(vt);
        Long interventionId = null;

        // RG03 : CONTRE_VISITE_OBLIGATOIRE → créer intervention maintenance à J+15
        if (request.getId() == null && ResultatVisite.CONTRE_VISITE_OBLIGATOIRE.equals(request.getResultat())) {
            InterventionMaintenance intervention = new InterventionMaintenance();
            intervention.setVehicule(vehicule);
            intervention.setTypeMaintenance(TypeMaintenance.CURATIVE);
            intervention.setNatureOperation(NatureMaintenance.CONTROLE_TECHNIQUE);
            intervention.setDatePrevisionnelle(LocalDate.now().plusDays(15));
            intervention.setKilometragePrevu(vehicule.getKilometrageActuel());
            intervention.setPrestataire("Centre de Visite Technique");
            intervention.setStatut(StatutMaintenance.PROGRAMMEE);
            intervention.setDescription("Contre-visite obligatoire suite à la visite technique du " + request.getDateVisite() +
                    " — Centre : " + request.getCentre());
            intervention.setImmobilisation(false);
            intervention.setCoutMainOeuvre(java.math.BigDecimal.ZERO);
            intervention.setCoutPieces(java.math.BigDecimal.ZERO);
            intervention.setMontantTotal(java.math.BigDecimal.ZERO);
            InterventionMaintenance savedIntervention = maintenanceRepository.save(intervention);
            interventionId = savedIntervention.getId();
            log.info("RG03 - Intervention maintenance créée (id={}) à J+15 suite contre-visite VT pour véhicule {}",
                    interventionId, vehicule.getImmatriculation());
        }

        journalService.log("VISITE_TECHNIQUE", request.getId() == null ? "CREATE" : "UPDATE", "VisiteTechnique", saved.getId(), null,
                saved.getResultat() + " / " + saved.getDateVisite(), null);
        return mapToDto(saved, interventionId);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!vtRepository.existsById(id)) throw new ResourceNotFoundException("Visite technique non trouvée : " + id);
        vtRepository.deleteById(id);
        journalService.log("VISITE_TECHNIQUE", "DELETE", "VisiteTechnique", id, null, null, null);
    }

    private VisiteTechniqueDto mapToDto(VisiteTechnique vt, Long interventionCreeeId) {
        Vehicule v = vt.getVehicule();
        return VisiteTechniqueDto.builder()
                .id(vt.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .dateVisite(vt.getDateVisite())
                .centre(vt.getCentre())
                .resultat(vt.getResultat())
                .dateProchaine(vt.getDateProchaine())
                .pvVisite(vt.getPvVisite())
                .observations(vt.getObservations())
                .interventionCreeeId(interventionCreeeId)
                .dateCreation(vt.getDateCreation())
                .build();
    }
}

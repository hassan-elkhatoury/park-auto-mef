package com.mef.parkauto.service;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReformeVehiculeService {

    private final ReformeVehiculeRepository reformeRepository;
    private final VehiculeRepository vehiculeRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<ReformeVehiculeDto> getAll() {
        return reformeRepository.findAllByOrderByDateCreationDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReformeVehiculeDto getById(Long id) {
        return reformeRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
    }

    @Transactional
    public ReformeVehiculeDto creerOuModifier(ReformeVehiculeRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getMotifReforme() == null || request.getMotifReforme().isBlank()) throw new BadRequestException("Le motif de réforme est obligatoire.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        ReformeVehicule reforme = request.getId() != null
                ? reformeRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + request.getId()))
                : new ReformeVehicule();

        reforme.setVehicule(vehicule);
        reforme.setMotifReforme(request.getMotifReforme());
        reforme.setDateDecision(request.getDateDecision());
        reforme.setPvCommission(request.getPvCommission());
        reforme.setStatut(request.getStatut() != null ? request.getStatut() : StatutReforme.INITIE);
        reforme.setPrixCession(request.getPrixCession());

        if (reforme.getStatut() == StatutReforme.EN_COURS_DE_REFORME || reforme.getStatut() == StatutReforme.INITIE) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_COURS_DE_REFORME);
            vehiculeRepository.save(vehicule);
        }

        boolean creation = request.getId() == null;
        ReformeVehicule saved = reformeRepository.save(reforme);
        journalService.log("REFORME", creation ? "CREATE" : "UPDATE", "ReformeVehicule", saved.getId(), null,
                saved.getStatut() + " / " + saved.getMotifReforme(), null);
        return mapToDto(saved);
    }

    /**
     * RG04 : Valide la réforme — le PV de commission est OBLIGATOIRE
     */
    @Transactional
    public ReformeVehiculeDto valider(Long id) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));

        // RG04 — Vérification PV obligatoire
        if (reforme.getPvCommission() == null || reforme.getPvCommission().isBlank()) {
            throw new IllegalStateException(
                "Le PV de Commission de Réforme est obligatoire avant la validation finale. " +
                "Veuillez uploader le document via l'API GED."
            );
        }

        reforme.setStatut(StatutReforme.REFORME);
        Vehicule vehicule = reforme.getVehicule();
        vehicule.setStatutAdministratif(StatutAdministratif.REFORME);
        vehiculeRepository.save(vehicule);
        log.info("RG04 - Réforme {} validée pour le véhicule {}", id, vehicule.getImmatriculation());

        ReformeVehicule saved = reformeRepository.save(reforme);
        journalService.log("REFORME", "VALIDATE", "ReformeVehicule", saved.getId(), null, saved.getStatut().name(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
        if (reforme.getStatut() == StatutReforme.VALIDE || reforme.getStatut() == StatutReforme.REFORME || reforme.getStatut() == StatutReforme.VENDU) {
            throw new IllegalStateException("Une réforme validée ou clôturée ne peut pas être supprimée.");
        }
        Vehicule vehicule = reforme.getVehicule();
        reformeRepository.delete(reforme);
        journalService.log("REFORME", "DELETE", "ReformeVehicule", id, null, null, null);
        if (vehicule != null) {
            vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
            vehiculeRepository.save(vehicule);
        }
    }

    private ReformeVehiculeDto mapToDto(ReformeVehicule r) {
        Vehicule v = r.getVehicule();
        return ReformeVehiculeDto.builder()
                .id(r.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .motifReforme(r.getMotifReforme())
                .dateDecision(r.getDateDecision())
                .pvCommission(r.getPvCommission())
                .statut(r.getStatut())
                .prixCession(r.getPrixCession())
                .dateCreation(r.getDateCreation())
                .build();
    }
}

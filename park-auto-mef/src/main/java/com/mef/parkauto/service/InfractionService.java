package com.mef.parkauto.service;

import com.mef.parkauto.dto.InfractionDto;
import com.mef.parkauto.dto.InfractionRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InfractionService {

    private final InfractionRepository infractionRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<InfractionDto> getAll() {
        return infractionRepository.findAllByOrderByDateInfractionDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InfractionDto getById(Long id) {
        return infractionRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Infraction non trouvée : " + id));
    }

    @Transactional
    public InfractionDto creerOuModifier(InfractionRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getDateInfraction() == null) throw new BadRequestException("La date de l'infraction est obligatoire.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Infraction infraction = request.getId() != null
                ? infractionRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Infraction non trouvée : " + request.getId()))
                : new Infraction();

        infraction.setVehicule(vehicule);
        if (request.getConducteurId() != null) {
            conducteurRepository.findById(request.getConducteurId()).ifPresent(infraction::setConducteur);
        }
        infraction.setDateInfraction(request.getDateInfraction());
        infraction.setLieuInfraction(request.getLieuInfraction());
        infraction.setTypeInfraction(request.getTypeInfraction());
        infraction.setMontantAmende(request.getMontantAmende());
        infraction.setStatut(request.getStatut() != null ? request.getStatut() : StatutInfraction.EN_ATTENTE);
        infraction.setReferenceContravention(request.getReferenceContravention());
        infraction.setObservations(request.getObservations());

        boolean creation = request.getId() == null;
        Infraction saved = infractionRepository.save(infraction);
        journalService.log("INFRACTION", creation ? "CREATE" : "UPDATE", "Infraction", saved.getId(), null,
                saved.getReferenceContravention(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!infractionRepository.existsById(id)) throw new ResourceNotFoundException("Infraction non trouvée : " + id);
        infractionRepository.deleteById(id);
        journalService.log("INFRACTION", "DELETE", "Infraction", id, null, null, null);
    }

    private InfractionDto mapToDto(Infraction i) {
        Vehicule v = i.getVehicule();
        Conducteur c = i.getConducteur();
        return InfractionDto.builder()
                .id(i.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNom(c != null ? c.getNom() + " " + c.getPrenom() : null)
                .dateInfraction(i.getDateInfraction())
                .lieuInfraction(i.getLieuInfraction())
                .typeInfraction(i.getTypeInfraction())
                .montantAmende(i.getMontantAmende())
                .statut(i.getStatut())
                .referenceContravention(i.getReferenceContravention())
                .observations(i.getObservations())
                .dateCreation(i.getDateCreation())
                .build();
    }
}

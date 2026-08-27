package com.mef.parkauto.service;

import com.mef.parkauto.dto.AssuranceDto;
import com.mef.parkauto.dto.AssuranceRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssuranceService {

    private final AssuranceRepository assuranceRepository;
    private final VehiculeRepository vehiculeRepository;
    private final EmailService emailService;
    private final UtilisateurRepository utilisateurRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<AssuranceDto> getAllAssurances() {
        return assuranceRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssuranceDto getById(Long id) {
        return assuranceRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Assurance non trouvée : " + id));
    }

    @Transactional(readOnly = true)
    public List<AssuranceDto> getByVehicule(Long vehiculeId) {
        return assuranceRepository.findByVehiculeIdOrderByDateFinDesc(vehiculeId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssuranceDto> getAssurancesExpirantBientot() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        return assuranceRepository.findExpirantEntre(today, limit)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public AssuranceDto creerOuModifier(AssuranceRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getNumeroPolice() == null || request.getNumeroPolice().isBlank()) throw new BadRequestException("Le numéro de police est obligatoire.");
        if (request.getDateDebut() == null || request.getDateFin() == null) throw new BadRequestException("Les dates de début et de fin sont obligatoires.");
        if (request.getDateFin().isBefore(request.getDateDebut())) throw new BadRequestException("La date de fin doit être postérieure à la date de début.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Assurance assurance = request.getId() != null
                ? assuranceRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assurance non trouvée : " + request.getId()))
                : new Assurance();

        assurance.setVehicule(vehicule);
        assurance.setNumeroPolice(request.getNumeroPolice());
        assurance.setCompagnie(request.getCompagnie());
        assurance.setTypeGarantie(request.getTypeGarantie());
        assurance.setDateDebut(request.getDateDebut());
        assurance.setDateFin(request.getDateFin());
        assurance.setMontantPrime(request.getMontantPrime());
        assurance.setFranchise(request.getFranchise());
        assurance.setStatut(request.getStatut() != null ? request.getStatut() : StatutAssurance.ACTIVE);
        assurance.setDocuments(request.getDocuments());
        assurance.setObservations(request.getObservations());

        // Sync dateFinAssurance on vehicule
        if (assurance.getStatut() == StatutAssurance.ACTIVE) {
            vehicule.setDateFinAssurance(request.getDateFin());
            vehiculeRepository.save(vehicule);
        }

        boolean creation = request.getId() == null;
        Assurance saved = assuranceRepository.save(assurance);
        journalService.log("ASSURANCE", creation ? "CREATE" : "UPDATE", "Assurance", saved.getId(), null,
                saved.getNumeroPolice(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!assuranceRepository.existsById(id)) throw new ResourceNotFoundException("Assurance non trouvée : " + id);
        assuranceRepository.deleteById(id);
        journalService.log("ASSURANCE", "DELETE", "Assurance", id, null, null, null);
    }

    /**
     * RG02 : Vérifie si un véhicule a une assurance valide. Lance exception si non.
     */
    public void verifierAssuranceValide(Long vehiculeId) {
        List<Assurance> actives = assuranceRepository.findAssurancesActivesParVehicule(vehiculeId, LocalDate.now());
        if (actives.isEmpty()) {
            throw new IllegalStateException(
                "Ce véhicule n'a pas d'assurance valide. L'affectation est bloquée jusqu'à la souscription d'un contrat actif."
            );
        }
    }

    private AssuranceDto mapToDto(Assurance a) {
        Vehicule v = a.getVehicule();
        long joursRestants = a.getDateFin() != null ? ChronoUnit.DAYS.between(LocalDate.now(), a.getDateFin()) : 0;
        return AssuranceDto.builder()
                .id(a.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .numeroPolice(a.getNumeroPolice())
                .compagnie(a.getCompagnie())
                .typeGarantie(a.getTypeGarantie())
                .dateDebut(a.getDateDebut())
                .dateFin(a.getDateFin())
                .montantPrime(a.getMontantPrime())
                .franchise(a.getFranchise())
                .statut(a.getStatut())
                .documents(a.getDocuments())
                .observations(a.getObservations())
                .joursRestants(joursRestants)
                .dateCreation(a.getDateCreation())
                .build();
    }
}

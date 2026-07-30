package com.mef.parkauto.service.impl;

import com.mef.parkauto.dto.vehicule.HistoriqueStatutResponse;
import com.mef.parkauto.dto.vehicule.StatutChangeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeResponse;
import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.HistoriqueStatutVehicule;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.DuplicateResourceException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.mapper.HistoriqueStatutMapper;
import com.mef.parkauto.mapper.VehiculeMapper;
import com.mef.parkauto.repository.HistoriqueStatutRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import com.mef.parkauto.service.JournalService;
import com.mef.parkauto.service.VehiculeService;
import com.mef.parkauto.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class VehiculeServiceImpl implements VehiculeService {

    private final VehiculeRepository vehiculeRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final VehiculeMapper vehiculeMapper;
    private final HistoriqueStatutMapper historiqueStatutMapper;
    private final JournalService journalService;
    private final HttpServletRequest httpServletRequest;

    @Override
    @Transactional(readOnly = true)
    public Page<VehiculeResponse> findAll(String search, String direction, StatutAdministratif statut, Pageable pageable) {
        log.info("Recherche de véhicules avec critères - search: {}, direction: {}, statut: {}", search, direction, statut);
        String formattedSearch = (search != null && !search.trim().isEmpty()) ? "%" + search.trim().toLowerCase() + "%" : null;
        String formattedDirection = (direction != null && !direction.trim().isEmpty()) ? direction.trim() : null;
        return vehiculeRepository.searchVehicules(formattedSearch, formattedDirection, statut, pageable)
                .map(vehiculeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public VehiculeResponse findById(Long id) {
        log.info("Consultation du véhicule ID: {}", id);
        return vehiculeRepository.findById(id)
                .map(vehiculeMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'ID: " + id));
    }

    @Override
    public VehiculeResponse create(VehiculeRequest request) {
        log.info("Création d'un nouveau véhicule immatriculation: {}", request.immatriculation());

        // Validations d'unicité
        if (vehiculeRepository.existsByImmatriculation(request.immatriculation())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec l'immatriculation: " + request.immatriculation());
        }
        if (vehiculeRepository.existsByNumeroChassis(request.numeroChassis())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec le numéro de châssis: " + request.numeroChassis());
        }
        if (vehiculeRepository.existsByNumeroInventaire(request.numeroInventaire())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec le numéro d'inventaire: " + request.numeroInventaire());
        }

        // Validation kilométrage
        if (request.kilometrageActuel() < request.kilometrageInitial()) {
            throw new BadRequestException("Le kilométrage actuel ne peut pas être inférieur au kilométrage initial");
        }

        Vehicule vehicule = vehiculeMapper.toEntity(request);

        // Statuts par défaut si non fournis
        if (vehicule.getStatutAdministratif() == null) {
            vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        }
        if (vehicule.getEtatTechnique() == null) {
            vehicule.setEtatTechnique(EtatTechnique.NEUF);
        }

        Vehicule savedVehicule = vehiculeRepository.save(vehicule);

        // Enregistrer la première ligne d'historique de statut
        recordStatusHistory(savedVehicule, null, savedVehicule.getStatutAdministratif(), null, savedVehicule.getEtatTechnique(), "Initialisation lors de la création", null);

        // Log d'audit (DB uniquement)
        journalService.log(
                AppConstants.MODULE_VEHICULE,
                AppConstants.ACTION_CREATE,
                "Vehicule",
                savedVehicule.getId(),
                null,
                "Véhicule créé avec immatriculation: " + savedVehicule.getImmatriculation(),
                httpServletRequest.getRemoteAddr()
        );

        return vehiculeMapper.toResponse(savedVehicule);
    }

    @Override
    public VehiculeResponse update(Long id, VehiculeRequest request) {
        log.info("Mise à jour du véhicule ID: {}", id);

        Vehicule vehicule = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'ID: " + id));

        // Validations d'unicité si modifiés
        if (!vehicule.getImmatriculation().equalsIgnoreCase(request.immatriculation()) &&
                vehiculeRepository.existsByImmatriculation(request.immatriculation())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec l'immatriculation: " + request.immatriculation());
        }

        if (!vehicule.getNumeroChassis().equalsIgnoreCase(request.numeroChassis()) &&
                vehiculeRepository.existsByNumeroChassis(request.numeroChassis())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec le numéro de châssis: " + request.numeroChassis());
        }

        if (!vehicule.getNumeroInventaire().equalsIgnoreCase(request.numeroInventaire()) &&
                vehiculeRepository.existsByNumeroInventaire(request.numeroInventaire())) {
            throw new DuplicateResourceException("Un véhicule existe déjà avec le numéro d'inventaire: " + request.numeroInventaire());
        }

        // Règle de gestion : Le kilométrage saisi ne peut pas être inférieur au dernier kilométrage enregistré
        if (request.kilometrageActuel() < vehicule.getKilometrageActuel()) {
            throw new BadRequestException(String.format(
                    "Le nouveau kilométrage (%d km) ne peut pas être inférieur au dernier kilométrage enregistré (%d km)",
                    request.kilometrageActuel(), vehicule.getKilometrageActuel()
            ));
        }

        String oldState = String.format("Immat: %s, Châssis: %s, Km: %d, Statut: %s",
                vehicule.getImmatriculation(), vehicule.getNumeroChassis(), vehicule.getKilometrageActuel(), vehicule.getStatutAdministratif());

        // Mise à jour partielle via Mapper
        vehiculeMapper.updateEntityFromRequest(request, vehicule);

        Vehicule updatedVehicule = vehiculeRepository.save(vehicule);

        String newState = String.format("Immat: %s, Châssis: %s, Km: %d, Statut: %s",
                updatedVehicule.getImmatriculation(), updatedVehicule.getNumeroChassis(), updatedVehicule.getKilometrageActuel(), updatedVehicule.getStatutAdministratif());

        // Audit log
        journalService.log(
                AppConstants.MODULE_VEHICULE,
                AppConstants.ACTION_UPDATE,
                "Vehicule",
                updatedVehicule.getId(),
                oldState,
                newState,
                httpServletRequest.getRemoteAddr()
        );

        return vehiculeMapper.toResponse(updatedVehicule);
    }

    @Override
    public void archive(Long id) {
        log.info("Archivage du véhicule ID: {}", id);

        Vehicule vehicule = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'ID: " + id));

        if (vehicule.getStatutAdministratif() == StatutAdministratif.ARCHIVE) {
            log.info("Le véhicule ID: {} est déjà archivé", id);
            return;
        }

        StatutAdministratif oldStatut = vehicule.getStatutAdministratif();
        vehicule.setStatutAdministratif(StatutAdministratif.ARCHIVE);
        vehiculeRepository.save(vehicule);

        recordStatusHistory(vehicule, oldStatut, StatutAdministratif.ARCHIVE, vehicule.getEtatTechnique(), vehicule.getEtatTechnique(), "Archivage du véhicule (Soft delete)", null);

        journalService.log(
                AppConstants.MODULE_VEHICULE,
                AppConstants.ACTION_DELETE,
                "Vehicule",
                id,
                "Statut: " + oldStatut,
                "Statut: ARCHIVE",
                httpServletRequest.getRemoteAddr()
        );
    }

    @Override
    public VehiculeResponse changeStatus(Long id, StatutChangeRequest request) {
        log.info("Changement de statut pour le véhicule ID: {}", id);

        Vehicule vehicule = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'ID: " + id));

        StatutAdministratif oldAdminStatus = vehicule.getStatutAdministratif();
        EtatTechnique oldTechState = vehicule.getEtatTechnique();

        vehicule.setStatutAdministratif(request.nouveauStatutAdministratif());
        vehicule.setEtatTechnique(request.nouveauEtatTechnique());

        Vehicule updatedVehicule = vehiculeRepository.save(vehicule);

        recordStatusHistory(updatedVehicule, oldAdminStatus, request.nouveauStatutAdministratif(), oldTechState, request.nouveauEtatTechnique(), request.motif(), request.pieceJustificative());

        journalService.log(
                AppConstants.MODULE_VEHICULE,
                AppConstants.ACTION_CHANGE_STATUS,
                "Vehicule",
                id,
                String.format("Admin: %s, Tech: %s", oldAdminStatus, oldTechState),
                String.format("Admin: %s, Tech: %s", request.nouveauStatutAdministratif(), request.nouveauEtatTechnique()),
                httpServletRequest.getRemoteAddr()
        );

        return vehiculeMapper.toResponse(updatedVehicule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistoriqueStatutResponse> getHistory(Long vehiculeId) {
        log.info("Consultation de l'historique de statut pour le véhicule ID: {}", vehiculeId);

        if (!vehiculeRepository.existsById(vehiculeId)) {
            throw new ResourceNotFoundException("Véhicule introuvable avec l'ID: " + vehiculeId);
        }

        return historiqueStatutRepository.findByVehiculeIdOrderByDateChangementDesc(vehiculeId)
                .stream()
                .map(historiqueStatutMapper::toResponse)
                .toList();
    }

    private void recordStatusHistory(
            Vehicule vehicule,
            StatutAdministratif ancienStatut,
            StatutAdministratif nouveauStatut,
            EtatTechnique ancienEtat,
            EtatTechnique nouveauEtat,
            String motif,
            String pieceJustificative
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication() != null ?
                SecurityContextHolder.getContext().getAuthentication().getName() : "SYSTEM";

        HistoriqueStatutVehicule historique = new HistoriqueStatutVehicule();
        historique.setVehicule(vehicule);
        historique.setAncienStatutAdministratif(ancienStatut);
        historique.setNouveauStatutAdministratif(nouveauStatut);
        historique.setAncienEtatTechnique(ancienEtat);
        historique.setNouveauEtatTechnique(nouveauEtat);
        historique.setDateChangement(LocalDateTime.now());
        historique.setMotif(motif);
        historique.setUtilisateur(username);
        historique.setPieceJustificative(pieceJustificative);

        historiqueStatutRepository.save(historique);
    }
}

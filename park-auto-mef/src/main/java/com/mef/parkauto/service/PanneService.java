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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PanneService {

    private final PanneRepository panneRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final GarageAgreeRepository garageRepository;
    private final PieceRemplacementRepository pieceRepository;
    private final BudgetService budgetService;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<PanneDto> getAllPannes() {
        return panneRepository.findAllByOrderByDateDeclarationDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PanneDto> getPannesByVehicule(Long vehiculeId) {
        return panneRepository.findByVehiculeIdOrderByDateDeclarationDesc(vehiculeId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PanneDto getPanneById(Long id) {
        return panneRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec l'id : " + id));
    }

    /**
     * Déclaration d'une panne curative avec application de RG02 (Immobilisation automatique).
     */
    @Transactional
    public PanneDto declarerPanne(PanneRequest request) {
        if (request.getVehiculeId() == null) {
            throw new BadRequestException("Le véhicule est obligatoire pour déclarer une panne.");
        }
        if (request.getNaturePanne() == null || request.getNaturePanne().isBlank()) {
            throw new BadRequestException("La nature de la panne est obligatoire.");
        }

        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        PanneVehicule panne = (request.getId() != null)
                ? panneRepository.findById(request.getId()).orElse(new PanneVehicule())
                : new PanneVehicule();

        panne.setVehicule(vehicule);

        if (request.getConducteurId() != null) {
            conducteurRepository.findById(request.getConducteurId()).ifPresent(panne::setConducteur);
        }
        if (request.getGarageAgreeId() != null) {
            garageRepository.findById(request.getGarageAgreeId()).ifPresent(panne::setGarageAgree);
        }

        panne.setDateDeclaration(request.getDateDeclaration() != null ? request.getDateDeclaration() : LocalDateTime.now());
        panne.setLieuPanne(request.getLieuPanne());
        panne.setKilometragePanne(request.getKilometragePanne() != null ? request.getKilometragePanne() : vehicule.getKilometrageActuel());
        panne.setNaturePanne(request.getNaturePanne());
        panne.setDescriptionSymptomes(request.getDescriptionSymptomes());
        panne.setDegreUrgence(request.getDegreUrgence() != null ? request.getDegreUrgence() : UrgencePanne.MOYENNE);
        panne.setImmobilisante(request.getImmobilisante() != null ? request.getImmobilisante() : true);
        panne.setRemorquageRequis(Boolean.TRUE.equals(request.getRemorquageRequis()));
        panne.setSocieteRemorquage(request.getSocieteRemorquage());
        panne.setDiagnosticAtelier(request.getDiagnosticAtelier());
        panne.setDureeImmobilisationJours(request.getDureeImmobilisationJours());
        panne.setCoutEstimeDevis(request.getCoutEstimeDevis() != null ? request.getCoutEstimeDevis() : BigDecimal.ZERO);
        panne.setStatut(request.getStatut() != null ? request.getStatut() : StatutPanne.DECLAREE);
        panne.setObservations(request.getObservations());

        // RG02 : Immobilisation automatique
        if (Boolean.TRUE.equals(panne.getImmobilisante()) &&
                (panne.getStatut() == StatutPanne.DECLAREE || panne.getStatut() == StatutPanne.EN_DIAGNOSTIC || panne.getStatut() == StatutPanne.EN_REPARATION)) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_REPARATION);
            vehiculeRepository.save(vehicule);
            log.info("RG02 — Véhicule {} immobilisé au statut EN_REPARATION suite à panne.", vehicule.getImmatriculation());
        }

        PanneVehicule saved = panneRepository.save(panne);
        journalService.log("PANNE", request.getId() == null ? "DECLARE" : "UPDATE", "PanneVehicule", saved.getId(), null,
                "Panne " + saved.getNaturePanne() + " sur " + vehicule.getImmatriculation(), null);

        return mapToDto(saved);
    }

    /**
     * Clôture d'une réparation avec application stricte de RG04 (Kilométrage croissant) et RG05 (Impact budgétaire).
     */
    @Transactional
    public PanneDto cloturerReparation(Long id, CloturePanneRequest request) {
        PanneVehicule panne = panneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panne non trouvée avec l'id : " + id));

        Vehicule vehicule = panne.getVehicule();
        Long kmActuel = vehicule.getKilometrageActuel() != null ? vehicule.getKilometrageActuel() : 0L;
        Long kmReel = request.getKilometrageReel();

        // Contrôle strict du kilométrage croissant
        if (kmReel == null) {
            throw new BadRequestException("Le kilométrage réel de clôture est obligatoire.");
        }
        if (kmReel < kmActuel) {
            throw new BadRequestException(String.format(
                    "Le kilométrage réel (%d km) ne peut pas être inférieur au kilométrage actuel du véhicule (%d km).",
                    kmReel, kmActuel));
        }

        panne.setKilometrageCloture(kmReel);
        panne.setCoutReelReparation(request.getCoutReelReparation() != null ? request.getCoutReelReparation() : panne.getCoutEstimeDevis());
        panne.setDateReparation(request.getDateReparation() != null ? request.getDateReparation() : LocalDateTime.now());
        panne.setDateCloture(LocalDateTime.now());
        panne.setReferenceBonSortie(request.getReferenceBonSortie());
        panne.setReferenceFacture(request.getReferenceFacture());
        panne.setGarantieAccordee(request.getGarantieAccordee());
        panne.setStatut(StatutPanne.REPAREE);
        if (request.getObservations() != null) {
            panne.setObservations(request.getObservations());
        }

        // Mise à jour atomique du véhicule : Compteur & Disponibilité
        vehicule.setKilometrageActuel(kmReel);
        vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        vehiculeRepository.save(vehicule);
        log.info("RG04 — Clôture réparation pour véhicule {}. Kilométrage mis à jour à {} km, véhicule DISPONIBLE.",
                vehicule.getImmatriculation(), kmReel);

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
                pr.setPanne(panne);
                if (panne.getGarageAgree() != null) {
                    pr.setGarage(panne.getGarageAgree());
                }
                pieceRepository.save(pr);
            }
        }

        // RG05 : Imputation budgétaire automatique sur la Direction du véhicule
        if (panne.getCoutReelReparation() != null && panne.getCoutReelReparation().compareTo(BigDecimal.ZERO) > 0) {
            budgetService.imputerDepense(vehicule.getDirection(), NatureDepense.REPARATION,
                    panne.getCoutReelReparation(), "Réparation panne " + vehicule.getImmatriculation());
        }

        PanneVehicule saved = panneRepository.save(panne);
        journalService.log("PANNE", "CLOTURE_REPARATION", "PanneVehicule", saved.getId(), null,
                "Clôture réparation " + vehicule.getImmatriculation() + " (" + kmReel + " km / " + saved.getCoutReelReparation() + " DH)", null);

        return mapToDto(saved);
    }

    @Transactional
    public void supprimerPanne(Long id) {
        if (!panneRepository.existsById(id)) {
            throw new ResourceNotFoundException("Panne non trouvée avec l'id : " + id);
        }
        panneRepository.deleteById(id);
        journalService.log("PANNE", "DELETE", "PanneVehicule", id, null, null, null);
    }

    private PanneDto mapToDto(PanneVehicule p) {
        Vehicule v = p.getVehicule();
        Conducteur c = p.getConducteur();
        GarageAgree g = p.getGarageAgree();

        List<PieceRemplacementDto> piecesDto = pieceRepository.findByPanneId(p.getId()).stream()
                .map(pr -> PieceRemplacementDto.builder()
                        .id(pr.getId())
                        .referencePiece(pr.getReferencePiece())
                        .designation(pr.getDesignation())
                        .categorie(pr.getCategorie())
                        .quantite(pr.getQuantite())
                        .prixUnitaire(pr.getPrixUnitaire())
                        .montantTotal(pr.getMontantTotal())
                        .panneId(p.getId())
                        .garageId(pr.getGarage() != null ? pr.getGarage().getId() : null)
                        .garageNom(pr.getGarage() != null ? pr.getGarage().getNomGarage() : null)
                        .build())
                .collect(Collectors.toList());

        return PanneDto.builder()
                .id(p.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNom(c != null ? c.getNom() + " " + c.getPrenom() : null)
                .garageAgreeId(g != null ? g.getId() : null)
                .garageNom(g != null ? g.getNomGarage() : null)
                .dateDeclaration(p.getDateDeclaration())
                .lieuPanne(p.getLieuPanne())
                .kilometragePanne(p.getKilometragePanne())
                .naturePanne(p.getNaturePanne())
                .descriptionSymptomes(p.getDescriptionSymptomes())
                .degreUrgence(p.getDegreUrgence())
                .immobilisante(p.getImmobilisante())
                .remorquageRequis(p.getRemorquageRequis())
                .societeRemorquage(p.getSocieteRemorquage())
                .diagnosticAtelier(p.getDiagnosticAtelier())
                .dureeImmobilisationJours(p.getDureeImmobilisationJours())
                .coutEstimeDevis(p.getCoutEstimeDevis())
                .coutReelReparation(p.getCoutReelReparation())
                .kilometrageCloture(p.getKilometrageCloture())
                .dateReparation(p.getDateReparation())
                .dateCloture(p.getDateCloture())
                .statut(p.getStatut())
                .referenceBonSortie(p.getReferenceBonSortie())
                .referenceFacture(p.getReferenceFacture())
                .garantieAccordee(p.getGarantieAccordee())
                .observations(p.getObservations())
                .pieces(piecesDto)
                .dateCreation(p.getDateCreation())
                .build();
    }
}

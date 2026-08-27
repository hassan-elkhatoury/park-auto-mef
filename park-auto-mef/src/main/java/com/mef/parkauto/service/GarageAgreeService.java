package com.mef.parkauto.service;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.GarageAgree;
import com.mef.parkauto.entity.PieceRemplacement;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.GarageAgreeRepository;
import com.mef.parkauto.repository.PieceRemplacementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GarageAgreeService {

    private final GarageAgreeRepository garageRepository;
    private final PieceRemplacementRepository pieceRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<GarageAgreeDto> getAllGarages() {
        return garageRepository.findAll().stream()
                .map(this::mapGarageToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GarageAgreeDto> getGaragesActifs() {
        return garageRepository.findByActifTrueOrderByNomGarageAsc().stream()
                .map(this::mapGarageToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GarageAgreeDto getGarageById(Long id) {
        return garageRepository.findById(id)
                .map(this::mapGarageToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Garage agréé non trouvé : " + id));
    }

    @Transactional
    public GarageAgreeDto creerOuModifierGarage(GarageAgreeRequest request) {
        if (request.getNomGarage() == null || request.getNomGarage().isBlank()) {
            throw new BadRequestException("Le nom du garage est obligatoire.");
        }

        GarageAgree garage = (request.getId() != null)
                ? garageRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Garage non trouvé : " + request.getId()))
                : new GarageAgree();

        garage.setNomGarage(request.getNomGarage());
        garage.setRaisonSociale(request.getRaisonSociale());
        garage.setVille(request.getVille());
        garage.setAdresse(request.getAdresse());
        garage.setTelephone(request.getTelephone());
        garage.setEmail(request.getEmail());
        garage.setContactNom(request.getContactNom());
        garage.setReferenceConvention(request.getReferenceConvention());
        garage.setAgreeMEF(request.getAgreeMEF() != null ? request.getAgreeMEF() : true);
        garage.setSpecialites(request.getSpecialites());
        garage.setTarifHoraireMo(request.getTarifHoraireMo() != null ? request.getTarifHoraireMo() : BigDecimal.ZERO);
        garage.setRemisePiecesPct(request.getRemisePiecesPct() != null ? request.getRemisePiecesPct() : BigDecimal.ZERO);
        garage.setNoteEvaluation(request.getNoteEvaluation() != null ? request.getNoteEvaluation() : BigDecimal.valueOf(4.5));
        garage.setObservations(request.getObservations());
        garage.setActif(request.getActif() != null ? request.getActif() : true);

        boolean creation = request.getId() == null;
        GarageAgree saved = garageRepository.save(garage);
        journalService.log("GARAGE", creation ? "CREATE" : "UPDATE", "GarageAgree", saved.getId(), null,
                saved.getNomGarage() + " (" + saved.getVille() + ")", null);

        return mapGarageToDto(saved);
    }

    @Transactional
    public void supprimerGarage(Long id) {
        if (!garageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Garage non trouvé : " + id);
        }
        garageRepository.deleteById(id);
        journalService.log("GARAGE", "DELETE", "GarageAgree", id, null, null, null);
    }

    // --- PIECES DE RECHANGE ---

    @Transactional(readOnly = true)
    public List<PieceRemplacementDto> getAllPieces() {
        return pieceRepository.findAll().stream()
                .map(this::mapPieceToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PieceRemplacementDto> getPiecesByGarage(Long garageId) {
        return pieceRepository.findByGarageId(garageId).stream()
                .map(this::mapPieceToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PieceRemplacementDto creerPiece(PieceRemplacementRequest request) {
        PieceRemplacement piece = new PieceRemplacement();
        piece.setReferencePiece(request.getReferencePiece());
        piece.setDesignation(request.getDesignation());
        piece.setCategorie(request.getCategorie());
        piece.setQuantite(request.getQuantite() != null ? request.getQuantite() : 1);
        piece.setPrixUnitaire(request.getPrixUnitaire() != null ? request.getPrixUnitaire() : BigDecimal.ZERO);
        piece.calculerMontantTotal();

        if (request.getGarageId() != null) {
            garageRepository.findById(request.getGarageId()).ifPresent(piece::setGarage);
        }

        PieceRemplacement saved = pieceRepository.save(piece);
        return mapPieceToDto(saved);
    }

    public GarageAgreeDto mapGarageToDto(GarageAgree g) {
        return GarageAgreeDto.builder()
                .id(g.getId())
                .nomGarage(g.getNomGarage())
                .raisonSociale(g.getRaisonSociale())
                .ville(g.getVille())
                .adresse(g.getAdresse())
                .telephone(g.getTelephone())
                .email(g.getEmail())
                .contactNom(g.getContactNom())
                .referenceConvention(g.getReferenceConvention())
                .agreeMEF(g.getAgreeMEF())
                .specialites(g.getSpecialites())
                .tarifHoraireMo(g.getTarifHoraireMo())
                .remisePiecesPct(g.getRemisePiecesPct())
                .noteEvaluation(g.getNoteEvaluation())
                .observations(g.getObservations())
                .actif(g.getActif())
                .dateCreation(g.getDateCreation())
                .build();
    }

    public PieceRemplacementDto mapPieceToDto(PieceRemplacement p) {
        return PieceRemplacementDto.builder()
                .id(p.getId())
                .referencePiece(p.getReferencePiece())
                .designation(p.getDesignation())
                .categorie(p.getCategorie())
                .quantite(p.getQuantite())
                .prixUnitaire(p.getPrixUnitaire())
                .montantTotal(p.getMontantTotal())
                .interventionId(p.getIntervention() != null ? p.getIntervention().getId() : null)
                .panneId(p.getPanne() != null ? p.getPanne().getId() : null)
                .garageId(p.getGarage() != null ? p.getGarage().getId() : null)
                .garageNom(p.getGarage() != null ? p.getGarage().getNomGarage() : null)
                .build();
    }
}

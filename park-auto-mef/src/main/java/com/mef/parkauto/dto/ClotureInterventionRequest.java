package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ClotureInterventionRequest {

    @NotNull(message = "Le kilométrage réel de clôture est obligatoire")
    private Long kilometrageRealise;

    private LocalDate dateRealisation;
    private BigDecimal coutMainOeuvre;
    private BigDecimal coutPieces;
    private BigDecimal montantTotal;
    private String piecesRemplacees;
    private String prestataire;
    private Long garageAgreeId;
    private String referenceFacture;
    private String description;
    private List<PieceRemplacementRequest> pieces;
}

package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CloturePanneRequest {

    @NotNull(message = "Le kilométrage réel de clôture est obligatoire")
    private Long kilometrageReel;

    private BigDecimal coutReelReparation;
    private LocalDateTime dateReparation;
    private String referenceBonSortie;
    private String referenceFacture;
    private String garantieAccordee;
    private String observations;
    private List<PieceRemplacementRequest> pieces;
}

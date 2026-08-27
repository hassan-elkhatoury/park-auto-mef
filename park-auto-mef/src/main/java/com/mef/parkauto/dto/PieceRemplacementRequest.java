package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PieceRemplacementRequest {
    private Long id;

    @NotBlank(message = "La référence de la pièce est obligatoire")
    private String referencePiece;

    @NotBlank(message = "La désignation de la pièce est obligatoire")
    private String designation;

    private String categorie;
    private Integer quantite = 1;
    private BigDecimal prixUnitaire = BigDecimal.ZERO;
    private BigDecimal montantTotal;
    private Long interventionId;
    private Long panneId;
    private Long garageId;
}

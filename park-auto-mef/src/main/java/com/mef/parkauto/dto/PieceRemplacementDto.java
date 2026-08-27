package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PieceRemplacementDto {
    private Long id;
    private String referencePiece;
    private String designation;
    private String categorie;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal montantTotal;
    private Long interventionId;
    private Long panneId;
    private Long garageId;
    private String garageNom;
}

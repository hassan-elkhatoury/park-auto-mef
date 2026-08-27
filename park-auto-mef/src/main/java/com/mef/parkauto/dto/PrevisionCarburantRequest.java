package com.mef.parkauto.dto;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburantRequest {
    private Long id;
    private Long vehiculeId;
    private String direction;
    private Integer mois;
    private Integer annee;
    private Double kmPrevus;
    private Double consoMoyenne;
    private BigDecimal prixUnitairePrevus;
    private Double quantiteReelle;
    private BigDecimal montantReel;
}

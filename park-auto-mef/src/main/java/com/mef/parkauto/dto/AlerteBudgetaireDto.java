package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureDepense;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlerteBudgetaireDto {
    private Long budgetId;
    private Integer annee;
    private String direction;
    private NatureDepense natureDepense;
    private BigDecimal montantAlloue;
    private BigDecimal montantEngage;
    private BigDecimal montantRealise;
    private BigDecimal montantDisponible;
    private double tauxConsommation;
    private String niveauAlerte; // "VIGILANCE_80" ou "CRITIQUE_95"
    private String message;
}

package com.mef.parkauto.dto;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * Synthèse budgétaire d'un exercice (CdC §19) : alloué, engagé, réalisé, disponible,
 * écart prévisionnel/réalisé et taux d'exécution.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetSyntheseDto {
    private Integer annee;
    private BigDecimal totalAlloue;
    /** Crédits engagés non encore liquidés. */
    private BigDecimal totalEngage;
    private BigDecimal totalRealise;
    /** Alloué − engagé − réalisé. */
    private BigDecimal totalRestant;
    /** Alloué − réalisé (écart prévisionnel / réalisé). */
    private BigDecimal ecartPrevisionnelRealise;
    /** Réalisé / alloué (%). */
    private Double tauxConsommationGlobal;
    /** (Engagé + réalisé) / alloué (%). */
    private Double tauxEngagementGlobal;
    private List<BudgetDirectionDto> lignes;
}

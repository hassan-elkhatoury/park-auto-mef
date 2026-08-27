package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetSyntheseDto {
    private Integer annee;
    private BigDecimal totalAlloue;
    private BigDecimal totalRealise;
    private BigDecimal totalRestant;
    private Double tauxConsommationGlobal;
    private List<BudgetDirectionDto> lignes;
}

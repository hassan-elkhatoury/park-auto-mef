package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BudgetDirectionRequest {
    private Long id;
    private Integer annee;
    private String direction;
    private String service;
    private String centreCout;
    private NatureDepense natureDepense;
    private BigDecimal montantAlloue;
    private BigDecimal montantEngage;
    private BigDecimal montantRealise;
}

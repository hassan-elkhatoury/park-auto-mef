package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetDirectionDto {
    private Long id;
    private Integer annee;
    private String direction;
    private String service;
    private String centreCout;
    private NatureDepense natureDepense;
    private BigDecimal montantAlloue;
    private BigDecimal montantEngage;
    private BigDecimal montantRealise;
    private BigDecimal montantRestant;
    private BigDecimal montantDisponible;
    private Double tauxConsommation; // (montantEngage ou montantRealise)/montantAlloue * 100
    private Boolean seuilAlerte80Atteint;
    private Boolean seuilAlerte95Atteint;
    private LocalDateTime dateCreation;
}

package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureDepense;
import com.mef.parkauto.entity.StatutEngagement;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EngagementBudgetaireDto {
    private Long id;
    private String numeroEngagement;
    private LocalDate dateEngagement;
    private Integer annee;
    private String direction;
    private String service;
    private String centreCout;
    private NatureDepense natureDepense;
    private BigDecimal montantEngage;
    private BigDecimal montantLiquide;
    private StatutEngagement statutEngagement;
    private String beneficiaire;
    private String objet;
    private String referencePiece;
    private LocalDateTime dateCreation;
}

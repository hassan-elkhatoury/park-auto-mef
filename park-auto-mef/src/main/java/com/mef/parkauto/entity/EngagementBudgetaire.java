package com.mef.parkauto.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "engagements_budgetaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EngagementBudgetaire extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String numeroEngagement;

    @Column(nullable = false)
    private LocalDate dateEngagement;

    @Column(nullable = false)
    private Integer annee;

    @Column(nullable = false, length = 100)
    private String direction;

    @Column(length = 100)
    private String service;

    @Column(length = 50)
    private String centreCout;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NatureDepense natureDepense;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal montantEngage = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal montantLiquide = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutEngagement statutEngagement = StatutEngagement.ENGAGE;

    @Column(length = 150)
    private String beneficiaire;

    @Column(length = 255)
    private String objet;

    @Column(length = 100)
    private String referencePiece;
}

package com.mef.parkauto.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercices_budgetaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciceBudgetaire extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Integer annee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutExercice statut = StatutExercice.OUVERT;

    @Column
    private LocalDateTime dateCloture;

    @Column(length = 100)
    private String cloturePar;

    @Column(length = 500)
    private String observations;
}

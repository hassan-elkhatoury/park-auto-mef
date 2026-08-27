package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutExercice;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciceBudgetaireDto {
    private Long id;
    private Integer annee;
    private StatutExercice statut;
    private LocalDateTime dateCloture;
    private String cloturePar;
    private String observations;
    private LocalDateTime dateCreation;
}

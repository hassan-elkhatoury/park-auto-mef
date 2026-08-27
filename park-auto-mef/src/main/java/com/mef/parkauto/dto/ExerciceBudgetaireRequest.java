package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciceBudgetaireRequest {
    @NotNull(message = "L'année budgétaire est obligatoire.")
    private Integer annee;
    private String observations;
}

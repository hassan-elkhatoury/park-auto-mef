package com.mef.parkauto.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestitutionRequest {

    @NotNull(message = "Le kilométrage de retour est obligatoire")
    @Min(value = 0, message = "Le kilométrage doit être positif")
    private Long kilometrageRetour;

    private String niveauCarburantRetour;
    private String remarquesRestitution;
    private String anomaliesConstatees;
}

package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationDemandeRequest {

    @NotNull(message = "La décision est obligatoire (true pour approuver, false pour rejeter)")
    private Boolean approuve;

    // Obligatoire uniquement en cas de rejet (approuve = false)
    private String motifRejet;
}

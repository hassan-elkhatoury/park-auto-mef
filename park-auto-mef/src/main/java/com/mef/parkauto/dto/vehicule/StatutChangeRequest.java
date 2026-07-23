package com.mef.parkauto.dto.vehicule;

import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.StatutAdministratif;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatutChangeRequest(
        @NotNull(message = "Le nouveau statut administratif est obligatoire")
        StatutAdministratif nouveauStatutAdministratif,

        @NotNull(message = "Le nouvel état technique est obligatoire")
        EtatTechnique nouveauEtatTechnique,

        @Size(max = 500, message = "Le motif ne doit pas dépasser 500 caractères")
        String motif,

        String pieceJustificative
) {
}

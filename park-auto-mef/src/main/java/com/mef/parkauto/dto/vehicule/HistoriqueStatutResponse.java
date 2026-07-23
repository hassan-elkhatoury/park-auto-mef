package com.mef.parkauto.dto.vehicule;

import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.StatutAdministratif;

import java.time.LocalDateTime;

public record HistoriqueStatutResponse(
        Long id,
        Long vehiculeId,
        String immatriculation,
        StatutAdministratif ancienStatutAdministratif,
        StatutAdministratif nouveauStatutAdministratif,
        EtatTechnique ancienEtatTechnique,
        EtatTechnique nouveauEtatTechnique,
        LocalDateTime dateChangement,
        String motif,
        String utilisateur,
        String pieceJustificative
) {
}

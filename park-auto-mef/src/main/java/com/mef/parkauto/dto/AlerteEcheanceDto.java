package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlerteEcheanceDto {
    private String id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private String typeAlerte; // ASSURANCE, CONTROLE_TECHNIQUE, VIGNETTE, MAINTENANCE_PREVENTIVE, CARTE_CARBURANT
    private String titre;
    private String message;
    private String niveauSeverite; // CRITIQUE, ATTENTION, INFO
    private LocalDate dateEcheance;
    private Long kilometrageActuel;
    private Long kilometrageSeuil;
    private Integer joursRestants;
}

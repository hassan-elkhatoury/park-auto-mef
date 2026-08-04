package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TcoVehiculeDto {
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private BigDecimal coutAcquisition;
    private BigDecimal coutCarburantTotal;
    private BigDecimal coutMaintenanceTotal;
    private BigDecimal tcoTotal;
    private Double totalLitresCarburant;
    private Long kilometrageActuel;
    private Double consommationMoyenne; // L/100km
    private String statutAdministratif;
}

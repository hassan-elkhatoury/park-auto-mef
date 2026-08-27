package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveSummaryDto {
    private Long totalVehicules;
    private Long vehiculesEnMaintenance;
    private Double tauxImmobilisation; // %
    private BigDecimal coutTotalAcquisition;
    private BigDecimal coutTotalCarburant;
    private BigDecimal totalCarburant; // alias
    private BigDecimal coutTotalMaintenance;
    private BigDecimal totalMaintenance; // alias
    private BigDecimal coutTotalAssurance;
    private BigDecimal totalAssurance; // alias
    private BigDecimal coutTotalTaxes;
    private BigDecimal totalTaxes; // alias
    private BigDecimal tcoGlobal;
    private BigDecimal totalTco; // alias
    private Long totalKilometrageFlotte;
    private Double coutMoyenKilometriqueMadKm; // MAD / km
    private Double coutMoyenKm; // alias
    private Double totalLitresConsommes;
    private Double totalEmissionsCO2Kg; // Estimated CO2 in kg
    private Integer alertesActivesCount;
    private Integer surconsommationsCount;
    private List<TcoDirectionDto> tcoParDirection;
    private List<TcoMotorisationDto> tcoParMotorisation;
}

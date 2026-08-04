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
    private BigDecimal coutTotalCarburant;
    private BigDecimal coutTotalMaintenance;
    private BigDecimal tcoGlobal;
    private Double totalLitresConsommes;
    private Double totalEmissionsCO2Kg; // Estimated CO2 in kg
    private Integer alertesActivesCount;
    private Integer surconsommationsCount;
    private List<TcoDirectionDto> tcoParDirection;
}

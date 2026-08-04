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
public class TcoDirectionDto {
    private String direction;
    private Long nombreVehicules;
    private BigDecimal totalAcquisition;
    private BigDecimal totalCarburant;
    private BigDecimal totalMaintenance;
    private BigDecimal tcoTotal;
    private BigDecimal tcoMoyenParVehicule;
}

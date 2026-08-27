package com.mef.parkauto.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TcoMotorisationDto {
    private String typeCarburant;
    private long nombreVehicules;
    private BigDecimal totalAcquisition;
    private BigDecimal totalCarburant;
    private BigDecimal totalMaintenance;
    private BigDecimal tcoTotal;
    private BigDecimal tcoMoyen;
    private Double coutKm; // alias
    private Double coutMoyenKm; // alias
    private Double coutKilometriqueMadKm;
    private double totalLitres;
    private double totalCO2Kg;
}

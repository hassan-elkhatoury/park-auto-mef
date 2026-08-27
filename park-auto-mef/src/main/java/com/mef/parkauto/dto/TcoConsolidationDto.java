package com.mef.parkauto.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TcoConsolidationDto {
    private BigDecimal tcoGlobalTotal;
    private BigDecimal coutMoyenParVehicule;
    private Double coutMoyenKilometriqueMadKm;
    private Long totalVehicules;
    private Long totalKilometrageFlotte;
    private Double totalEmissionsCO2Tonnes;
    private List<TcoMotorisationDto> parMotorisation;
    private List<TcoDirectionDto> parDirection;
}

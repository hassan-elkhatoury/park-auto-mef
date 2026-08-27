package com.mef.parkauto.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiquidationEngagementRequest {
    @NotNull(message = "Le montant liquidé est obligatoire.")
    @DecimalMin(value = "0.01", message = "Le montant liquidé doit être supérieur à zéro.")
    private BigDecimal montantLiquide;

    private String referenceFacture;
}

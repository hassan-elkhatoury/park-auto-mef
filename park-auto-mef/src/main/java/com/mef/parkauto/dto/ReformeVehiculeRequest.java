package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeRequest {
    private Long id;
    private Long vehiculeId;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private StatutReforme statut;
    private BigDecimal prixCession;
}

package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class InfractionRequest {
    private Long id;
    private Long vehiculeId;
    private Long conducteurId;
    private LocalDate dateInfraction;
    private String lieuInfraction;
    private String typeInfraction;
    private BigDecimal montantAmende;
    private StatutInfraction statut;
    private String referenceContravention;
    private String observations;
}

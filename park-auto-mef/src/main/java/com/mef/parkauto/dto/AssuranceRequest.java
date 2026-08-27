package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class AssuranceRequest {
    private Long id;
    private Long vehiculeId;
    private String numeroPolice;
    private CompagnieAssurance compagnie;
    private TypeGarantie typeGarantie;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private BigDecimal montantPrime;
    private BigDecimal franchise;
    private StatutAssurance statut;
    private String documents;
    private String observations;
}

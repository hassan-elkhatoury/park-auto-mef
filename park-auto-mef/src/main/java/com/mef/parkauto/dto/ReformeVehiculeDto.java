package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private StatutReforme statut;
    private BigDecimal prixCession;
    private LocalDateTime dateCreation;
}

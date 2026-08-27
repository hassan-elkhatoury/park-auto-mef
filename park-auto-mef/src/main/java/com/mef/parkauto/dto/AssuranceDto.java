package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AssuranceDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
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
    private LocalDateTime dateCreation;
    private long joursRestants; // calculé
}

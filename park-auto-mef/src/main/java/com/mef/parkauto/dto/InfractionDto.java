package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InfractionDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private Long conducteurId;
    private String conducteurNom;
    private LocalDate dateInfraction;
    private String lieuInfraction;
    private String typeInfraction;
    private BigDecimal montantAmende;
    private StatutInfraction statut;
    private String referenceContravention;
    private String observations;
    private LocalDateTime dateCreation;
}

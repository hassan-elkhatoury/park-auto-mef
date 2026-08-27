package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GarageAgreeDto {
    private Long id;
    private String nomGarage;
    private String raisonSociale;
    private String ville;
    private String adresse;
    private String telephone;
    private String email;
    private String contactNom;
    private String referenceConvention;
    private Boolean agreeMEF;
    private String specialites;
    private BigDecimal tarifHoraireMo;
    private BigDecimal remisePiecesPct;
    private BigDecimal noteEvaluation;
    private String observations;
    private Boolean actif;
    private LocalDateTime dateCreation;
}

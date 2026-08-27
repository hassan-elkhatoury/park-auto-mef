package com.mef.parkauto.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GarageAgreeRequest {
    private Long id;

    @NotBlank(message = "Le nom du garage est obligatoire")
    private String nomGarage;

    private String raisonSociale;
    private String ville;
    private String adresse;
    private String telephone;
    private String email;
    private String contactNom;
    private String referenceConvention;
    private Boolean agreeMEF = true;
    private String specialites;
    private BigDecimal tarifHoraireMo;
    private BigDecimal remisePiecesPct;
    private BigDecimal noteEvaluation;
    private String observations;
    private Boolean actif = true;
}

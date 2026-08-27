package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureDepense;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EngagementBudgetaireRequest {
    private LocalDate dateEngagement;

    @NotNull(message = "L'année budgétaire est obligatoire.")
    private Integer annee;

    @NotBlank(message = "La direction est obligatoire.")
    private String direction;

    private String service;
    private String centreCout;

    @NotNull(message = "La nature de dépense est obligatoire.")
    private NatureDepense natureDepense;

    @NotNull(message = "Le montant de l'engagement est obligatoire.")
    @DecimalMin(value = "0.01", message = "Le montant de l'engagement doit être supérieur à zéro.")
    private BigDecimal montantEngage;

    @NotBlank(message = "Le bénéficiaire ou prestataire est obligatoire.")
    private String beneficiaire;

    @NotBlank(message = "L'objet de l'engagement est obligatoire.")
    private String objet;

    private String referencePiece;
}

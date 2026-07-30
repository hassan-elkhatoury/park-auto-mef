package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutDemande;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeDeplacementDto {

    private Long id;
    private String reference;

    private Long demandeurId;
    private String demandeurNomComplet;
    private String demandeurDirection;
    private String demandeurService;

    @NotBlank(message = "Le motif de la mission est obligatoire")
    private String motif;

    @NotBlank(message = "La destination est obligatoire")
    private String destination;

    @NotNull(message = "La date & heure de départ est obligatoire")
    private LocalDateTime dateHeureDepart;

    @NotNull(message = "La date & heure de retour estimée est obligatoire")
    private LocalDateTime dateHeureRetourEstimee;

    @Min(value = 1, message = "Le nombre de passagers doit être d'au moins 1")
    private Integer nombrePassagers;

    private String listePassagers;

    private StatutDemande statut;
    private String motifRejet;

    private LocalDateTime dateValidationService;
    private String valideurServiceNomComplet;

    private LocalDateTime dateApprobationParc;
    private String approbateurParcNomComplet;

    private Long affectationId;
    private String affectationReference;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

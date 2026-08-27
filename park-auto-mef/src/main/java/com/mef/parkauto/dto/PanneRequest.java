package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutPanne;
import com.mef.parkauto.entity.UrgencePanne;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PanneRequest {
    private Long id;

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehiculeId;

    private Long conducteurId;
    private Long garageAgreeId;
    private LocalDateTime dateDeclaration;
    private String lieuPanne;
    private Long kilometragePanne;
    private String naturePanne;
    private String descriptionSymptomes;
    private UrgencePanne degreUrgence = UrgencePanne.MOYENNE;
    private Boolean immobilisante = true;
    private Boolean remorquageRequis = false;
    private String societeRemorquage;
    private String diagnosticAtelier;
    private Integer dureeImmobilisationJours;
    private BigDecimal coutEstimeDevis;
    private BigDecimal coutReelReparation;
    private StatutPanne statut = StatutPanne.DECLAREE;
    private String observations;
}

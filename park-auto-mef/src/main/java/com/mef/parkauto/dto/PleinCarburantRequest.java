package com.mef.parkauto.dto;

import com.mef.parkauto.entity.TypeCarburant;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PleinCarburantRequest {

    private Long id;

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehiculeId;

    private Long conducteurId;

    private Long carteCarburantId;

    private LocalDateTime datePlein;

    private String stationService;

    private TypeCarburant typeCarburant;

    @NotNull(message = "La quantité en litres est obligatoire")
    @Positive(message = "La quantité doit être supérieure à zéro")
    private Double quantiteLitres;

    private BigDecimal prixUnitaire;

    @NotNull(message = "Le montant TTC est obligatoire")
    @Positive(message = "Le montant TTC doit être supérieur à zéro")
    private BigDecimal montantTTC;

    @NotNull(message = "Le kilométrage est obligatoire")
    private Long kilometrage;

    private String referenceTicket;

    private String referenceFacture;

    private String observation;
}

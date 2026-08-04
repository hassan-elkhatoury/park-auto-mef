package com.mef.parkauto.dto;

import com.mef.parkauto.entity.TypeCarburant;
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
public class PleinCarburantDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private Long conducteurId;
    private String conducteurNomPrenom;
    private Long carteCarburantId;
    private String numeroCarteCarburant;
    private LocalDateTime datePlein;
    private String stationService;
    private TypeCarburant typeCarburant;
    private Double quantiteLitres;
    private BigDecimal prixUnitaire;
    private BigDecimal montantTTC;
    private Long kilometrage;
    private Double consommationMoyenne;
    private Boolean anomalieSurconsommation;
    private String referenceTicket;
    private String referenceFacture;
    private String observation;
}

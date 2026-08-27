package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutPanne;
import com.mef.parkauto.entity.UrgencePanne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PanneDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private Long conducteurId;
    private String conducteurNom;
    private Long garageAgreeId;
    private String garageNom;
    private LocalDateTime dateDeclaration;
    private String lieuPanne;
    private Long kilometragePanne;
    private String naturePanne;
    private String descriptionSymptomes;
    private UrgencePanne degreUrgence;
    private Boolean immobilisante;
    private Boolean remorquageRequis;
    private String societeRemorquage;
    private String diagnosticAtelier;
    private Integer dureeImmobilisationJours;
    private BigDecimal coutEstimeDevis;
    private BigDecimal coutReelReparation;
    private Long kilometrageCloture;
    private LocalDateTime dateReparation;
    private LocalDateTime dateCloture;
    private StatutPanne statut;
    private String referenceBonSortie;
    private String referenceFacture;
    private String garantieAccordee;
    private String observations;
    private List<PieceRemplacementDto> pieces;
    private LocalDateTime dateCreation;
}

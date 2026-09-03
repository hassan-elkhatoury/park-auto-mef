package com.mef.parkauto.dto;

import com.mef.parkauto.entity.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SinistreDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private Long conducteurId;
    private String conducteurNom;
    private Long assuranceId;
    private String numeroPolice;
    private String compagnieNom;
    private Long garageAgreeId;
    private String garageNom;
    private LocalDate dateAccident;
    private String lieuAccident;
    private String description;
    private String tiersImpliques;
    private NatureAccident natureAccident;
    private BigDecimal montantDommages;
    private BigDecimal montantFranchise;
    private BigDecimal montantRembourse;
    private BigDecimal coutResteACharge;
    private StatutSinistre statut;
    private String referenceExpertise;
    private String numeroConstat;
    private String refPvPolice;
    private LocalDate dateExpertise;
    private LocalDate dateCloture;
    private Boolean remorquageRequis;
    private Boolean perteTotale;
    /** Identifiant de la procédure de réforme ouverte suite à la perte totale, le cas échéant. */
    private Long reformeId;
    private String observations;
    private LocalDateTime dateCreation;
}

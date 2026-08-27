package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureAccident;
import com.mef.parkauto.entity.StatutSinistre;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SinistreRequest {
    private Long id;
    private Long vehiculeId;
    private Long conducteurId;
    private Long assuranceId;
    private Long garageAgreeId;
    private LocalDate dateAccident;
    private String lieuAccident;
    private String description;
    private String tiersImpliques;
    private NatureAccident natureAccident = NatureAccident.COLLISION;
    private BigDecimal montantDommages;
    private BigDecimal montantFranchise;
    private BigDecimal montantRembourse;
    private StatutSinistre statut = StatutSinistre.DECLARE;
    private String referenceExpertise;
    private String numeroConstat;
    private String refPvPolice;
    private LocalDate dateExpertise;
    private LocalDate dateCloture;
    private Boolean remorquageRequis;
    private String observations;
}

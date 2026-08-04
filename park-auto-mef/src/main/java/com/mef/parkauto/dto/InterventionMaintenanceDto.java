package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureMaintenance;
import com.mef.parkauto.entity.StatutMaintenance;
import com.mef.parkauto.entity.TypeMaintenance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterventionMaintenanceDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private TypeMaintenance typeMaintenance;
    private NatureMaintenance natureOperation;
    private LocalDate datePrevisionnelle;
    private LocalDate dateRealisation;
    private Long kilometragePrevu;
    private Long kilometrageRealise;
    private String prestataire;
    private BigDecimal coutMainOeuvre;
    private BigDecimal coutPieces;
    private BigDecimal montantTotal;
    private String piecesRemplacees;
    private StatutMaintenance statut;
    private Boolean immobilisation;
    private String description;
}

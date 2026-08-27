package com.mef.parkauto.dto;

import com.mef.parkauto.entity.NatureMaintenance;
import com.mef.parkauto.entity.StatutMaintenance;
import com.mef.parkauto.entity.TypeMaintenance;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class InterventionMaintenanceRequest {

    private Long id;

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehiculeId;

    private Long garageAgreeId;

    private TypeMaintenance typeMaintenance = TypeMaintenance.PREVENTIVE;

    private NatureMaintenance natureOperation = NatureMaintenance.REVISION_PERIODIQUE;

    private LocalDate datePrevisionnelle;

    private LocalDate dateRealisation;

    private Long kilometragePrevu;

    private Long kilometrageRealise;

    private String prestataire;

    private BigDecimal coutMainOeuvre;

    private BigDecimal coutPieces;

    private BigDecimal montantTotal;

    private String piecesRemplacees;

    private StatutMaintenance statut = StatutMaintenance.PROGRAMMEE;

    private Boolean immobilisation = false;

    private String description;

    private List<PieceRemplacementRequest> pieces;
}

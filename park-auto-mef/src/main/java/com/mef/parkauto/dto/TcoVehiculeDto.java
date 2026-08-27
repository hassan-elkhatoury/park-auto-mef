package com.mef.parkauto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TcoVehiculeDto {
    private Long vehiculeId;
    private Long id; // alias for vehiculeId
    private String immatriculation;
    private String matricule; // alias for immatriculation
    private String marque;
    private String modele;
    private String marqueModele;
    private String direction;
    private String typeCarburant;
    private BigDecimal coutAcquisition;
    private BigDecimal coutCarburant; // alias for coutCarburantTotal
    private BigDecimal coutCarburantTotal;
    private BigDecimal coutMaintenance; // alias for coutMaintenanceTotal
    private BigDecimal coutMaintenanceTotal;
    private BigDecimal coutAssurance; // alias for coutAssuranceTotal
    private BigDecimal coutAssuranceTotal;
    private BigDecimal coutTaxes; // alias for coutTaxesTotal
    private BigDecimal coutTaxesTotal;
    private BigDecimal coutSinistresTotal;
    private BigDecimal tcoTotal;
    private Double coutKm; // alias for coutKilometriqueMadKm
    private Double coutKilometriqueMadKm; // TCO / km
    private Double totalLitresCarburant;
    private Long kilometrageActuel;
    private Double consommationMoyenne; // L/100km
    private String statutAdministratif;
}

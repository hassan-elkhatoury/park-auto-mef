package com.mef.parkauto.dto;

import com.mef.parkauto.entity.CarteCarburantStatut;
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
public class CarteCarburantDto {
    private Long id;
    private String numeroCarte;
    private String fournisseur;
    private Long vehiculeId;
    private String vehiculeImmatriculation;
    private String vehiculeMarqueModele;
    private String serviceAttribue;
    private BigDecimal plafondMensuel;
    private BigDecimal solde;
    private LocalDate dateActivation;
    private LocalDate dateExpiration;
    private CarteCarburantStatut statut;
    private String observation;
}

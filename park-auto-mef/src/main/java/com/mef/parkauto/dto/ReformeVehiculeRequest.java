package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeRequest {
    private Long id;
    private Long vehiculeId;
    private Long sinistreId;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private LocalDate datePvCommission;
    private String pvDomaines;
    private LocalDate datePvDomaines;
    /**
     * Statut cible demandé. Seules les transitions autorisées par la machine à états
     * (INITIE → EN_COURS_DE_REFORME → VALIDE → REFORME → VENDU) sont acceptées ;
     * VALIDE/REFORME passent obligatoirement par l'endpoint de validation.
     */
    private StatutReforme statut;
    private BigDecimal prixCession;
    private LocalDate dateCession;
    private String acquereur;
    private String observation;
}

package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobileRequest {
    private Long id;
    private Long vehiculeId;
    private Integer annee;
    private TypeTaxe type;
    private BigDecimal montant;
    private StatutTaxe statut;
    private LocalDate dateEcheance;
    private String referencePaiement;
}

package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobileDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private Integer annee;
    private TypeTaxe type;
    private BigDecimal montant;
    private StatutTaxe statut;
    private LocalDate dateEcheance;
    private String referencePaiement;
    private LocalDateTime dateCreation;
}

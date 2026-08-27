package com.mef.parkauto.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburantDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String direction;
    private Integer mois;
    private Integer annee;
    private Double kmPrevus;
    private Double consoMoyenne;
    private Double quantitePrevueLitres;
    private BigDecimal prixUnitairePrevus;
    private BigDecimal montantPrevu;
    private Double quantiteReelle;
    private BigDecimal montantReel;
    private Double ecartQuantite; // quantiteReelle - quantitePrevueLitres
    private LocalDateTime dateCreation;
}

package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name="previsions_carburant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburant extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="vehicule_id")
    private Vehicule vehicule;
    
    @Column(length=100) private String direction;
    
    @Column(nullable=false) private Integer mois;
    @Column(nullable=false) private Integer annee;
    
    private Double kmPrevus;
    private Double consoMoyenne; // L/100km
    
    // AMÉLIORATION: null-safe @Transient getter
    @Transient
    public Double getQuantitePrevueLitres() {
        if (kmPrevus == null || consoMoyenne == null) return 0.0;
        return kmPrevus * consoMoyenne / 100.0;
    }
    
    @Column(precision=10, scale=4) private BigDecimal prixUnitairePrevus;
    
    // AMÉLIORATION: null-safe @Transient getter
    @Transient
    public BigDecimal getMontantPrevu() {
        Double qte = getQuantitePrevueLitres();
        if (prixUnitairePrevus == null || qte == 0.0) return BigDecimal.ZERO;
        return prixUnitairePrevus.multiply(BigDecimal.valueOf(qte));
    }
    
    private Double quantiteReelle;
    @Column(precision=12, scale=2) private BigDecimal montantReel;
}

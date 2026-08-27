package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name="budgets_direction")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class BudgetDirection extends BaseEntity {
    @Column(nullable=false) private Integer annee;
    @Column(nullable=false, length=100) private String direction;
    @Column(length=100) private String service;
    @Column(length=50) private String centreCout;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private NatureDepense natureDepense;
    
    @Column(nullable=false, precision=14, scale=2)
    @Builder.Default
    private BigDecimal montantAlloue = BigDecimal.ZERO;
    
    @Column(precision=14, scale=2)
    @Builder.Default
    private BigDecimal montantEngage = BigDecimal.ZERO;
    
    @Column(precision=14, scale=2)
    @Builder.Default
    private BigDecimal montantRealise = BigDecimal.ZERO;

    @Column(name = "seuil_alerte80atteint", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean seuilAlerte80Atteint = false;

    @Column(name = "seuil_alerte95atteint", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean seuilAlerte95Atteint = false;

    public Boolean getSeuilAlerte80Atteint() {
        return seuilAlerte80Atteint != null && seuilAlerte80Atteint;
    }

    public Boolean getSeuilAlerte95Atteint() {
        return seuilAlerte95Atteint != null && seuilAlerte95Atteint;
    }
    
    @Transient
    public BigDecimal getMontantRestant() {
        if (montantAlloue == null) return BigDecimal.ZERO;
        BigDecimal realise = montantRealise != null ? montantRealise : BigDecimal.ZERO;
        return montantAlloue.subtract(realise);
    }

    @Transient
    public BigDecimal getMontantDisponible() {
        if (montantAlloue == null) return BigDecimal.ZERO;
        BigDecimal engage = montantEngage != null ? montantEngage : BigDecimal.ZERO;
        BigDecimal realise = montantRealise != null ? montantRealise : BigDecimal.ZERO;
        // Total consommations ou bloqué
        BigDecimal consommeOuBloque = engage.max(realise);
        return montantAlloue.subtract(consommeOuBloque);
    }
}

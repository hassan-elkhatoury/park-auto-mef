package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="taxes_automobiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobile extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(nullable=false) private Integer annee;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private TypeTaxe type;
    
    @Column(precision=10, scale=2) private BigDecimal montant;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private StatutTaxe statut = StatutTaxe.EN_RETARD;
    
    private LocalDate dateEcheance;
    @Column(length=100) private String referencePaiement;
}

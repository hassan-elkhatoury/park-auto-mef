package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="reformes_vehicules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReformeVehicule extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(length=1000) private String motifReforme;
    private LocalDate dateDecision;
    
    // Obligatoire pour validation finale (RG04)
    @Column(length=500) private String pvCommission;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutReforme statut = StatutReforme.INITIE;
    
    @Column(precision=12, scale=2) private BigDecimal prixCession;
}

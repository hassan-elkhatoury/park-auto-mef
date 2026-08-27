package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="assurances")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Assurance extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(unique=true, nullable=false, length=100)
    private String numeroPolice;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private CompagnieAssurance compagnie;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private TypeGarantie typeGarantie;
    
    @Column(nullable=false) private LocalDate dateDebut;
    @Column(nullable=false) private LocalDate dateFin;
    
    @Column(precision=12, scale=2) private BigDecimal montantPrime;
    @Column(precision=12, scale=2) private BigDecimal franchise;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private StatutAssurance statut = StatutAssurance.ACTIVE;
    
    @Column(length=500) private String documents;
    @Column(length=500) private String observations;
}

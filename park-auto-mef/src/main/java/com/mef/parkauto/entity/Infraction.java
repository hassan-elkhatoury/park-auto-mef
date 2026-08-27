package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="infractions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Infraction extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="conducteur_id")
    private Conducteur conducteur;
    
    @Column(nullable=false) private LocalDate dateInfraction;
    @Column(length=200) private String lieuInfraction;
    @Column(length=100) private String typeInfraction;
    @Column(precision=10, scale=2) private BigDecimal montantAmende;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutInfraction statut = StatutInfraction.EN_ATTENTE;
    
    @Column(length=100) private String referenceContravention;
    @Column(length=500) private String observations;
}

package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="visites_techniques")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VisiteTechnique extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(nullable=false) private LocalDate dateVisite;
    @Column(length=100) private String centre;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=40)
    private ResultatVisite resultat;
    
    private LocalDate dateProchaine;
    @Column(length=500) private String pvVisite;
    @Column(length=500) private String observations;
}

package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// IMMUTABLE - pas de BaseEntity (pas de updatedBy/lastModified)
@Entity @Table(name="audit_logs")
@Getter @NoArgsConstructor @AllArgsConstructor
@Builder
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    private Long utilisateurId;
    @Column(nullable=false, length=100) private String action;
    @Column(nullable=false, length=100) private String entite;
    private Long entiteId;
    @Lob @Column(columnDefinition="TEXT") private String ancienneValeur;
    @Lob @Column(columnDefinition="TEXT") private String nouvelleValeur;
    @Column(nullable=false, updatable=false) private LocalDateTime dateAction;
    @Column(length=50) private String adresseIp;
    @Column(length=150) private String utilisateurNom;
    
    @PrePersist
    public void prePersist() {
        if (dateAction == null) dateAction = LocalDateTime.now();
    }
}

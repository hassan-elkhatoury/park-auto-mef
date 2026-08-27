package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="documents_ged")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentGED {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable=false, length=100) private String entite;
    @Column(nullable=false) private Long entiteId;
    @Column(length=100) private String typeDocument;
    @Column(nullable=false, length=255) private String nomFichier;
    @Column(nullable=false, length=500) private String cheminFichier;
    @Column(length=100) private String typeMime;
    private Long taille;
    @Column(length=150) private String uploadePar;
    
    @Column(nullable=false, updatable=false)
    private LocalDateTime dateUpload;
    
    @PrePersist
    public void prePersist() {
        if (dateUpload == null) dateUpload = LocalDateTime.now();
    }
}

package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VisiteTechniqueDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private LocalDate dateVisite;
    private String centre;
    private ResultatVisite resultat;
    private LocalDate dateProchaine;
    private String pvVisite;
    private String observations;
    private LocalDateTime dateCreation;
    private Long interventionCreeeId; // si RG03 déclenché
}

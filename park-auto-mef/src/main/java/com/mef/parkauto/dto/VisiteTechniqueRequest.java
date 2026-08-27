package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class VisiteTechniqueRequest {
    private Long id;
    private Long vehiculeId;
    private LocalDate dateVisite;
    private String centre;
    private ResultatVisite resultat;
    private LocalDate dateProchaine;
    private String pvVisite;
    private String observations;
}

package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private Long sinistreId;
    private String sinistreReference;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private LocalDate datePvCommission;
    private String pvDomaines;
    private LocalDate datePvDomaines;
    private StatutReforme statut;
    private BigDecimal prixCession;
    private LocalDate dateCession;
    private String acquereur;
    private LocalDate dateSortieParc;
    private String observation;
    private LocalDateTime dateCreation;
    /** Transitions de statut autorisées depuis l'état courant (pilotage de l'IHM). */
    private List<StatutReforme> transitionsPossibles;
    /** Pièces GED rattachées (entité "reforme"). */
    private Integer nbDocumentsGED;
}

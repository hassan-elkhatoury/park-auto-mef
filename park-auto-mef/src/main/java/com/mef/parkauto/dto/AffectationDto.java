package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutAffectation;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectationDto {

    private Long id;
    private String reference;

    @NotNull(message = "La demande de déplacement est obligatoire")
    private Long demandeDeplacementId;
    private String demandeReference;
    private String demandeMotif;
    private String demandeDestination;

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehiculeId;
    private String vehiculeImmatriculation;
    private String vehiculeMarqueModele;
    private Long vehiculeKilometrageActuel;

    @NotNull(message = "Le conducteur est obligatoire")
    private Long conducteurId;
    private String conducteurNomComplet;
    private String conducteurNumeroPermis;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFinPrevisionnelle;
    private LocalDateTime dateFinReelle;

    private Long kilometrageDepart;
    private Long kilometrageRetour;
    private String niveauCarburantRetour;
    private String remarquesRestitution;
    private String anomaliesConstatees;

    private StatutAffectation statut;

    private Long createurId;
    private String createurNomComplet;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

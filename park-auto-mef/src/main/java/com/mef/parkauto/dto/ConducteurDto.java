package com.mef.parkauto.dto;

import com.mef.parkauto.entity.StatutConducteur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConducteurDto {

    private Long id;

    @NotBlank(message = "Le matricule est obligatoire")
    private String matricule;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le N° CIN est obligatoire")
    private String cin;

    private String direction;
    private String service;
    private String telephone;
    private String email;

    @NotBlank(message = "Le numéro de permis est obligatoire")
    private String numeroPermis;

    @NotBlank(message = "La catégorie du permis est obligatoire")
    private String categoriePermis;

    private LocalDate dateDelivrancePermis;

    @NotNull(message = "La date d'expiration du permis est obligatoire")
    private LocalDate dateExpirationPermis;

    private StatutConducteur statut;
    private String habilitationsSpeciales;

    // Optional link to Utilisateur
    private Long utilisateurId;
    private String utilisateurNomComplet;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

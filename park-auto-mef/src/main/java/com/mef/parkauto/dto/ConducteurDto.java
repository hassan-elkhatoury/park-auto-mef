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

    /** CIN marocaine : 1 à 2 lettres suivies de 5 à 7 chiffres (ex. AB123456, K12345). */
    @NotBlank(message = "Le N° CIN est obligatoire")
    @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z]{1,2}[0-9]{5,7}$",
            message = "Format de CIN invalide (attendu : 1 à 2 lettres suivies de 5 à 7 chiffres, ex. AB123456)")
    private String cin;

    private String direction;
    private String service;

    @jakarta.validation.constraints.Pattern(regexp = "^$|^(\\+212|0)[5-7][0-9]{8}$",
            message = "Numéro de téléphone marocain invalide (ex. 0612345678 ou +212612345678)")
    private String telephone;

    @jakarta.validation.constraints.Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le numéro de permis est obligatoire")
    @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z0-9/-]{4,30}$",
            message = "Numéro de permis invalide (4 à 30 caractères alphanumériques, '-' ou '/')")
    private String numeroPermis;

    @NotBlank(message = "La catégorie du permis est obligatoire")
    @jakarta.validation.constraints.Pattern(regexp = "^(A|A1|B|C|D|E\\(B\\)|E\\(C\\)|E\\(D\\)|EB|EC|ED)(\\s*[,/+]\\s*(A|A1|B|C|D|E\\(B\\)|E\\(C\\)|E\\(D\\)|EB|EC|ED))*$",
            message = "Catégorie de permis invalide (A, A1, B, C, D, E(B), E(C), E(D) — plusieurs valeurs séparées par des virgules)")
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

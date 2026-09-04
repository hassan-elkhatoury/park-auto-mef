package com.mef.parkauto.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Mise à jour du profil par l'utilisateur connecté.
 * Ne permet pas de changer email, matricule, rôle, direction ou statut.
 */
public record UpdateProfilRequest(
        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
        String nom,

        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
        String prenom,

        @Size(max = 20, message = "Le téléphone ne peut pas dépasser 20 caractères")
        String telephone
) {
}

package com.mef.parkauto.dto.user;

import com.mef.parkauto.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO pour la mise à jour d'un utilisateur.
 * N'inclut pas le mot de passe — les changements de mot de passe
 * seront gérés par un endpoint dédié dans un sprint futur.
 */
public record UtilisateurRequest(
        @NotBlank(message = "Le matricule est obligatoire")
        String matricule,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
        String nom,

        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
        String prenom,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        String email,

        String telephone,
        String direction,
        String service,
        String region,

        UserStatus statut
) {
}

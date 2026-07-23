package com.mef.parkauto.dto.auth;

import com.mef.parkauto.entity.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
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

        @NotNull(message = "Le rôle est obligatoire")
        RoleType role
) {
}

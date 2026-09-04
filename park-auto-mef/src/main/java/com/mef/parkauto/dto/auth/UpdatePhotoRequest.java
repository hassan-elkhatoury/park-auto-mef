package com.mef.parkauto.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Mise à jour de la photo de profil via un chemin public (portrait MEF prédéfini).
 * Les uploads personnalisés passent par {@code multipart/form-data}, pas par ce DTO.
 */
public record UpdatePhotoRequest(
        @NotBlank(message = "L'URL de la photo est obligatoire")
        @Size(max = 1024, message = "L'URL de la photo ne peut pas dépasser 1024 caractères")
        String photoUrl
) {
}

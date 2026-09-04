package com.mef.parkauto.dto.user;

import com.mef.parkauto.dto.role.RoleResponse;
import com.mef.parkauto.entity.UserStatus;

import java.time.LocalDateTime;
public record UtilisateurResponse(
        Long id,
        String matricule,
        String nom,
        String prenom,
        String email,
        String telephone,
        String direction,
        String service,
        String region,
        UserStatus statut,
        RoleResponse role,
        boolean doitChangerMotDePasse,
        String photoUrl,
        LocalDateTime dateCreation,
        LocalDateTime dateModification
) {
}

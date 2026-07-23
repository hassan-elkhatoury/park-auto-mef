package com.mef.parkauto.dto.user;

import com.mef.parkauto.entity.RoleType;
import jakarta.validation.constraints.NotNull;

public record UpdateRolesRequest(
        @NotNull(message = "Le rôle est requis")
        RoleType role
) {
}

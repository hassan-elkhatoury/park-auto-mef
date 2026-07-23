package com.mef.parkauto.dto.role;

import com.mef.parkauto.entity.RoleType;

public record RoleResponse(
        Long id,
        RoleType nom,
        String description
) {
}

package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.role.RoleResponse;
import com.mef.parkauto.entity.Role;
import org.mapstruct.Mapper;

/**
 * MapStruct mapper pour la conversion des entités {@link Role}
 * en DTOs {@link RoleResponse}.
 */
@Mapper(componentModel = "spring")
public interface RoleMapper {

    /**
     * Convertit une entité Role en RoleResponse.
     *
     * @param role l'entité rôle à convertir
     * @return le DTO de réponse correspondant
     */
    RoleResponse toResponse(Role role);
}

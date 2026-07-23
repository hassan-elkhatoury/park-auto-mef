package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.user.UtilisateurRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.entity.Utilisateur;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * MapStruct mapper pour la conversion des entités {@link Utilisateur}
 * en DTOs et la mise à jour partielle depuis les requêtes.
 * <p>
 * Délègue la conversion des rôles au {@link RoleMapper}.
 */
@Mapper(componentModel = "spring", uses = {RoleMapper.class})
public interface UtilisateurMapper {
    /**
     * Convertit une entité Utilisateur en UtilisateurResponse.
     * Les rôles sont automatiquement convertis via {@link RoleMapper}.
     *
     * @param utilisateur l'entité utilisateur à convertir
     * @return le DTO de réponse correspondant
     */
    UtilisateurResponse toResponse(Utilisateur utilisateur);

    /**
     * Met à jour une entité Utilisateur existante à partir d'un UtilisateurRequest.
     * Les propriétés null dans la requête sont ignorées (mise à jour partielle).
     * Les champs sensibles et d'audit sont exclus de la mise à jour.
     *
     * @param request      le DTO contenant les nouvelles valeurs
     * @param utilisateur  l'entité cible à mettre à jour
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "motDePasse", ignore = true)
    @Mapping(target = "sel", ignore = true)
    @Mapping(target = "doitChangerMotDePasse", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "dateCreation", ignore = true)
    @Mapping(target = "dateModification", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntityFromRequest(UtilisateurRequest request, @MappingTarget Utilisateur utilisateur);
}

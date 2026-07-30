package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.ConducteurDto;
import com.mef.parkauto.entity.Conducteur;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ConducteurMapper {

    @Mapping(target = "utilisateurId", source = "utilisateur.id")
    @Mapping(target = "utilisateurNomComplet", expression = "java(conducteur.getUtilisateur() != null ? conducteur.getUtilisateur().getNom() + ' ' + conducteur.getUtilisateur().getPrenom() : null)")
    @Mapping(target = "createdAt", source = "dateCreation")
    @Mapping(target = "updatedAt", source = "dateModification")
    ConducteurDto toDto(Conducteur conducteur);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dateCreation", ignore = true)
    @Mapping(target = "dateModification", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "utilisateur", ignore = true)
    Conducteur toEntity(ConducteurDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dateCreation", ignore = true)
    @Mapping(target = "dateModification", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "utilisateur", ignore = true)
    void updateEntityFromDto(ConducteurDto dto, @MappingTarget Conducteur entity);
}

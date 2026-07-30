package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.DemandeDeplacementDto;
import com.mef.parkauto.entity.DemandeDeplacement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DemandeDeplacementMapper {

    @Mapping(target = "demandeurId", source = "demandeur.id")
    @Mapping(target = "demandeurNomComplet", expression = "java(demande.getDemandeur() != null ? demande.getDemandeur().getNom() + ' ' + demande.getDemandeur().getPrenom() : null)")
    @Mapping(target = "demandeurDirection", source = "demandeur.direction")
    @Mapping(target = "demandeurService", source = "demandeur.service")
    @Mapping(target = "valideurServiceNomComplet", expression = "java(demande.getValideurService() != null ? demande.getValideurService().getNom() + ' ' + demande.getValideurService().getPrenom() : null)")
    @Mapping(target = "approbateurParcNomComplet", expression = "java(demande.getApprobateurParc() != null ? demande.getApprobateurParc().getNom() + ' ' + demande.getApprobateurParc().getPrenom() : null)")
    @Mapping(target = "createdAt", source = "dateCreation")
    @Mapping(target = "updatedAt", source = "dateModification")
    @Mapping(target = "affectationId", ignore = true)
    @Mapping(target = "affectationReference", ignore = true)
    DemandeDeplacementDto toDto(DemandeDeplacement demande);
}

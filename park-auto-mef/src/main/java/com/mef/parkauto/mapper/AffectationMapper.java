package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.AffectationDto;
import com.mef.parkauto.entity.Affectation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AffectationMapper {

    @Mapping(target = "demandeDeplacementId", source = "demandeDeplacement.id")
    @Mapping(target = "demandeReference", source = "demandeDeplacement.reference")
    @Mapping(target = "demandeMotif", source = "demandeDeplacement.motif")
    @Mapping(target = "demandeDestination", source = "demandeDeplacement.destination")
    @Mapping(target = "vehiculeId", source = "vehicule.id")
    @Mapping(target = "vehiculeImmatriculation", source = "vehicule.immatriculation")
    @Mapping(target = "vehiculeMarqueModele", expression = "java(affectation.getVehicule() != null ? affectation.getVehicule().getMarque() + ' ' + affectation.getVehicule().getModele() : null)")
    @Mapping(target = "vehiculeKilometrageActuel", source = "vehicule.kilometrageActuel")
    @Mapping(target = "conducteurId", source = "conducteur.id")
    @Mapping(target = "conducteurNomComplet", expression = "java(affectation.getConducteur() != null ? affectation.getConducteur().getNom() + ' ' + affectation.getConducteur().getPrenom() : null)")
    @Mapping(target = "conducteurNumeroPermis", source = "conducteur.numeroPermis")
    @Mapping(target = "createurId", source = "createur.id")
    @Mapping(target = "createurNomComplet", expression = "java(affectation.getCreateur() != null ? affectation.getCreateur().getNom() + ' ' + affectation.getCreateur().getPrenom() : null)")
    @Mapping(target = "createdAt", source = "dateCreation")
    @Mapping(target = "updatedAt", source = "dateModification")
    AffectationDto toDto(Affectation affectation);
}

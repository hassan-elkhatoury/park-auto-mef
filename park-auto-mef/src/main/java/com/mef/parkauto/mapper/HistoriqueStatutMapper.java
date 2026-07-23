package com.mef.parkauto.mapper;

import com.mef.parkauto.dto.vehicule.HistoriqueStatutResponse;
import com.mef.parkauto.entity.HistoriqueStatutVehicule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HistoriqueStatutMapper {

    @Mapping(target = "vehiculeId", source = "vehicule.id")
    @Mapping(target = "immatriculation", source = "vehicule.immatriculation")
    HistoriqueStatutResponse toResponse(HistoriqueStatutVehicule historique);
}

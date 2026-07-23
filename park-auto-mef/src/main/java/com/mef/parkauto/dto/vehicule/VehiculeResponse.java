package com.mef.parkauto.dto.vehicule;

import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.TypeCarburant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehiculeResponse(
        Long id,
        String immatriculation,
        String ancienneImmatriculation,
        String numeroInventaire,
        String numeroChassis,
        String numeroMoteur,
        String marque,
        String modele,
        String version,
        String categorie,
        String typeVehicule,
        String couleur,
        Integer anneeFabrication,
        LocalDate datePremiereMiseCirculation,

        TypeCarburant typeCarburant,
        Integer puissanceFiscale,
        Integer puissanceReelle,
        Integer cylindree,
        Integer nombrePlaces,
        String typeBoiteVitesses,
        Double capaciteReservoir,
        Double consommationTheorique,
        Long kilometrageInitial,
        Long kilometrageActuel,

        String modeAcquisition,
        String fournisseur,
        LocalDate dateAcquisition,
        LocalDate dateReception,
        BigDecimal montantAcquisition,
        String numeroMarche,
        String numeroBonCommande,
        String referenceFacture,
        Integer dureeGarantie,
        LocalDate dateFinGarantie,

        String organisme,
        String direction,
        String division,
        String service,
        String region,
        String provincePrefecture,
        String commune,
        String centreCout,
        String responsable,

        StatutAdministratif statutAdministratif,
        EtatTechnique etatTechnique,

        LocalDateTime dateCreation,
        LocalDateTime dateModification,
        String createdBy,
        String updatedBy
) {
}

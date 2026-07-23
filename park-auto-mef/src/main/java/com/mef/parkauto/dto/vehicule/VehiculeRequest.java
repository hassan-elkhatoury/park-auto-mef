package com.mef.parkauto.dto.vehicule;

import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.TypeCarburant;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehiculeRequest(
        @NotBlank(message = "L'immatriculation est obligatoire")
        @Size(max = 50, message = "L'immatriculation ne doit pas dépasser 50 caractères")
        String immatriculation,

        String ancienneImmatriculation,

        @NotBlank(message = "Le numéro d'inventaire est obligatoire")
        @Size(max = 50, message = "Le numéro d'inventaire ne doit pas dépasser 50 caractères")
        String numeroInventaire,

        @NotBlank(message = "Le numéro de châssis est obligatoire")
        @Size(max = 50, message = "Le numéro de châssis ne doit pas dépasser 50 caractères")
        String numeroChassis,

        String numeroMoteur,

        @NotBlank(message = "La marque est obligatoire")
        @Size(max = 50, message = "La marque ne doit pas dépasser 50 caractères")
        String marque,

        @NotBlank(message = "Le modèle est obligatoire")
        @Size(max = 50, message = "Le modèle ne doit pas dépasser 50 caractères")
        String modele,

        String version,
        String categorie,
        String typeVehicule,
        String couleur,
        Integer anneeFabrication,
        LocalDate datePremiereMiseCirculation,

        @NotNull(message = "Le type de carburant est obligatoire")
        TypeCarburant typeCarburant,

        Integer puissanceFiscale,
        Integer puissanceReelle,
        Integer cylindree,
        Integer nombrePlaces,
        String typeBoiteVitesses,
        Double capaciteReservoir,
        Double consommationTheorique,

        @NotNull(message = "Le kilométrage initial est obligatoire")
        @Min(value = 0, message = "Le kilométrage initial doit être positif ou nul")
        Long kilometrageInitial,

        @NotNull(message = "Le kilométrage actuel est obligatoire")
        @Min(value = 0, message = "Le kilométrage actuel doit être positif ou nul")
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
        EtatTechnique etatTechnique
) {
}

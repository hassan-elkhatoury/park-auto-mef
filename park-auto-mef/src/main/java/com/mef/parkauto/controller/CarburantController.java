package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.CarteCarburantDto;
import com.mef.parkauto.dto.PleinCarburantDto;
import com.mef.parkauto.dto.PleinCarburantRequest;
import com.mef.parkauto.service.CarburantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carburant")
@RequiredArgsConstructor
@Tag(name = "Gestion Carburant & Cartes", description = "Endpoints pour le suivi des pleins et des cartes dotation carburant")
public class CarburantController {

    private final CarburantService carburantService;

    @GetMapping("/pleins")
    @Operation(summary = "Obtenir la liste de tous les pleins de carburant (triés du plus récent au plus ancien)")
    public ResponseEntity<ApiResponse<List<PleinCarburantDto>>> getAllPleins() {
        List<PleinCarburantDto> pleins = carburantService.getAllPleins();
        return ResponseEntity.ok(ApiResponse.success(pleins, "Liste des pleins récupérée avec succès"));
    }

    @GetMapping("/pleins/vehicule/{vehiculeId}")
    @Operation(summary = "Obtenir l'historique des pleins d'un véhicule")
    public ResponseEntity<ApiResponse<List<PleinCarburantDto>>> getPleinsByVehicule(@PathVariable Long vehiculeId) {
        List<PleinCarburantDto> pleins = carburantService.getPleinsByVehicule(vehiculeId);
        return ResponseEntity.ok(ApiResponse.success(pleins, "Historique du véhicule récupéré avec succès"));
    }

    @GetMapping("/pleins/anomalies")
    @Operation(summary = "Obtenir les pleins présentant une anomalie de surconsommation")
    public ResponseEntity<ApiResponse<List<PleinCarburantDto>>> getAnomaliesSurconsommation() {
        List<PleinCarburantDto> anomalies = carburantService.getAnomaliesSurconsommation();
        return ResponseEntity.ok(ApiResponse.success(anomalies, "Liste des anomalies récupérée avec succès"));
    }

    @PostMapping("/pleins")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONDUCTEUR')")
    @Operation(summary = "Enregistrer un nouveau plein de carburant")
    public ResponseEntity<ApiResponse<PleinCarburantDto>> enregistrerPlein(@Valid @RequestBody PleinCarburantRequest request) {
        PleinCarburantDto plein = carburantService.enregistrerPlein(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(plein, "Plein de carburant enregistré avec succès"));
    }

    @DeleteMapping("/pleins/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Supprimer un enregistrement de plein")
    public ResponseEntity<ApiResponse<Void>> deletePlein(@PathVariable Long id) {
        carburantService.deletePlein(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Enregistrement supprimé avec succès"));
    }

    @GetMapping("/cartes")
    @Operation(summary = "Obtenir toutes les cartes carburant")
    public ResponseEntity<ApiResponse<List<CarteCarburantDto>>> getAllCartes() {
        List<CarteCarburantDto> cartes = carburantService.getAllCartes();
        return ResponseEntity.ok(ApiResponse.success(cartes, "Liste des cartes carburant récupérée"));
    }

    @PostMapping("/cartes")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @Operation(summary = "Créer ou mettre à jour une carte carburant")
    public ResponseEntity<ApiResponse<CarteCarburantDto>> enregistrerCarte(@RequestBody CarteCarburantDto dto) {
        CarteCarburantDto saved = carburantService.enregistrerCarte(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Carte carburant enregistrée avec succès"));
    }

    @DeleteMapping("/cartes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @Operation(summary = "Supprimer une carte carburant")
    public ResponseEntity<ApiResponse<Void>> deleteCarte(@PathVariable Long id) {
        carburantService.deleteCarte(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Carte carburant supprimée avec succès"));
    }
}

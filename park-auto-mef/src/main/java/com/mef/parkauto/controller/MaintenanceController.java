package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@Tag(name = "Gestion Maintenance & Alertes", description = "Endpoints pour le suivi des révisions, réparations et alertes d'échéances")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping("/interventions")
    @Operation(summary = "Obtenir toutes les interventions de maintenance (triées par date récente)")
    public ResponseEntity<ApiResponse<List<InterventionMaintenanceDto>>> getAllInterventions() {
        List<InterventionMaintenanceDto> list = maintenanceService.getAllInterventions();
        return ResponseEntity.ok(ApiResponse.success(list, "Liste des interventions récupérée avec succès"));
    }

    @GetMapping("/interventions/{id}")
    @Operation(summary = "Obtenir une intervention par son identifiant")
    public ResponseEntity<ApiResponse<InterventionMaintenanceDto>> getInterventionById(@PathVariable Long id) {
        InterventionMaintenanceDto dto = maintenanceService.getInterventionById(id);
        return ResponseEntity.ok(ApiResponse.success(dto, "Intervention récupérée avec succès"));
    }

    @GetMapping("/interventions/vehicule/{vehiculeId}")
    @Operation(summary = "Obtenir les interventions de maintenance d'un véhicule")
    public ResponseEntity<ApiResponse<List<InterventionMaintenanceDto>>> getInterventionsByVehicule(@PathVariable Long vehiculeId) {
        List<InterventionMaintenanceDto> list = maintenanceService.getInterventionsByVehicule(vehiculeId);
        return ResponseEntity.ok(ApiResponse.success(list, "Interventions du véhicule récupérées avec succès"));
    }

    @PostMapping("/interventions")
    @Operation(summary = "Créer ou mettre à jour une intervention de maintenance")
    public ResponseEntity<ApiResponse<InterventionMaintenanceDto>> enregistrerIntervention(@Valid @RequestBody InterventionMaintenanceRequest request) {
        InterventionMaintenanceDto dto = maintenanceService.enregistrerIntervention(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Intervention enregistrée avec succès"));
    }

    @PutMapping("/interventions/{id}/cloturer")
    @Operation(summary = "Clôturer formellement une intervention (RG04 : contrôle kilométrage croissant, remise à DISPONIBLE et imputation RG05)")
    public ResponseEntity<ApiResponse<InterventionMaintenanceDto>> cloturerIntervention(
            @PathVariable Long id,
            @Valid @RequestBody ClotureInterventionRequest request) {
        InterventionMaintenanceDto dto = maintenanceService.cloturerIntervention(id, request);
        return ResponseEntity.ok(ApiResponse.success(dto, "Intervention clôturée avec succès"));
    }

    @DeleteMapping("/interventions/{id}")
    @Operation(summary = "Supprimer une intervention de maintenance")
    public ResponseEntity<ApiResponse<Void>> deleteIntervention(@PathVariable Long id) {
        maintenanceService.deleteIntervention(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Intervention supprimée avec succès"));
    }

    @GetMapping("/alertes")
    @Operation(summary = "Obtenir les alertes actives (Maintenance à 90%, Assurances, Contrôle Technique, Vignettes)")
    public ResponseEntity<ApiResponse<List<AlerteEcheanceDto>>> getAlertes() {
        List<AlerteEcheanceDto> alertes = maintenanceService.getAlertesEcheances();
        return ResponseEntity.ok(ApiResponse.success(alertes, "Liste des alertes d'échéances récupérée"));
    }
}

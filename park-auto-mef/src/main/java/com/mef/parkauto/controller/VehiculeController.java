package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.vehicule.HistoriqueStatutResponse;
import com.mef.parkauto.dto.vehicule.StatutChangeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeResponse;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.service.VehiculeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Contrôleur REST pour la gestion du parc automobile et des véhicules.
 */
@RestController
@RequestMapping("/api/vehicules")
@Tag(name = "Véhicules", description = "Endpoints de gestion du parc automobile et des véhicules")
@Slf4j
@RequiredArgsConstructor
public class VehiculeController {

    private final VehiculeService vehiculeService;

    @GetMapping
    @Operation(summary = "Récupère la liste des véhicules (paginée avec filtres multicritères)")
    public ResponseEntity<ApiResponse<Page<VehiculeResponse>>> getAllVehicules(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) StatutAdministratif statut,
            @PageableDefault(size = 10, sort = "id") Pageable pageable
    ) {
        log.info("Requête GET reçue pour la liste des véhicules");
        Page<VehiculeResponse> page = vehiculeService.findAll(search, direction, statut, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Liste des véhicules récupérée avec succès"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère les détails d'un véhicule par son identifiant")
    public ResponseEntity<ApiResponse<VehiculeResponse>> getVehiculeById(@PathVariable Long id) {
        log.info("Requête GET reçue pour le véhicule ID: {}", id);
        VehiculeResponse response = vehiculeService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Détails du véhicule récupérés"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Crée une nouvelle fiche véhicule dans le parc")
    public ResponseEntity<ApiResponse<VehiculeResponse>> createVehicule(@Valid @RequestBody VehiculeRequest request) {
        log.info("Requête POST reçue pour créer un véhicule immatriculation: {}", request.immatriculation());
        VehiculeResponse response = vehiculeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Fiche véhicule créée avec succès"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Met à jour la fiche d'un véhicule existant")
    public ResponseEntity<ApiResponse<VehiculeResponse>> updateVehicule(
            @PathVariable Long id,
            @Valid @RequestBody VehiculeRequest request
    ) {
        log.info("Requête PUT reçue pour mettre à jour le véhicule ID: {}", id);
        VehiculeResponse response = vehiculeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Fiche véhicule mise à jour avec succès"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Archive un véhicule (Soft Delete - statut passé à ARCHIVE)")
    public ResponseEntity<ApiResponse<Void>> archiveVehicule(@PathVariable Long id) {
        log.info("Requête DELETE reçue pour archiver le véhicule ID: {}", id);
        vehiculeService.archive(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Véhicule archivé avec succès"));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Modifie le statut administratif et/ou l'état technique d'un véhicule")
    public ResponseEntity<ApiResponse<VehiculeResponse>> changeVehiculeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatutChangeRequest request
    ) {
        log.info("Requête PUT reçue pour changer le statut du véhicule ID: {}", id);
        VehiculeResponse response = vehiculeService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Statut du véhicule mis à jour avec succès"));
    }

    @GetMapping("/{id}/historique")
    @Operation(summary = "Consulte l'historique des changements de statut d'un véhicule")
    public ResponseEntity<ApiResponse<List<HistoriqueStatutResponse>>> getVehiculeHistory(@PathVariable Long id) {
        log.info("Requête GET reçue pour l'historique du véhicule ID: {}", id);
        List<HistoriqueStatutResponse> history = vehiculeService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history, "Historique du véhicule récupéré avec succès"));
    }
}

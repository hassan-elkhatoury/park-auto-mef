package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ConducteurDto;
import com.mef.parkauto.entity.StatutConducteur;
import com.mef.parkauto.service.ConducteurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/conducteurs")
@RequiredArgsConstructor
@Tag(name = "Gestion des Conducteurs", description = "Endpoints pour la gestion des conducteurs et chauffeurs habilités du MEF")
@SecurityRequirement(name = "Bearer Authentication")
public class ConducteurController {

    private final ConducteurService conducteurService;

    @GetMapping
    @Operation(summary = "Obtenir la liste de tous les conducteurs")
    public ResponseEntity<List<ConducteurDto>> getAllConducteurs() {
        return ResponseEntity.ok(conducteurService.getAllConducteurs());
    }

    @GetMapping("/actifs")
    @Operation(summary = "Obtenir la liste des conducteurs actifs")
    public ResponseEntity<List<ConducteurDto>> getConducteursActifs() {
        return ResponseEntity.ok(conducteurService.getConducteursActifs());
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Obtenir la liste des conducteurs habilités et disponibles (permis valide)")
    public ResponseEntity<List<ConducteurDto>> getConducteursHabilitesDisponibles() {
        return ResponseEntity.ok(conducteurService.getConducteursHabilitesDisponibles());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un conducteur par son ID")
    public ResponseEntity<ConducteurDto> getConducteurById(@PathVariable Long id) {
        return ResponseEntity.ok(conducteurService.getConducteurById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Créer un nouveau conducteur")
    public ResponseEntity<ConducteurDto> createConducteur(@Valid @RequestBody ConducteurDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conducteurService.createConducteur(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Mettre à jour les informations d'un conducteur")
    public ResponseEntity<ConducteurDto> updateConducteur(@PathVariable Long id, @Valid @RequestBody ConducteurDto dto) {
        return ResponseEntity.ok(conducteurService.updateConducteur(id, dto));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Changer le statut d'un conducteur")
    public ResponseEntity<Void> changeStatut(@PathVariable Long id, @RequestParam StatutConducteur statut) {
        conducteurService.changeStatut(id, statut);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @Operation(summary = "Supprimer un conducteur")
    public ResponseEntity<Void> deleteConducteur(@PathVariable Long id) {
        conducteurService.deleteConducteur(id);
        return ResponseEntity.noContent().build();
    }
}

package com.mef.parkauto.controller;

import com.mef.parkauto.dto.AffectationDto;
import com.mef.parkauto.dto.RestitutionRequest;
import com.mef.parkauto.service.AffectationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/affectations")
@RequiredArgsConstructor
@Tag(name = "Affectations & Restitutions", description = "Endpoints pour l'affectation de véhicules/conducteurs et la restitution de fin de mission")
@SecurityRequirement(name = "Bearer Authentication")
public class AffectationController {

    private final AffectationService affectationService;

    @GetMapping
    @Operation(summary = "Obtenir la liste de toutes les affectations")
    public ResponseEntity<List<AffectationDto>> getAllAffectations() {
        return ResponseEntity.ok(affectationService.getAllAffectations());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir les détails d'une affectation par son ID")
    public ResponseEntity<AffectationDto> getAffectationById(@PathVariable Long id) {
        return ResponseEntity.ok(affectationService.getAffectationById(id));
    }

    @GetMapping("/demande/{demandeId}")
    @Operation(summary = "Obtenir l'affectation associée à une demande de déplacement")
    public ResponseEntity<AffectationDto> getAffectationByDemandeId(@PathVariable Long demandeId) {
        return ResponseEntity.ok(affectationService.getAffectationByDemandeId(demandeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Créer une affectation de véhicule et conducteur (Approbation Niveau 2 - Gestionnaire du Parc)")
    public ResponseEntity<AffectationDto> créerAffectation(@Valid @RequestBody AffectationDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(affectationService.créerAffectation(dto));
    }

    @PostMapping("/{id}/restitution")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @Operation(summary = "Enregistrer la restitution d'un véhicule et clôturer la mission")
    public ResponseEntity<AffectationDto> effectuerRestitution(@PathVariable Long id, @Valid @RequestBody RestitutionRequest request) {
        return ResponseEntity.ok(affectationService.effectuerRestitution(id, request));
    }
}

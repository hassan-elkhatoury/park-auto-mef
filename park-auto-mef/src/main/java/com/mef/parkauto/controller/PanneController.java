package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.PanneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pannes")
@RequiredArgsConstructor
@Tag(name = "Gestion des Pannes & Réparations Curatives", description = "Endpoints pour la déclaration, suivi et clôture des pannes avec remorquage")
public class PanneController {

    private final PanneService panneService;

    @GetMapping
    @Operation(summary = "Obtenir toutes les pannes déclarées")
    public ResponseEntity<List<PanneDto>> getAll() {
        return ResponseEntity.ok(panneService.getAllPannes());
    }

    @GetMapping("/vehicule/{vehiculeId}")
    @Operation(summary = "Obtenir les pannes d'un véhicule")
    public ResponseEntity<List<PanneDto>> getByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(panneService.getPannesByVehicule(vehiculeId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'une panne par son id")
    public ResponseEntity<PanneDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(panneService.getPanneById(id));
    }

    @PostMapping({"", "/", "/declarer"})
    @Operation(summary = "Déclarer une nouvelle panne (RG02 : bascule automatique à EN_REPARATION)")
    public ResponseEntity<PanneDto> declarer(@Valid @RequestBody PanneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(panneService.declarerPanne(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une panne")
    public ResponseEntity<PanneDto> modifier(@PathVariable Long id, @Valid @RequestBody PanneRequest request) {
        request.setId(id);
        return ResponseEntity.ok(panneService.declarerPanne(request));
    }

    @PutMapping("/{id}/cloturer")
    @Operation(summary = "Clôturer une réparation curative (RG04 : contrôle kilométrage croissant & remise à DISPONIBLE)")
    public ResponseEntity<PanneDto> cloturer(@PathVariable Long id, @Valid @RequestBody CloturePanneRequest request) {
        return ResponseEntity.ok(panneService.cloturerReparation(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un dossier de panne")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        panneService.supprimerPanne(id);
        return ResponseEntity.noContent().build();
    }
}

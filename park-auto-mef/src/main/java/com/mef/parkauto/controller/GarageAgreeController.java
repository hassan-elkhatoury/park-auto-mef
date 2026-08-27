package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.GarageAgreeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garages")
@RequiredArgsConstructor
@Tag(name = "Référentiel Garages Agréés & Pièces", description = "Endpoints pour la gestion des garages partenaires MEF et pièces détachées")
public class GarageAgreeController {

    private final GarageAgreeService garageService;

    @GetMapping
    @Operation(summary = "Obtenir tous les garages agréés")
    public ResponseEntity<List<GarageAgreeDto>> getAll() {
        return ResponseEntity.ok(garageService.getAllGarages());
    }

    @GetMapping("/actifs")
    @Operation(summary = "Obtenir la liste des garages actifs conventionnés")
    public ResponseEntity<List<GarageAgreeDto>> getActifs() {
        return ResponseEntity.ok(garageService.getGaragesActifs());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un garage agréé par son identifiant")
    public ResponseEntity<GarageAgreeDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(garageService.getGarageById(id));
    }

    @PostMapping
    @Operation(summary = "Créer ou mettre à jour un garage agréé")
    public ResponseEntity<GarageAgreeDto> enregistrer(@Valid @RequestBody GarageAgreeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(garageService.creerOuModifierGarage(request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un garage agréé")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        garageService.supprimerGarage(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pieces")
    @Operation(summary = "Catalogue général des pièces de rechange")
    public ResponseEntity<List<PieceRemplacementDto>> getAllPieces() {
        return ResponseEntity.ok(garageService.getAllPieces());
    }

    @GetMapping("/{garageId}/pieces")
    @Operation(summary = "Pièces fournies par un garage spécifique")
    public ResponseEntity<List<PieceRemplacementDto>> getPiecesByGarage(@PathVariable Long garageId) {
        return ResponseEntity.ok(garageService.getPiecesByGarage(garageId));
    }

    @PostMapping("/pieces")
    @Operation(summary = "Ajouter une pièce au catalogue")
    public ResponseEntity<PieceRemplacementDto> creerPiece(@Valid @RequestBody PieceRemplacementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(garageService.creerPiece(request));
    }
}

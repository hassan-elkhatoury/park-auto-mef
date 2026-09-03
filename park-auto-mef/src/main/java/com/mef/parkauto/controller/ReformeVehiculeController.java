package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.service.ReformeVehiculeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reformes")
@RequiredArgsConstructor
public class ReformeVehiculeController {
    private final ReformeVehiculeService reformeService;

    @GetMapping public ResponseEntity<List<ReformeVehiculeDto>> getAll() { return ResponseEntity.ok(reformeService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> getById(@PathVariable Long id) { return ResponseEntity.ok(reformeService.getById(id)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @PostMapping public ResponseEntity<ReformeVehiculeDto> creer(@RequestBody ReformeVehiculeRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(reformeService.creerOuModifier(req)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @PutMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> modifier(@PathVariable Long id, @RequestBody ReformeVehiculeRequest req) { req.setId(id); return ResponseEntity.ok(reformeService.creerOuModifier(req)); }
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/valider") public ResponseEntity<ReformeVehiculeDto> valider(@PathVariable Long id) { return ResponseEntity.ok(reformeService.valider(id)); }
    /** Transition de statut contrôlée par la machine à états RG07 (INITIE → EN_COURS_DE_REFORME → VALIDE → REFORME → VENDU). */
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @PostMapping("/{id}/statut/{statut}") public ResponseEntity<ReformeVehiculeDto> changerStatut(@PathVariable Long id, @PathVariable com.mef.parkauto.entity.StatutReforme statut) { return ResponseEntity.ok(reformeService.changerStatut(id, statut)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { reformeService.supprimer(id); return ResponseEntity.noContent().build(); }
}

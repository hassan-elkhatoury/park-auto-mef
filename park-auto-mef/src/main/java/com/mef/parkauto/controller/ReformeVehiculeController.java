package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.service.ReformeVehiculeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reformes")
@RequiredArgsConstructor
public class ReformeVehiculeController {
    private final ReformeVehiculeService reformeService;

    @GetMapping public ResponseEntity<List<ReformeVehiculeDto>> getAll() { return ResponseEntity.ok(reformeService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> getById(@PathVariable Long id) { return ResponseEntity.ok(reformeService.getById(id)); }
    @PostMapping public ResponseEntity<ReformeVehiculeDto> creer(@RequestBody ReformeVehiculeRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(reformeService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> modifier(@PathVariable Long id, @RequestBody ReformeVehiculeRequest req) { req.setId(id); return ResponseEntity.ok(reformeService.creerOuModifier(req)); }
    @PostMapping("/{id}/valider") public ResponseEntity<ReformeVehiculeDto> valider(@PathVariable Long id) { return ResponseEntity.ok(reformeService.valider(id)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { reformeService.supprimer(id); return ResponseEntity.noContent().build(); }
}

package com.mef.parkauto.controller;

import com.mef.parkauto.dto.VisiteTechniqueDto;
import com.mef.parkauto.dto.VisiteTechniqueRequest;
import com.mef.parkauto.service.VisiteTechniqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visites-techniques")
@RequiredArgsConstructor
public class VisiteTechniqueController {
    private final VisiteTechniqueService vtService;

    @GetMapping public ResponseEntity<List<VisiteTechniqueDto>> getAll() { return ResponseEntity.ok(vtService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<VisiteTechniqueDto> getById(@PathVariable Long id) { return ResponseEntity.ok(vtService.getById(id)); }
    @GetMapping("/vehicule/{vehiculeId}") public ResponseEntity<List<VisiteTechniqueDto>> getByVehicule(@PathVariable Long vehiculeId) { return ResponseEntity.ok(vtService.getByVehicule(vehiculeId)); }
    @PostMapping public ResponseEntity<VisiteTechniqueDto> creer(@RequestBody VisiteTechniqueRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(vtService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<VisiteTechniqueDto> modifier(@PathVariable Long id, @RequestBody VisiteTechniqueRequest req) { req.setId(id); return ResponseEntity.ok(vtService.creerOuModifier(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { vtService.supprimer(id); return ResponseEntity.noContent().build(); }
}

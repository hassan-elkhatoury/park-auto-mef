package com.mef.parkauto.controller;

import com.mef.parkauto.dto.AssuranceDto;
import com.mef.parkauto.dto.AssuranceRequest;
import com.mef.parkauto.service.AssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assurances")
@RequiredArgsConstructor
public class AssuranceController {

    private final AssuranceService assuranceService;

    @GetMapping
    public ResponseEntity<List<AssuranceDto>> getAll() {
        return ResponseEntity.ok(assuranceService.getAllAssurances());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssuranceDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assuranceService.getById(id));
    }

    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<AssuranceDto>> getByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(assuranceService.getByVehicule(vehiculeId));
    }

    @GetMapping("/expirant-bientot")
    public ResponseEntity<List<AssuranceDto>> getExpirantBientot() {
        return ResponseEntity.ok(assuranceService.getAssurancesExpirantBientot());
    }

    @PostMapping
    public ResponseEntity<AssuranceDto> creer(@RequestBody AssuranceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assuranceService.creerOuModifier(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssuranceDto> modifier(@PathVariable Long id, @RequestBody AssuranceRequest request) {
        request.setId(id);
        return ResponseEntity.ok(assuranceService.creerOuModifier(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        assuranceService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}

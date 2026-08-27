package com.mef.parkauto.controller;

import com.mef.parkauto.dto.SinistreDto;
import com.mef.parkauto.dto.SinistreRequest;
import com.mef.parkauto.service.SinistreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sinistres")
@RequiredArgsConstructor
public class SinistreController {

    private final SinistreService sinistreService;

    @GetMapping
    public ResponseEntity<List<SinistreDto>> getAll() {
        return ResponseEntity.ok(sinistreService.getAllSinistres());
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<SinistreDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sinistreService.getById(id));
    }

    @GetMapping("/vehicule/{vehiculeId:\\d+}")
    public ResponseEntity<List<SinistreDto>> getByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(sinistreService.getByVehicule(vehiculeId));
    }

    @PostMapping({"", "/", "/declarer"})
    public ResponseEntity<SinistreDto> declarer(@RequestBody SinistreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sinistreService.declarer(request));
    }

    @PutMapping({"/{id:\\d+}", "/modifier/{id:\\d+}"})
    public ResponseEntity<SinistreDto> modifier(@PathVariable Long id, @RequestBody SinistreRequest request) {
        return ResponseEntity.ok(sinistreService.modifier(id, request));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        sinistreService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}

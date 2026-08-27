package com.mef.parkauto.controller;

import com.mef.parkauto.dto.TaxeAutomobileDto;
import com.mef.parkauto.dto.TaxeAutomobileRequest;
import com.mef.parkauto.service.TaxeAutomobileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taxes-automobiles")
@RequiredArgsConstructor
public class TaxeAutomobileController {
    private final TaxeAutomobileService taxeService;

    @GetMapping public ResponseEntity<List<TaxeAutomobileDto>> getAll() { return ResponseEntity.ok(taxeService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<TaxeAutomobileDto> getById(@PathVariable Long id) { return ResponseEntity.ok(taxeService.getById(id)); }
    @PostMapping public ResponseEntity<TaxeAutomobileDto> creer(@RequestBody TaxeAutomobileRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(taxeService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<TaxeAutomobileDto> modifier(@PathVariable Long id, @RequestBody TaxeAutomobileRequest req) { req.setId(id); return ResponseEntity.ok(taxeService.creerOuModifier(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { taxeService.supprimer(id); return ResponseEntity.noContent().build(); }
}

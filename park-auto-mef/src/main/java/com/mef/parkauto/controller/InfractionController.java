package com.mef.parkauto.controller;

import com.mef.parkauto.dto.InfractionDto;
import com.mef.parkauto.dto.InfractionRequest;
import com.mef.parkauto.service.InfractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infractions")
@RequiredArgsConstructor
public class InfractionController {
    private final InfractionService infractionService;

    @GetMapping public ResponseEntity<List<InfractionDto>> getAll() { return ResponseEntity.ok(infractionService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<InfractionDto> getById(@PathVariable Long id) { return ResponseEntity.ok(infractionService.getById(id)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @PostMapping public ResponseEntity<InfractionDto> creer(@RequestBody InfractionRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(infractionService.creerOuModifier(req)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @PutMapping("/{id}") public ResponseEntity<InfractionDto> modifier(@PathVariable Long id, @RequestBody InfractionRequest req) { req.setId(id); return ResponseEntity.ok(infractionService.creerOuModifier(req)); }
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL')")
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { infractionService.supprimer(id); return ResponseEntity.noContent().build(); }
}

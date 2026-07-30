package com.mef.parkauto.controller;

import com.mef.parkauto.dto.DemandeDeplacementDto;
import com.mef.parkauto.dto.ValidationDemandeRequest;
import com.mef.parkauto.entity.StatutDemande;
import com.mef.parkauto.service.DemandeDeplacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
@Tag(name = "Demandes de Déplacement", description = "Endpoints pour la réservation, validation N1 et gestion des demandes de mission")
@SecurityRequirement(name = "Bearer Authentication")
public class DemandeDeplacementController {

    private final DemandeDeplacementService demandeService;

    @GetMapping
    @Operation(summary = "Obtenir la liste de toutes les demandes de déplacement")
    public ResponseEntity<List<DemandeDeplacementDto>> getAllDemandes(@RequestParam(required = false) StatutDemande statut) {
        if (statut != null) {
            return ResponseEntity.ok(demandeService.getDemandesByStatut(statut));
        }
        return ResponseEntity.ok(demandeService.getAllDemandes());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir les détails d'une demande par son ID")
    public ResponseEntity<DemandeDeplacementDto> getDemandeById(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDemandeById(id));
    }

    @PostMapping
    @Operation(summary = "Soumettre une nouvelle demande de réservation / déplacement (Formulaire Agent)")
    public ResponseEntity<DemandeDeplacementDto> createDemande(@Valid @RequestBody DemandeDeplacementDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(demandeService.createDemande(dto));
    }

    @PatchMapping("/{id}/validation-service")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_SERVICE', 'GESTIONNAIRE_CENTRAL')")
    @Operation(summary = "Validation / Rejet Niveau 1 par le Responsable de Service (Motif obligatoire si rejet)")
    public ResponseEntity<DemandeDeplacementDto> validerNiveau1(@PathVariable Long id, @Valid @RequestBody ValidationDemandeRequest validationRequest) {
        return ResponseEntity.ok(demandeService.validerNiveau1(id, validationRequest));
    }

    @PatchMapping("/{id}/annuler")
    @Operation(summary = "Annuler une demande de déplacement")
    public ResponseEntity<Void> annulerDemande(@PathVariable Long id) {
        demandeService.annulerDemande(id);
        return ResponseEntity.noContent().build();
    }
}

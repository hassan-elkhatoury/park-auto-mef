package com.mef.parkauto.controller;

import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.service.OrdreMissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ordres-de-mission")
@RequiredArgsConstructor
@Tag(name = "Ordres de Mission", description = "Endpoints pour l'émission et l'impression des Ordres de Mission officiels du MEF en PDF")
@SecurityRequirement(name = "Bearer Authentication")
public class OrdreMissionController {

    private final OrdreMissionService ordreMissionService;

    @GetMapping("/{affectationId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION', 'CONDUCTEUR')")
    @Operation(summary = "Générer et afficher le document PDF officiel de l'Ordre de Mission (QR code d'authentification inclus)")
    public ResponseEntity<byte[]> getOrdreMissionPdf(@PathVariable Long affectationId, Authentication authentication) {
        // Un conducteur ne peut consulter que les ordres de mission qui le concernent
        Utilisateur utilisateur = authentication != null && authentication.getPrincipal() instanceof Utilisateur u ? u : null;
        ordreMissionService.verifierAcces(affectationId, utilisateur);

        byte[] pdfBytes = ordreMissionService.generateOrdreMissionPdf(affectationId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        // Inline content disposition allows direct browser preview & one-click print
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"ordre-de-mission-" + affectationId + ".pdf\"");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping(value = "/{affectationId}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'CONSULTATION', 'CONDUCTEUR')")
    @Operation(summary = "QR code HMAC-SHA256 de l'ordre de mission (contrôle d'authenticité)")
    public ResponseEntity<byte[]> getOrdreMissionQr(@PathVariable Long affectationId, Authentication authentication) {
        Utilisateur utilisateur = authentication != null && authentication.getPrincipal() instanceof Utilisateur u ? u : null;
        ordreMissionService.verifierAcces(affectationId, utilisateur);
        byte[] png = ordreMissionService.generateQrPngForAffectation(affectationId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }
}

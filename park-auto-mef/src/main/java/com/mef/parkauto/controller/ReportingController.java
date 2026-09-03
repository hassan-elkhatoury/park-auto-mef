package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.ReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reporting")
@RequiredArgsConstructor
@Tag(name = "Reporting Décisionnel & TCO MEF", description = "États financiers, calcul du TCO dynamique (MAD/km), consolidations par motorisation et direction, exports Excel et PDF")
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONSULTATION')")
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/summary")
    @Operation(summary = "Obtenir la synthèse exécutive globale du parc automobile")
    public ResponseEntity<ApiResponse<ExecutiveSummaryDto>> getExecutiveSummary() {
        ExecutiveSummaryDto summary = reportingService.getExecutiveSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Synthèse exécutive récupérée avec succès"));
    }

    @GetMapping("/tco/vehicules")
    @Operation(summary = "Obtenir le TCO détaillé par véhicule avec ratio MAD / km")
    public ResponseEntity<ApiResponse<List<TcoVehiculeDto>>> getTcoParVehicule() {
        List<TcoVehiculeDto> list = reportingService.getTcoParVehicule();
        return ResponseEntity.ok(ApiResponse.success(list, "TCO par véhicule récupéré avec succès"));
    }

    @GetMapping("/tco/directions")
    @Operation(summary = "Obtenir le TCO agrégé par direction du MEF")
    public ResponseEntity<ApiResponse<List<TcoDirectionDto>>> getTcoParDirection() {
        List<TcoDirectionDto> list = reportingService.getTcoParDirection();
        return ResponseEntity.ok(ApiResponse.success(list, "TCO par direction récupéré avec succès"));
    }

    @GetMapping("/tco/motorisations")
    @Operation(summary = "Obtenir le TCO et bilan carbone consolidé par type de motorisation")
    public ResponseEntity<ApiResponse<List<TcoMotorisationDto>>> getTcoParMotorisation() {
        List<TcoMotorisationDto> list = reportingService.getTcoParMotorisation();
        return ResponseEntity.ok(ApiResponse.success(list, "TCO par motorisation récupéré avec succès"));
    }

    @GetMapping("/tco/consolidation")
    @Operation(summary = "Obtenir la consolidation décisionnelle complète (Direction, Motorisation, KPIs globaux)")
    public ResponseEntity<ApiResponse<TcoConsolidationDto>> getTcoConsolidation() {
        TcoConsolidationDto dto = reportingService.getTcoConsolidation();
        return ResponseEntity.ok(ApiResponse.success(dto, "Consolidation TCO récupérée avec succès"));
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Exporter le rapport décisionnel complet en format Excel (.xlsx avec formules)")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] excelBytes = reportingService.generateExcelReport();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Rapport_TCO_MEF_" + timestamp + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/export/pdf")
    @Operation(summary = "Exporter le rapport financier exécutif officiel en format PDF")
    public ResponseEntity<byte[]> exportPdf() {
        byte[] pdfBytes = reportingService.generatePdfReport();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Rapport_Financier_Executif_MEF_" + timestamp + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Exporter les données consolidées du parc et TCO en format CSV normalisé (SID MEF)")
    public ResponseEntity<byte[]> exportCsv() {
        byte[] csvBytes = reportingService.generateCsvReport();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Rapport_TCO_MEF_" + timestamp + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}

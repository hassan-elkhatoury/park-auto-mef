package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.ExecutiveSummaryDto;
import com.mef.parkauto.dto.TcoDirectionDto;
import com.mef.parkauto.dto.TcoVehiculeDto;
import com.mef.parkauto.service.ReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reporting")
@RequiredArgsConstructor
@Tag(name = "Reporting Exécutif & Exports TCO", description = "Endpoints pour les tableaux de bord analytiques, calcul du TCO et exportations Excel/PDF")
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/summary")
    @Operation(summary = "Obtenir la synthèse exécutive du parc (KPIs, TCO global, taux d'immobilisation, émissions CO2)")
    public ResponseEntity<ApiResponse<ExecutiveSummaryDto>> getExecutiveSummary() {
        ExecutiveSummaryDto summary = reportingService.getExecutiveSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Synthèse exécutive récupérée avec succès"));
    }

    @GetMapping("/tco/vehicules")
    @Operation(summary = "Obtenir le TCO détaillé par véhicule (Acquisition + Carburant + Maintenance)")
    public ResponseEntity<ApiResponse<List<TcoVehiculeDto>>> getTcoParVehicule() {
        List<TcoVehiculeDto> list = reportingService.getTcoParVehicule();
        return ResponseEntity.ok(ApiResponse.success(list, "TCO par véhicule récupéré avec succès"));
    }

    @GetMapping("/tco/directions")
    @Operation(summary = "Obtenir le TCO agrégé par Direction du MEF")
    public ResponseEntity<ApiResponse<List<TcoDirectionDto>>> getTcoParDirection() {
        List<TcoDirectionDto> list = reportingService.getTcoParDirection();
        return ResponseEntity.ok(ApiResponse.success(list, "TCO par direction récupéré avec succès"));
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Télécharger le rapport de synthèse au format Excel (.xlsx)")
    public ResponseEntity<byte[]> downloadExcelReport() {
        byte[] excelBytes = reportingService.generateExcelReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Rapport_TCO_MEF.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @GetMapping("/export/pdf")
    @Operation(summary = "Télécharger le rapport exécutif au format PDF (.pdf)")
    public ResponseEntity<byte[]> downloadPdfReport() {
        byte[] pdfBytes = reportingService.generatePdfReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Rapport_Executif_MEF.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}

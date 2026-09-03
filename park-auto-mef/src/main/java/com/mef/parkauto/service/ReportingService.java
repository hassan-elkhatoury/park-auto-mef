package com.mef.parkauto.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportingService {

    private final VehiculeRepository vehiculeRepository;
    private final PleinCarburantRepository pleinCarburantRepository;
    private final InterventionMaintenanceRepository maintenanceRepository;
    private final AssuranceRepository assuranceRepository;
    private final TaxeAutomobileRepository taxeRepository;
    private final SinistreRepository sinistreRepository;
    private final BudgetDirectionRepository budgetRepository;
    private final EngagementBudgetaireRepository engagementRepository;
    private final MaintenanceService maintenanceService;

    // ==========================================
    // 1. TCO DÉTAILLÉ PAR VÉHICULE (RG02)
    // ==========================================

    @Transactional(readOnly = true)
    public List<TcoVehiculeDto> getTcoParVehicule() {
        List<Vehicule> vehicules = vehiculeRepository.findAll();
        List<TcoVehiculeDto> list = new ArrayList<>();

        for (Vehicule v : vehicules) {
            BigDecimal acq = v.getMontantAcquisition() != null ? v.getMontantAcquisition() : BigDecimal.ZERO;
            BigDecimal carb = pleinCarburantRepository.sumMontantByVehiculeId(v.getId());
            if (carb == null) carb = BigDecimal.ZERO;

            BigDecimal maint = maintenanceRepository.sumMontantByVehiculeId(v.getId());
            if (maint == null) maint = BigDecimal.ZERO;

            List<Assurance> assurances = assuranceRepository.findByVehiculeIdOrderByDateFinDesc(v.getId());
            BigDecimal coutAssurance = assurances.stream()
                    .map(Assurance::getMontantPrime)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<TaxeAutomobile> taxes = taxeRepository.findByVehiculeIdOrderByAnneeDesc(v.getId());
            BigDecimal coutTaxes = taxes.stream()
                    .map(TaxeAutomobile::getMontant)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<Sinistre> sinistres = sinistreRepository.findByVehiculeIdOrderByDateAccidentDesc(v.getId());
            BigDecimal coutSinistres = sinistres.stream()
                    .map(Sinistre::getMontantFranchise)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal tco = acq.add(carb).add(maint).add(coutAssurance).add(coutTaxes).add(coutSinistres);

            List<PleinCarburant> pleins = pleinCarburantRepository.findByVehiculeIdOrderByDatePleinDesc(v.getId());
            double totalLitres = pleins.stream().mapToDouble(PleinCarburant::getQuantiteLitres).sum();
            Double consoMoy = pleins.isEmpty() ? null : pleins.get(0).getConsommationMoyenne();

            Long km = v.getKilometrageActuel();
            Double madKm = null;
            if (km != null && km > 0 && tco.compareTo(BigDecimal.ZERO) > 0) {
                madKm = tco.divide(BigDecimal.valueOf(km), 4, RoundingMode.HALF_UP).doubleValue();
            }

            list.add(TcoVehiculeDto.builder()
                    .vehiculeId(v.getId())
                    .id(v.getId())
                    .immatriculation(v.getImmatriculation())
                    .matricule(v.getImmatriculation())
                    .marque(v.getMarque())
                    .modele(v.getModele())
                    .marqueModele(v.getMarque() + " " + v.getModele())
                    .direction(v.getDirection() != null ? v.getDirection() : "Direction Générale")
                    .typeCarburant(v.getTypeCarburant() != null ? v.getTypeCarburant().name() : "DIESEL")
                    .coutAcquisition(acq)
                    .coutCarburant(carb)
                    .coutCarburantTotal(carb)
                    .coutMaintenance(maint)
                    .coutMaintenanceTotal(maint)
                    .coutAssurance(coutAssurance)
                    .coutAssuranceTotal(coutAssurance)
                    .coutTaxes(coutTaxes)
                    .coutTaxesTotal(coutTaxes)
                    .coutSinistresTotal(coutSinistres)
                    .tcoTotal(tco)
                    .coutKm(madKm)
                    .coutKilometriqueMadKm(madKm)
                    .totalLitresCarburant(totalLitres)
                    .kilometrageActuel(km != null ? km : 0L)
                    .consommationMoyenne(consoMoy)
                    .statutAdministratif(v.getStatutAdministratif() != null ? v.getStatutAdministratif().name() : "DISPONIBLE")
                    .build());
        }
        return list;
    }

    // ==========================================
    // 2. AGRÉGATION TCO PAR DIRECTION (RG05)
    // ==========================================

    @Transactional(readOnly = true)
    public List<TcoDirectionDto> getTcoParDirection() {
        List<TcoVehiculeDto> tcoVehicules = getTcoParVehicule();
        Map<String, List<TcoVehiculeDto>> parDir = tcoVehicules.stream()
                .collect(Collectors.groupingBy(TcoVehiculeDto::getDirection));

        List<TcoDirectionDto> result = new ArrayList<>();
        for (Map.Entry<String, List<TcoVehiculeDto>> entry : parDir.entrySet()) {
            String dir = entry.getKey();
            List<TcoVehiculeDto> vList = entry.getValue();

            long count = vList.size();
            BigDecimal sumAcq = vList.stream().map(v -> v.getCoutAcquisition() != null ? v.getCoutAcquisition() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumCarb = vList.stream().map(v -> v.getCoutCarburantTotal() != null ? v.getCoutCarburantTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumMaint = vList.stream().map(v -> v.getCoutMaintenanceTotal() != null ? v.getCoutMaintenanceTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumTco = vList.stream().map(v -> v.getTcoTotal() != null ? v.getTcoTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal moyTco = count > 0 ? sumTco.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            long dirKm = vList.stream().mapToLong(v -> v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L).sum();
            Double dirMadKm = (dirKm > 0 && sumTco.compareTo(BigDecimal.ZERO) > 0)
                    ? sumTco.divide(BigDecimal.valueOf(dirKm), 4, RoundingMode.HALF_UP).doubleValue() : null;

            result.add(TcoDirectionDto.builder()
                    .direction(dir)
                    .nombreVehicules(count)
                    .totalAcquisition(sumAcq)
                    .totalCarburant(sumCarb)
                    .totalMaintenance(sumMaint)
                    .tcoTotal(sumTco)
                    .tcoMoyenParVehicule(moyTco)
                    .coutMoyenKm(dirMadKm)
                    .build());
        }

        result.sort((a, b) -> b.getTcoTotal().compareTo(a.getTcoTotal()));
        return result;
    }

    // ==========================================
    // 3. CONSOLIDATION PAR MOTORISATION (RG05)
    // ==========================================

    @Transactional(readOnly = true)
    public List<TcoMotorisationDto> getTcoParMotorisation() {
        List<TcoVehiculeDto> tcoVehicules = getTcoParVehicule();
        Map<String, List<TcoVehiculeDto>> parMotor = tcoVehicules.stream()
                .collect(Collectors.groupingBy(v -> v.getTypeCarburant() != null ? v.getTypeCarburant() : "DIESEL"));

        List<TcoMotorisationDto> result = new ArrayList<>();
        for (Map.Entry<String, List<TcoVehiculeDto>> entry : parMotor.entrySet()) {
            String motor = entry.getKey();
            List<TcoVehiculeDto> vList = entry.getValue();

            long count = vList.size();
            BigDecimal sumAcq = vList.stream().map(v -> v.getCoutAcquisition() != null ? v.getCoutAcquisition() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumCarb = vList.stream().map(v -> v.getCoutCarburantTotal() != null ? v.getCoutCarburantTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumMaint = vList.stream().map(v -> v.getCoutMaintenanceTotal() != null ? v.getCoutMaintenanceTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumTco = vList.stream().map(v -> v.getTcoTotal() != null ? v.getTcoTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal moyTco = count > 0 ? sumTco.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            long totalKm = vList.stream().mapToLong(v -> v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L).sum();
            Double madKm = (totalKm > 0 && sumTco.compareTo(BigDecimal.ZERO) > 0)
                    ? sumTco.divide(BigDecimal.valueOf(totalKm), 4, RoundingMode.HALF_UP).doubleValue() : null;

            double totalL = vList.stream().mapToDouble(v -> v.getTotalLitresCarburant() != null ? v.getTotalLitresCarburant() : 0.0).sum();
            double co2Factor = "ESSENCE".equalsIgnoreCase(motor) ? 2.39 : 2.64;
            double co2Kg = Math.round(totalL * co2Factor * 10.0) / 10.0;

            result.add(TcoMotorisationDto.builder()
                    .typeCarburant(motor)
                    .nombreVehicules(count)
                    .totalAcquisition(sumAcq)
                    .totalCarburant(sumCarb)
                    .totalMaintenance(sumMaint)
                    .tcoTotal(sumTco)
                    .tcoMoyen(moyTco)
                    .coutKm(madKm)
                    .coutMoyenKm(madKm)
                    .coutKilometriqueMadKm(madKm)
                    .totalLitres(totalL)
                    .totalCO2Kg(co2Kg)
                    .build());
        }

        result.sort((a, b) -> b.getTcoTotal().compareTo(a.getTcoTotal()));
        return result;
    }

    // ==========================================
    // 4. CONSOLIDATION GLOBALE TCO & FLOTTE
    // ==========================================

    @Transactional(readOnly = true)
    public TcoConsolidationDto getTcoConsolidation() {
        List<TcoVehiculeDto> vehicules = getTcoParVehicule();
        List<TcoDirectionDto> parDir = getTcoParDirection();
        List<TcoMotorisationDto> parMotor = getTcoParMotorisation();

        long totalV = vehicules.size();
        BigDecimal totalTco = vehicules.stream().map(v -> v.getTcoTotal() != null ? v.getTcoTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moyTco = totalV > 0 ? totalTco.divide(BigDecimal.valueOf(totalV), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        long totalKm = vehicules.stream().mapToLong(v -> v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L).sum();
        Double madKm = (totalKm > 0 && totalTco.compareTo(BigDecimal.ZERO) > 0)
                ? totalTco.divide(BigDecimal.valueOf(totalKm), 4, RoundingMode.HALF_UP).doubleValue() : 0.0;

        double totalLitres = pleinCarburantRepository.sumTotalLitres();
        if (Double.isNaN(totalLitres)) totalLitres = 0.0;
        double co2Tonnes = Math.round((totalLitres * 2.64 / 1000.0) * 100.0) / 100.0;

        return TcoConsolidationDto.builder()
                .tcoGlobalTotal(totalTco)
                .coutMoyenParVehicule(moyTco)
                .coutMoyenKilometriqueMadKm(madKm)
                .totalVehicules(totalV)
                .totalKilometrageFlotte(totalKm)
                .totalEmissionsCO2Tonnes(co2Tonnes)
                .parMotorisation(parMotor)
                .parDirection(parDir)
                .build();
    }

    // ==========================================
    // 5. SYNTHÈSE EXÉCUTIVE PILOTAGE
    // ==========================================

    @Transactional(readOnly = true)
    public ExecutiveSummaryDto getExecutiveSummary() {
        List<TcoVehiculeDto> vehicules = getTcoParVehicule();
        List<TcoDirectionDto> directions = getTcoParDirection();
        List<TcoMotorisationDto> motorisations = getTcoParMotorisation();

        long totalV = vehicules.size();
        long immobV = vehicules.stream().filter(v -> 
                "EN_MAINTENANCE".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "EN_ENTRETIEN".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "EN_REPARATION".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "IMMOBILISE".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "ACCIDENTE".equalsIgnoreCase(v.getStatutAdministratif())).count();

        double tauxImmob = totalV > 0 ? Math.round((immobV * 100.0 / totalV) * 10.0) / 10.0 : 0.0;

        long affectesV = vehicules.stream().filter(v -> "AFFECTE".equalsIgnoreCase(v.getStatutAdministratif())).count();
        long disponiblesV = vehicules.stream().filter(v -> "DISPONIBLE".equalsIgnoreCase(v.getStatutAdministratif())).count();
        long reformesV = vehicules.stream().filter(v ->
                "REFORME".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "VENDU".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "ARCHIVE".equalsIgnoreCase(v.getStatutAdministratif())).count();
        long enServiceV = totalV - reformesV;
        double tauxUtilisation = enServiceV > 0 ? Math.round((affectesV * 100.0 / enServiceV) * 10.0) / 10.0 : 0.0;

        BigDecimal totalAcq = vehicules.stream().map(v -> v.getCoutAcquisition() != null ? v.getCoutAcquisition() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCarb = vehicules.stream().map(v -> v.getCoutCarburantTotal() != null ? v.getCoutCarburantTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMaint = vehicules.stream().map(v -> v.getCoutMaintenanceTotal() != null ? v.getCoutMaintenanceTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAssur = vehicules.stream().map(v -> v.getCoutAssuranceTotal() != null ? v.getCoutAssuranceTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTaxes = vehicules.stream().map(v -> v.getCoutTaxesTotal() != null ? v.getCoutTaxesTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tcoGlobal = vehicules.stream().map(v -> v.getTcoTotal() != null ? v.getTcoTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalKm = vehicules.stream().mapToLong(v -> v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L).sum();
        Double madKm = (totalKm > 0 && tcoGlobal.compareTo(BigDecimal.ZERO) > 0)
                ? tcoGlobal.divide(BigDecimal.valueOf(totalKm), 4, RoundingMode.HALF_UP).doubleValue() : 0.0;

        double totalLitres = pleinCarburantRepository.sumTotalLitres();
        if (Double.isNaN(totalLitres)) totalLitres = 0.0;
        double totalCO2 = Math.round(totalLitres * 2.64 * 10.0) / 10.0;

        long alertesCount = maintenanceService.getAlertesEcheances().size();
        long surconsoCount = pleinCarburantRepository.findAnomaliesOrderByDatePleinDesc().size();

        return ExecutiveSummaryDto.builder()
                .totalVehicules(totalV)
                .vehiculesEnMaintenance(immobV)
                .tauxImmobilisation(tauxImmob)
                .vehiculesAffectes(affectesV)
                .vehiculesDisponibles(disponiblesV)
                .vehiculesReformes(reformesV)
                .tauxUtilisationParc(tauxUtilisation)
                .coutTotalAcquisition(totalAcq)
                .coutTotalCarburant(totalCarb)
                .totalCarburant(totalCarb)
                .coutTotalMaintenance(totalMaint)
                .totalMaintenance(totalMaint)
                .coutTotalAssurance(totalAssur)
                .totalAssurance(totalAssur)
                .coutTotalTaxes(totalTaxes)
                .totalTaxes(totalTaxes)
                .tcoGlobal(tcoGlobal)
                .totalTco(tcoGlobal)
                .totalKilometrageFlotte(totalKm)
                .coutMoyenKilometriqueMadKm(madKm)
                .coutMoyenKm(madKm)
                .totalLitresConsommes(totalLitres)
                .totalEmissionsCO2Kg(totalCO2)
                .alertesActivesCount((int) alertesCount)
                .surconsommationsCount((int) surconsoCount)
                .tcoParDirection(directions)
                .tcoParMotorisation(motorisations)
                .build();
    }

    // ==========================================
    // 6. EXPORTATION EXCEL MULTI-ONGLETS (POI)
    // ==========================================

    @Transactional(readOnly = true)
    public byte[] generateExcelReport() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            byte[] navyRgb = new byte[]{(byte) 10, (byte) 30, (byte) 63};      // #0A1E3F
            byte[] goldRgb = new byte[]{(byte) 197, (byte) 155, (byte) 39};   // #C59B27
            byte[] zebraRgb = new byte[]{(byte) 244, (byte) 246, (byte) 251};  // #F4F6FB

            XSSFColor navyColor = new XSSFColor(navyRgb, null);
            XSSFColor goldColor = new XSSFColor(goldRgb, null);
            XSSFColor zebraColor = new XSSFColor(zebraRgb, null);

            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());

            org.apache.poi.ss.usermodel.Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 11);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);

            org.apache.poi.ss.usermodel.Font boldDataFont = workbook.createFont();
            boldDataFont.setBold(true);
            boldDataFont.setFontHeightInPoints((short) 10);

            org.apache.poi.ss.usermodel.Font dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 10);

            DataFormat format = workbook.createDataFormat();

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            CellStyle sectionStyle = workbook.createCellStyle();
            sectionStyle.setFont(sectionFont);

            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(navyColor);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setFont(dataFont);

            org.apache.poi.xssf.usermodel.XSSFCellStyle textZebraStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            textZebraStyle.setFont(dataFont);
            textZebraStyle.setFillForegroundColor(zebraColor);
            textZebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setFont(dataFont);
            currencyStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            org.apache.poi.xssf.usermodel.XSSFCellStyle currencyZebraStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            currencyZebraStyle.setFont(dataFont);
            currencyZebraStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));
            currencyZebraStyle.setAlignment(HorizontalAlignment.RIGHT);
            currencyZebraStyle.setFillForegroundColor(zebraColor);
            currencyZebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle totalCurrencyStyle = workbook.createCellStyle();
            totalCurrencyStyle.setFont(boldDataFont);
            totalCurrencyStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));
            totalCurrencyStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalCurrencyStyle.setBorderTop(BorderStyle.THIN);
            totalCurrencyStyle.setBorderBottom(BorderStyle.DOUBLE);

            CellStyle totalTextStyle = workbook.createCellStyle();
            totalTextStyle.setFont(boldDataFont);
            totalTextStyle.setBorderTop(BorderStyle.THIN);
            totalTextStyle.setBorderBottom(BorderStyle.DOUBLE);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setFont(dataFont);
            numberStyle.setDataFormat(format.getFormat("#,##0.00"));
            numberStyle.setAlignment(HorizontalAlignment.RIGHT);

            // --- FEUILLE 1 : SYNTHÈSE TCO & DIRECTIONS ---
            Sheet sheet1 = workbook.createSheet("Synthèse TCO Directions");
            sheet1.setDisplayGridlines(true);

            Row r0 = sheet1.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("ROYAUME DU MAROC — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet1.createRow(1);
            r1.createCell(0).setCellValue("Tableau de Bord du Coût Global d'Exploitation (TCO) & Rentabilité — Généré le : " + new Date());

            int rowIdx = 3;
            Row sec1Row = sheet1.createRow(rowIdx++);
            sec1Row.createCell(0).setCellValue("1. SYNTHÈSE DU TCO PAR DIRECTION MEF");
            sec1Row.getCell(0).setCellStyle(sectionStyle);

            String[] headersDir = {"Direction MEF", "Nb Véhicules", "Acquisition Total", "Carburant Total", "Maintenance Total", "TCO Total (MAD)", "TCO Moyen / Véhicule"};
            Row hRow1 = sheet1.createRow(rowIdx++);
            hRow1.setHeightInPoints(24);
            for (int i = 0; i < headersDir.length; i++) {
                Cell cell = hRow1.createCell(i);
                cell.setCellValue(headersDir[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoDirectionDto> dirList = getTcoParDirection();
            int dirStartRow = rowIdx + 1;
            int rowIndex = 0;
            for (TcoDirectionDto d : dirList) {
                Row row = sheet1.createRow(rowIdx++);
                boolean isEven = (rowIndex % 2 == 0);
                CellStyle curText = isEven ? textStyle : textZebraStyle;
                CellStyle curCurr = isEven ? currencyStyle : currencyZebraStyle;

                Cell cell0 = row.createCell(0); cell0.setCellValue(d.getDirection() != null ? d.getDirection() : ""); cell0.setCellStyle(curText);
                Cell cell1 = row.createCell(1); cell1.setCellValue(d.getNombreVehicules()); cell1.setCellStyle(curText);
                Cell cell2 = row.createCell(2); cell2.setCellValue(d.getTotalAcquisition() != null ? d.getTotalAcquisition().doubleValue() : 0.0); cell2.setCellStyle(curCurr);
                Cell cell3 = row.createCell(3); cell3.setCellValue(d.getTotalCarburant() != null ? d.getTotalCarburant().doubleValue() : 0.0); cell3.setCellStyle(curCurr);
                Cell cell4 = row.createCell(4); cell4.setCellValue(d.getTotalMaintenance() != null ? d.getTotalMaintenance().doubleValue() : 0.0); cell4.setCellStyle(curCurr);
                Cell cell5 = row.createCell(5); cell5.setCellValue(d.getTcoTotal() != null ? d.getTcoTotal().doubleValue() : 0.0); cell5.setCellStyle(curCurr);
                Cell cell6 = row.createCell(6); cell6.setCellValue(d.getTcoMoyenParVehicule() != null ? d.getTcoMoyenParVehicule().doubleValue() : 0.0); cell6.setCellStyle(curCurr);
                rowIndex++;
            }
            int dirEndRow = rowIdx;

            // Total Row
            Row totRow1 = sheet1.createRow(rowIdx++);
            Cell t1 = totRow1.createCell(0); t1.setCellValue("TOTAL MEF"); t1.setCellStyle(totalTextStyle);
            Cell t2 = totRow1.createCell(1); t2.setCellFormula("SUM(B" + dirStartRow + ":B" + dirEndRow + ")"); t2.setCellStyle(totalTextStyle);
            Cell t3 = totRow1.createCell(2); t3.setCellFormula("SUM(C" + dirStartRow + ":C" + dirEndRow + ")"); t3.setCellStyle(totalCurrencyStyle);
            Cell t4 = totRow1.createCell(3); t4.setCellFormula("SUM(D" + dirStartRow + ":D" + dirEndRow + ")"); t4.setCellStyle(totalCurrencyStyle);
            Cell t5 = totRow1.createCell(4); t5.setCellFormula("SUM(E" + dirStartRow + ":E" + dirEndRow + ")"); t5.setCellStyle(totalCurrencyStyle);
            Cell t6 = totRow1.createCell(5); t6.setCellFormula("SUM(F" + dirStartRow + ":F" + dirEndRow + ")"); t6.setCellStyle(totalCurrencyStyle);
            Cell t7 = totRow1.createCell(6); t7.setCellFormula("AVERAGE(G" + dirStartRow + ":G" + dirEndRow + ")"); t7.setCellStyle(totalCurrencyStyle);

            for (int i = 0; i < headersDir.length; i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, Math.max(sheet1.getColumnWidth(i) + 1200, 4200));
            }

            // --- FEUILLE 2 : DÉTAIL TCO & MAD/KM PAR VÉHICULE ---
            Sheet sheet2 = workbook.createSheet("TCO Véhicules & MAD-km");
            sheet2.setDisplayGridlines(true);

            String[] headersVeh = {"Immatriculation", "Marque & Modèle", "Direction MEF", "Carburant", "Kilométrage", "Statut", "Acquisition", "Carburant Total", "Maintenance Total", "Assurance Total", "TCO Total (MAD)", "MAD / km", "Conso (L/100km)"};
            Row hRow2 = sheet2.createRow(0);
            hRow2.setHeightInPoints(24);
            for (int i = 0; i < headersVeh.length; i++) {
                Cell cell = hRow2.createCell(i);
                cell.setCellValue(headersVeh[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoVehiculeDto> vehList = getTcoParVehicule();
            int vRowIdx = 1;
            rowIndex = 0;
            for (TcoVehiculeDto v : vehList) {
                Row row = sheet2.createRow(vRowIdx++);
                boolean isEven = (rowIndex % 2 == 0);
                CellStyle curText = isEven ? textStyle : textZebraStyle;
                CellStyle curCurr = isEven ? currencyStyle : currencyZebraStyle;

                row.createCell(0).setCellValue(v.getImmatriculation() != null ? v.getImmatriculation() : ""); row.getCell(0).setCellStyle(curText);
                row.createCell(1).setCellValue(v.getMarqueModele() != null ? v.getMarqueModele() : ""); row.getCell(1).setCellStyle(curText);
                row.createCell(2).setCellValue(v.getDirection() != null ? v.getDirection() : ""); row.getCell(2).setCellStyle(curText);
                row.createCell(3).setCellValue(v.getTypeCarburant() != null ? v.getTypeCarburant() : ""); row.getCell(3).setCellStyle(curText);
                row.createCell(4).setCellValue(v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0); row.getCell(4).setCellStyle(curText);
                row.createCell(5).setCellValue(v.getStatutAdministratif() != null ? v.getStatutAdministratif() : "DISPONIBLE"); row.getCell(5).setCellStyle(curText);
                row.createCell(6).setCellValue(v.getCoutAcquisition() != null ? v.getCoutAcquisition().doubleValue() : 0.0); row.getCell(6).setCellStyle(curCurr);
                row.createCell(7).setCellValue(v.getCoutCarburantTotal() != null ? v.getCoutCarburantTotal().doubleValue() : 0.0); row.getCell(7).setCellStyle(curCurr);
                row.createCell(8).setCellValue(v.getCoutMaintenanceTotal() != null ? v.getCoutMaintenanceTotal().doubleValue() : 0.0); row.getCell(8).setCellStyle(curCurr);
                row.createCell(9).setCellValue(v.getCoutAssuranceTotal() != null ? v.getCoutAssuranceTotal().doubleValue() : 0.0); row.getCell(9).setCellStyle(curCurr);
                row.createCell(10).setCellValue(v.getTcoTotal() != null ? v.getTcoTotal().doubleValue() : 0.0); row.getCell(10).setCellStyle(curCurr);

                Cell cMadKm = row.createCell(11);
                if (v.getCoutKilometriqueMadKm() != null) {
                    cMadKm.setCellValue(v.getCoutKilometriqueMadKm());
                    cMadKm.setCellStyle(numberStyle);
                } else {
                    cMadKm.setCellValue("N/A");
                    cMadKm.setCellStyle(curText);
                }

                Cell cConso = row.createCell(12);
                if (v.getConsommationMoyenne() != null) {
                    cConso.setCellValue(v.getConsommationMoyenne());
                    cConso.setCellStyle(numberStyle);
                } else {
                    cConso.setCellValue("N/A");
                    cConso.setCellStyle(curText);
                }
                rowIndex++;
            }

            for (int i = 0; i < headersVeh.length; i++) {
                sheet2.autoSizeColumn(i);
                sheet2.setColumnWidth(i, Math.max(sheet2.getColumnWidth(i) + 1000, 3800));
            }

            // --- FEUILLE 3 : SUIVI BUDGÉTAIRE ANALYTIQUE ---
            Sheet sheet3 = workbook.createSheet("Suivi Budgétaire Analytique");
            sheet3.setDisplayGridlines(true);

            String[] headersBud = {"Année", "Direction MEF", "Service", "Centre Coût", "Nature Dépense", "Budget Alloué", "Budget Engagé", "Budget Réalisé", "Solde Disponible", "Taux Consommation"};
            Row hRow3 = sheet3.createRow(0);
            hRow3.setHeightInPoints(24);
            for (int i = 0; i < headersBud.length; i++) {
                Cell cell = hRow3.createCell(i);
                cell.setCellValue(headersBud[i]);
                cell.setCellStyle(headerStyle);
            }

            List<BudgetDirection> budgets = budgetRepository.findAll();
            int bRowIdx = 1;
            rowIndex = 0;
            for (BudgetDirection b : budgets) {
                Row row = sheet3.createRow(bRowIdx++);
                boolean isEven = (rowIndex % 2 == 0);
                CellStyle curText = isEven ? textStyle : textZebraStyle;
                CellStyle curCurr = isEven ? currencyStyle : currencyZebraStyle;

                row.createCell(0).setCellValue(b.getAnnee() != null ? b.getAnnee() : 2026); row.getCell(0).setCellStyle(curText);
                row.createCell(1).setCellValue(b.getDirection() != null ? b.getDirection() : ""); row.getCell(1).setCellStyle(curText);
                row.createCell(2).setCellValue(b.getService() != null ? b.getService() : "-"); row.getCell(2).setCellStyle(curText);
                row.createCell(3).setCellValue(b.getCentreCout() != null ? b.getCentreCout() : "-"); row.getCell(3).setCellStyle(curText);
                row.createCell(4).setCellValue(b.getNatureDepense() != null ? b.getNatureDepense().name() : "AUTRES"); row.getCell(4).setCellStyle(curText);
                row.createCell(5).setCellValue(b.getMontantAlloue() != null ? b.getMontantAlloue().doubleValue() : 0.0); row.getCell(5).setCellStyle(curCurr);
                row.createCell(6).setCellValue(b.getMontantEngage() != null ? b.getMontantEngage().doubleValue() : 0.0); row.getCell(6).setCellStyle(curCurr);
                row.createCell(7).setCellValue(b.getMontantRealise() != null ? b.getMontantRealise().doubleValue() : 0.0); row.getCell(7).setCellStyle(curCurr);
                row.createCell(8).setCellValue(b.getMontantDisponible() != null ? b.getMontantDisponible().doubleValue() : 0.0); row.getCell(8).setCellStyle(curCurr);

                BigDecimal alloue = b.getMontantAlloue() != null ? b.getMontantAlloue() : BigDecimal.ZERO;
                BigDecimal consomme = (b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO)
                        .max(b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO);
                double taux = alloue.compareTo(BigDecimal.ZERO) > 0 ? consomme.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;
                row.createCell(9).setCellValue(Math.round(taux * 10.0) / 10.0 + " %"); row.getCell(9).setCellStyle(curText);
                rowIndex++;
            }

            for (int i = 0; i < headersBud.length; i++) {
                sheet3.autoSizeColumn(i);
                sheet3.setColumnWidth(i, Math.max(sheet3.getColumnWidth(i) + 1000, 3800));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération Excel : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du fichier Excel : " + e.getMessage(), e);
        }
    }

    // ==========================================
    // 6b. EXPORTATION CSV STANDARDISÉE (SID MEF)
    // ==========================================

    @Transactional(readOnly = true)
    public byte[] generateCsvReport() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
            
            // UTF-8 BOM pour compatibilité Excel
            writer.write('\uFEFF');

            writer.write("=== RAPPORT TCO ET FLOTTE AUTOMOBILE MEF ===\n");
            writer.write("Genere le;" + new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()) + "\n\n");

            // Section 1 : TCO par Véhicule
            writer.write("--- 1. DETAIL DU COUT GLOBAL D'EXPLOITATION (TCO) PAR VEHICULE ---\n");
            writer.write("Immatriculation;Marque & Modele;Direction MEF;Carburant;Kilometrage;Statut;Acquisition (MAD);Carburant Total (MAD);Maintenance Total (MAD);Assurance Total (MAD);TCO Total (MAD);MAD/km;Conso Moyenne (L/100km)\n");
            
            List<TcoVehiculeDto> vehicules = getTcoParVehicule();
            for (TcoVehiculeDto v : vehicules) {
                writer.write(String.format(Locale.FRENCH, "%s;%s;%s;%s;%d;%s;%.2f;%.2f;%.2f;%.2f;%.2f;%s;%s\n",
                        v.getImmatriculation() != null ? v.getImmatriculation() : "",
                        v.getMarqueModele() != null ? v.getMarqueModele().replace(";", ",") : "",
                        v.getDirection() != null ? v.getDirection().replace(";", ",") : "",
                        v.getTypeCarburant() != null ? v.getTypeCarburant() : "",
                        v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0L,
                        v.getStatutAdministratif() != null ? v.getStatutAdministratif() : "DISPONIBLE",
                        v.getCoutAcquisition() != null ? v.getCoutAcquisition().doubleValue() : 0.0,
                        v.getCoutCarburantTotal() != null ? v.getCoutCarburantTotal().doubleValue() : 0.0,
                        v.getCoutMaintenanceTotal() != null ? v.getCoutMaintenanceTotal().doubleValue() : 0.0,
                        v.getCoutAssuranceTotal() != null ? v.getCoutAssuranceTotal().doubleValue() : 0.0,
                        v.getTcoTotal() != null ? v.getTcoTotal().doubleValue() : 0.0,
                        v.getCoutKilometriqueMadKm() != null ? String.format(Locale.FRENCH, "%.4f", v.getCoutKilometriqueMadKm()) : "N/A",
                        v.getConsommationMoyenne() != null ? String.format(Locale.FRENCH, "%.2f", v.getConsommationMoyenne()) : "N/A"
                ));
            }

            // Section 2 : TCO par Direction
            writer.write("\n--- 2. CONSOLIDATION DU TCO PAR DIRECTION MEF ---\n");
            writer.write("Direction MEF;Nombre Vehicules;Acquisition Total (MAD);Carburant Total (MAD);Maintenance Total (MAD);TCO Total (MAD);TCO Moyen par Vehicule (MAD);Cout Moyen au Km (MAD/km)\n");
            List<TcoDirectionDto> directions = getTcoParDirection();
            for (TcoDirectionDto d : directions) {
                writer.write(String.format(Locale.FRENCH, "%s;%d;%.2f;%.2f;%.2f;%.2f;%.2f;%s\n",
                        d.getDirection() != null ? d.getDirection().replace(";", ",") : "",
                        d.getNombreVehicules(),
                        d.getTotalAcquisition() != null ? d.getTotalAcquisition().doubleValue() : 0.0,
                        d.getTotalCarburant() != null ? d.getTotalCarburant().doubleValue() : 0.0,
                        d.getTotalMaintenance() != null ? d.getTotalMaintenance().doubleValue() : 0.0,
                        d.getTcoTotal() != null ? d.getTcoTotal().doubleValue() : 0.0,
                        d.getTcoMoyenParVehicule() != null ? d.getTcoMoyenParVehicule().doubleValue() : 0.0,
                        d.getCoutMoyenKm() != null ? String.format(Locale.FRENCH, "%.4f", d.getCoutMoyenKm()) : "N/A"
                ));
            }

            // Section 3 : Suivi Budgétaire
            writer.write("\n--- 3. SUIVI BUDGETAIRE ANALYTIQUE ---\n");
            writer.write("Annee;Direction MEF;Service;Centre Cout;Nature Depense;Budget Alloue (MAD);Budget Engage (MAD);Budget Realise (MAD);Solde Disponible (MAD);Taux Consommation\n");
            List<BudgetDirection> budgets = budgetRepository.findAll();
            for (BudgetDirection b : budgets) {
                BigDecimal alloue = b.getMontantAlloue() != null ? b.getMontantAlloue() : BigDecimal.ZERO;
                BigDecimal engage = b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO;
                BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;
                BigDecimal disponible = b.getMontantDisponible() != null ? b.getMontantDisponible() : BigDecimal.ZERO;
                BigDecimal consomme = engage.max(realise);
                double taux = alloue.compareTo(BigDecimal.ZERO) > 0 ? consomme.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;

                writer.write(String.format(Locale.FRENCH, "%d;%s;%s;%s;%s;%.2f;%.2f;%.2f;%.2f;%.1f %%\n",
                        b.getAnnee() != null ? b.getAnnee() : 2026,
                        b.getDirection() != null ? b.getDirection().replace(";", ",") : "",
                        b.getService() != null ? b.getService().replace(";", ",") : "-",
                        b.getCentreCout() != null ? b.getCentreCout().replace(";", ",") : "-",
                        b.getNatureDepense() != null ? b.getNatureDepense().name() : "AUTRES",
                        alloue.doubleValue(),
                        engage.doubleValue(),
                        realise.doubleValue(),
                        disponible.doubleValue(),
                        taux
                ));
            }

            writer.flush();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération CSV : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du fichier CSV : " + e.getMessage(), e);
        }
    }

    // ==========================================
    // 7. EXPORTATION PDF OFFICIELLE (OpenPDF)
    // ==========================================

    @Transactional(readOnly = true)
    public byte[] generatePdfReport() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 30);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new ReportPageEvent());
            document.open();

            Color navyColor = new Color(10, 30, 63);      // #0A1E3F
            Color goldColor = new Color(197, 155, 39);    // #C59B27
            Color headerBg = new Color(10, 30, 63);
            Color zebraBg = new Color(248, 250, 252);

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, navyColor);
            Font fontSubTitle = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, Color.DARK_GRAY);
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.WHITE);
            Font fontData = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, navyColor);
            Font fontSection = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, navyColor);

            Image royaumeLogo = loadLogoImage("royaume_du_maroc_logo.png");
            Image mefLogo = loadLogoImage("logo.png");
            addOfficialPdfHeader(document, royaumeLogo, mefLogo, navyColor, goldColor);

            Paragraph pTitle = new Paragraph("RAPPORT FINANCIER EXÉCUTIF - CONTRÔLE BUDGÉTAIRE, TCO & RENTABILITÉ", fontTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingBefore(8);
            document.add(pTitle);

            String generatedAt = new SimpleDateFormat("dd/MM/yyyy 'à' HH:mm", Locale.FRENCH).format(new Date());
            Paragraph pSub = new Paragraph("Direction du Budget / Direction des Affaires Générales (DAG) — Document officiel généré le " + generatedAt, fontSubTitle);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(10);
            document.add(pSub);

            ExecutiveSummaryDto summary = getExecutiveSummary();
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(12);

            long totalVehicules = (summary != null && summary.getTotalVehicules() != null) ? summary.getTotalVehicules() : 0L;
            double tauxImmob = (summary != null && summary.getTauxImmobilisation() != null) ? summary.getTauxImmobilisation() : 0.0;
            double disponibilite = Math.max(0.0, Math.round((100.0 - tauxImmob) * 10.0) / 10.0);
            double totalLitres = (summary != null && summary.getTotalLitresConsommes() != null) ? summary.getTotalLitresConsommes() : 0.0;
            int alertesCount = (summary != null && summary.getAlertesActivesCount() != null) ? summary.getAlertesActivesCount() : 0;

            addKpiCell(kpiTable, "FLOTTE TOTALE", totalVehicules + " Véhicules", "Disponibilité: " + disponibilite + "%", navyColor);
            addKpiCell(kpiTable, "COÛT CARBURANT", formatMad(summary != null ? summary.getCoutTotalCarburant() : null), String.format(Locale.FRENCH, "%.0f Litres", totalLitres), goldColor);
            addKpiCell(kpiTable, "COÛT MAINTENANCE", formatMad(summary != null ? summary.getCoutTotalMaintenance() : null), alertesCount + " alertes actives", new Color(196, 125, 43));
            addKpiCell(kpiTable, "TCO GLOBAL & MAD/KM", formatMad(summary != null ? summary.getTcoGlobal() : null), "Ratio: " + (summary != null && summary.getCoutMoyenKilometriqueMadKm() != null ? String.format(Locale.FRENCH, "%.2f MAD/km", summary.getCoutMoyenKilometriqueMadKm()) : "N/A"), new Color(13, 122, 95));

            document.add(kpiTable);

            // Section 1: Directions
            Paragraph dirTitle = new Paragraph("1. Répartition du Coût Global d'Exploitation (TCO) par Direction MEF", fontSection);
            dirTitle.setSpacingAfter(6);
            document.add(dirTitle);

            PdfPTable dirTable = new PdfPTable(7);
            dirTable.setWidthPercentage(100);
            dirTable.setWidths(new float[]{28, 9, 15, 15, 15, 18, 16});
            dirTable.setSpacingAfter(12);
            dirTable.setHeaderRows(1);

            String[] dirHeaders = {"Direction MEF", "Nb Véh.", "Acquisition", "Carburant", "Maintenance", "TCO Total (MAD)", "TCO Moyen / Véh."};
            for (String h : dirHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(4);
                dirTable.addCell(cell);
            }

            int idx = 0;
            List<TcoDirectionDto> dirList = (summary != null && summary.getTcoParDirection() != null) ? summary.getTcoParDirection() : java.util.Collections.emptyList();
            for (TcoDirectionDto d : dirList) {
                Color bg = (idx % 2 == 0) ? Color.WHITE : zebraBg;
                addBodyCell(dirTable, d.getDirection() != null ? d.getDirection() : "Non spécifié", fontData, bg, Element.ALIGN_LEFT);
                addBodyCell(dirTable, String.valueOf(d.getNombreVehicules()), fontData, bg, Element.ALIGN_CENTER);
                addBodyCell(dirTable, formatMad(d.getTotalAcquisition()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTotalCarburant()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTotalMaintenance()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTcoTotal()), fontBold, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTcoMoyenParVehicule()), fontData, bg, Element.ALIGN_RIGHT);
                idx++;
            }

            if (summary != null) {
                addDirectionTotalRow(dirTable, summary, navyColor);
            }
            document.add(dirTable);

            // Section 2: Motorisations
            Paragraph motorTitle = new Paragraph("2. Consolidation Analytique par Type de Motorisation", fontSection);
            motorTitle.setSpacingAfter(6);
            document.add(motorTitle);

            PdfPTable motorTable = new PdfPTable(7);
            motorTable.setWidthPercentage(100);
            motorTable.setWidths(new float[]{18, 12, 18, 18, 18, 18, 16});
            motorTable.setSpacingAfter(12);
            motorTable.setHeaderRows(1);

            String[] motorHeaders = {"Carburant", "Nb Véh.", "Carburant Total", "Maintenance", "TCO Total (MAD)", "MAD / km", "Émissions CO2"};
            for (String h : motorHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(4);
                motorTable.addCell(cell);
            }

            idx = 0;
            List<TcoMotorisationDto> motorList = (summary != null && summary.getTcoParMotorisation() != null) ? summary.getTcoParMotorisation() : java.util.Collections.emptyList();
            for (TcoMotorisationDto m : motorList) {
                Color bg = (idx % 2 == 0) ? Color.WHITE : zebraBg;
                addBodyCell(motorTable, m.getTypeCarburant() != null ? m.getTypeCarburant() : "DIESEL", fontBold, bg, Element.ALIGN_LEFT);
                addBodyCell(motorTable, String.valueOf(m.getNombreVehicules()), fontData, bg, Element.ALIGN_CENTER);
                addBodyCell(motorTable, formatMad(m.getTotalCarburant()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(motorTable, formatMad(m.getTotalMaintenance()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(motorTable, formatMad(m.getTcoTotal()), fontBold, bg, Element.ALIGN_RIGHT);
                addBodyCell(motorTable, m.getCoutKilometriqueMadKm() != null ? String.format(Locale.FRENCH, "%.2f MAD/km", m.getCoutKilometriqueMadKm()) : "N/A", fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(motorTable, String.format(Locale.FRENCH, "%.1f kg", m.getTotalCO2Kg()), fontData, bg, Element.ALIGN_RIGHT);
                idx++;
            }
            document.add(motorTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération PDF : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du rapport PDF : " + e.getMessage(), e);
        }
    }

    private void addOfficialPdfHeader(Document document, Image royaumeLogo, Image mefLogo, Color navyColor, Color goldColor) throws Exception {
        PdfPTable header = new PdfPTable(3);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{31, 38, 31});

        header.addCell(createLogoCell(royaumeLogo, 195, 58, Element.ALIGN_LEFT));

        Font institutionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, navyColor);
        PdfPCell identityCell = new PdfPCell(new Phrase("ROYAUME DU MAROC\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nPARC AUTOMOBILE MINISTÉRIEL", institutionFont));
        identityCell.setBorder(PdfPCell.NO_BORDER);
        identityCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        identityCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        identityCell.setPaddingTop(5);
        header.addCell(identityCell);

        header.addCell(createLogoCell(mefLogo, 185, 58, Element.ALIGN_RIGHT));
        document.add(header);

        PdfPTable rule = new PdfPTable(1);
        rule.setWidthPercentage(100);
        PdfPCell ruleCell = new PdfPCell(new Phrase(" "));
        ruleCell.setFixedHeight(2.5f);
        ruleCell.setBackgroundColor(goldColor);
        ruleCell.setBorder(PdfPCell.NO_BORDER);
        rule.addCell(ruleCell);
        document.add(rule);
    }

    private PdfPCell createLogoCell(Image logo, float maxWidth, float maxHeight, int alignment) {
        PdfPCell cell;
        if (logo != null) {
            try {
                logo.scaleToFit(maxWidth, maxHeight);
                cell = new PdfPCell(logo, false);
            } catch (Exception e) {
                cell = new PdfPCell(new Phrase(""));
            }
        } else {
            cell = new PdfPCell(new Phrase(""));
        }
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(2);
        return cell;
    }

    private void addDirectionTotalRow(PdfPTable table, ExecutiveSummaryDto summary, Color navyColor) {
        List<TcoDirectionDto> list = summary.getTcoParDirection() != null ? summary.getTcoParDirection() : java.util.Collections.emptyList();
        BigDecimal acquisition = list.stream()
                .map(d -> d.getTotalAcquisition() != null ? d.getTotalAcquisition() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
        addTotalCell(table, "TOTAL MEF", totalFont, navyColor, Element.ALIGN_LEFT);
        addTotalCell(table, String.valueOf(summary.getTotalVehicules()), totalFont, navyColor, Element.ALIGN_CENTER);
        addTotalCell(table, formatMad(acquisition), totalFont, navyColor, Element.ALIGN_RIGHT);
        addTotalCell(table, formatMad(summary.getCoutTotalCarburant()), totalFont, navyColor, Element.ALIGN_RIGHT);
        addTotalCell(table, formatMad(summary.getCoutTotalMaintenance()), totalFont, navyColor, Element.ALIGN_RIGHT);
        BigDecimal tcoGlobal = summary.getTcoGlobal() != null ? summary.getTcoGlobal() : BigDecimal.ZERO;
        addTotalCell(table, formatMad(tcoGlobal), totalFont, navyColor, Element.ALIGN_RIGHT);
        addTotalCell(table, summary.getTotalVehicules() > 0
                ? formatMad(tcoGlobal.divide(BigDecimal.valueOf(summary.getTotalVehicules()), 2, RoundingMode.HALF_UP))
                : formatMad(BigDecimal.ZERO), totalFont, navyColor, Element.ALIGN_RIGHT);
    }

    private void addTotalCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private static class ReportPageEvent extends PdfPageEventHelper {
        private final Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(100, 116, 139));

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle page = document.getPageSize();
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_LEFT,
                    new Phrase("MEF - Parc Automobile | Rapport Financier Exécutif Confidentiel", footerFont),
                    document.left(), page.getBottom() + 14, 0);
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_RIGHT,
                    new Phrase("Page " + writer.getPageNumber(), footerFont),
                    document.right(), page.getBottom() + 14, 0);
        }
    }

    private void addBodyCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addKpiCell(PdfPTable table, String label, String value, String sub, Color bgColor) {
        Font fLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Color.WHITE);
        Font fVal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);
        Font fSub = FontFactory.getFont(FontFactory.HELVETICA, 6.5f, Color.LIGHT_GRAY);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.addElement(new Phrase(label, fLabel));
        cell.addElement(new Phrase(value, fVal));
        cell.addElement(new Phrase(sub, fSub));
        table.addCell(cell);
    }

    private Image loadLogoImage(String filename) {
        try {
            java.net.URL url = getClass().getResource("/static/assets/" + filename);
            if (url != null) return Image.getInstance(url);
            url = getClass().getClassLoader().getResource("static/assets/" + filename);
            if (url != null) return Image.getInstance(url);
            java.io.File file = new java.io.File("src/main/resources/static/assets/" + filename);
            if (file.exists()) return Image.getInstance(file.getAbsolutePath());
            file = new java.io.File("target/classes/static/assets/" + filename);
            if (file.exists()) return Image.getInstance(file.getAbsolutePath());
        } catch (Exception e) {
            log.warn("Could not load logo image: {}", filename);
        }
        return null;
    }

    private String formatMad(BigDecimal val) {
        if (val == null) return "0.00 MAD";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.FRENCH);
        symbols.setGroupingSeparator(' ');
        DecimalFormat df = new DecimalFormat("#,##0.00 MAD", symbols);
        return df.format(val);
    }
}

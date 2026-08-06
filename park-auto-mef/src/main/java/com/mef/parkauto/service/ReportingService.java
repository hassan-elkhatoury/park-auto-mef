package com.mef.parkauto.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mef.parkauto.dto.ExecutiveSummaryDto;
import com.mef.parkauto.dto.TcoDirectionDto;
import com.mef.parkauto.dto.TcoVehiculeDto;
import com.mef.parkauto.entity.PleinCarburant;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.TypeCarburant;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.repository.InterventionMaintenanceRepository;
import com.mef.parkauto.repository.PleinCarburantRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final VehiculeRepository vehiculeRepository;
    private final PleinCarburantRepository pleinCarburantRepository;
    private final InterventionMaintenanceRepository maintenanceRepository;
    private final MaintenanceService maintenanceService;

    @Transactional(readOnly = true)
    public List<TcoVehiculeDto> getTcoParVehicule() {
        List<Vehicule> vehicules = vehiculeRepository.findAll();
        List<TcoVehiculeDto> list = new ArrayList<>();

        for (Vehicule v : vehicules) {
            BigDecimal acq = v.getMontantAcquisition() != null ? v.getMontantAcquisition() : BigDecimal.ZERO;
            BigDecimal carb = pleinCarburantRepository.sumMontantByVehiculeId(v.getId());
            BigDecimal maint = maintenanceRepository.sumMontantByVehiculeId(v.getId());
            BigDecimal tco = acq.add(carb).add(maint);

            List<PleinCarburant> pleins = pleinCarburantRepository.findByVehiculeIdOrderByDatePleinDesc(v.getId());
            double totalLitres = pleins.stream().mapToDouble(PleinCarburant::getQuantiteLitres).sum();
            
            Double consoMoy = pleins.isEmpty() ? null : pleins.get(0).getConsommationMoyenne();

            list.add(TcoVehiculeDto.builder()
                    .vehiculeId(v.getId())
                    .immatriculation(v.getImmatriculation())
                    .marqueModele(v.getMarque() + " " + v.getModele())
                    .direction(v.getDirection() != null ? v.getDirection() : "Direction Générale")
                    .coutAcquisition(acq)
                    .coutCarburantTotal(carb)
                    .coutMaintenanceTotal(maint)
                    .tcoTotal(tco)
                    .totalLitresCarburant(totalLitres)
                    .kilometrageActuel(v.getKilometrageActuel())
                    .consommationMoyenne(consoMoy)
                    .statutAdministratif(v.getStatutAdministratif() != null ? v.getStatutAdministratif().name() : "DISPONIBLE")
                    .build());
        }
        return list;
    }

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
            BigDecimal sumAcq = vList.stream().map(TcoVehiculeDto::getCoutAcquisition).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumCarb = vList.stream().map(TcoVehiculeDto::getCoutCarburantTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumMaint = vList.stream().map(TcoVehiculeDto::getCoutMaintenanceTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumTco = vList.stream().map(TcoVehiculeDto::getTcoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal moyTco = count > 0 ? sumTco.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            result.add(TcoDirectionDto.builder()
                    .direction(dir)
                    .nombreVehicules(count)
                    .totalAcquisition(sumAcq)
                    .totalCarburant(sumCarb)
                    .totalMaintenance(sumMaint)
                    .tcoTotal(sumTco)
                    .tcoMoyenParVehicule(moyTco)
                    .build());
        }

        result.sort((a, b) -> b.getTcoTotal().compareTo(a.getTcoTotal()));
        return result;
    }

    @Transactional(readOnly = true)
    public ExecutiveSummaryDto getExecutiveSummary() {
        List<TcoVehiculeDto> vehicules = getTcoParVehicule();
        List<TcoDirectionDto> directions = getTcoParDirection();

        long totalV = vehicules.size();
        long immobV = vehicules.stream().filter(v -> 
                "EN_MAINTENANCE".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "EN_ENTRETIEN".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "EN_REPARATION".equalsIgnoreCase(v.getStatutAdministratif()) ||
                "IMMOBILISE".equalsIgnoreCase(v.getStatutAdministratif())).count();

        double tauxImmob = totalV > 0 ? Math.round((immobV * 100.0 / totalV) * 10.0) / 10.0 : 0.0;

        BigDecimal totalCarb = vehicules.stream().map(TcoVehiculeDto::getCoutCarburantTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMaint = vehicules.stream().map(TcoVehiculeDto::getCoutMaintenanceTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tcoGlobal = vehicules.stream().map(TcoVehiculeDto::getTcoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        double totalLitres = pleinCarburantRepository.sumTotalLitres();
        if (Double.isNaN(totalLitres)) totalLitres = 0.0;

        // Estimation Émissions CO2 : ~2.64 kg CO2 / Litre Diesel
        double totalCO2 = Math.round(totalLitres * 2.64 * 10.0) / 10.0;

        long alertesCount = maintenanceService.getAlertesEcheances().size();
        long surconsoCount = pleinCarburantRepository.findAnomaliesOrderByDatePleinDesc().size();

        return ExecutiveSummaryDto.builder()
                .totalVehicules(totalV)
                .vehiculesEnMaintenance(immobV)
                .tauxImmobilisation(tauxImmob)
                .coutTotalCarburant(totalCarb)
                .coutTotalMaintenance(totalMaint)
                .tcoGlobal(tcoGlobal)
                .totalLitresConsommes(totalLitres)
                .totalEmissionsCO2Kg(totalCO2)
                .alertesActivesCount((int) alertesCount)
                .surconsommationsCount((int) surconsoCount)
                .tcoParDirection(directions)
                .build();
    }

    /**
     * Exportation Excel professionnelle POI pour la Direction du Budget et du DAG:
     * - Auto-sized columns avec padding généreux
     * - En-têtes en gras avec fond bleu marine (#0A1E3F)
     * - Lignes de données avec formatage monétaire (#,##0.00 "MAD") et zébrage
     * - Totalisation en bas de tableau avec bordure double
     */
    public byte[] generateExcelReport() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Rapport TCO MEF");
            sheet.setDisplayGridlines(true);

            // Palette Couleurs MEF POI
            byte[] navyRgb = new byte[]{(byte) 10, (byte) 30, (byte) 63};      // #0A1E3F
            byte[] goldRgb = new byte[]{(byte) 197, (byte) 155, (byte) 39};   // #C59B27
            byte[] zebraRgb = new byte[]{(byte) 244, (byte) 246, (byte) 251};  // #F4F6FB

            XSSFColor navyColor = new XSSFColor(navyRgb, null);
            XSSFColor goldColor = new XSSFColor(goldRgb, null);
            XSSFColor zebraColor = new XSSFColor(zebraRgb, null);

            // Fonts
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

            // Cell Styles
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            CellStyle subTitleStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font subFont = workbook.createFont();
            subFont.setItalic(true);
            subFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            subTitleStyle.setFont(subFont);

            CellStyle sectionStyle = workbook.createCellStyle();
            sectionStyle.setFont(sectionFont);

            // Header cell style (Navy #0A1E3F background, white text)
            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(navyColor);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Formats
            DataFormat format = workbook.createDataFormat();

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setFont(dataFont);

            CellStyle textZebraStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            textZebraStyle.setFont(dataFont);
            ((org.apache.poi.xssf.usermodel.XSSFCellStyle) textZebraStyle).setFillForegroundColor(zebraColor);
            textZebraStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setFont(dataFont);
            currencyStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle currencyZebraStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
            currencyZebraStyle.setFont(dataFont);
            currencyZebraStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));
            currencyZebraStyle.setAlignment(HorizontalAlignment.RIGHT);
            ((org.apache.poi.xssf.usermodel.XSSFCellStyle) currencyZebraStyle).setFillForegroundColor(zebraColor);
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

            // 1. Title Rows
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("ROYAUME DU MAROC — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES");
            titleCell.setCellStyle(titleStyle);

            Row subTitleRow = sheet.createRow(1);
            Cell subCell = subTitleRow.createCell(0);
            subCell.setCellValue("Rapport Exécutif & Tableau de Bord du Coût Global d'Exploitation (TCO) — Généré le : " + new Date());
            subCell.setCellStyle(subTitleStyle);

            // 2. Section 1: Summary by Direction
            int rowIdx = 3;
            Row sec1Row = sheet.createRow(rowIdx++);
            Cell sec1Cell = sec1Row.createCell(0);
            sec1Cell.setCellValue("1. SYNTHÈSE DU COÛT GLOBAL (TCO) PAR DIRECTION MEF");
            sec1Cell.setCellStyle(sectionStyle);

            String[] headersDir = {"Direction MEF", "Nb Véhicules", "Acquisition Total", "Carburant Total", "Maintenance Total", "TCO Total (MAD)", "TCO Moyen / Véhicule"};
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(24);
            for (int i = 0; i < headersDir.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headersDir[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoDirectionDto> dirList = getTcoParDirection();
            int dirStartRow = rowIdx + 1;
            int rowIndex = 0;
            for (TcoDirectionDto d : dirList) {
                Row row = sheet.createRow(rowIdx++);
                boolean isEven = (rowIndex % 2 == 0);
                CellStyle currentText = isEven ? textStyle : textZebraStyle;
                CellStyle currentCurr = isEven ? currencyStyle : currencyZebraStyle;

                Cell c0 = row.createCell(0); c0.setCellValue(d.getDirection()); c0.setCellStyle(currentText);
                Cell c1 = row.createCell(1); c1.setCellValue(d.getNombreVehicules()); c1.setCellStyle(currentText);
                Cell c2 = row.createCell(2); c2.setCellValue(d.getTotalAcquisition().doubleValue()); c2.setCellStyle(currentCurr);
                Cell c3 = row.createCell(3); c3.setCellValue(d.getTotalCarburant().doubleValue()); c3.setCellStyle(currentCurr);
                Cell c4 = row.createCell(4); c4.setCellValue(d.getTotalMaintenance().doubleValue()); c4.setCellStyle(currentCurr);
                Cell c5 = row.createCell(5); c5.setCellValue(d.getTcoTotal().doubleValue()); c5.setCellStyle(currentCurr);
                Cell c6 = row.createCell(6); c6.setCellValue(d.getTcoMoyenParVehicule().doubleValue()); c6.setCellStyle(currentCurr);
                rowIndex++;
            }
            int dirEndRow = rowIdx;

            // Total Row for Directions
            Row totalDirRow = sheet.createRow(rowIdx++);
            Cell totLabel = totalDirRow.createCell(0); totLabel.setCellValue("TOTAL MEF"); totLabel.setCellStyle(totalTextStyle);
            Cell totCount = totalDirRow.createCell(1); totCount.setCellFormula("SUM(B" + dirStartRow + ":B" + dirEndRow + ")"); totCount.setCellStyle(totalTextStyle);
            Cell totAcq = totalDirRow.createCell(2); totAcq.setCellFormula("SUM(C" + dirStartRow + ":C" + dirEndRow + ")"); totAcq.setCellStyle(totalCurrencyStyle);
            Cell totCarb = totalDirRow.createCell(3); totCarb.setCellFormula("SUM(D" + dirStartRow + ":D" + dirEndRow + ")"); totCarb.setCellStyle(totalCurrencyStyle);
            Cell totMaint = totalDirRow.createCell(4); totMaint.setCellFormula("SUM(E" + dirStartRow + ":E" + dirEndRow + ")"); totMaint.setCellStyle(totalCurrencyStyle);
            Cell totTco = totalDirRow.createCell(5); totTco.setCellFormula("SUM(F" + dirStartRow + ":F" + dirEndRow + ")"); totTco.setCellStyle(totalCurrencyStyle);
            Cell totMoy = totalDirRow.createCell(6); totMoy.setCellFormula("AVERAGE(G" + dirStartRow + ":G" + dirEndRow + ")"); totMoy.setCellStyle(totalCurrencyStyle);

            // 3. Section 2: Detailed Vehicle TCO
            rowIdx += 2;
            Row sec2Row = sheet.createRow(rowIdx++);
            Cell sec2Cell = sec2Row.createCell(0);
            sec2Cell.setCellValue("2. DÉTAIL DU TCO ET CONSOMMATION PAR VÉHICULE");
            sec2Cell.setCellStyle(sectionStyle);

            String[] headersVeh = {"Immatriculation", "Marque & Modèle", "Direction MEF", "Kilométrage", "Statut", "Acquisition", "Carburant", "Maintenance", "TCO Total (MAD)", "Conso (L/100km)"};
            Row headerRow2 = sheet.createRow(rowIdx++);
            headerRow2.setHeightInPoints(24);
            for (int i = 0; i < headersVeh.length; i++) {
                Cell cell = headerRow2.createCell(i);
                cell.setCellValue(headersVeh[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoVehiculeDto> vehList = getTcoParVehicule();
            int vehStartRow = rowIdx + 1;
            rowIndex = 0;
            for (TcoVehiculeDto v : vehList) {
                Row row = sheet.createRow(rowIdx++);
                boolean isEven = (rowIndex % 2 == 0);
                CellStyle currentText = isEven ? textStyle : textZebraStyle;
                CellStyle currentCurr = isEven ? currencyStyle : currencyZebraStyle;

                Cell c0 = row.createCell(0); c0.setCellValue(v.getImmatriculation()); c0.setCellStyle(currentText);
                Cell c1 = row.createCell(1); c1.setCellValue(v.getMarqueModele()); c1.setCellStyle(currentText);
                Cell c2 = row.createCell(2); c2.setCellValue(v.getDirection()); c2.setCellStyle(currentText);
                Cell c3 = row.createCell(3); c3.setCellValue(v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0); c3.setCellStyle(currentText);
                Cell c4 = row.createCell(4); c4.setCellValue(v.getStatutAdministratif()); c4.setCellStyle(currentText);

                Cell c5 = row.createCell(5); c5.setCellValue(v.getCoutAcquisition().doubleValue()); c5.setCellStyle(currentCurr);
                Cell c6 = row.createCell(6); c6.setCellValue(v.getCoutCarburantTotal().doubleValue()); c6.setCellStyle(currentCurr);
                Cell c7 = row.createCell(7); c7.setCellValue(v.getCoutMaintenanceTotal().doubleValue()); c7.setCellStyle(currentCurr);
                Cell c8 = row.createCell(8); c8.setCellValue(v.getTcoTotal().doubleValue()); c8.setCellStyle(currentCurr);

                Cell c9 = row.createCell(9);
                if (v.getConsommationMoyenne() != null) {
                    c9.setCellValue(v.getConsommationMoyenne());
                    c9.setCellStyle(numberStyle);
                } else {
                    c9.setCellValue("N/A");
                    c9.setCellStyle(currentText);
                }
                rowIndex++;
            }
            int vehEndRow = rowIdx;

            // Total Row for Vehicles
            Row totalVehRow = sheet.createRow(rowIdx++);
            Cell vTotLabel = totalVehRow.createCell(0); vTotLabel.setCellValue("TOTAL FLOTTE"); vTotLabel.setCellStyle(totalTextStyle);
            totalVehRow.createCell(1).setCellStyle(totalTextStyle);
            totalVehRow.createCell(2).setCellStyle(totalTextStyle);
            totalVehRow.createCell(3).setCellStyle(totalTextStyle);
            totalVehRow.createCell(4).setCellStyle(totalTextStyle);

            Cell vTotAcq = totalVehRow.createCell(5); vTotAcq.setCellFormula("SUM(F" + vehStartRow + ":F" + vehEndRow + ")"); vTotAcq.setCellStyle(totalCurrencyStyle);
            Cell vTotCarb = totalVehRow.createCell(6); vTotCarb.setCellFormula("SUM(G" + vehStartRow + ":G" + vehEndRow + ")"); vTotCarb.setCellStyle(totalCurrencyStyle);
            Cell vTotMaint = totalVehRow.createCell(7); vTotMaint.setCellFormula("SUM(H" + vehStartRow + ":H" + vehEndRow + ")"); vTotMaint.setCellStyle(totalCurrencyStyle);
            Cell vTotTco = totalVehRow.createCell(8); vTotTco.setCellFormula("SUM(I" + vehStartRow + ":I" + vehEndRow + ")"); vTotTco.setCellStyle(totalCurrencyStyle);
            totalVehRow.createCell(9).setCellStyle(totalTextStyle);

            // Auto-size columns with safety padding
            for (int i = 0; i < Math.max(headersDir.length, headersVeh.length); i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 1200, 4200));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du fichier Excel : " + e.getMessage(), e);
        }
    }

    /**
     * Exportation PDF officielle pour la Direction du Budget et du DAG (OpenPDF)
     * Incorpore les logos officiels (Royaume du Maroc + MEF) à l'instar de l'Ordre de Mission
     */
    public byte[] generatePdfReport() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color navyColor = new Color(10, 30, 63);      // #0A1E3F
            Color goldColor = new Color(197, 155, 39);    // #C59B27
            Color headerBg = new Color(10, 30, 63);
            Color zebraBg = new Color(248, 250, 252);

            // Fonts
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, navyColor);
            Font fontSubTitle = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontData = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, navyColor);
            Font fontSection = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, navyColor);

            // 1. Logos & Official Header (identical to Ordre de Mission)
            Image royaumeLogo = loadLogoImage("royaume_du_maroc_logo.png");
            Image mefLogo = loadLogoImage("logo.png");

            if (royaumeLogo != null || mefLogo != null) {
                PdfPTable logoTable = new PdfPTable(2);
                logoTable.setWidthPercentage(100);

                PdfPCell leftLogoCell = new PdfPCell();
                leftLogoCell.setBorder(PdfPCell.NO_BORDER);
                leftLogoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                leftLogoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                if (royaumeLogo != null) {
                    royaumeLogo.scaleToFit(110, 110);
                    leftLogoCell.addElement(royaumeLogo);
                }
                logoTable.addCell(leftLogoCell);

                PdfPCell rightLogoCell = new PdfPCell();
                rightLogoCell.setBorder(PdfPCell.NO_BORDER);
                rightLogoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                rightLogoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                if (mefLogo != null) {
                    mefLogo.scaleToFit(95, 95);
                    rightLogoCell.addElement(mefLogo);
                }
                logoTable.addCell(rightLogoCell);

                document.add(logoTable);
            }

            // 2. Main Title Banner
            Paragraph pHeader = new Paragraph("ROYAUME DU MAROC\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nPARC AUTOMOBILE MINISTÉRIEL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY));
            pHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(pHeader);

            Paragraph pTitle = new Paragraph("RAPPORT EXÉCUTIF DU PARC AUTOMOBILE — BILAN TCO & FLOTTE", fontTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingBefore(6);
            document.add(pTitle);

            Paragraph pSub = new Paragraph("Document de Synthèse pour la Direction du Budget et du DAG — Généré le : " + new Date(), fontSubTitle);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(12);
            document.add(pSub);

            // 3. Executive Summary KPIs
            ExecutiveSummaryDto summary = getExecutiveSummary();
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(14);

            addKpiCell(kpiTable, "FLOTTE TOTALE", summary.getTotalVehicules() + " Véhicules", "Taux Immobilisation: " + summary.getTauxImmobilisation() + "%", navyColor);
            addKpiCell(kpiTable, "COÛT CARBURANT", formatMad(summary.getCoutTotalCarburant()), summary.getTotalLitresConsommes() + " Litres consommé(s)", goldColor);
            addKpiCell(kpiTable, "COÛT MAINTENANCE", formatMad(summary.getCoutTotalMaintenance()), summary.getAlertesActivesCount() + " alertes d'échéances actives", new Color(196, 125, 43));
            addKpiCell(kpiTable, "COÛT GLOBAL (TCO)", formatMad(summary.getTcoGlobal()), "Total Acquisition + Carb + Maint", new Color(13, 122, 95));

            document.add(kpiTable);

            // 4. Direction Table
            Paragraph dirTitle = new Paragraph("1. Répartition du Coût Global (TCO) par Direction du MEF", fontSection);
            dirTitle.setSpacingAfter(6);
            document.add(dirTitle);

            PdfPTable dirTable = new PdfPTable(7);
            dirTable.setWidthPercentage(100);
            dirTable.setWidths(new float[]{28, 9, 15, 15, 15, 18, 16});
            dirTable.setSpacingAfter(14);

            String[] dirHeaders = {"Direction MEF", "Nb Véh.", "Acquisition", "Carburant", "Maintenance", "TCO Total (MAD)", "TCO Moyen / Véh."};
            for (String h : dirHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                dirTable.addCell(cell);
            }

            int idx = 0;
            for (TcoDirectionDto d : summary.getTcoParDirection()) {
                Color bg = (idx % 2 == 0) ? Color.WHITE : zebraBg;
                
                addBodyCell(dirTable, d.getDirection(), fontData, bg, Element.ALIGN_LEFT);
                addBodyCell(dirTable, String.valueOf(d.getNombreVehicules()), fontData, bg, Element.ALIGN_CENTER);
                addBodyCell(dirTable, formatMad(d.getTotalAcquisition()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTotalCarburant()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTotalMaintenance()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTcoTotal()), fontBold, bg, Element.ALIGN_RIGHT);
                addBodyCell(dirTable, formatMad(d.getTcoMoyenParVehicule()), fontData, bg, Element.ALIGN_RIGHT);
                idx++;
            }

            document.add(dirTable);

            // 5. Detailed Vehicle Table
            Paragraph vehTitle = new Paragraph("2. Analyse TCO Individuelle de la Flotte Automobile", fontSection);
            vehTitle.setSpacingAfter(6);
            document.add(vehTitle);

            PdfPTable vehTable = new PdfPTable(8);
            vehTable.setWidthPercentage(100);
            vehTable.setWidths(new float[]{16, 20, 18, 11, 14, 14, 17, 10});

            String[] vehHeaders = {"Immatriculation", "Marque & Modèle", "Direction MEF", "Km Actuel", "Carburant", "Maintenance", "TCO Total (MAD)", "Conso"};
            for (String h : vehHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(headerBg);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                vehTable.addCell(cell);
            }

            idx = 0;
            for (TcoVehiculeDto v : getTcoParVehicule()) {
                Color bg = (idx % 2 == 0) ? Color.WHITE : zebraBg;

                addBodyCell(vehTable, v.getImmatriculation(), fontBold, bg, Element.ALIGN_LEFT);
                addBodyCell(vehTable, v.getMarqueModele(), fontData, bg, Element.ALIGN_LEFT);
                addBodyCell(vehTable, v.getDirection(), fontData, bg, Element.ALIGN_LEFT);
                addBodyCell(vehTable, (v.getKilometrageActuel() != null ? v.getKilometrageActuel().toString() : "0") + " km", fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(vehTable, formatMad(v.getCoutCarburantTotal()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(vehTable, formatMad(v.getCoutMaintenanceTotal()), fontData, bg, Element.ALIGN_RIGHT);
                addBodyCell(vehTable, formatMad(v.getTcoTotal()), fontBold, bg, Element.ALIGN_RIGHT);
                addBodyCell(vehTable, v.getConsommationMoyenne() != null ? v.getConsommationMoyenne() + " L" : "N/A", fontData, bg, Element.ALIGN_CENTER);
                idx++;
            }

            document.add(vehTable);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du rapport PDF : " + e.getMessage(), e);
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
        Font fLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
        Font fVal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
        Font fSub = FontFactory.getFont(FontFactory.HELVETICA, 7, Color.LIGHT_GRAY);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setPadding(8);
        cell.addElement(new Phrase(label, fLabel));
        cell.addElement(new Phrase(value, fVal));
        cell.addElement(new Phrase(sub, fSub));
        table.addCell(cell);
    }

    private Image loadLogoImage(String filename) {
        try {
            java.net.URL url = getClass().getResource("/static/assets/" + filename);
            if (url != null) {
                return Image.getInstance(url);
            }
            url = getClass().getClassLoader().getResource("static/assets/" + filename);
            if (url != null) {
                return Image.getInstance(url);
            }
            java.io.File file = new java.io.File("src/main/resources/static/assets/" + filename);
            if (file.exists()) {
                return Image.getInstance(file.getAbsolutePath());
            }
            file = new java.io.File("target/classes/static/assets/" + filename);
            if (file.exists()) {
                return Image.getInstance(file.getAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("Could not load logo: " + filename + " -> " + e.getMessage());
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

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
     * Pro-Tip 1: Exportation Excel avec mise en forme professionnelle Apache POI:
     * - autoSizeColumn()
     * - En-têtes en gras avec fond bleu marine (#0A1E3F)
     * - Formatage monétaire (#,##0.00 "MAD")
     */
    public byte[] generateExcelReport() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Rapport TCO MEF");

            // Define styles
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0.00 \"MAD\""));

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setDataFormat(format.getFormat("#,##0.00"));

            CellStyle titleStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES - RAPPORT DE SYNTHÈSE DU PARC (TCO)");
            titleCell.setCellStyle(titleStyle);

            Row subTitleRow = sheet.createRow(1);
            subTitleRow.createCell(0).setCellValue("Généré le : " + new Date());

            // Section 1: Summary by Direction
            int rowIdx = 3;
            Row sec1Row = sheet.createRow(rowIdx++);
            Cell sec1Cell = sec1Row.createCell(0);
            sec1Cell.setCellValue("1. SYNTHÈSE DU COÛT GLOBAL (TCO) PAR DIRECTION MEF");
            sec1Cell.setCellStyle(titleStyle);

            String[] headersDir = {"Direction MEF", "Nb Véhicules", "Acquisition Total", "Carburant Total", "Maintenance Total", "TCO Total (MAD)", "TCO Moyen / Véhicule"};
            Row headerRow = sheet.createRow(rowIdx++);
            for (int i = 0; i < headersDir.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headersDir[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoDirectionDto> dirList = getTcoParDirection();
            for (TcoDirectionDto d : dirList) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(d.getDirection());
                row.createCell(1).setCellValue(d.getNombreVehicules());
                
                Cell c2 = row.createCell(2); c2.setCellValue(d.getTotalAcquisition().doubleValue()); c2.setCellStyle(currencyStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(d.getTotalCarburant().doubleValue()); c3.setCellStyle(currencyStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(d.getTotalMaintenance().doubleValue()); c4.setCellStyle(currencyStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(d.getTcoTotal().doubleValue()); c5.setCellStyle(currencyStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(d.getTcoMoyenParVehicule().doubleValue()); c6.setCellStyle(currencyStyle);
            }

            // Section 2: Detailed Vehicle TCO
            rowIdx += 2;
            Row sec2Row = sheet.createRow(rowIdx++);
            Cell sec2Cell = sec2Row.createCell(0);
            sec2Cell.setCellValue("2. DÉTAIL DU TCO ET CONSOMMATION PAR VÉHICULE");
            sec2Cell.setCellStyle(titleStyle);

            String[] headersVeh = {"Immatriculation", "Marque & Modèle", "Direction MEF", "Kilométrage", "Statut", "Acquisition", "Carburant", "Maintenance", "TCO Total (MAD)", "Conso (L/100km)"};
            Row headerRow2 = sheet.createRow(rowIdx++);
            for (int i = 0; i < headersVeh.length; i++) {
                Cell cell = headerRow2.createCell(i);
                cell.setCellValue(headersVeh[i]);
                cell.setCellStyle(headerStyle);
            }

            List<TcoVehiculeDto> vehList = getTcoParVehicule();
            for (TcoVehiculeDto v : vehList) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(v.getImmatriculation());
                row.createCell(1).setCellValue(v.getMarqueModele());
                row.createCell(2).setCellValue(v.getDirection());
                row.createCell(3).setCellValue(v.getKilometrageActuel() != null ? v.getKilometrageActuel() : 0);
                row.createCell(4).setCellValue(v.getStatutAdministratif());

                Cell c5 = row.createCell(5); c5.setCellValue(v.getCoutAcquisition().doubleValue()); c5.setCellStyle(currencyStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(v.getCoutCarburantTotal().doubleValue()); c6.setCellStyle(currencyStyle);
                Cell c7 = row.createCell(7); c7.setCellValue(v.getCoutMaintenanceTotal().doubleValue()); c7.setCellStyle(currencyStyle);
                Cell c8 = row.createCell(8); c8.setCellValue(v.getTcoTotal().doubleValue()); c8.setCellStyle(currencyStyle);

                Cell c9 = row.createCell(9);
                if (v.getConsommationMoyenne() != null) {
                    c9.setCellValue(v.getConsommationMoyenne());
                    c9.setCellStyle(numberStyle);
                } else {
                    c9.setCellValue("N/A");
                }
            }

            // Apply autoSizeColumn to all columns for crisp presentation
            for (int i = 0; i < Math.max(headersDir.length, headersVeh.length); i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 1000, 4000));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du fichier Excel : " + e.getMessage(), e);
        }
    }

    /**
     * Exportation PDF officielle pour la Direction du Budget et du DAG (OpenPDF)
     */
    public byte[] generatePdfReport() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(10, 30, 63));
            Font fontSubTitle = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontData = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.BLACK);

            // Header MEF
            Paragraph pHeader = new Paragraph("ROYAUME DU MAROC\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nDIRECTION DU BUDGET & DAG", fontTitle);
            pHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(pHeader);

            Paragraph pTitle = new Paragraph("RAPPORT EXÉCUTIF DU PARC AUTOMOBILE - TCO & MAINTENANCE", fontTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingBefore(10);
            document.add(pTitle);

            Paragraph pSub = new Paragraph("Rapport généré le : " + new Date(), fontSubTitle);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(15);
            document.add(pSub);

            // Executive Summary KPIs
            ExecutiveSummaryDto summary = getExecutiveSummary();
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(15);

            addKpiCell(kpiTable, "FLOTTE TOTALE", summary.getTotalVehicules() + " Véhicules", "Taux Immo: " + summary.getTauxImmobilisation() + "%", new Color(10, 30, 63));
            addKpiCell(kpiTable, "COÛT CARBURANT", formatMad(summary.getCoutTotalCarburant()), summary.getTotalLitresConsommes() + " Litres", new Color(197, 155, 39));
            addKpiCell(kpiTable, "COÛT MAINTENANCE", formatMad(summary.getCoutTotalMaintenance()), "Réparations & Entretiens", new Color(196, 125, 43));
            addKpiCell(kpiTable, "TCO GLOBAL MEF", formatMad(summary.getTcoGlobal()), "Acq + Carb + Maint", new Color(13, 122, 95));

            document.add(kpiTable);

            // Direction Table
            Paragraph dirTitle = new Paragraph("Bilan par Direction Ministérielle (TCO)", fontTitle);
            dirTitle.setSpacingAfter(10);
            document.add(dirTitle);

            PdfPTable dirTable = new PdfPTable(6);
            dirTable.setWidthPercentage(100);
            dirTable.setWidths(new float[]{30, 10, 15, 15, 15, 15});
            dirTable.setSpacingAfter(20);

            String[] dirHeaders = {"Direction", "Nb Véh.", "Acquisition", "Carburant", "Maintenance", "TCO Total (MAD)"};
            for (String h : dirHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(new Color(10, 30, 63));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                dirTable.addCell(cell);
            }

            for (TcoDirectionDto d : summary.getTcoParDirection()) {
                dirTable.addCell(new Phrase(d.getDirection(), fontData));
                dirTable.addCell(new Phrase(String.valueOf(d.getNombreVehicules()), fontData));
                dirTable.addCell(new Phrase(formatMad(d.getTotalAcquisition()), fontData));
                dirTable.addCell(new Phrase(formatMad(d.getTotalCarburant()), fontData));
                dirTable.addCell(new Phrase(formatMad(d.getTotalMaintenance()), fontData));
                dirTable.addCell(new Phrase(formatMad(d.getTcoTotal()), fontBold));
            }

            document.add(dirTable);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du rapport PDF : " + e.getMessage(), e);
        }
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

    private String formatMad(BigDecimal val) {
        if (val == null) return "0.00 MAD";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.FRENCH);
        symbols.setGroupingSeparator(' ');
        DecimalFormat df = new DecimalFormat("#,##0.00 MAD", symbols);
        return df.format(val);
    }
}

package com.mef.parkauto.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mef.parkauto.entity.Affectation;
import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.DemandeDeplacement;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.AffectationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class OrdreMissionService {

    private final AffectationRepository affectationRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Transactional(readOnly = true)
    public byte[] generateOrdreMissionPdf(Long affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new ResourceNotFoundException("Affectation non trouvée : " + affectationId));

        DemandeDeplacement demande = affectation.getDemandeDeplacement();
        Vehicule vehicule = affectation.getVehicule();
        Conducteur conducteur = affectation.getConducteur();

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(197, 160, 89)); // Gold #C5A059
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(15, 29, 50)); // Dark #0F1D32
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font valueFont;
            try {
                BaseFont unicodeFont = BaseFont.createFont("Arial", BaseFont.IDENTITY_H, BaseFont.NOT_EMBEDDED);
                valueFont = new Font(unicodeFont, 10, Font.NORMAL, Color.DARK_GRAY);
            } catch (DocumentException e) {
                valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            }

            // 1. Logos
            Image royaumeLogo = Image.getInstance(getClass().getResource("/static/assets/royaume_du_maroc_logo.png"));
            royaumeLogo.scaleToFit(130, 130);
            Image mefLogo = Image.getInstance(getClass().getResource("/static/assets/logo.png"));
            mefLogo.scaleToFit(110, 110);

            PdfPTable logoTable = new PdfPTable(2);
            logoTable.setWidthPercentage(100);
            logoTable.setHorizontalAlignment(Element.ALIGN_CENTER);

            PdfPCell leftLogoCell = new PdfPCell(royaumeLogo, false);
            leftLogoCell.setBorder(PdfPCell.NO_BORDER);
            leftLogoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            leftLogoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoTable.addCell(leftLogoCell);

            PdfPCell rightLogoCell = new PdfPCell(mefLogo, false);
            rightLogoCell.setBorder(PdfPCell.NO_BORDER);
            rightLogoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightLogoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoTable.addCell(rightLogoCell);

            document.add(logoTable);

            document.add(new Paragraph(" "));

            // 2. Header Kingdom of Morocco / MEF
            Paragraph header = new Paragraph("ROYAUME DU MAROC\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nPARC AUTOMOBILE MINISTÉRIEL", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            document.add(new Paragraph(" "));

            // 3. Main Title
            Paragraph title = new Paragraph("ORDRE DE MISSION OFFICIEL\nN° " + affectation.getReference(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph(" "));

            // Table 1: Information Mission
            PdfPTable tableMission = new PdfPTable(2);
            tableMission.setWidthPercentage(100);

            String demandeurNom = (demande.getDemandeur() != null) ? demande.getDemandeur().getNom() + " " + demande.getDemandeur().getPrenom() : "-";
            String demandeurStructure = (demande.getDemandeur() != null) ? (demande.getDemandeur().getDirection() != null ? demande.getDemandeur().getDirection() : "MEF") + " / " + (demande.getDemandeur().getService() != null ? demande.getDemandeur().getService() : "-") : "-";

            addTableCell(tableMission, "RÉFÉRENCE DEMANDE", demande.getReference(), labelFont, valueFont);
            addTableCell(tableMission, "DATE D'ÉMISSION", affectation.getDateCreation() != null ? affectation.getDateCreation().format(DATE_FORMATTER) : "-", labelFont, valueFont);
            addTableCell(tableMission, "BENEFICIAIRE / AGENT", demandeurNom, labelFont, valueFont);
            addTableCell(tableMission, "DIRECTION & SERVICE", demandeurStructure, labelFont, valueFont);
            addTableCell(tableMission, "MOTIF / OBJET DE LA MISSION", demande.getMotif(), labelFont, valueFont);
            addTableCell(tableMission, "DESTINATION", demande.getDestination(), labelFont, valueFont);
            addTableCell(tableMission, "DATE & HEURE DÉPART", demande.getDateHeureDepart().format(DATE_FORMATTER), labelFont, valueFont);
            addTableCell(tableMission, "DATE & HEURE RETOUR PRÉVUE", demande.getDateHeureRetourEstimee().format(DATE_FORMATTER), labelFont, valueFont);

            document.add(new Paragraph("Informations relatives à la Mission", sectionTitleFont));
            document.add(new Paragraph(" "));
            document.add(tableMission);

            document.add(new Paragraph(" "));

            // Table 2: Véhicule & Conducteur
            PdfPTable tableVehicule = new PdfPTable(2);
            tableVehicule.setWidthPercentage(100);

            addTableCell(tableVehicule, "VÉHICULE AFFECTÉ", vehicule.getMarque() + " " + vehicule.getModele() + " (" + vehicule.getTypeCarburant() + ")", labelFont, valueFont);
            addTableCell(tableVehicule, "IMMATRICULATION", vehicule.getImmatriculation(), labelFont, valueFont);
            addTableCell(tableVehicule, "KILOMÉTRAGE DÉPART", affectation.getKilometrageDepart() + " km", labelFont, valueFont);
            addTableCell(tableVehicule, "CONDUCTEUR DÉSIGNÉ", conducteur.getNom() + " " + conducteur.getPrenom(), labelFont, valueFont);
            addTableCell(tableVehicule, "N° PERMIS / CATÉGORIE", conducteur.getNumeroPermis() + " (Cat. " + conducteur.getCategoriePermis() + ")", labelFont, valueFont);
            addTableCell(tableVehicule, "TÉLÉPHONE CONDUCTEUR", conducteur.getTelephone() != null ? conducteur.getTelephone() : "-", labelFont, valueFont);
            addTableCell(tableVehicule, "PASSAGERS / ACCOMPAGNATEURS", demande.getListePassagers() != null && !demande.getListePassagers().isEmpty() ? demande.getListePassagers() : "Aucun", labelFont, valueFont);

            document.add(new Paragraph("Véhicule et Chauffeur Assignés", sectionTitleFont));
            document.add(new Paragraph(" "));
            document.add(tableVehicule);

            // Table 3: Procès-Verbal de Restitution & Clôture (Dynamic section if vehicle has been returned)
            boolean isRestituee = affectation.getKilometrageRetour() != null || affectation.getDateFinReelle() != null;
            if (isRestituee) {
                document.newPage();
                PdfPTable tableRestitution = new PdfPTable(2);
                tableRestitution.setWidthPercentage(100);

                String dateRetour = affectation.getDateFinReelle() != null ? affectation.getDateFinReelle().format(DATE_FORMATTER) : "-";
                long kmDepart = affectation.getKilometrageDepart();
                long kmRetour = affectation.getKilometrageRetour() != null ? affectation.getKilometrageRetour() : kmDepart;
                long distance = Math.max(0L, kmRetour - kmDepart);

                addTableCell(tableRestitution, "DATE & HEURE RESTITUTION EFFECTIVE", dateRetour, labelFont, valueFont);
                addTableCell(tableRestitution, "KILOMÉTRAGE RETOUR EFFECTIF", kmRetour + " km", labelFont, valueFont);
                addTableCell(tableRestitution, "DISTANCE TOTALE PARCOURUE", distance + " km", labelFont, valueFont);
                addTableCell(tableRestitution, "NIVEAU CARBURANT AU RETOUR", affectation.getNiveauCarburantRetour() != null ? affectation.getNiveauCarburantRetour() : "Non spécifié", labelFont, valueFont);
                addTableCell(tableRestitution, "ANOMALIES / REMARQUES ÉVENTUELLES", affectation.getRemarquesRestitution() != null && !affectation.getRemarquesRestitution().isEmpty() ? affectation.getRemarquesRestitution() : "Aucune anomalie signalée", labelFont, valueFont);
                addTableCell(tableRestitution, "STATUT FINAL DE L'AFFECTATION", "CLÔTURÉE & RESTITUÉE (Véhicule remis en disponibilité)", labelFont, valueFont);

                document.add(new Paragraph("Procès-Verbal de Restitution & Clôture de Mission", sectionTitleFont));
                document.add(new Paragraph(" "));
                document.add(tableRestitution);
            }

            document.add(new Paragraph(" "));

            // Instructions & Signatures
            String noteText = isRestituee
                ? "Note : Le présent document certifie l'exécution complète de la mission et la restitution du véhicule au Parc Automobile du Ministère."
                : "Note : Le présent ordre de mission autorise l'utilisation du véhicule ci-dessus aux dates et itinéraires mentionnés. Il doit être présenté à toute réquisition des autorités compétentes.";
            Paragraph note = new Paragraph(noteText, valueFont);
            document.add(note);

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // Signature block
            PdfPTable tableSignature = new PdfPTable(2);
            tableSignature.setWidthPercentage(100);

            PdfPCell cellLeft = new PdfPCell(new Phrase("Le Responsable du Parc Automobile\n\n\n\n[Signature et Cachet]", labelFont));
            cellLeft.setBorder(PdfPCell.NO_BORDER);
            cellLeft.setHorizontalAlignment(Element.ALIGN_CENTER);

            PdfPCell cellRight = new PdfPCell(new Phrase("Le Conducteur / Bénéficiaire\n\n\n\n[Lu et Approuvé]", labelFont));
            cellRight.setBorder(PdfPCell.NO_BORDER);
            cellRight.setHorizontalAlignment(Element.ALIGN_CENTER);

            tableSignature.addCell(cellLeft);
            tableSignature.addCell(cellRight);

            document.add(tableSignature);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF d'Ordre de Mission : " + e.getMessage(), e);
        }

        return out.toByteArray();
    }

    private void addTableCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, labelFont));
        cellLabel.setBackgroundColor(new Color(240, 243, 248));
        cellLabel.setPadding(6);

        PdfPCell cellValue = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        cellValue.setPadding(6);

        table.addCell(cellLabel);
        table.addCell(cellValue);
    }
}

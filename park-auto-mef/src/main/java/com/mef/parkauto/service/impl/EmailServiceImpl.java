package com.mef.parkauto.service.impl;

import com.mef.parkauto.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:hello@demomailtrap.com}")
    private String fromEmail;

    private static final String HEADER_STYLE =
        "background-color:#0F1D32;color:#fff;padding:24px;text-align:center;";
    private static final String TITLE_STYLE =
        "margin:0;font-size:20px;font-weight:800;text-transform:uppercase;color:#C5A059;";
    private static final String SUB_STYLE =
        "margin:4px 0 0 0;font-size:12px;color:#94a3b8;";
    private static final String CARD_STYLE =
        "max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);";
    private static final String FOOTER_HTML =
        "<div style=\"background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px;text-align:center;font-size:11px;color:#64748b;\">" +
        "Ce message automatique a été envoyé par le Système Park Auto MEF. Merci de ne pas y répondre directement.</div>";

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // =====================================================================
    // Sprint 1 — Mot de passe temporaire
    // =====================================================================

    @Override
    @Async
    public void sendTemporaryPassword(String toEmail, String nom, String prenom, String tempPassword) {
        try {
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>body{font-family:'Segoe UI',Arial,sans-serif;background-color:#f4f6f9;color:#1e293b;margin:0;padding:20px;}</style>
                </head><body>
                <div style="%s">
                  <div style="%s">
                    <h1 style="%s">Royaume du Maroc</h1>
                    <p style="%s">Ministère de l'Économie et des Finances — Park Auto MEF</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Votre compte d'accès au Système de Gestion du Parc Automobile du MEF a été créé.</p>
                    <p>Voici votre mot de passe temporaire :</p>
                    <div style="background:#F8FAFC;border-left:4px solid #C5A059;padding:16px;border-radius:8px;margin:20px 0;font-family:monospace;font-size:18px;font-weight:bold;color:#0F1D32;letter-spacing:1px;">%s</div>
                    <p style="font-size:12px;color:#ef4444;">📌 <strong>Important :</strong> Vous devrez modifier ce mot de passe lors de votre première connexion.</p>
                    <p>Cordialement,<br><strong>L'Équipe Support IT — MEF</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, HEADER_STYLE, TITLE_STYLE, SUB_STYLE,
                              prenom, nom, tempPassword, FOOTER_HTML);
            sendHtml(toEmail, "Royaume du Maroc — MEF : Création de votre Compte Park Auto & Mot de Passe Temporaire", html);
        } catch (Exception e) {
            log.error("Échec envoi email mot de passe temporaire à {} : {}", toEmail, e.getMessage());
        }
    }

    // =====================================================================
    // Sprint 5 — Alerte Assurance J-30
    // =====================================================================

    @Override
    @Async
    public void sendAssuranceExpirationAlert(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, String numeroPolice, LocalDate dateFin) {
        try {
            long jours = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dateFin);
            String couleur = jours <= 7 ? "#ef4444" : "#f59e0b";
            String urgence = jours <= 0 ? "⛔ EXPIRÉE" : ("⚠️ J-" + jours);
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;padding:20px;">
                <div style="%s">
                  <div style="%s">
                    <h1 style="%s">Park Auto MEF</h1>
                    <p style="%s">Alerte Assurance — Échéance Imminente</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Le contrat d'assurance ci-dessous nécessite votre attention :</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                      <tr style="background:#f8fafc;"><td style="padding:10px;font-weight:600;">Véhicule</td><td style="padding:10px;">%s — %s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">N° Police</td><td style="padding:10px;">%s</td></tr>
                      <tr style="background:#f8fafc;"><td style="padding:10px;font-weight:600;">Date d'expiration</td><td style="padding:10px;color:%s;font-weight:bold;">%s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Statut</td><td style="padding:10px;"><span style="background:%s;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;">%s</span></td></tr>
                    </table>
                    <p>⚠️ Veuillez procéder au renouvellement du contrat dans les meilleurs délais pour éviter tout blocage d'affectation de véhicule.</p>
                    <p>Cordialement,<br><strong>Système Park Auto MEF — Notifications Automatiques</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, HEADER_STYLE, TITLE_STYLE, SUB_STYLE,
                              prenom, nom,
                              immatriculation, marqueModele, numeroPolice,
                              couleur, dateFin.format(DATE_FMT),
                              couleur, urgence,
                              FOOTER_HTML);
            sendHtml(toEmail, "⚠️ MEF Park Auto — Alerte Assurance J-" + jours + " : " + immatriculation, html);
        } catch (Exception e) {
            log.error("Échec envoi alerte assurance à {} : {}", toEmail, e.getMessage());
        }
    }

    // =====================================================================
    // Sprint 5 — Notification Sinistre Déclaré (RG01)
    // =====================================================================

    @Override
    @Async
    public void sendSinistreNotification(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, String natureAccident, String lieu) {
        try {
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;padding:20px;">
                <div style="%s">
                  <div style="background:#7f1d1d;color:#fff;padding:24px;text-align:center;">
                    <h1 style="%s">🚨 Sinistre Déclaré</h1>
                    <p style="%s">Park Auto MEF — Alerte Immédiate</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Un sinistre vient d'être déclaré dans le système. Le véhicule a été automatiquement marqué <strong style="color:#ef4444;">ACCIDENTÉ</strong>.</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                      <tr style="background:#fef2f2;"><td style="padding:10px;font-weight:600;">Véhicule</td><td style="padding:10px;font-weight:bold;">%s — %s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Nature de l'accident</td><td style="padding:10px;">%s</td></tr>
                      <tr style="background:#fef2f2;"><td style="padding:10px;font-weight:600;">Lieu</td><td style="padding:10px;">%s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Statut véhicule</td><td style="padding:10px;"><span style="background:#ef4444;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;">ACCIDENTÉ</span></td></tr>
                    </table>
                    <p>Veuillez prendre les dispositions nécessaires (expertise, déclaration compagnie d'assurance).</p>
                    <p>Cordialement,<br><strong>Système Park Auto MEF — Notifications Automatiques</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, TITLE_STYLE, SUB_STYLE,
                              prenom, nom,
                              immatriculation, marqueModele, natureAccident,
                              lieu != null ? lieu : "Non renseigné",
                              FOOTER_HTML);
            sendHtml(toEmail, "🚨 MEF Park Auto — Sinistre Déclaré : " + immatriculation, html);
        } catch (Exception e) {
            log.error("Échec envoi notification sinistre à {} : {}", toEmail, e.getMessage());
        }
    }

    // =====================================================================
    // Sprint 5 — Alerte Dépassement Budget
    // =====================================================================

    @Override
    @Async
    public void sendBudgetDepassementAlert(String toEmail, String nom, String prenom,
            String direction, String natureDepense, BigDecimal montantAlloue, BigDecimal montantRealise) {
        try {
            double taux = montantAlloue != null && montantAlloue.compareTo(BigDecimal.ZERO) > 0
                ? montantRealise.divide(montantAlloue, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100 : 0;
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;padding:20px;">
                <div style="%s">
                  <div style="%s">
                    <h1 style="%s">Park Auto MEF</h1>
                    <p style="%s">Alerte Budgétaire — Dépassement Détecté</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Un dépassement budgétaire a été détecté :</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                      <tr style="background:#f8fafc;"><td style="padding:10px;font-weight:600;">Direction</td><td style="padding:10px;">%s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Nature de dépense</td><td style="padding:10px;">%s</td></tr>
                      <tr style="background:#fef2f2;"><td style="padding:10px;font-weight:600;">Montant alloué</td><td style="padding:10px;">%s MAD</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Montant réalisé</td><td style="padding:10px;color:#ef4444;font-weight:bold;">%s MAD</td></tr>
                      <tr style="background:#fef2f2;"><td style="padding:10px;font-weight:600;">Taux de consommation</td><td style="padding:10px;"><span style="background:#ef4444;color:#fff;padding:4px 10px;border-radius:6px;">%.1f%%</span></td></tr>
                    </table>
                    <p>Cordialement,<br><strong>Système Park Auto MEF — Notifications Automatiques</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, HEADER_STYLE, TITLE_STYLE, SUB_STYLE,
                              prenom, nom,
                              direction, natureDepense,
                              montantAlloue, montantRealise, taux,
                              FOOTER_HTML);
            sendHtml(toEmail, "💰 MEF Park Auto — Alerte Dépassement Budget : " + direction, html);
        } catch (Exception e) {
            log.error("Échec envoi alerte budget à {} : {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendBudgetAlertEmail(String direction, String natureDepense, BigDecimal montantAlloue, BigDecimal montantRealise) {
        sendBudgetDepassementAlert("admin@mef.gov.ma", "Responsable", "Financier", direction, natureDepense, montantAlloue, montantRealise);
    }

    // =====================================================================
    // Sprint 5 — Alerte Visite Technique Imminente
    // =====================================================================

    @Override
    @Async
    public void sendVisiteTechniqueAlert(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, LocalDate dateProchaine) {
        try {
            long jours = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dateProchaine);
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;padding:20px;">
                <div style="%s">
                  <div style="%s">
                    <h1 style="%s">Park Auto MEF</h1>
                    <p style="%s">Alerte Visite Technique — Échéance Imminente</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Une visite technique est prévue dans <strong style="color:#f59e0b;">%d jour(s)</strong> :</p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                      <tr style="background:#f8fafc;"><td style="padding:10px;font-weight:600;">Véhicule</td><td style="padding:10px;">%s — %s</td></tr>
                      <tr><td style="padding:10px;font-weight:600;">Date de visite</td><td style="padding:10px;font-weight:bold;color:#f59e0b;">%s</td></tr>
                    </table>
                    <p>Veuillez vous assurer que le véhicule est disponible et en état pour la visite technique.</p>
                    <p>Cordialement,<br><strong>Système Park Auto MEF — Notifications Automatiques</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, HEADER_STYLE, TITLE_STYLE, SUB_STYLE,
                              prenom, nom, jours,
                              immatriculation, marqueModele,
                              dateProchaine.format(DATE_FMT),
                              FOOTER_HTML);
            sendHtml(toEmail, "🔧 MEF Park Auto — Visite Technique Imminente : " + immatriculation, html);
        } catch (Exception e) {
            log.error("Échec envoi alerte VT à {} : {}", toEmail, e.getMessage());
        }
    }

    // =====================================================================
    // Sprint 8 — Alerte générique (CdC §21)
    // =====================================================================

    @Override
    @Async
    public void sendAlerteGenerique(String toEmail, String nom, String prenom, String titre,
            java.util.Map<String, String> lignes, String severite) {
        try {
            String couleur = "CRITIQUE".equalsIgnoreCase(severite) ? "#ef4444"
                    : ("ATTENTION".equalsIgnoreCase(severite) ? "#f59e0b" : "#2563eb");
            StringBuilder rows = new StringBuilder();
            boolean alt = false;
            for (java.util.Map.Entry<String, String> e : lignes.entrySet()) {
                rows.append("<tr").append(alt ? " style=\"background:#f8fafc;\"" : "").append(">")
                    .append("<td style=\"padding:10px;font-weight:600;\">").append(escape(e.getKey())).append("</td>")
                    .append("<td style=\"padding:10px;\">").append(escape(e.getValue())).append("</td></tr>");
                alt = !alt;
            }
            String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;padding:20px;">
                <div style="%s">
                  <div style="%s">
                    <h1 style="%s">Park Auto MEF</h1>
                    <p style="%s">%s</p>
                  </div>
                  <div style="padding:30px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p><span style="background:%s;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;">%s</span></p>
                    <table style="width:100%%;border-collapse:collapse;margin:16px 0;">%s</table>
                    <p>Cordialement,<br><strong>Système Park Auto MEF — Notifications Automatiques</strong></p>
                  </div>
                  %s
                </div></body></html>
                """.formatted(CARD_STYLE, HEADER_STYLE, TITLE_STYLE, SUB_STYLE, escape(titre),
                              escape(prenom), escape(nom), couleur, severite != null ? severite : "INFO",
                              rows, FOOTER_HTML);
            sendHtml(toEmail, "MEF Park Auto — " + titre, html);
        } catch (Exception e) {
            log.error("Échec envoi alerte '{}' à {} : {}", titre, toEmail, e.getMessage());
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    // =====================================================================
    // Utilitaire privé
    // =====================================================================

    private void sendHtml(String toEmail, String subject, String htmlBody) throws Exception {
        if (toEmail == null || toEmail.isBlank()) {
            log.debug("Envoi e-mail ignoré : destinataire vide (sujet : {})", subject);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
        log.info("Email envoyé avec succès à {} — Sujet : {}", toEmail, subject);
    }
}

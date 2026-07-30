package com.mef.parkauto.service.impl;

import com.mef.parkauto.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:hello@demomailtrap.com}")
    private String fromEmail;

    @Override
    @Async
    public void sendTemporaryPassword(String toEmail, String nom, String prenom, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Royaume du Maroc — MEF : Création de votre Compte Park Auto & Mot de Passe Temporaire");

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 20px; }
                        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                        .header { background-color: #0F1D32; color: #ffffff; padding: 24px; text-align: center; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; color: #C5A059; }
                        .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; }
                        .content { padding: 30px; }
                        .pwd-box { background-color: #F8FAFC; border-left: 4px solid #C5A059; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #0F1D32; letter-spacing: 1px; }
                        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">
                            <h1>Royaume du Maroc</h1>
                            <p>Ministère de l'Économie et des Finances — Park Auto MEF</p>
                        </div>
                        <div class="content">
                            <p>Bonjour <strong>%s %s</strong>,</p>
                            <p>Votre compte d'accès au Système de Gestion du Parc Automobile du MEF a été créé par l'administrateur système.</p>
                            <p>Voici votre mot de passe temporaire pour votre première connexion :</p>
                            <div class="pwd-box">%s</div>
                            <p style="font-size: 12px; color: #ef4444;">📌 <strong>Important :</strong> Lors de votre première connexion, le système vous demandera de modifier obligatoirement ce mot de passe temporaire pour des raisons de sécurité.</p>
                            <p>Cordialement,<br><strong>L'Équipe Support IT — MEF</strong></p>
                        </div>
                        <div class="footer">
                            Ce message automatique a été envoyé par le Système Park Auto MEF. Merci de ne pas y répondre directement.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(prenom, nom, tempPassword);

            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email de mot de passe temporaire envoyé avec succès à {}", toEmail);

        } catch (Exception e) {
            log.error("Échec de l'envoi de l'email à {} : {}", toEmail, e.getMessage(), e);
        }
    }
}

package com.mef.parkauto.service;

public interface EmailService {

    /**
     * Envoie un email contenant le mot de passe temporaire à un nouvel utilisateur.
     *
     * @param toEmail      l'adresse email du destinataire
     * @param nom          le nom de l'utilisateur
     * @param prenom       le prénom de l'utilisateur
     * @param tempPassword le mot de passe temporaire en clair
     */
    void sendTemporaryPassword(String toEmail, String nom, String prenom, String tempPassword);

    void sendAssuranceExpirationAlert(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, String numeroPolice, java.time.LocalDate dateFin);

    void sendSinistreNotification(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, String natureAccident, String lieu);

    void sendBudgetDepassementAlert(String toEmail, String nom, String prenom,
            String direction, String natureDepense, java.math.BigDecimal montantAlloue, java.math.BigDecimal montantRealise);

    void sendBudgetAlertEmail(String direction, String natureDepense, java.math.BigDecimal montantAlloue, java.math.BigDecimal montantRealise);

    void sendVisiteTechniqueAlert(String toEmail, String nom, String prenom,
            String immatriculation, String marqueModele, java.time.LocalDate dateProchaine);
}

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
}

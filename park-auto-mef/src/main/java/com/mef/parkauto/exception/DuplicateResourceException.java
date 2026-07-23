package com.mef.parkauto.exception;

/**
 * Exception levée lors d'une tentative de création d'une ressource
 * avec un identifiant unique déjà existant (email, matricule, etc.).
 * Résulte en une réponse HTTP 409.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}

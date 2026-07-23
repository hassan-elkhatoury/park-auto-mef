package com.mef.parkauto.exception;

/**
 * Exception levée lorsque la requête du client est invalide
 * ou contient des données incohérentes.
 * Résulte en une réponse HTTP 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

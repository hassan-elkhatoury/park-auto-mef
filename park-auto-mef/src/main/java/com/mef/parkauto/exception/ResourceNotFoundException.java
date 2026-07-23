package com.mef.parkauto.exception;

/**
 * Exception levée lorsqu'une ressource demandée n'existe pas.
 * Résulte en une réponse HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}

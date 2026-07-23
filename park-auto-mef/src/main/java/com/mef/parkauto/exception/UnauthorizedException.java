package com.mef.parkauto.exception;

/**
 * Exception levée lorsqu'un utilisateur n'est pas authentifié
 * ou que ses identifiants sont invalides.
 * Résulte en une réponse HTTP 401.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}

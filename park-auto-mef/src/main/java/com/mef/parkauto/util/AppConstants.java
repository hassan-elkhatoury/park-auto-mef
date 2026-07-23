package com.mef.parkauto.util;

/**
 * Constantes partagées de l'application.
 * Utilisées dans la pagination, la journalisation et les modules métier.
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class — not instantiable
    }

    // ---- Pagination ----
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT_FIELD = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";

    // ---- Module names (journalisation) ----
    public static final String MODULE_AUTH = "AUTH";
    public static final String MODULE_UTILISATEUR = "UTILISATEUR";
    public static final String MODULE_ROLE = "ROLE";
    public static final String MODULE_VEHICULE = "VEHICULE";
    public static final String MODULE_ASSURANCE = "ASSURANCE";
    public static final String MODULE_ENTRETIEN = "ENTRETIEN";

    // ---- Action names (journalisation) ----
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_LOGIN = "LOGIN";
    public static final String ACTION_LOGOUT = "LOGOUT";
    public static final String ACTION_CHANGE_STATUS = "CHANGE_STATUS";
    public static final String ACTION_CHANGE_ROLES = "CHANGE_ROLES";
}

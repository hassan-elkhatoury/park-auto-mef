package com.mef.parkauto.entity;

/**
 * Statuts du compte utilisateur.
 * Remplace le simple boolean actif par un enum plus expressif.
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    LOCKED,
    ARCHIVED
}

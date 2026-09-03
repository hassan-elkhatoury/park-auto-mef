package com.mef.parkauto.entity;

/**
 * Statut d'une taxe / vignette automobile.
 * A_PAYER : échéance à venir, non réglée (statut par défaut) ;
 * EN_RETARD : échéance dépassée sans paiement (alerte "taxe non payée", CdC §21) ;
 * PAYEE : réglée (référence de paiement) ;
 * EXONEREE : véhicule exonéré.
 */
public enum StatutTaxe {
    A_PAYER, PAYEE, EN_RETARD, EXONEREE
}

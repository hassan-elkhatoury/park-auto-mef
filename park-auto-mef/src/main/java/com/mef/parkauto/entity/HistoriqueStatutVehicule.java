package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité traçant l'historique des changements de statuts administratifs
 * et d'états techniques d'un véhicule.
 */
@Entity
@Table(name = "historique_statuts_vehicule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueStatutVehicule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatutAdministratif ancienStatutAdministratif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutAdministratif nouveauStatutAdministratif;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EtatTechnique ancienEtatTechnique;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EtatTechnique nouveauEtatTechnique;

    @Column(nullable = false)
    private LocalDateTime dateChangement = LocalDateTime.now();

    @Column(length = 500)
    private String motif;

    @Column(nullable = false, length = 100)
    private String utilisateur;

    @Column(length = 255)
    private String pieceJustificative;
}

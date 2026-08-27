package com.mef.parkauto.service;

import com.mef.parkauto.entity.RoleType;
import com.mef.parkauto.entity.StatutAssurance;
import com.mef.parkauto.repository.AssuranceRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.repository.VisiteTechniqueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final AssuranceRepository assuranceRepository;
    private final VisiteTechniqueRepository vtRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    /**
     * Vérifie quotidiennement (8h00) les assurances expirant dans 30 jours et les VT proches.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional(readOnly = true)
    public void envoyerAlertesQuotidiennes() {
        log.info("NotificationService - Démarrage des alertes quotidiennes J-30");

        LocalDate today = LocalDate.now();
        LocalDate limit30 = today.plusDays(30);

        // Alertes assurances
        List<com.mef.parkauto.entity.Assurance> assurancesExpirant =
                assuranceRepository.findExpirantEntre(today, limit30);

        assurancesExpirant.forEach(assurance -> {
            log.info("Alerte assurance expirante : police {} - véhicule {}",
                    assurance.getNumeroPolice(),
                    assurance.getVehicule().getImmatriculation());
            // Notifier les gestionnaires
            utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null &&
                             (u.getRole().getNom() == RoleType.GESTIONNAIRE_CENTRAL ||
                              u.getRole().getNom() == RoleType.ADMIN))
                .forEach(g -> {
                    try {
                        emailService.sendAssuranceExpirationAlert(
                            g.getEmail(), g.getNom(), g.getPrenom(),
                            assurance.getVehicule().getImmatriculation(),
                            assurance.getVehicule().getMarque() + " " + assurance.getVehicule().getModele(),
                            assurance.getNumeroPolice(),
                            assurance.getDateFin()
                        );
                    } catch (Exception e) {
                        log.error("Erreur envoi alerte assurance : {}", e.getMessage());
                    }
                });
        });

        // Alertes visites techniques
        vtRepository.findByDateProchaineBeforeAndDateProchaineIsNotNull(limit30).stream()
            .filter(vt -> vt.getDateProchaine() != null && vt.getDateProchaine().isAfter(today.minusDays(1)))
            .forEach(vt -> log.info("Alerte VT prochaine : véhicule {} - date {}",
                    vt.getVehicule().getImmatriculation(), vt.getDateProchaine()));

        log.info("NotificationService - Alertes quotidiennes terminées. {} assurances expirant signalées.",
                assurancesExpirant.size());
    }
}

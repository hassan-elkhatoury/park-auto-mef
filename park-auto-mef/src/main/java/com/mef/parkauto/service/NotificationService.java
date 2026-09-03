package com.mef.parkauto.service;

import com.mef.parkauto.dto.AlerteEcheanceDto;
import com.mef.parkauto.entity.RoleType;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.repository.AssuranceRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.repository.VisiteTechniqueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Planificateur des alertes et notifications (CdC §21).
 * <p>
 * Chaque jour à 8h00 :
 * <ol>
 *   <li>actualise les taxes A_PAYER échues → EN_RETARD ;</li>
 *   <li>envoie par e-mail aux gestionnaires (ADMIN, GESTIONNAIRE_CENTRAL) et au Responsable Financier
 *       (pour les taxes / budget) les alertes J-30 : assurance, visite technique, permis, taxe non payée,
 *       garantie, carte carburant, véhicule immobilisé, entretien ;</li>
 *   <li>journalise le récapitulatif.</li>
 * </ol>
 * Les mêmes alertes sont exposées en temps réel dans l'application via
 * {@code GET /api/maintenance/alertes} ({@link MaintenanceService#getAlertesEcheances()}).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final AssuranceRepository assuranceRepository;
    private final VisiteTechniqueRepository vtRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;
    private final MaintenanceService maintenanceService;
    private final TaxeAutomobileService taxeAutomobileService;
    private final JournalService journalService;

    private static final Set<String> TYPES_FINANCIER = Set.of("TAXE_NON_PAYEE", "VIGNETTE", "ASSURANCE");

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void envoyerAlertesQuotidiennes() {
        log.info("NotificationService - Démarrage des alertes quotidiennes J-30");

        int taxesEnRetard = taxeAutomobileService.actualiserRetards();

        List<Utilisateur> gestionnaires = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getNom() != null && u.isEnabled()
                        && (u.getRole().getNom() == RoleType.GESTIONNAIRE_CENTRAL || u.getRole().getNom() == RoleType.ADMIN))
                .toList();
        List<Utilisateur> financiers = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getNom() == RoleType.RESPONSABLE_FINANCIER && u.isEnabled())
                .toList();

        // 1) Assurances expirant sous 30 jours — alerte dédiée (RG02)
        LocalDate today = LocalDate.now();
        List<com.mef.parkauto.entity.Assurance> assurancesExpirant = assuranceRepository.findExpirantEntre(today, today.plusDays(30));
        assurancesExpirant.forEach(assurance -> gestionnaires.forEach(g -> {
            try {
                emailService.sendAssuranceExpirationAlert(
                        g.getEmail(), g.getNom(), g.getPrenom(),
                        assurance.getVehicule().getImmatriculation(),
                        assurance.getVehicule().getMarque() + " " + assurance.getVehicule().getModele(),
                        assurance.getNumeroPolice(), assurance.getDateFin());
            } catch (Exception e) {
                log.error("Erreur envoi alerte assurance : {}", e.getMessage());
            }
        }));

        // 2) Visites techniques planifiées sous 30 jours — alerte dédiée
        vtRepository.findByDateProchaineBeforeAndDateProchaineIsNotNull(today.plusDays(30)).stream()
                .filter(vt -> vt.getDateProchaine() != null && !vt.getDateProchaine().isBefore(today))
                .forEach(vt -> gestionnaires.forEach(g -> {
                    try {
                        emailService.sendVisiteTechniqueAlert(
                                g.getEmail(), g.getNom(), g.getPrenom(),
                                vt.getVehicule().getImmatriculation(),
                                vt.getVehicule().getMarque() + " " + vt.getVehicule().getModele(),
                                vt.getDateProchaine());
                    } catch (Exception e) {
                        log.error("Erreur envoi alerte VT : {}", e.getMessage());
                    }
                }));

        // 3) Toutes les autres alertes consolidées (permis, taxes, garantie, immobilisation, cartes, entretien, VT échues)
        List<AlerteEcheanceDto> alertes = maintenanceService.getAlertesEcheances();
        int envoyees = 0;
        for (AlerteEcheanceDto a : alertes) {
            if ("ASSURANCE".equals(a.getTypeAlerte())) continue; // déjà traitée en (1)
            if (!"CRITIQUE".equals(a.getNiveauSeverite()) && !"ATTENTION".equals(a.getNiveauSeverite())) continue;

            Map<String, String> lignes = new LinkedHashMap<>();
            if (a.getImmatriculation() != null) lignes.put("Véhicule / Référence", a.getImmatriculation()
                    + (a.getMarqueModele() != null ? " — " + a.getMarqueModele() : ""));
            if (a.getDirection() != null) lignes.put("Direction", a.getDirection());
            lignes.put("Type d'alerte", a.getTypeAlerte());
            lignes.put("Détail", a.getMessage());
            if (a.getDateEcheance() != null) lignes.put("Échéance", a.getDateEcheance().toString());
            if (a.getJoursRestants() != null && a.getDateEcheance() != null) {
                lignes.put("Jours restants", a.getJoursRestants() < 0 ? "Échue depuis " + (-a.getJoursRestants()) + " j" : a.getJoursRestants() + " j");
            }

            List<Utilisateur> destinataires = TYPES_FINANCIER.contains(a.getTypeAlerte())
                    ? concat(gestionnaires, financiers) : gestionnaires;
            for (Utilisateur u : destinataires) {
                emailService.sendAlerteGenerique(u.getEmail(), u.getNom(), u.getPrenom(), a.getTitre(), lignes, a.getNiveauSeverite());
                envoyees++;
            }
        }

        String bilan = String.format("Alertes J-30 : %d assurance(s), %d alerte(s) consolidée(s) (%d e-mails), %d taxe(s) passée(s) EN_RETARD.",
                assurancesExpirant.size(), alertes.size(), envoyees, taxesEnRetard);
        journalService.log("NOTIFICATION", "ALERTES_QUOTIDIENNES", "Systeme", null, null, bilan, null);
        log.info("NotificationService - {}", bilan);
    }

    private static List<Utilisateur> concat(List<Utilisateur> a, List<Utilisateur> b) {
        java.util.LinkedHashMap<Long, Utilisateur> m = new java.util.LinkedHashMap<>();
        a.forEach(u -> m.put(u.getId(), u));
        b.forEach(u -> m.put(u.getId(), u));
        return List.copyOf(m.values());
    }
}

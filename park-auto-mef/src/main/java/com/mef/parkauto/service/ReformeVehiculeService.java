package com.mef.parkauto.service;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * RG07 — Procédure de réforme d'un véhicule.
 * <p>
 * Machine à états contrôlée côté serveur :
 * <pre>
 *   INITIE ──► EN_COURS_DE_REFORME ──► VALIDE ──► REFORME ──► VENDU
 * </pre>
 * <ul>
 *   <li>Le passage à VALIDE exige le PV de la Commission de Réforme <b>et</b> le PV des Domaines
 *       (référence saisie ou pièce GED de type PV_COMMISSION / PV_DOMAINES rattachée à l'entité "reforme").</li>
 *   <li>Le passage à REFORME (sortie du parc) exige que le véhicule n'ait aucune affectation en cours.</li>
 *   <li>Le passage à VENDU exige le prix et la date de cession.</li>
 *   <li>Un véhicule réformé ne peut plus être affecté ni recevoir de plein (contrôlé dans les services concernés).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReformeVehiculeService {

    public static final String GED_ENTITE = "reforme";
    public static final String GED_TYPE_PV_COMMISSION = "PV_COMMISSION";
    public static final String GED_TYPE_PV_DOMAINES = "PV_DOMAINES";

    private static final Map<StatutReforme, Set<StatutReforme>> TRANSITIONS = new EnumMap<>(StatutReforme.class);
    static {
        TRANSITIONS.put(StatutReforme.INITIE, Set.of(StatutReforme.EN_COURS_DE_REFORME));
        TRANSITIONS.put(StatutReforme.EN_COURS_DE_REFORME, Set.of(StatutReforme.VALIDE));
        TRANSITIONS.put(StatutReforme.VALIDE, Set.of(StatutReforme.REFORME));
        TRANSITIONS.put(StatutReforme.REFORME, Set.of(StatutReforme.VENDU));
        TRANSITIONS.put(StatutReforme.VENDU, Set.of());
    }

    private final ReformeVehiculeRepository reformeRepository;
    private final VehiculeRepository vehiculeRepository;
    private final SinistreRepository sinistreRepository;
    private final AffectationRepository affectationRepository;
    private final DocumentGEDRepository documentGEDRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<ReformeVehiculeDto> getAll() {
        return reformeRepository.findAllByOrderByDateCreationDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReformeVehiculeDto getById(Long id) {
        return reformeRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
    }

    /**
     * Crée une procédure de réforme (statut INITIE) ou met à jour ses informations.
     * Les changements de statut passent par {@link #changerStatut} / {@link #valider} :
     * un statut fourni ici est traité comme une demande de transition et contrôlé.
     */
    @Transactional
    public ReformeVehiculeDto creerOuModifier(ReformeVehiculeRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getMotifReforme() == null || request.getMotifReforme().isBlank()) throw new BadRequestException("Le motif de réforme est obligatoire.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        boolean creation = request.getId() == null;
        ReformeVehicule reforme;
        if (creation) {
            StatutAdministratif sa = vehicule.getStatutAdministratif();
            if (sa == StatutAdministratif.REFORME || sa == StatutAdministratif.VENDU || sa == StatutAdministratif.ARCHIVE) {
                throw new BadRequestException("Le véhicule " + vehicule.getImmatriculation() + " est déjà " + sa + ".");
            }
            boolean dejaEnCours = reformeRepository.findAllByOrderByDateCreationDesc().stream()
                    .anyMatch(r -> r.getVehicule() != null && r.getVehicule().getId().equals(vehicule.getId())
                            && r.getStatut() != StatutReforme.VENDU);
            if (dejaEnCours) {
                throw new BadRequestException("Une procédure de réforme est déjà en cours pour le véhicule " + vehicule.getImmatriculation() + ".");
            }
            if (affectationRepository.existsByVehiculeIdAndStatut(vehicule.getId(), StatutAffectation.EN_COURS)) {
                throw new BadRequestException("Le véhicule " + vehicule.getImmatriculation()
                        + " fait l'objet d'une affectation en cours : la restitution doit être effectuée avant d'initier la réforme.");
            }
            reforme = new ReformeVehicule();
            reforme.setStatut(StatutReforme.INITIE);
            reforme.setVehicule(vehicule);
        } else {
            reforme = reformeRepository.findById(request.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + request.getId()));
            if (reforme.getStatut() == StatutReforme.REFORME || reforme.getStatut() == StatutReforme.VENDU) {
                // Après sortie du parc, seules les informations de cession restent modifiables
                if (!reforme.getVehicule().getId().equals(vehicule.getId())) {
                    throw new BadRequestException("Le véhicule d'une réforme validée ne peut pas être modifié.");
                }
            } else if (!reforme.getVehicule().getId().equals(vehicule.getId())) {
                throw new BadRequestException("Le véhicule d'une procédure de réforme ne peut pas être modifié ; supprimez et recréez la procédure.");
            }
        }

        // Lien avec un sinistre (perte totale) — le sinistre doit concerner le même véhicule
        if (request.getSinistreId() != null) {
            Sinistre sinistre = sinistreRepository.findById(request.getSinistreId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + request.getSinistreId()));
            if (sinistre.getVehicule() == null || !sinistre.getVehicule().getId().equals(vehicule.getId())) {
                throw new BadRequestException("Le sinistre " + request.getSinistreId() + " ne concerne pas le véhicule " + vehicule.getImmatriculation() + ".");
            }
            reforme.setSinistre(sinistre);
        } else if (creation) {
            reforme.setSinistre(null);
        }

        reforme.setMotifReforme(request.getMotifReforme());
        reforme.setDateDecision(request.getDateDecision());
        reforme.setPvCommission(blankToNull(request.getPvCommission()));
        reforme.setDatePvCommission(request.getDatePvCommission());
        reforme.setPvDomaines(blankToNull(request.getPvDomaines()));
        reforme.setDatePvDomaines(request.getDatePvDomaines());
        reforme.setPrixCession(request.getPrixCession());
        reforme.setDateCession(request.getDateCession());
        reforme.setAcquereur(request.getAcquereur());
        reforme.setObservation(request.getObservation());

        // Le véhicule est gelé dès l'ouverture de la procédure
        if (reforme.getStatut() == StatutReforme.INITIE || reforme.getStatut() == StatutReforme.EN_COURS_DE_REFORME) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_COURS_DE_REFORME);
            vehiculeRepository.save(vehicule);
        }

        ReformeVehicule saved = reformeRepository.save(reforme);
        journalService.log("REFORME", creation ? "CREATE" : "UPDATE", "ReformeVehicule", saved.getId(), null,
                saved.getStatut() + " / " + saved.getMotifReforme(), null);

        // Demande de transition de statut incluse dans la requête → contrôlée par la machine à états
        if (request.getStatut() != null && request.getStatut() != saved.getStatut()) {
            return changerStatut(saved.getId(), request.getStatut());
        }
        return mapToDto(saved);
    }

    /**
     * Applique une transition de statut si elle est autorisée par la machine à états.
     */
    @Transactional
    public ReformeVehiculeDto changerStatut(Long id, StatutReforme cible) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
        StatutReforme actuel = reforme.getStatut();
        if (cible == null || cible == actuel) return mapToDto(reforme);
        if (!TRANSITIONS.getOrDefault(actuel, Set.of()).contains(cible)) {
            throw new BadRequestException("Transition de statut non autorisée : " + actuel + " → " + cible
                    + ". Transitions possibles : " + TRANSITIONS.getOrDefault(actuel, Set.of()) + ".");
        }

        Vehicule vehicule = reforme.getVehicule();
        switch (cible) {
            case EN_COURS_DE_REFORME -> {
                if (reforme.getDateDecision() == null) {
                    throw new BadRequestException("La date de décision de la commission est requise pour engager la réforme.");
                }
                vehicule.setStatutAdministratif(StatutAdministratif.EN_COURS_DE_REFORME);
            }
            case VALIDE -> verifierPiecesValidation(reforme);
            case REFORME -> {
                if (affectationRepository.existsByVehiculeIdAndStatut(vehicule.getId(), StatutAffectation.EN_COURS)) {
                    throw new BadRequestException("Impossible de sortir le véhicule du parc : une affectation est encore en cours.");
                }
                reforme.setDateSortieParc(LocalDate.now());
                vehicule.setStatutAdministratif(StatutAdministratif.REFORME);
            }
            case VENDU -> {
                if (reforme.getPrixCession() == null || reforme.getPrixCession().signum() <= 0) {
                    throw new BadRequestException("Le prix de cession est obligatoire pour clôturer la réforme en VENDU.");
                }
                if (reforme.getDateCession() == null) reforme.setDateCession(LocalDate.now());
                vehicule.setStatutAdministratif(StatutAdministratif.VENDU);
            }
            default -> throw new BadRequestException("Transition non gérée : " + cible);
        }

        reforme.setStatut(cible);
        vehiculeRepository.save(vehicule);
        ReformeVehicule saved = reformeRepository.save(reforme);
        journalService.log("REFORME", "TRANSITION", "ReformeVehicule", saved.getId(), actuel.name(), cible.name(), null);
        log.info("RG07 - Réforme {} : {} → {} (véhicule {})", id, actuel, cible, vehicule.getImmatriculation());
        return mapToDto(saved);
    }

    /**
     * RG07 — Validation finale : PV Commission + PV Domaines obligatoires, puis sortie du parc.
     * Enchaîne les transitions nécessaires jusqu'à REFORME.
     */
    @Transactional
    public ReformeVehiculeDto valider(Long id) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
        if (reforme.getStatut() == StatutReforme.REFORME || reforme.getStatut() == StatutReforme.VENDU) {
            throw new BadRequestException("Cette réforme est déjà validée (" + reforme.getStatut() + ").");
        }
        verifierPiecesValidation(reforme);

        if (reforme.getStatut() == StatutReforme.INITIE) {
            if (reforme.getDateDecision() == null) reforme.setDateDecision(LocalDate.now());
            reformeRepository.save(reforme);
            changerStatut(id, StatutReforme.EN_COURS_DE_REFORME);
        }
        if (reformeRepository.findById(id).map(ReformeVehicule::getStatut).orElse(null) == StatutReforme.EN_COURS_DE_REFORME) {
            changerStatut(id, StatutReforme.VALIDE);
        }
        ReformeVehiculeDto dto = changerStatut(id, StatutReforme.REFORME);
        journalService.log("REFORME", "VALIDATE", "ReformeVehicule", id, null, StatutReforme.REFORME.name(), null);
        return dto;
    }

    @Transactional
    public void supprimer(Long id) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
        if (reforme.getStatut() == StatutReforme.VALIDE || reforme.getStatut() == StatutReforme.REFORME || reforme.getStatut() == StatutReforme.VENDU) {
            throw new IllegalStateException("Une réforme validée ou clôturée ne peut pas être supprimée.");
        }
        Vehicule vehicule = reforme.getVehicule();
        reformeRepository.delete(reforme);
        journalService.log("REFORME", "DELETE", "ReformeVehicule", id, reforme.getStatut().name(),
                "Suppression de la procédure de réforme (" + reforme.getMotifReforme() + ")", null);
        if (vehicule != null && vehicule.getStatutAdministratif() == StatutAdministratif.EN_COURS_DE_REFORME) {
            // Retour à l'état antérieur : accidenté si un sinistre est à l'origine, disponible sinon
            vehicule.setStatutAdministratif(reforme.getSinistre() != null
                    ? StatutAdministratif.ACCIDENTE : StatutAdministratif.DISPONIBLE);
            vehiculeRepository.save(vehicule);
        }
    }

    // ------------------------------------------------------------------
    // Règles internes
    // ------------------------------------------------------------------

    private void verifierPiecesValidation(ReformeVehicule reforme) {
        List<DocumentGED> docs = documentGEDRepository.findByEntiteAndEntiteIdOrderByDateUploadDesc(GED_ENTITE, reforme.getId());
        boolean pvCommissionOk = reforme.getPvCommission() != null
                || docs.stream().anyMatch(d -> GED_TYPE_PV_COMMISSION.equalsIgnoreCase(d.getTypeDocument()));
        boolean pvDomainesOk = reforme.getPvDomaines() != null
                || docs.stream().anyMatch(d -> GED_TYPE_PV_DOMAINES.equalsIgnoreCase(d.getTypeDocument()));

        if (!pvCommissionOk && !pvDomainesOk) {
            throw new IllegalStateException("RG07 — Le PV de la Commission de Réforme et le PV des Domaines sont obligatoires avant la validation. "
                    + "Renseignez leurs références ou joignez-les via la GED (types PV_COMMISSION et PV_DOMAINES).");
        }
        if (!pvCommissionOk) {
            throw new IllegalStateException("RG07 — Le PV de la Commission de Réforme est obligatoire avant la validation.");
        }
        if (!pvDomainesOk) {
            throw new IllegalStateException("RG07 — Le PV des Domaines est obligatoire avant la validation.");
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private ReformeVehiculeDto mapToDto(ReformeVehicule r) {
        Vehicule v = r.getVehicule();
        Sinistre s = r.getSinistre();
        int nbDocs = r.getId() != null
                ? documentGEDRepository.findByEntiteAndEntiteIdOrderByDateUploadDesc(GED_ENTITE, r.getId()).size() : 0;
        return ReformeVehiculeDto.builder()
                .id(r.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .sinistreId(s != null ? s.getId() : null)
                .sinistreReference(s != null ? (s.getNumeroConstat() != null ? s.getNumeroConstat() : "SIN-" + s.getId()) : null)
                .motifReforme(r.getMotifReforme())
                .dateDecision(r.getDateDecision())
                .pvCommission(r.getPvCommission())
                .datePvCommission(r.getDatePvCommission())
                .pvDomaines(r.getPvDomaines())
                .datePvDomaines(r.getDatePvDomaines())
                .statut(r.getStatut())
                .prixCession(r.getPrixCession())
                .dateCession(r.getDateCession())
                .acquereur(r.getAcquereur())
                .dateSortieParc(r.getDateSortieParc())
                .observation(r.getObservation())
                .dateCreation(r.getDateCreation())
                .transitionsPossibles(List.copyOf(TRANSITIONS.getOrDefault(r.getStatut(), Set.of())))
                .nbDocumentsGED(nbDocs)
                .build();
    }
}

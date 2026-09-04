package com.mef.parkauto.service;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetDirectionRepository budgetRepository;
    private final PrevisionCarburantRepository previsionRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ExerciceBudgetaireRepository exerciceRepository;
    private final EngagementBudgetaireRepository engagementRepository;
    private final JournalService journalService;
    private final EmailService emailService;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * RG03 — Notifie les Responsables Financiers et Administrateurs actifs du franchissement d'un seuil.
     * Ne renvoie pas d'e-mail si le seuil était déjà atteint (anti-spam).
     */
    private void notifierSeuilBudget(BudgetDirection budget, BigDecimal alloue, BigDecimal consomme, String seuil) {
        try {
            List<Utilisateur> destinataires = utilisateurRepository.findAll().stream()
                    .filter(u -> u.isEnabled() && u.getRole() != null
                            && (u.getRole().getNom() == RoleType.RESPONSABLE_FINANCIER || u.getRole().getNom() == RoleType.ADMIN))
                    .toList();
            if (destinataires.isEmpty()) {
                emailService.sendBudgetAlertEmail(budget.getDirection(), budget.getNatureDepense().name(), alloue, consomme);
                return;
            }
            for (Utilisateur u : destinataires) {
                emailService.sendBudgetDepassementAlert(u.getEmail(), u.getNom(), u.getPrenom(),
                        budget.getDirection(), budget.getNatureDepense().name() + " — seuil " + seuil, alloue, consomme);
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer l'email d'alerte budgétaire : {}", e.getMessage());
        }
    }

    // ==========================================
    // 1. EXERCICES BUDGÉTAIRES (RG04)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ExerciceBudgetaireDto> getAllExercices() {
        return exerciceRepository.findAllByOrderByAnneeDesc().stream()
                .map(this::mapExerciceToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExerciceBudgetaireDto getExerciceByAnnee(Integer annee) {
        return exerciceRepository.findByAnnee(annee)
                .map(this::mapExerciceToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Exercice budgétaire non trouvé pour l'année : " + annee));
    }

    @Transactional
    public ExerciceBudgetaireDto creerExercice(ExerciceBudgetaireRequest request, String username) {
        if (request.getAnnee() == null) throw new BadRequestException("L'année est obligatoire.");
        if (exerciceRepository.existsByAnnee(request.getAnnee())) {
            throw new BadRequestException("L'exercice budgétaire pour l'année " + request.getAnnee() + " existe déjà.");
        }
        ExerciceBudgetaire ex = ExerciceBudgetaire.builder()
                .annee(request.getAnnee())
                .statut(StatutExercice.OUVERT)
                .observations(request.getObservations())
                .build();
        ExerciceBudgetaire saved = exerciceRepository.save(ex);
        journalService.log("BUDGET", "CREATE_EXERCICE", "ExerciceBudgetaire", saved.getId(), username,
                "Ouverture exercice " + saved.getAnnee(), null);
        return mapExerciceToDto(saved);
    }

    @Transactional
    public ExerciceBudgetaireDto cloturerExercice(Integer annee, ClotureExerciceRequest request, String username) {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(annee)
                .orElseThrow(() -> new ResourceNotFoundException("Exercice non trouvé : " + annee));
        if (ex.getStatut() == StatutExercice.CLOTURE) {
            throw new BadRequestException("L'exercice " + annee + " est déjà clôturé.");
        }
        ex.setStatut(StatutExercice.CLOTURE);
        ex.setDateCloture(LocalDateTime.now());
        ex.setCloturePar(username != null ? username : "ADMIN");
        if (request != null && request.getObservations() != null) {
            ex.setObservations(request.getObservations());
        }
        ExerciceBudgetaire saved = exerciceRepository.save(ex);
        journalService.log("BUDGET", "CLOTURE_EXERCICE", "ExerciceBudgetaire", saved.getId(), username,
                "Clôture officielle et verrouillage en lecture seule de l'exercice " + annee, null);
        return mapExerciceToDto(saved);
    }

    @Transactional
    public ExerciceBudgetaireDto rouvrirExercice(Integer annee, String username) {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(annee)
                .orElseThrow(() -> new ResourceNotFoundException("Exercice non trouvé : " + annee));
        ex.setStatut(StatutExercice.OUVERT);
        ex.setDateCloture(null);
        ex.setCloturePar(null);
        ExerciceBudgetaire saved = exerciceRepository.save(ex);
        journalService.log("BUDGET", "REOUVERTURE_EXERCICE", "ExerciceBudgetaire", saved.getId(), username,
                "Réouverture de l'exercice " + annee, null);
        return mapExerciceToDto(saved);
    }

    @Transactional
    public ExerciceBudgetaireDto modifierExercice(Integer annee, ExerciceBudgetaireRequest request, String username) {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(annee)
                .orElseThrow(() -> new ResourceNotFoundException("Exercice non trouvé : " + annee));
        if (ex.getStatut() == StatutExercice.CLOTURE) {
            throw new BadRequestException("L'exercice " + annee + " est clôturé et verrouillé en lecture seule.");
        }
        if (request != null && request.getObservations() != null) {
            ex.setObservations(request.getObservations());
        }
        ExerciceBudgetaire saved = exerciceRepository.save(ex);
        journalService.log("BUDGET", "UPDATE_EXERCICE", "ExerciceBudgetaire", saved.getId(), username,
                "Mise à jour de l'exercice " + annee, null);
        return mapExerciceToDto(saved);
    }

    @Transactional
    public void supprimerExercice(Integer annee, String username) {
        ExerciceBudgetaire ex = exerciceRepository.findByAnnee(annee)
                .orElseThrow(() -> new ResourceNotFoundException("Exercice non trouvé : " + annee));
        if (ex.getStatut() == StatutExercice.CLOTURE) {
            throw new BadRequestException("Impossible de supprimer un exercice clôturé.");
        }
        Long id = ex.getId();
        exerciceRepository.delete(ex);
        journalService.log("BUDGET", "DELETE_EXERCICE", "ExerciceBudgetaire", id, username,
                "Suppression de l'exercice " + annee, null);
    }

    public void verifierExerciceOuvert(Integer annee) {
        if (annee == null) return;
        Optional<ExerciceBudgetaire> opt = exerciceRepository.findByAnnee(annee);
        if (opt.isPresent() && opt.get().getStatut() == StatutExercice.CLOTURE) {
            throw new BadRequestException("L'exercice budgétaire " + annee + " est clôturé et verrouillé en lecture seule. Aucune modification n'est autorisée.");
        }
    }

    /**
     * RG04 — Une opération est rattachée à l'exercice de sa date comptable. L'année déclarée
     * et l'année de la date de l'opération doivent coïncider, et l'exercice correspondant doit
     * être ouvert. Empêche de contourner la clôture en déclarant une année différente de la date.
     */
    public void verifierExerciceOuvert(Integer annee, LocalDate dateOperation) {
        if (dateOperation != null) {
            int anneeDate = dateOperation.getYear();
            if (annee != null && annee != anneeDate) {
                throw new BadRequestException("Incohérence d'exercice : la date de l'opération (" + dateOperation
                        + ") relève de l'exercice " + anneeDate + " alors que l'exercice déclaré est " + annee + ".");
            }
            verifierExerciceOuvert(anneeDate);
        }
        verifierExerciceOuvert(annee);
    }

    // ==========================================
    // 2. ENVELOPPES BUDGÉTAIRES (BUDGET DIRECTION)
    // ==========================================

    @Transactional(readOnly = true)
    public List<BudgetDirectionDto> getAllBudgets() {
        return budgetRepository.findAll().stream().map(this::mapBudgetToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BudgetDirectionDto> getBudgetsByAnnee(Integer annee) {
        return budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(annee)
                .stream().map(this::mapBudgetToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetSyntheseDto getSynthese(Integer annee) {
        List<BudgetDirectionDto> lignes = getBudgetsByAnnee(annee);
        BigDecimal totalAlloue = lignes.stream().map(BudgetDirectionDto::getMontantAlloue)
                .filter(m -> m != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEngage = lignes.stream().map(BudgetDirectionDto::getMontantEngage)
                .filter(m -> m != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRealise = lignes.stream().map(BudgetDirectionDto::getMontantRealise)
                .filter(m -> m != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        // Disponible = alloué − engagé − réalisé (les engagements non liquidés gèlent des crédits)
        BigDecimal totalRestant = totalAlloue.subtract(totalEngage).subtract(totalRealise);
        BigDecimal ecart = totalAlloue.subtract(totalRealise);
        double taux = totalAlloue.compareTo(BigDecimal.ZERO) > 0
                ? totalRealise.divide(totalAlloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;
        double tauxEngagement = totalAlloue.compareTo(BigDecimal.ZERO) > 0
                ? totalEngage.add(totalRealise).divide(totalAlloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;
        return BudgetSyntheseDto.builder()
                .annee(annee).totalAlloue(totalAlloue).totalEngage(totalEngage).totalRealise(totalRealise)
                .totalRestant(totalRestant).ecartPrevisionnelRealise(ecart)
                .tauxConsommationGlobal(taux).tauxEngagementGlobal(tauxEngagement)
                .lignes(lignes).build();
    }

    @Transactional(readOnly = true)
    public BudgetDirectionDto getBudgetById(Long id) {
        return budgetRepository.findById(id).map(this::mapBudgetToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Budget non trouvé : " + id));
    }

    @Transactional
    public BudgetDirectionDto creerOuModifierBudget(BudgetDirectionRequest request) {
        if (request.getAnnee() == null) throw new BadRequestException("L'année budgétaire est obligatoire.");
        verifierExerciceOuvert(request.getAnnee());

        if (request.getDirection() == null || request.getDirection().isBlank()) throw new BadRequestException("La direction est obligatoire.");
        if (request.getNatureDepense() == null) throw new BadRequestException("La nature de dépense est obligatoire.");
        if (request.getMontantAlloue() != null && request.getMontantAlloue().signum() < 0) throw new BadRequestException("Le montant alloué ne peut pas être négatif.");
        if (request.getMontantEngage() != null && request.getMontantEngage().signum() < 0) throw new BadRequestException("Le montant engagé ne peut pas être négatif.");
        if (request.getMontantRealise() != null && request.getMontantRealise().signum() < 0) throw new BadRequestException("Le montant réalisé ne peut pas être négatif.");

        BudgetDirection budget = request.getId() != null
                ? budgetRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Budget non trouvé : " + request.getId()))
                : new BudgetDirection();

        budget.setAnnee(request.getAnnee());
        budget.setDirection(request.getDirection());
        budget.setService(request.getService());
        budget.setCentreCout(request.getCentreCout());
        budget.setNatureDepense(request.getNatureDepense());
        budget.setMontantAlloue(request.getMontantAlloue() != null ? request.getMontantAlloue() : BigDecimal.ZERO);
        budget.setMontantEngage(request.getMontantEngage() != null ? request.getMontantEngage() : BigDecimal.ZERO);
        budget.setMontantRealise(request.getMontantRealise() != null ? request.getMontantRealise() : BigDecimal.ZERO);

        verifierEtMettreAJourSeuilsAlerte(budget);

        boolean creation = request.getId() == null;
        BudgetDirection saved = budgetRepository.save(budget);
        journalService.log("BUDGET", creation ? "CREATE" : "UPDATE", "BudgetDirection", saved.getId(), null,
                saved.getDirection() + " / " + saved.getNatureDepense() + " / Alloué: " + saved.getMontantAlloue(), null);
        return mapBudgetToDto(saved);
    }

    @Transactional
    public void supprimerBudget(Long id) {
        BudgetDirection b = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget non trouvé : " + id));
        verifierExerciceOuvert(b.getAnnee());
        budgetRepository.deleteById(id);
        journalService.log("BUDGET", "DELETE", "BudgetDirection", id, null, null, null);
    }

    // ==========================================
    // 3. ENGAGEMENTS FINANCIERS (RG01 & RG03)
    // ==========================================

    @Transactional(readOnly = true)
    public List<EngagementBudgetaireDto> getAllEngagements(Integer annee, String direction) {
        if (annee != null && direction != null && !direction.isBlank()) {
            return engagementRepository.findByAnneeAndDirectionOrderByDateEngagementDesc(annee, direction).stream()
                    .map(this::mapEngagementToDto).collect(Collectors.toList());
        } else if (annee != null) {
            return engagementRepository.findByAnneeOrderByDateEngagementDesc(annee).stream()
                    .map(this::mapEngagementToDto).collect(Collectors.toList());
        } else if (direction != null && !direction.isBlank()) {
            return engagementRepository.findByDirectionOrderByDateEngagementDesc(direction).stream()
                    .map(this::mapEngagementToDto).collect(Collectors.toList());
        }
        return engagementRepository.findAll().stream()
                .map(this::mapEngagementToDto).collect(Collectors.toList());
    }

    @Transactional
    public EngagementBudgetaireDto creerEngagement(EngagementBudgetaireRequest request, String username) {
        if (request.getAnnee() == null) throw new BadRequestException("L'année budgétaire est obligatoire.");
        LocalDate dateEngagement = request.getDateEngagement() != null ? request.getDateEngagement() : LocalDate.now();
        verifierExerciceOuvert(request.getAnnee(), dateEngagement);

        if (request.getDirection() == null || request.getDirection().isBlank()) throw new BadRequestException("La direction est obligatoire.");
        if (request.getNatureDepense() == null) throw new BadRequestException("La nature de dépense est obligatoire.");
        if (request.getMontantEngage() == null || request.getMontantEngage().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Le montant de l'engagement doit être strictement supérieur à zéro.");
        }

        // RG01 : Vérification de l'enveloppe budgétaire et du solde disponible
        List<BudgetDirection> budgets = budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(request.getAnnee());
        BudgetDirection budget = budgets.stream()
                .filter(b -> request.getDirection().equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == request.getNatureDepense())
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Aucune enveloppe budgétaire définie pour la Direction " 
                        + request.getDirection() + " et la nature " + request.getNatureDepense() + " pour l'exercice " + request.getAnnee() + ". Engagement refusé."));

        BigDecimal disponible = budget.getMontantDisponible();
        if (disponible.compareTo(request.getMontantEngage()) < 0) {
            throw new BadRequestException("Crédits budgétaires insuffisants pour la Direction " + request.getDirection() 
                    + " (" + request.getNatureDepense() + "). Solde disponible : " + disponible + " MAD, Montant demandé : " 
                    + request.getMontantEngage() + " MAD.");
        }

        BigDecimal engageActuel = budget.getMontantEngage() != null ? budget.getMontantEngage() : BigDecimal.ZERO;
        budget.setMontantEngage(engageActuel.add(request.getMontantEngage()));

        verifierEtMettreAJourSeuilsAlerte(budget);
        budgetRepository.save(budget);

        String numEngagement = "ENG-" + request.getAnnee() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        EngagementBudgetaire engagement = EngagementBudgetaire.builder()
                .numeroEngagement(numEngagement)
                .dateEngagement(dateEngagement)
                .annee(request.getAnnee())
                .direction(request.getDirection())
                .service(request.getService())
                .centreCout(request.getCentreCout())
                .natureDepense(request.getNatureDepense())
                .montantEngage(request.getMontantEngage())
                .montantLiquide(BigDecimal.ZERO)
                .statutEngagement(StatutEngagement.ENGAGE)
                .beneficiaire(request.getBeneficiaire())
                .objet(request.getObjet())
                .referencePiece(request.getReferencePiece())
                .build();

        EngagementBudgetaire saved = engagementRepository.save(engagement);
        journalService.log("BUDGET", "ENGAGEMENT", "EngagementBudgetaire", saved.getId(), username,
                "Engagement n° " + saved.getNumeroEngagement() + " de " + saved.getMontantEngage() + " MAD (" + saved.getNatureDepense() + ") pour " + saved.getDirection(), null);

        return mapEngagementToDto(saved);
    }

    @Transactional
    public EngagementBudgetaireDto liquiderEngagement(Long id, LiquidationEngagementRequest request, String username) {
        EngagementBudgetaire eng = engagementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engagement non trouvé : " + id));
        verifierExerciceOuvert(eng.getAnnee());

        if (eng.getStatutEngagement() != StatutEngagement.ENGAGE) {
            throw new BadRequestException("Seul un engagement au statut ENGAGE peut être liquidé.");
        }

        BigDecimal montantLiquide = (request != null && request.getMontantLiquide() != null) ? request.getMontantLiquide() : eng.getMontantEngage();
        eng.setMontantLiquide(montantLiquide);
        eng.setStatutEngagement(StatutEngagement.LIQUIDE);
        if (request != null && request.getReferenceFacture() != null && !request.getReferenceFacture().isBlank()) {
            eng.setReferencePiece(request.getReferenceFacture());
        }

        List<BudgetDirection> budgets = budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(eng.getAnnee());
        Optional<BudgetDirection> optB = budgets.stream()
                .filter(b -> eng.getDirection().equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == eng.getNatureDepense())
                .findFirst();

        if (optB.isPresent()) {
            BudgetDirection b = optB.get();
            BigDecimal engage = b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO;
            BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;

            b.setMontantEngage(engage.subtract(eng.getMontantEngage()).max(BigDecimal.ZERO));
            b.setMontantRealise(realise.add(montantLiquide));

            verifierEtMettreAJourSeuilsAlerte(b);
            budgetRepository.save(b);
        }

        EngagementBudgetaire saved = engagementRepository.save(eng);
        journalService.log("BUDGET", "LIQUIDATION", "EngagementBudgetaire", saved.getId(), username,
                "Liquidation engagement n° " + saved.getNumeroEngagement() + " - Montant liquidé: " + saved.getMontantLiquide() + " MAD", null);

        return mapEngagementToDto(saved);
    }

    @Transactional
    public EngagementBudgetaireDto annulerEngagement(Long id, String motif, String username) {
        EngagementBudgetaire eng = engagementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engagement non trouvé : " + id));
        verifierExerciceOuvert(eng.getAnnee());

        if (eng.getStatutEngagement() == StatutEngagement.LIQUIDE) {
            throw new BadRequestException("Impossible d'annuler un engagement déjà liquidé.");
        }
        if (eng.getStatutEngagement() == StatutEngagement.ANNULE) {
            throw new BadRequestException("Cet engagement est déjà annulé.");
        }

        List<BudgetDirection> budgets = budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(eng.getAnnee());
        Optional<BudgetDirection> optB = budgets.stream()
                .filter(b -> eng.getDirection().equalsIgnoreCase(b.getDirection()) && b.getNatureDepense() == eng.getNatureDepense())
                .findFirst();

        if (optB.isPresent()) {
            BudgetDirection b = optB.get();
            BigDecimal engage = b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO;
            b.setMontantEngage(engage.subtract(eng.getMontantEngage()).max(BigDecimal.ZERO));
            verifierEtMettreAJourSeuilsAlerte(b);
            budgetRepository.save(b);
        }

        eng.setStatutEngagement(StatutEngagement.ANNULE);
        EngagementBudgetaire saved = engagementRepository.save(eng);
        journalService.log("BUDGET", "ANNULATION", "EngagementBudgetaire", saved.getId(), username,
                "Annulation engagement n° " + saved.getNumeroEngagement() + " (" + (motif != null ? motif : "Sans motif") + ")", null);

        return mapEngagementToDto(saved);
    }

    // ==========================================
    // 4. ALERTES BUDGÉTAIRES (RG03)
    // ==========================================

    @Transactional(readOnly = true)
    public List<AlerteBudgetaireDto> getAlertesActives(Integer annee) {
        int anneeRecherche = annee != null ? annee : LocalDate.now().getYear();
        List<BudgetDirection> budgets = budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(anneeRecherche);
        List<AlerteBudgetaireDto> alertes = new ArrayList<>();

        for (BudgetDirection b : budgets) {
            BigDecimal alloue = b.getMontantAlloue() != null ? b.getMontantAlloue() : BigDecimal.ZERO;
            if (alloue.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal engage = b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO;
            BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;
            BigDecimal consomme = engage.max(realise);

            double taux = consomme.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100;

            if (taux >= 95.0) {
                alertes.add(AlerteBudgetaireDto.builder()
                        .budgetId(b.getId())
                        .annee(b.getAnnee())
                        .direction(b.getDirection())
                        .natureDepense(b.getNatureDepense())
                        .montantAlloue(alloue)
                        .montantEngage(engage)
                        .montantRealise(realise)
                        .montantDisponible(b.getMontantDisponible())
                        .tauxConsommation(taux)
                        .niveauAlerte("CRITIQUE_95")
                        .message("Dépassement imminent : " + Math.round(taux) + "% des crédits consommés sur l'enveloppe " + b.getDirection() + " (" + b.getNatureDepense() + ").")
                        .build());
            } else if (taux >= 80.0) {
                alertes.add(AlerteBudgetaireDto.builder()
                        .budgetId(b.getId())
                        .annee(b.getAnnee())
                        .direction(b.getDirection())
                        .natureDepense(b.getNatureDepense())
                        .montantAlloue(alloue)
                        .montantEngage(engage)
                        .montantRealise(realise)
                        .montantDisponible(b.getMontantDisponible())
                        .tauxConsommation(taux)
                        .niveauAlerte("VIGILANCE_80")
                        .message("Seuil de vigilance : " + Math.round(taux) + "% des crédits consommés sur l'enveloppe " + b.getDirection() + " (" + b.getNatureDepense() + ").")
                        .build());
            }
        }
        return alertes;
    }

    private void verifierEtMettreAJourSeuilsAlerte(BudgetDirection budget) {
        BigDecimal alloue = budget.getMontantAlloue() != null ? budget.getMontantAlloue() : BigDecimal.ZERO;
        if (alloue.compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal engage = budget.getMontantEngage() != null ? budget.getMontantEngage() : BigDecimal.ZERO;
        BigDecimal realise = budget.getMontantRealise() != null ? budget.getMontantRealise() : BigDecimal.ZERO;
        BigDecimal consomme = engage.max(realise);

        double taux = consomme.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100;

        if (taux >= 95.0) {
            boolean nouveau = !Boolean.TRUE.equals(budget.getSeuilAlerte95Atteint());
            budget.setSeuilAlerte95Atteint(true);
            budget.setSeuilAlerte80Atteint(true);
            if (nouveau) notifierSeuilBudget(budget, alloue, consomme, "95 %");
        } else if (taux >= 80.0) {
            boolean nouveau = !Boolean.TRUE.equals(budget.getSeuilAlerte80Atteint());
            budget.setSeuilAlerte80Atteint(true);
            budget.setSeuilAlerte95Atteint(false);
            if (nouveau) notifierSeuilBudget(budget, alloue, consomme, "80 %");
        } else {
            budget.setSeuilAlerte80Atteint(false);
            budget.setSeuilAlerte95Atteint(false);
        }
    }

    // ==========================================
    // 5. IMPUTATION AUTOMATIQUE (RG05)
    // ==========================================

    @Transactional
    public void imputerDepense(String direction, NatureDepense natureDepense, BigDecimal montant, String motif) {
        if (direction == null || direction.isBlank() || montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        int anneeCourante = LocalDate.now().getYear();
        verifierExerciceOuvert(anneeCourante);

        List<BudgetDirection> budgets = budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(anneeCourante);
        Optional<BudgetDirection> optBudget = budgets.stream()
                .filter(b -> direction.equalsIgnoreCase(b.getDirection()) && (natureDepense == null || b.getNatureDepense() == natureDepense))
                .findFirst();

        if (optBudget.isPresent()) {
            BudgetDirection b = optBudget.get();
            BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;
            b.setMontantRealise(realise.add(montant));
            verifierEtMettreAJourSeuilsAlerte(b);
            budgetRepository.save(b);
            journalService.log("BUDGET", "IMPUTATION_AUTOMATIQUE", "BudgetDirection", b.getId(), null,
                    "Imputation " + montant + " DH (" + motif + ") pour " + direction, null);
        }
    }

    // ==========================================
    // 6. PRÉVISIONS CARBURANT
    // ==========================================

    @Transactional(readOnly = true)
    public List<PrevisionCarburantDto> getAllPrevisions() {
        return previsionRepository.findAll().stream().map(this::mapPrevisionToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrevisionCarburantDto> getPrevisionsByDirection(String direction, Integer annee) {
        return previsionRepository.findByDirectionAndAnneeOrderByMoisAsc(direction, annee)
                .stream().map(this::mapPrevisionToDto).collect(Collectors.toList());
    }

    @Transactional
    public PrevisionCarburantDto creerOuModifierPrevision(PrevisionCarburantRequest request) {
        if (request.getDirection() == null || request.getDirection().isBlank()) throw new BadRequestException("La direction est obligatoire.");
        if (request.getMois() == null || request.getMois() < 1 || request.getMois() > 12) throw new BadRequestException("Le mois doit être compris entre 1 et 12.");
        if (request.getAnnee() == null) throw new BadRequestException("L'année est obligatoire.");
        verifierExerciceOuvert(request.getAnnee());

        if (request.getKmPrevus() == null || request.getKmPrevus() <= 0) throw new BadRequestException("Les kilomètres prévus doivent être supérieurs à zéro.");
        if (request.getConsoMoyenne() == null || request.getConsoMoyenne() <= 0) throw new BadRequestException("La consommation moyenne doit être supérieure à zéro.");
        if (request.getPrixUnitairePrevus() == null || request.getPrixUnitairePrevus().signum() < 0) throw new BadRequestException("Le prix unitaire prévu est obligatoire.");

        PrevisionCarburant prev = request.getId() != null
                ? previsionRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Prévision non trouvée : " + request.getId()))
                : new PrevisionCarburant();
        if (request.getVehiculeId() != null) {
            vehiculeRepository.findById(request.getVehiculeId()).ifPresent(prev::setVehicule);
        }
        prev.setDirection(request.getDirection());
        prev.setMois(request.getMois());
        prev.setAnnee(request.getAnnee());
        prev.setKmPrevus(request.getKmPrevus());
        prev.setConsoMoyenne(request.getConsoMoyenne());
        prev.setPrixUnitairePrevus(request.getPrixUnitairePrevus());
        prev.setQuantiteReelle(request.getQuantiteReelle());
        prev.setMontantReel(request.getMontantReel());
        boolean creation = request.getId() == null;
        PrevisionCarburant saved = previsionRepository.save(prev);
        journalService.log("BUDGET", creation ? "CREATE_PREVISION" : "UPDATE_PREVISION", "PrevisionCarburant", saved.getId(), null,
                saved.getDirection() + " / " + saved.getMois() + "/" + saved.getAnnee(), null);
        return mapPrevisionToDto(saved);
    }

    @Transactional
    public void supprimerPrevision(Long id) {
        PrevisionCarburant prev = previsionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prévision non trouvée : " + id));
        verifierExerciceOuvert(prev.getAnnee());
        previsionRepository.deleteById(id);
        journalService.log("BUDGET", "DELETE_PREVISION", "PrevisionCarburant", id, null, null, null);
    }

    // ==========================================
    // MAPPERS
    // ==========================================

    private ExerciceBudgetaireDto mapExerciceToDto(ExerciceBudgetaire ex) {
        return ExerciceBudgetaireDto.builder()
                .id(ex.getId())
                .annee(ex.getAnnee())
                .statut(ex.getStatut())
                .dateCloture(ex.getDateCloture())
                .cloturePar(ex.getCloturePar())
                .observations(ex.getObservations())
                .dateCreation(ex.getDateCreation())
                .build();
    }

    private EngagementBudgetaireDto mapEngagementToDto(EngagementBudgetaire eng) {
        return EngagementBudgetaireDto.builder()
                .id(eng.getId())
                .numeroEngagement(eng.getNumeroEngagement())
                .dateEngagement(eng.getDateEngagement())
                .annee(eng.getAnnee())
                .direction(eng.getDirection())
                .service(eng.getService())
                .centreCout(eng.getCentreCout())
                .natureDepense(eng.getNatureDepense())
                .montantEngage(eng.getMontantEngage())
                .montantLiquide(eng.getMontantLiquide())
                .statutEngagement(eng.getStatutEngagement())
                .beneficiaire(eng.getBeneficiaire())
                .objet(eng.getObjet())
                .referencePiece(eng.getReferencePiece())
                .dateCreation(eng.getDateCreation())
                .build();
    }

    private BudgetDirectionDto mapBudgetToDto(BudgetDirection b) {
        BigDecimal alloue = b.getMontantAlloue() != null ? b.getMontantAlloue() : BigDecimal.ZERO;
        BigDecimal engage = b.getMontantEngage() != null ? b.getMontantEngage() : BigDecimal.ZERO;
        BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;
        BigDecimal consomme = engage.max(realise);

        double taux = alloue.compareTo(BigDecimal.ZERO) > 0
                ? consomme.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;

        return BudgetDirectionDto.builder()
                .id(b.getId())
                .annee(b.getAnnee())
                .direction(b.getDirection())
                .service(b.getService())
                .centreCout(b.getCentreCout())
                .natureDepense(b.getNatureDepense())
                .montantAlloue(alloue)
                .montantEngage(engage)
                .montantRealise(realise)
                .montantRestant(b.getMontantRestant())
                .montantDisponible(b.getMontantDisponible())
                .tauxConsommation(taux)
                .seuilAlerte80Atteint(b.getSeuilAlerte80Atteint())
                .seuilAlerte95Atteint(b.getSeuilAlerte95Atteint())
                .dateCreation(b.getDateCreation())
                .build();
    }

    private PrevisionCarburantDto mapPrevisionToDto(PrevisionCarburant p) {
        Double qteReelle = p.getQuantiteReelle();
        Double qtePrevue = p.getQuantitePrevueLitres();
        double ecart = (qteReelle != null && qtePrevue != null) ? qteReelle - qtePrevue : 0.0;
        return PrevisionCarburantDto.builder()
                .id(p.getId())
                .vehiculeId(p.getVehicule() != null ? p.getVehicule().getId() : null)
                .immatriculation(p.getVehicule() != null ? p.getVehicule().getImmatriculation() : null)
                .direction(p.getDirection()).mois(p.getMois()).annee(p.getAnnee())
                .kmPrevus(p.getKmPrevus()).consoMoyenne(p.getConsoMoyenne())
                .quantitePrevueLitres(qtePrevue)
                .prixUnitairePrevus(p.getPrixUnitairePrevus())
                .montantPrevu(p.getMontantPrevu())
                .quantiteReelle(qteReelle).montantReel(p.getMontantReel())
                .ecartQuantite(ecart)
                .dateCreation(p.getDateCreation()).build();
    }
}

package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Contrôle Budgétaire & Engagements MEF", description = "Gestion des exercices budgétaires, enveloppes par direction, chaîne d'engagements financiers et alertes de seuils")
public class BudgetController {

    private final BudgetService budgetService;

    // ==========================================
    // 1. EXERCICES BUDGÉTAIRES (RG04)
    // ==========================================

    @GetMapping("/api/budgets/exercices")
    @Operation(summary = "Lister tous les exercices budgétaires (statut OUVERT / CLÔTURÉ)")
    public ResponseEntity<ApiResponse<List<ExerciceBudgetaireDto>>> getAllExercices() {
        List<ExerciceBudgetaireDto> list = budgetService.getAllExercices();
        return ResponseEntity.ok(ApiResponse.success(list, "Exercices budgétaires récupérés avec succès"));
    }

    @GetMapping("/api/budgets/exercices/{annee:\\d+}")
    @Operation(summary = "Obtenir les détails d'un exercice budgétaire par année")
    public ResponseEntity<ApiResponse<ExerciceBudgetaireDto>> getExerciceByAnnee(@PathVariable Integer annee) {
        ExerciceBudgetaireDto dto = budgetService.getExerciceByAnnee(annee);
        return ResponseEntity.ok(ApiResponse.success(dto, "Exercice budgétaire récupéré avec succès"));
    }

    @PostMapping("/api/budgets/exercices")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Ouvrir un nouvel exercice budgétaire fiscal")
    public ResponseEntity<ApiResponse<ExerciceBudgetaireDto>> creerExercice(
            @Valid @RequestBody ExerciceBudgetaireRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        ExerciceBudgetaireDto dto = budgetService.creerExercice(req, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Exercice budgétaire " + dto.getAnnee() + " créé avec succès"));
    }

    @PostMapping("/api/budgets/exercices/{annee:\\d+}/cloturer")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Clôturer officiellement un exercice budgétaire (Verrouillage en lecture seule RG04)")
    public ResponseEntity<ApiResponse<ExerciceBudgetaireDto>> cloturerExercice(
            @PathVariable Integer annee, @RequestBody(required = false) ClotureExerciceRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        ExerciceBudgetaireDto dto = budgetService.cloturerExercice(annee, req, username);
        return ResponseEntity.ok(ApiResponse.success(dto, "Exercice budgétaire " + annee + " clôturé avec succès"));
    }

    @PostMapping("/api/budgets/exercices/{annee:\\d+}/rouvrir")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Réouvrir un exercice budgétaire (Admin)")
    public ResponseEntity<ApiResponse<ExerciceBudgetaireDto>> rouvrirExercice(
            @PathVariable Integer annee, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        ExerciceBudgetaireDto dto = budgetService.rouvrirExercice(annee, username);
        return ResponseEntity.ok(ApiResponse.success(dto, "Exercice budgétaire " + annee + " réouvert avec succès"));
    }

    @PutMapping("/api/budgets/exercices/{annee:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Modifier les informations d'un exercice budgétaire")
    public ResponseEntity<ApiResponse<ExerciceBudgetaireDto>> modifierExercice(
            @PathVariable Integer annee, @RequestBody ExerciceBudgetaireRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        ExerciceBudgetaireDto dto = budgetService.modifierExercice(annee, req, username);
        return ResponseEntity.ok(ApiResponse.success(dto, "Exercice budgétaire " + annee + " mis à jour avec succès"));
    }

    @DeleteMapping("/api/budgets/exercices/{annee:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Supprimer un exercice budgétaire")
    public ResponseEntity<ApiResponse<Void>> supprimerExercice(
            @PathVariable Integer annee, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        budgetService.supprimerExercice(annee, username);
        return ResponseEntity.ok(ApiResponse.success(null, "Exercice budgétaire " + annee + " supprimé avec succès"));
    }

    // ==========================================
    // 2. ENGAGEMENTS FINANCIERS (RG01 & RG03)
    // ==========================================

    @GetMapping("/api/budgets/engagements")
    @Operation(summary = "Lister les engagements financiers avec filtres optionnels par année et direction")
    public ResponseEntity<ApiResponse<List<EngagementBudgetaireDto>>> getAllEngagements(
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) String direction) {
        List<EngagementBudgetaireDto> list = budgetService.getAllEngagements(annee, direction);
        return ResponseEntity.ok(ApiResponse.success(list, "Engagements budgétaires récupérés avec succès"));
    }

    @PostMapping("/api/budgets/engagements")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Créer un nouvel engagement financier (Contrôle automatique du solde disponible RG01)")
    public ResponseEntity<ApiResponse<EngagementBudgetaireDto>> creerEngagement(
            @Valid @RequestBody EngagementBudgetaireRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        EngagementBudgetaireDto dto = budgetService.creerEngagement(req, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Engagement " + dto.getNumeroEngagement() + " validé avec succès"));
    }

    @PutMapping("/api/budgets/engagements/{id:\\d+}/liquider")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Liquider un engagement financier suite à réception de facture")
    public ResponseEntity<ApiResponse<EngagementBudgetaireDto>> liquiderEngagement(
            @PathVariable Long id, @RequestBody(required = false) LiquidationEngagementRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        EngagementBudgetaireDto dto = budgetService.liquiderEngagement(id, req, username);
        return ResponseEntity.ok(ApiResponse.success(dto, "Engagement " + dto.getNumeroEngagement() + " liquidé avec succès"));
    }

    @PutMapping("/api/budgets/engagements/{id:\\d+}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    @Operation(summary = "Annuler un engagement financier et libérer les crédits bloqués")
    public ResponseEntity<ApiResponse<EngagementBudgetaireDto>> annulerEngagement(
            @PathVariable Long id, @RequestParam(required = false) String motif, Authentication auth) {
        String username = auth != null ? auth.getName() : "ADMIN";
        EngagementBudgetaireDto dto = budgetService.annulerEngagement(id, motif, username);
        return ResponseEntity.ok(ApiResponse.success(dto, "Engagement " + dto.getNumeroEngagement() + " annulé avec succès"));
    }

    // ==========================================
    // 3. ALERTES BUDGÉTAIRES ACTIVES (RG03)
    // ==========================================

    @GetMapping("/api/budgets/alertes")
    @Operation(summary = "Obtenir les alertes budgétaires actives pour les enveloppes ayant atteint 80% ou 95% de consommation")
    public ResponseEntity<ApiResponse<List<AlerteBudgetaireDto>>> getAlertesActives(
            @RequestParam(required = false) Integer annee) {
        List<AlerteBudgetaireDto> alertes = budgetService.getAlertesActives(annee);
        return ResponseEntity.ok(ApiResponse.success(alertes, "Alertes budgétaires récupérées avec succès"));
    }

    // ==========================================
    // 4. ENVELOPPES BUDGÉTAIRES (BUDGET DIRECTION)
    // ==========================================

    @GetMapping({"/api/budgets", "/api/budgets/"})
    public ResponseEntity<List<BudgetDirectionDto>> getAllBudgets(@RequestParam(required=false) Integer annee) {
        if (annee != null) return ResponseEntity.ok(budgetService.getBudgetsByAnnee(annee));
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @GetMapping("/api/budgets/annee/{annee}")
    public ResponseEntity<List<BudgetDirectionDto>> getBudgetsByAnnee(@PathVariable Integer annee) {
        return ResponseEntity.ok(budgetService.getBudgetsByAnnee(annee));
    }

    @GetMapping("/api/budgets/synthese")
    public ResponseEntity<BudgetSyntheseDto> getSynthese(@RequestParam Integer annee) {
        return ResponseEntity.ok(budgetService.getSynthese(annee));
    }

    // --- PREVISIONS CARBURANT STATIC PATHS ---
    @GetMapping({"/api/previsions-carburant", "/api/budgets/previsions"})
    public ResponseEntity<List<PrevisionCarburantDto>> getAllPrevisions() {
        return ResponseEntity.ok(budgetService.getAllPrevisions());
    }

    @GetMapping({"/api/previsions-carburant/direction/{direction}", "/api/budgets/previsions/direction/{direction}"})
    public ResponseEntity<List<PrevisionCarburantDto>> getPrevisionsByDirection(
            @PathVariable String direction, @RequestParam Integer annee) {
        return ResponseEntity.ok(budgetService.getPrevisionsByDirection(direction, annee));
    }

    @PostMapping({"/api/previsions-carburant", "/api/budgets/previsions"})
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<PrevisionCarburantDto> creerPrevision(@RequestBody PrevisionCarburantRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.creerOuModifierPrevision(req));
    }

    @PutMapping({"/api/previsions-carburant/{id:\\d+}", "/api/budgets/previsions/{id:\\d+}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<PrevisionCarburantDto> modifierPrevision(@PathVariable Long id, @RequestBody PrevisionCarburantRequest req) {
        req.setId(id);
        return ResponseEntity.ok(budgetService.creerOuModifierPrevision(req));
    }

    @DeleteMapping({"/api/previsions-carburant/{id:\\d+}", "/api/budgets/previsions/{id:\\d+}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<Void> supprimerPrevision(@PathVariable Long id) {
        budgetService.supprimerPrevision(id);
        return ResponseEntity.noContent().build();
    }

    // --- DYNAMIC ID PATHS ---
    @GetMapping("/api/budgets/{id:\\d+}")
    public ResponseEntity<BudgetDirectionDto> getBudget(@PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetById(id));
    }

    @PostMapping("/api/budgets")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<BudgetDirectionDto> creerBudget(@RequestBody BudgetDirectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.creerOuModifierBudget(req));
    }

    @PutMapping("/api/budgets/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<BudgetDirectionDto> modifierBudget(@PathVariable Long id, @RequestBody BudgetDirectionRequest req) {
        req.setId(id);
        return ResponseEntity.ok(budgetService.creerOuModifierBudget(req));
    }

    @DeleteMapping("/api/budgets/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_FINANCIER')")
    public ResponseEntity<Void> supprimerBudget(@PathVariable Long id) {
        budgetService.supprimerBudget(id);
        return ResponseEntity.noContent().build();
    }
}

package com.mef.parkauto.service;

import com.mef.parkauto.dto.DemandeDeplacementDto;
import com.mef.parkauto.dto.ValidationDemandeRequest;
import com.mef.parkauto.entity.Affectation;
import com.mef.parkauto.entity.DemandeDeplacement;
import com.mef.parkauto.entity.StatutDemande;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.mapper.DemandeDeplacementMapper;
import com.mef.parkauto.repository.AffectationRepository;
import com.mef.parkauto.repository.DemandeDeplacementRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemandeDeplacementService {

    private final DemandeDeplacementRepository demandeRepository;
    private final AffectationRepository affectationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeDeplacementMapper demandeMapper;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<DemandeDeplacementDto> getAllDemandes() {
        return demandeRepository.findAllCustom().stream()
                .map(this::mapToDtoWithAffectation)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DemandeDeplacementDto getDemandeById(Long id) {
        DemandeDeplacement demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de déplacement non trouvée avec l'id : " + id));
        return mapToDtoWithAffectation(demande);
    }

    @Transactional(readOnly = true)
    public List<DemandeDeplacementDto> getDemandesByStatut(StatutDemande statut) {
        return demandeRepository.findByStatutOrderByDateCreationDesc(statut).stream()
                .map(this::mapToDtoWithAffectation)
                .collect(Collectors.toList());
    }

    @Transactional
    public DemandeDeplacementDto createDemande(DemandeDeplacementDto dto) {
        Utilisateur demandeur = getCurrentUtilisateur();

        if (dto.getDateHeureRetourEstimee().isBefore(dto.getDateHeureDepart())) {
            throw new IllegalArgumentException("La date de retour estimée ne peut pas être antérieure à la date de départ.");
        }

        DemandeDeplacement demande = new DemandeDeplacement();
        demande.setReference(generateReference());
        demande.setDemandeur(demandeur);
        demande.setMotif(dto.getMotif());
        demande.setDestination(dto.getDestination());
        demande.setDateHeureDepart(dto.getDateHeureDepart());
        demande.setDateHeureRetourEstimee(dto.getDateHeureRetourEstimee());
        demande.setNombrePassagers(dto.getNombrePassagers() != null ? dto.getNombrePassagers() : 1);
        demande.setListePassagers(dto.getListePassagers());
        demande.setStatut(StatutDemande.EN_ATTENTE_VALIDATION);

        DemandeDeplacement saved = demandeRepository.save(demande);
        journalService.log("DEMANDE_DEPLACEMENT", "CREATE", "DemandeDeplacement", saved.getId(), null,
                "Création de la demande " + saved.getReference() + " vers " + saved.getDestination(), null);

        return mapToDtoWithAffectation(saved);
    }

    @Transactional
    public DemandeDeplacementDto validerNiveau1(Long id, ValidationDemandeRequest validationRequest) {
        DemandeDeplacement demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de déplacement non trouvée avec l'id : " + id));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE_VALIDATION) {
            throw new IllegalStateException("La demande ne peut pas être validée/rejetée dans son statut actuel : " + demande.getStatut());
        }

        Utilisateur valideur = getCurrentUtilisateur();

        if (Boolean.TRUE.equals(validationRequest.getApprouve())) {
            demande.setStatut(StatutDemande.VALIDEE_SERVICE);
            demande.setDateValidationService(LocalDateTime.now());
            demande.setValideurService(valideur);
            demande.setMotifRejet(null);

            journalService.log("DEMANDE_DEPLACEMENT", "VALIDATION_N1", "DemandeDeplacement", id, null,
                    "Demande " + demande.getReference() + " validée par Responsable de Service (" + valideur.getNom() + ")", null);
        } else {
            if (validationRequest.getMotifRejet() == null || validationRequest.getMotifRejet().trim().isEmpty()) {
                throw new IllegalArgumentException("Le motif de rejet est obligatoire en cas de refus d'une demande.");
            }
            demande.setStatut(StatutDemande.REJETEE);
            demande.setDateValidationService(LocalDateTime.now());
            demande.setValideurService(valideur);
            demande.setMotifRejet(validationRequest.getMotifRejet().trim());

            journalService.log("DEMANDE_DEPLACEMENT", "REJET_N1", "DemandeDeplacement", id, null,
                    "Demande " + demande.getReference() + " rejetée. Motif : " + validationRequest.getMotifRejet(), null);
        }

        DemandeDeplacement saved = demandeRepository.save(demande);
        return mapToDtoWithAffectation(saved);
    }

    @Transactional
    public void annulerDemande(Long id) {
        DemandeDeplacement demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de déplacement non trouvée avec l'id : " + id));

        if (demande.getStatut() == StatutDemande.APPROUVEE_AFFECTEE || demande.getStatut() == StatutDemande.EN_COURS) {
            throw new IllegalStateException("Une demande déjà affectée ou en cours ne peut être annulée sans traiter l'affectation.");
        }
        if (demande.getStatut() == StatutDemande.TERMINEE || demande.getStatut() == StatutDemande.ANNULEE) {
            throw new IllegalStateException("Cette demande est déjà " + demande.getStatut() + ".");
        }

        // Contrôle de propriété : seul le demandeur, son Responsable de Service, les gestionnaires du parc
        // ou l'administrateur peuvent annuler une demande.
        Utilisateur courant = getCurrentUtilisateur();
        boolean estDemandeur = demande.getDemandeur() != null && courant != null
                && demande.getDemandeur().getId().equals(courant.getId());
        boolean roleAutorise = courant != null && courant.getRole() != null && courant.getRole().getNom() != null
                && java.util.Set.of("ADMIN", "RESPONSABLE_SERVICE", "GESTIONNAIRE_CENTRAL", "GESTIONNAIRE_LOCAL")
                        .contains(courant.getRole().getNom().name());
        if (!estDemandeur && !roleAutorise) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Vous ne pouvez annuler que vos propres demandes de déplacement.");
        }

        demande.setStatut(StatutDemande.ANNULEE);
        demandeRepository.save(demande);
        journalService.log("DEMANDE_DEPLACEMENT", "CANCEL", "DemandeDeplacement", id, null,
                "Annulation de la demande " + demande.getReference(), null);
    }

    private DemandeDeplacementDto mapToDtoWithAffectation(DemandeDeplacement demande) {
        DemandeDeplacementDto dto = demandeMapper.toDto(demande);
        Optional<Affectation> affectationOpt = affectationRepository.findByDemandeDeplacementId(demande.getId());
        if (affectationOpt.isPresent()) {
            dto.setAffectationId(affectationOpt.get().getId());
            dto.setAffectationReference(affectationOpt.get().getReference());
        }
        return dto;
    }

    private String generateReference() {
        int currentYear = Year.now().getValue();
        long count = demandeRepository.count() + 1;
        return String.format("DEM-%d-%04d", currentYear, count);
    }

    private Utilisateur getCurrentUtilisateur() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Utilisateur non authentifié.");
        }
        String email = auth.getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé : " + email));
    }
}

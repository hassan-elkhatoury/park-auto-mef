package com.mef.parkauto.service;

import com.mef.parkauto.dto.AffectationDto;
import com.mef.parkauto.dto.RestitutionRequest;
import com.mef.parkauto.entity.Affectation;
import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.DemandeDeplacement;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.StatutAffectation;
import com.mef.parkauto.entity.StatutConducteur;
import com.mef.parkauto.entity.StatutDemande;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.mapper.AffectationMapper;
import com.mef.parkauto.repository.AffectationRepository;
import com.mef.parkauto.repository.ConducteurRepository;
import com.mef.parkauto.repository.DemandeDeplacementRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AffectationService {

    private final AffectationRepository affectationRepository;
    private final DemandeDeplacementRepository demandeRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AffectationMapper affectationMapper;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<AffectationDto> getAllAffectations() {
        return affectationRepository.findAllCustom().stream()
                .map(affectationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AffectationDto getAffectationById(Long id) {
        Affectation affectation = affectationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affectation non trouvée avec l'id : " + id));
        return affectationMapper.toDto(affectation);
    }

    @Transactional(readOnly = true)
    public AffectationDto getAffectationByDemandeId(Long demandeId) {
        Affectation affectation = affectationRepository.findByDemandeDeplacementId(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune affectation trouvée pour la demande id : " + demandeId));
        return affectationMapper.toDto(affectation);
    }

    @Transactional
    public AffectationDto créerAffectation(AffectationDto dto) {
        DemandeDeplacement demande = demandeRepository.findById(dto.getDemandeDeplacementId())
                .orElseThrow(() -> new ResourceNotFoundException("Demande de déplacement non trouvée : " + dto.getDemandeDeplacementId()));

        if (demande.getStatut() != StatutDemande.VALIDEE_SERVICE && demande.getStatut() != StatutDemande.EN_ATTENTE_VALIDATION) {
            throw new IllegalStateException("Seule une demande validée ou en attente peut être affectée. Statut actuel : " + demande.getStatut());
        }

        Vehicule vehicule = vehiculeRepository.findById(dto.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + dto.getVehiculeId()));

        if (vehicule.getStatutAdministratif() != StatutAdministratif.DISPONIBLE) {
            throw new IllegalStateException("Le véhicule " + vehicule.getImmatriculation() + " n'est pas DISPONIBLE (Statut actuel : " + vehicule.getStatutAdministratif() + ").");
        }

        Conducteur conducteur = conducteurRepository.findById(dto.getConducteurId())
                .orElseThrow(() -> new ResourceNotFoundException("Conducteur non trouvé : " + dto.getConducteurId()));

        if (conducteur.getStatut() != StatutConducteur.ACTIF) {
            throw new IllegalStateException("Le conducteur " + conducteur.getNom() + " " + conducteur.getPrenom() + " n'est pas actif.");
        }

        if (conducteur.getDateExpirationPermis().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Le permis du conducteur " + conducteur.getNom() + " " + conducteur.getPrenom() + " a expiré le " + conducteur.getDateExpirationPermis());
        }

        Utilisateur createur = getCurrentUtilisateur();

        Affectation affectation = new Affectation();
        affectation.setReference(generateReference());
        affectation.setDemandeDeplacement(demande);
        affectation.setVehicule(vehicule);
        affectation.setConducteur(conducteur);
        affectation.setDateDebut(dto.getDateDebut() != null ? dto.getDateDebut() : demande.getDateHeureDepart());
        affectation.setDateFinPrevisionnelle(dto.getDateFinPrevisionnelle() != null ? dto.getDateFinPrevisionnelle() : demande.getDateHeureRetourEstimee());
        affectation.setKilometrageDepart(vehicule.getKilometrageActuel());
        affectation.setStatut(StatutAffectation.EN_COURS);
        affectation.setCreateur(createur);

        // Mettre à jour le statut du véhicule et de la demande
        vehicule.setStatutAdministratif(StatutAdministratif.AFFECTE);
        vehiculeRepository.save(vehicule);

        demande.setStatut(StatutDemande.APPROUVEE_AFFECTEE);
        demande.setDateApprobationParc(LocalDateTime.now());
        demande.setApprobateurParc(createur);
        demandeRepository.save(demande);

        Affectation saved = affectationRepository.save(affectation);

        journalService.log("AFFECTATION", "CREATE", "Affectation", saved.getId(), null,
                "Affectation du véhicule " + vehicule.getImmatriculation() + " au conducteur " + conducteur.getNom() + " pour la demande " + demande.getReference(), null);

        return affectationMapper.toDto(saved);
    }

    @Transactional
    public AffectationDto effectuerRestitution(Long affectationId, RestitutionRequest request) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new ResourceNotFoundException("Affectation non trouvée : " + affectationId));

        if (affectation.getStatut() != StatutAffectation.EN_COURS) {
            throw new IllegalStateException("L'affectation n'est plus en cours.");
        }

        if (request.getKilometrageRetour() < affectation.getKilometrageDepart()) {
            throw new IllegalArgumentException("Le kilométrage de retour (" + request.getKilometrageRetour() +
                    " km) ne peut être inférieur au kilométrage de départ (" + affectation.getKilometrageDepart() + " km).");
        }

        Vehicule vehicule = affectation.getVehicule();
        DemandeDeplacement demande = affectation.getDemandeDeplacement();

        // Mise à jour de l'affectation
        affectation.setKilometrageRetour(request.getKilometrageRetour());
        affectation.setNiveauCarburantRetour(request.getNiveauCarburantRetour());
        affectation.setRemarquesRestitution(request.getRemarquesRestitution());
        affectation.setAnomaliesConstatees(request.getAnomaliesConstatees());
        affectation.setDateFinReelle(LocalDateTime.now());
        affectation.setStatut(StatutAffectation.RESTITUEE);

        // Mise à jour du véhicule (statut DISPONIBLE & nouveau kilométrage)
        vehicule.setKilometrageActuel(request.getKilometrageRetour());
        vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
        vehiculeRepository.save(vehicule);

        // Mise à jour de la demande
        demande.setStatut(StatutDemande.TERMINEE);
        demandeRepository.save(demande);

        Affectation updated = affectationRepository.save(affectation);

        journalService.log("AFFECTATION", "RESTITUTION", "Affectation", affectationId, null,
                "Restitution du véhicule " + vehicule.getImmatriculation() + ". Km départ: " + affectation.getKilometrageDepart() +
                ", Km retour: " + request.getKilometrageRetour() + " (ΔKm = " + (request.getKilometrageRetour() - affectation.getKilometrageDepart()) + " km)", null);

        return affectationMapper.toDto(updated);
    }

    private String generateReference() {
        int currentYear = Year.now().getValue();
        long count = affectationRepository.count() + 1;
        return String.format("AFF-%d-%04d", currentYear, count);
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

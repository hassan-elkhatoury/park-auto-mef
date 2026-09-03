package com.mef.parkauto.service;

import com.mef.parkauto.dto.SinistreDto;
import com.mef.parkauto.dto.SinistreRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SinistreService {

    private final SinistreRepository sinistreRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final AssuranceRepository assuranceRepository;
    private final GarageAgreeRepository garageRepository;
    private final EmailService emailService;
    private final UtilisateurRepository utilisateurRepository;
    private final BudgetService budgetService;
    private final JournalService journalService;
    private final ReformeVehiculeRepository reformeRepository;

    @Transactional(readOnly = true)
    public List<SinistreDto> getAllSinistres() {
        return sinistreRepository.findAllByOrderByDateAccidentDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SinistreDto> getByVehicule(Long vehiculeId) {
        return sinistreRepository.findByVehiculeIdOrderByDateAccidentDesc(vehiculeId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SinistreDto getById(Long id) {
        return sinistreRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + id));
    }

    /**
     * RG03 : Déclarer un sinistre → véhicule passe à ACCIDENTE + notification email aux gestionnaires
     */
    @Transactional
    public SinistreDto declarer(SinistreRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getDateAccident() == null) throw new BadRequestException("La date de l'accident est obligatoire.");
        
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Sinistre sinistre = (request.getId() != null) 
                ? sinistreRepository.findById(request.getId()).orElse(new Sinistre())
                : new Sinistre();

        sinistre.setVehicule(vehicule);

        if (request.getConducteurId() != null) {
            conducteurRepository.findById(request.getConducteurId()).ifPresent(sinistre::setConducteur);
        }
        if (request.getAssuranceId() != null) {
            assuranceRepository.findById(request.getAssuranceId()).ifPresent(sinistre::setAssurance);
        }
        if (request.getGarageAgreeId() != null) {
            sinistre.setGarageAgree(chargerGarageAgreeActif(request.getGarageAgreeId()));
        }

        sinistre.setDateAccident(request.getDateAccident());
        sinistre.setLieuAccident(request.getLieuAccident());
        sinistre.setDescription(request.getDescription());
        sinistre.setTiersImpliques(request.getTiersImpliques());
        sinistre.setNatureAccident(request.getNatureAccident() != null ? request.getNatureAccident() : NatureAccident.COLLISION);
        sinistre.setMontantDommages(request.getMontantDommages() != null ? request.getMontantDommages() : BigDecimal.ZERO);
        sinistre.setMontantFranchise(request.getMontantFranchise() != null ? request.getMontantFranchise() : BigDecimal.ZERO);
        sinistre.setMontantRembourse(request.getMontantRembourse() != null ? request.getMontantRembourse() : BigDecimal.ZERO);
        sinistre.setStatut(request.getStatut() != null ? request.getStatut() : StatutSinistre.DECLARE);
        sinistre.setReferenceExpertise(request.getReferenceExpertise());
        sinistre.setNumeroConstat(request.getNumeroConstat());
        sinistre.setRefPvPolice(request.getRefPvPolice());
        sinistre.setDateExpertise(request.getDateExpertise());
        sinistre.setRemorquageRequis(Boolean.TRUE.equals(request.getRemorquageRequis()));
        sinistre.setPerteTotale(Boolean.TRUE.equals(request.getPerteTotale()));
        sinistre.setObservations(request.getObservations());

        // RG03 : Verrouillage strict du véhicule pour sinistre grave
        if (sinistre.getStatut() != StatutSinistre.CLOTURE && sinistre.getStatut() != StatutSinistre.CLOS) {
            vehicule.setStatutAdministratif(StatutAdministratif.ACCIDENTE);
            vehiculeRepository.save(vehicule);
            log.info("RG03 — Véhicule {} passé en statut ACCIDENTE suite au sinistre déclaré.", vehicule.getImmatriculation());
        }

        // Notification email aux gestionnaires
        try {
            utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && 
                             (u.getRole().getNom() == RoleType.GESTIONNAIRE_CENTRAL ||
                              u.getRole().getNom() == RoleType.ADMIN))
                .forEach(gestionnaire -> emailService.sendSinistreNotification(
                    gestionnaire.getEmail(),
                    gestionnaire.getNom(), gestionnaire.getPrenom(),
                    vehicule.getImmatriculation(),
                    vehicule.getMarque() + " " + vehicule.getModele(),
                    request.getNatureAccident() != null ? request.getNatureAccident().name() : "COLLISION",
                    request.getLieuAccident()
                ));
        } catch (Exception e) {
            log.warn("Erreur notification email sinistre : {}", e.getMessage());
        }

        Sinistre saved = sinistreRepository.save(sinistre);
        journalService.log("SINISTRE", request.getId() == null ? "CREATE" : "UPDATE", "Sinistre", saved.getId(), null,
                saved.getNatureAccident() + " / " + vehicule.getImmatriculation(), null);
        return mapToDto(saved);
    }

    /**
     * Progression du workflow assurance avec déblocage lors de la clôture et imputation RG05.
     */
    @Transactional
    public SinistreDto modifier(Long id, SinistreRequest request) {
        Sinistre sinistre = sinistreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + id));

        if (request.getVehiculeId() != null && (sinistre.getVehicule() == null || !request.getVehiculeId().equals(sinistre.getVehicule().getId()))) {
            sinistre.setVehicule(vehiculeRepository.findById(request.getVehiculeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId())));
        }
        if (request.getConducteurId() != null) conducteurRepository.findById(request.getConducteurId()).ifPresent(sinistre::setConducteur);
        if (request.getAssuranceId() != null) assuranceRepository.findById(request.getAssuranceId()).ifPresent(sinistre::setAssurance);
        if (request.getGarageAgreeId() != null) sinistre.setGarageAgree(chargerGarageAgreeActif(request.getGarageAgreeId()));

        if (request.getDateAccident() != null) sinistre.setDateAccident(request.getDateAccident());
        if (request.getLieuAccident() != null) sinistre.setLieuAccident(request.getLieuAccident());
        if (request.getTiersImpliques() != null) sinistre.setTiersImpliques(request.getTiersImpliques());
        if (request.getNatureAccident() != null) sinistre.setNatureAccident(request.getNatureAccident());
        if (request.getStatut() != null) sinistre.setStatut(request.getStatut());
        if (request.getMontantDommages() != null) sinistre.setMontantDommages(request.getMontantDommages());
        if (request.getMontantFranchise() != null) sinistre.setMontantFranchise(request.getMontantFranchise());
        if (request.getMontantRembourse() != null) sinistre.setMontantRembourse(request.getMontantRembourse());
        if (request.getReferenceExpertise() != null) sinistre.setReferenceExpertise(request.getReferenceExpertise());
        if (request.getNumeroConstat() != null) sinistre.setNumeroConstat(request.getNumeroConstat());
        if (request.getRefPvPolice() != null) sinistre.setRefPvPolice(request.getRefPvPolice());
        if (request.getDateExpertise() != null) sinistre.setDateExpertise(request.getDateExpertise());
        if (request.getDateCloture() != null) sinistre.setDateCloture(request.getDateCloture());
        if (request.getRemorquageRequis() != null) sinistre.setRemorquageRequis(request.getRemorquageRequis());
        if (request.getPerteTotale() != null) sinistre.setPerteTotale(request.getPerteTotale());
        if (request.getDescription() != null) sinistre.setDescription(request.getDescription());
        if (request.getObservations() != null) sinistre.setObservations(request.getObservations());

        Vehicule vehicule = sinistre.getVehicule();

        // RG03 : Remise en circulation automatique lors de la clôture
        if (sinistre.getStatut() == StatutSinistre.CLOTURE || sinistre.getStatut() == StatutSinistre.CLOS) {
            if (sinistre.getDateCloture() == null) {
                sinistre.setDateCloture(LocalDate.now());
            }
            if (Boolean.TRUE.equals(sinistre.getPerteTotale()) && vehicule != null) {
                // RG07 : perte totale → le véhicule ne revient pas en service, une procédure de réforme est ouverte
                ouvrirReformePourPerteTotale(sinistre, vehicule);
            } else if (vehicule != null && vehicule.getStatutAdministratif() == StatutAdministratif.ACCIDENTE) {
                vehicule.setStatutAdministratif(StatutAdministratif.DISPONIBLE);
                vehiculeRepository.save(vehicule);
                log.info("RG03 — Dossier sinistre clôturé pour le véhicule {}. Véhicule remis à DISPONIBLE.", vehicule.getImmatriculation());
            }

            // RG05 : Imputation budgétaire de la franchise / reste à charge MEF
            BigDecimal franchise = sinistre.getMontantFranchise() != null ? sinistre.getMontantFranchise() : BigDecimal.ZERO;
            if (franchise.compareTo(BigDecimal.ZERO) > 0 && vehicule != null) {
                budgetService.imputerDepense(vehicule.getDirection(), NatureDepense.ASSURANCE, franchise,
                        "Franchise sinistre " + vehicule.getImmatriculation() + " (" + sinistre.getNatureAccident() + ")");
            }
        }

        Sinistre saved = sinistreRepository.save(sinistre);
        journalService.log("SINISTRE", "UPDATE", "Sinistre", saved.getId(), null, saved.getStatut().name(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        Sinistre s = sinistreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + id));
        if (s.getStatut() == StatutSinistre.CLOTURE || s.getStatut() == StatutSinistre.CLOS
                || s.getStatut() == StatutSinistre.INDEMNISE) {
            throw new BadRequestException("Un dossier sinistre clôturé ou indemnisé est verrouillé et ne peut pas être supprimé (CdC §24).");
        }
        if (reformeRepository.findBySinistreId(id).isPresent()) {
            throw new BadRequestException("Ce sinistre est rattaché à une procédure de réforme et ne peut pas être supprimé.");
        }
        sinistreRepository.delete(s);
        journalService.log("SINISTRE", "DELETE", "Sinistre", id, s.getStatut().name(),
                "Suppression du sinistre " + s.getNatureAccident() + " du " + s.getDateAccident(), null);
    }

    private GarageAgree chargerGarageAgreeActif(Long garageId) {
        GarageAgree g = garageRepository.findById(garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Garage non trouvé avec l'id : " + garageId));
        if (!Boolean.TRUE.equals(g.getActif()) || !Boolean.TRUE.equals(g.getAgreeMEF())) {
            throw new BadRequestException("Le garage « " + g.getNomGarage() + " » n'est pas agréé MEF ou est désactivé : sélection refusée.");
        }
        return g;
    }

    /**
     * RG07 — Ouvre automatiquement une procédure de réforme (statut INITIE) rattachée au sinistre
     * de perte totale, si aucune n'existe déjà. Le véhicule passe EN_COURS_DE_REFORME.
     */
    private void ouvrirReformePourPerteTotale(Sinistre sinistre, Vehicule vehicule) {
        if (reformeRepository.findBySinistreId(sinistre.getId()).isPresent()) return;
        boolean dejaEnReforme = vehicule.getStatutAdministratif() == StatutAdministratif.EN_COURS_DE_REFORME
                || vehicule.getStatutAdministratif() == StatutAdministratif.REFORME
                || vehicule.getStatutAdministratif() == StatutAdministratif.VENDU;
        if (dejaEnReforme) return;

        ReformeVehicule reforme = new ReformeVehicule();
        reforme.setVehicule(vehicule);
        reforme.setSinistre(sinistre);
        reforme.setStatut(StatutReforme.INITIE);
        reforme.setDateDecision(null);
        reforme.setMotifReforme("Perte totale suite au sinistre " + sinistre.getNatureAccident()
                + " du " + sinistre.getDateAccident()
                + (sinistre.getNumeroConstat() != null ? " (constat " + sinistre.getNumeroConstat() + ")" : ""));
        reformeRepository.save(reforme);

        vehicule.setStatutAdministratif(StatutAdministratif.EN_COURS_DE_REFORME);
        vehiculeRepository.save(vehicule);
        journalService.log("REFORME", "CREATE_AUTO", "ReformeVehicule", reforme.getId(), null,
                "Ouverture automatique suite à perte totale (sinistre " + sinistre.getId() + ")", null);
        log.info("RG07 — Perte totale : procédure de réforme ouverte pour le véhicule {}.", vehicule.getImmatriculation());
    }

    private SinistreDto mapToDto(Sinistre s) {
        Vehicule v = s.getVehicule();
        Conducteur c = s.getConducteur();
        Assurance a = s.getAssurance();
        GarageAgree g = s.getGarageAgree();

        BigDecimal dommages = s.getMontantDommages() != null ? s.getMontantDommages() : BigDecimal.ZERO;
        BigDecimal rembourse = s.getMontantRembourse() != null ? s.getMontantRembourse() : BigDecimal.ZERO;
        BigDecimal franchise = s.getMontantFranchise() != null ? s.getMontantFranchise() : BigDecimal.ZERO;
        BigDecimal resteACharge = dommages.subtract(rembourse).max(franchise);

        return SinistreDto.builder()
                .id(s.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNom(c != null ? c.getNom() + " " + c.getPrenom() : null)
                .assuranceId(a != null ? a.getId() : null)
                .numeroPolice(a != null ? a.getNumeroPolice() : null)
                .compagnieNom(a != null && a.getCompagnie() != null ? a.getCompagnie().name() : null)
                .garageAgreeId(g != null ? g.getId() : null)
                .garageNom(g != null ? g.getNomGarage() : null)
                .dateAccident(s.getDateAccident())
                .lieuAccident(s.getLieuAccident())
                .description(s.getDescription())
                .tiersImpliques(s.getTiersImpliques())
                .natureAccident(s.getNatureAccident())
                .montantDommages(s.getMontantDommages())
                .montantFranchise(s.getMontantFranchise())
                .montantRembourse(s.getMontantRembourse())
                .coutResteACharge(resteACharge)
                .statut(s.getStatut())
                .referenceExpertise(s.getReferenceExpertise())
                .numeroConstat(s.getNumeroConstat())
                .refPvPolice(s.getRefPvPolice())
                .dateExpertise(s.getDateExpertise())
                .dateCloture(s.getDateCloture())
                .remorquageRequis(s.getRemorquageRequis())
                .perteTotale(s.getPerteTotale())
                .reformeId(reformeRepository.findBySinistreId(s.getId()).map(ReformeVehicule::getId).orElse(null))
                .observations(s.getObservations())
                .dateCreation(s.getDateCreation())
                .build();
    }
}

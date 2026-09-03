package com.mef.parkauto.service;

import com.mef.parkauto.dto.TaxeAutomobileDto;
import com.mef.parkauto.dto.TaxeAutomobileRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxeAutomobileService {

    private final TaxeAutomobileRepository taxeRepository;
    private final VehiculeRepository vehiculeRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<TaxeAutomobileDto> getAll() {
        return taxeRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxeAutomobileDto getById(Long id) {
        return taxeRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Taxe non trouvée : " + id));
    }

    @Transactional
    public TaxeAutomobileDto creerOuModifier(TaxeAutomobileRequest request) {
        if (request.getVehiculeId() == null) throw new BadRequestException("Le véhicule est obligatoire.");
        if (request.getAnnee() == null) throw new BadRequestException("L'année est obligatoire.");
        if (request.getType() == null) throw new BadRequestException("Le type de taxe est obligatoire.");
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));
        TaxeAutomobile taxe = request.getId() != null
                ? taxeRepository.findById(request.getId()).orElseThrow(() -> new ResourceNotFoundException("Taxe non trouvée : " + request.getId()))
                : new TaxeAutomobile();
        boolean creation = request.getId() == null;
        if (creation && taxeRepository.existsByVehiculeIdAndAnneeAndType(vehicule.getId(), request.getAnnee(), request.getType())) {
            throw new com.mef.parkauto.exception.DuplicateResourceException("Une taxe " + request.getType() + " existe déjà pour le véhicule "
                    + vehicule.getImmatriculation() + " au titre de l'année " + request.getAnnee() + ".");
        }
        if (request.getMontant() != null && request.getMontant().signum() < 0) {
            throw new BadRequestException("Le montant de la taxe ne peut pas être négatif.");
        }
        taxe.setVehicule(vehicule);
        taxe.setAnnee(request.getAnnee());
        taxe.setType(request.getType());
        taxe.setMontant(request.getMontant());
        taxe.setDateEcheance(request.getDateEcheance());
        taxe.setReferencePaiement(request.getReferencePaiement());

        // Statut : PAYEE exige une référence de paiement ; sinon A_PAYER / EN_RETARD selon l'échéance
        StatutTaxe statut = request.getStatut() != null ? request.getStatut() : StatutTaxe.A_PAYER;
        if (statut == StatutTaxe.PAYEE) {
            if (taxe.getReferencePaiement() == null || taxe.getReferencePaiement().isBlank()) {
                throw new BadRequestException("La référence de paiement est obligatoire pour marquer une taxe comme PAYÉE.");
            }
            if (taxe.getDatePaiement() == null) taxe.setDatePaiement(java.time.LocalDate.now());
        } else if (statut == StatutTaxe.A_PAYER && taxe.getDateEcheance() != null
                && taxe.getDateEcheance().isBefore(java.time.LocalDate.now())) {
            statut = StatutTaxe.EN_RETARD;
        }
        taxe.setStatut(statut);
        TaxeAutomobile saved = taxeRepository.save(taxe);
        journalService.log("TAXE", creation ? "CREATE" : "UPDATE", "TaxeAutomobile", saved.getId(), null,
                saved.getType() + " / " + saved.getAnnee(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        TaxeAutomobile t = taxeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Taxe non trouvée : " + id));
        if (t.getStatut() == StatutTaxe.PAYEE) {
            throw new BadRequestException("Une taxe réglée est verrouillée et ne peut pas être supprimée (CdC §24).");
        }
        taxeRepository.delete(t);
        journalService.log("TAXE", "DELETE", "TaxeAutomobile", id, t.getStatut().name(),
                "Suppression taxe " + t.getType() + " " + t.getAnnee(), null);
    }

    /**
     * Passe automatiquement en EN_RETARD les taxes A_PAYER dont l'échéance est dépassée
     * (appelé par le planificateur d'alertes — CdC §21 « taxe non payée »).
     */
    @Transactional
    public int actualiserRetards() {
        List<TaxeAutomobile> enRetard = taxeRepository.findByStatutAndDateEcheanceBefore(StatutTaxe.A_PAYER, java.time.LocalDate.now());
        enRetard.forEach(t -> t.setStatut(StatutTaxe.EN_RETARD));
        taxeRepository.saveAll(enRetard);
        return enRetard.size();
    }

    private TaxeAutomobileDto mapToDto(TaxeAutomobile t) {
        Vehicule v = t.getVehicule();
        return TaxeAutomobileDto.builder()
                .id(t.getId()).vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .annee(t.getAnnee()).type(t.getType()).montant(t.getMontant())
                .statut(t.getStatut()).dateEcheance(t.getDateEcheance())
                .referencePaiement(t.getReferencePaiement())
                .datePaiement(t.getDatePaiement())
                .dateCreation(t.getDateCreation()).build();
    }
}

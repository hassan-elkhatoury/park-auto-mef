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
        taxe.setVehicule(vehicule);
        taxe.setAnnee(request.getAnnee());
        taxe.setType(request.getType());
        taxe.setMontant(request.getMontant());
        taxe.setStatut(request.getStatut() != null ? request.getStatut() : StatutTaxe.EN_RETARD);
        taxe.setDateEcheance(request.getDateEcheance());
        taxe.setReferencePaiement(request.getReferencePaiement());
        boolean creation = request.getId() == null;
        TaxeAutomobile saved = taxeRepository.save(taxe);
        journalService.log("TAXE", creation ? "CREATE" : "UPDATE", "TaxeAutomobile", saved.getId(), null,
                saved.getType() + " / " + saved.getAnnee(), null);
        return mapToDto(saved);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!taxeRepository.existsById(id)) throw new ResourceNotFoundException("Taxe non trouvée : " + id);
        taxeRepository.deleteById(id);
        journalService.log("TAXE", "DELETE", "TaxeAutomobile", id, null, null, null);
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
                .dateCreation(t.getDateCreation()).build();
    }
}

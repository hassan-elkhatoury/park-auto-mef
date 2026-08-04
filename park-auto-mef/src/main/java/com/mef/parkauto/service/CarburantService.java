package com.mef.parkauto.service;

import com.mef.parkauto.dto.CarteCarburantDto;
import com.mef.parkauto.dto.PleinCarburantDto;
import com.mef.parkauto.dto.PleinCarburantRequest;
import com.mef.parkauto.entity.CarteCarburant;
import com.mef.parkauto.entity.CarteCarburantStatut;
import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.PleinCarburant;
import com.mef.parkauto.entity.TypeCarburant;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.CarteCarburantRepository;
import com.mef.parkauto.repository.ConducteurRepository;
import com.mef.parkauto.repository.PleinCarburantRepository;
import com.mef.parkauto.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarburantService {

    private final PleinCarburantRepository pleinCarburantRepository;
    private final CarteCarburantRepository carteCarburantRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;

    @Transactional(readOnly = true)
    public List<PleinCarburantDto> getAllPleins() {
        return pleinCarburantRepository.findAllByOrderByDatePleinDesc()
                .stream()
                .map(this::mapToPleinDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PleinCarburantDto> getPleinsByVehicule(Long vehiculeId) {
        return pleinCarburantRepository.findByVehiculeIdOrderByDatePleinDesc(vehiculeId)
                .stream()
                .map(this::mapToPleinDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PleinCarburantDto> getAnomaliesSurconsommation() {
        return pleinCarburantRepository.findAnomaliesOrderByDatePleinDesc()
                .stream()
                .map(this::mapToPleinDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PleinCarburantDto enregistrerPlein(PleinCarburantRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé avec l'id : " + request.getVehiculeId()));

        // Règle 1: Le kilométrage saisi doit être >= au dernier kilométrage connu du véhicule
        Long kilometrageActuel = vehicule.getKilometrageActuel() != null ? vehicule.getKilometrageActuel() : 0L;
        if (request.getKilometrage() < kilometrageActuel) {
            throw new IllegalArgumentException("Le kilométrage saisi (" + request.getKilometrage() + 
                    " km) doit être supérieur ou égal au dernier kilométrage connu du véhicule (" + kilometrageActuel + " km).");
        }

        // Règle 2: Mise à jour automatique du kilométrage du véhicule
        vehicule.setKilometrageActuel(request.getKilometrage());
        vehiculeRepository.save(vehicule);

        Conducteur conducteur = null;
        if (request.getConducteurId() != null) {
            conducteur = conducteurRepository.findById(request.getConducteurId()).orElse(null);
        }

        CarteCarburant carte = null;
        if (request.getCarteCarburantId() != null) {
            carte = carteCarburantRepository.findById(request.getCarteCarburantId()).orElse(null);
            if (carte != null && carte.getSolde() != null && request.getMontantTTC() != null) {
                // Déduction du solde si disponible
                if (carte.getSolde().compareTo(request.getMontantTTC()) >= 0) {
                    carte.setSolde(carte.getSolde().subtract(request.getMontantTTC()));
                    carteCarburantRepository.save(carte);
                }
            }
        }

        PleinCarburant plein = new PleinCarburant();
        plein.setVehicule(vehicule);
        plein.setConducteur(conducteur);
        plein.setCarteCarburant(carte);
        plein.setDatePlein(request.getDatePlein() != null ? request.getDatePlein() : LocalDateTime.now());
        plein.setStationService(request.getStationService() != null ? request.getStationService() : "Station Agip / Total MEF");
        plein.setTypeCarburant(request.getTypeCarburant() != null ? request.getTypeCarburant() : vehicule.getTypeCarburant());
        plein.setQuantiteLitres(request.getQuantiteLitres());
        plein.setPrixUnitaire(request.getPrixUnitaire() != null ? request.getPrixUnitaire() : BigDecimal.valueOf(12.50));
        plein.setMontantTTC(request.getMontantTTC());
        plein.setKilometrage(request.getKilometrage());
        plein.setReferenceTicket(request.getReferenceTicket());
        plein.setReferenceFacture(request.getReferenceFacture());
        plein.setObservation(request.getObservation());

        // Calcul automatique de la consommation moyenne L/100km & détection surconsommation
        List<PleinCarburant> precedents = pleinCarburantRepository.findLatestByVehiculeId(vehicule.getId());
        Double consoMoy = null;
        if (!precedents.isEmpty()) {
            PleinCarburant dernierPlein = precedents.get(0);
            long diffKm = request.getKilometrage() - dernierPlein.getKilometrage();
            if (diffKm > 0) {
                consoMoy = Math.round((request.getQuantiteLitres() * 100.0 / diffKm) * 100.0) / 100.0;
            }
        }
        
        if (consoMoy == null && vehicule.getKilometrageInitial() != null && request.getKilometrage() > vehicule.getKilometrageInitial()) {
            long diffKm = request.getKilometrage() - vehicule.getKilometrageInitial();
            if (diffKm > 0) {
                consoMoy = Math.round((request.getQuantiteLitres() * 100.0 / diffKm) * 100.0) / 100.0;
            }
        }

        if (consoMoy == null) {
            consoMoy = 7.5; // valeur moyenne par défaut si 1er plein
        }

        plein.setConsommationMoyenne(consoMoy);

        // Détection d'anomalie (si > 12 L/100km ou 20% au dessus du théorique)
        double consoTheorique = vehicule.getConsommationTheorique() != null ? vehicule.getConsommationTheorique() : 8.0;
        boolean estAnomalie = (consoMoy > 12.0) || (consoMoy > (consoTheorique * 1.20));
        plein.setAnomalieSurconsommation(estAnomalie);

        PleinCarburant saved = pleinCarburantRepository.save(plein);
        return mapToPleinDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CarteCarburantDto> getAllCartes() {
        return carteCarburantRepository.findAll()
                .stream()
                .map(this::mapToCarteDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CarteCarburantDto enregistrerCarte(CarteCarburantDto dto) {
        CarteCarburant carte = new CarteCarburant();
        if (dto.getId() != null) {
            carte = carteCarburantRepository.findById(dto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Carte non trouvée"));
        }
        carte.setNumeroCarte(dto.getNumeroCarte());
        carte.setFournisseur(dto.getFournisseur() != null ? dto.getFournisseur() : "TotalEnergies");
        if (dto.getVehiculeId() != null) {
            Vehicule v = vehiculeRepository.findById(dto.getVehiculeId()).orElse(null);
            carte.setVehicule(v);
        } else {
            carte.setVehicule(null);
        }
        carte.setServiceAttribue(dto.getServiceAttribue());
        carte.setPlafondMensuel(dto.getPlafondMensuel() != null ? dto.getPlafondMensuel() : BigDecimal.valueOf(3000));
        carte.setSolde(dto.getSolde() != null ? dto.getSolde() : dto.getPlafondMensuel());
        carte.setDateActivation(dto.getDateActivation());
        carte.setDateExpiration(dto.getDateExpiration());
        carte.setStatut(dto.getStatut() != null ? dto.getStatut() : CarteCarburantStatut.ACTIVE);
        carte.setObservation(dto.getObservation());

        CarteCarburant saved = carteCarburantRepository.save(carte);
        return mapToCarteDto(saved);
    }

    @Transactional
    public void deletePlein(Long id) {
        pleinCarburantRepository.deleteById(id);
    }

    @Transactional
    public void deleteCarte(Long id) {
        carteCarburantRepository.deleteById(id);
    }

    private PleinCarburantDto mapToPleinDto(PleinCarburant p) {
        Vehicule v = p.getVehicule();
        Conducteur c = p.getConducteur();
        CarteCarburant cc = p.getCarteCarburant();

        return PleinCarburantDto.builder()
                .id(p.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNomPrenom(c != null ? c.getPrenom() + " " + c.getNom() : null)
                .carteCarburantId(cc != null ? cc.getId() : null)
                .numeroCarteCarburant(cc != null ? cc.getNumeroCarte() : null)
                .datePlein(p.getDatePlein())
                .stationService(p.getStationService())
                .typeCarburant(p.getTypeCarburant())
                .quantiteLitres(p.getQuantiteLitres())
                .prixUnitaire(p.getPrixUnitaire())
                .montantTTC(p.getMontantTTC())
                .kilometrage(p.getKilometrage())
                .consommationMoyenne(p.getConsommationMoyenne())
                .anomalieSurconsommation(p.getAnomalieSurconsommation())
                .referenceTicket(p.getReferenceTicket())
                .referenceFacture(p.getReferenceFacture())
                .observation(p.getObservation())
                .build();
    }

    private CarteCarburantDto mapToCarteDto(CarteCarburant c) {
        Vehicule v = c.getVehicule();
        return CarteCarburantDto.builder()
                .id(c.getId())
                .numeroCarte(c.getNumeroCarte())
                .fournisseur(c.getFournisseur())
                .vehiculeId(v != null ? v.getId() : null)
                .vehiculeImmatriculation(v != null ? v.getImmatriculation() : null)
                .vehiculeMarqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .serviceAttribue(c.getServiceAttribue())
                .plafondMensuel(c.getPlafondMensuel())
                .solde(c.getSolde())
                .dateActivation(c.getDateActivation())
                .dateExpiration(c.getDateExpiration())
                .statut(c.getStatut())
                .observation(c.getObservation())
                .build();
    }
}

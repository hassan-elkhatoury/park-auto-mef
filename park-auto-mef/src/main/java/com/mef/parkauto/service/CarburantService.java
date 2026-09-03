package com.mef.parkauto.service;

import com.mef.parkauto.dto.CarteCarburantDto;
import com.mef.parkauto.dto.PleinCarburantDto;
import com.mef.parkauto.dto.PleinCarburantRequest;
import com.mef.parkauto.entity.CarteCarburant;
import com.mef.parkauto.entity.CarteCarburantStatut;
import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.PleinCarburant;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.TypeCarburant;
import com.mef.parkauto.entity.Vehicule;
import com.mef.parkauto.exception.DuplicateResourceException;
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
@lombok.extern.slf4j.Slf4j
public class CarburantService {

    private final PleinCarburantRepository pleinCarburantRepository;
    private final CarteCarburantRepository carteCarburantRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final JournalService journalService;

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

    /** RG05 — seuil de surconsommation : +25 % au-dessus de la moyenne historique du véhicule. */
    public static final double SEUIL_SURCONSOMMATION = 1.25;
    /** Tolérance de cohérence montant = quantité × prix unitaire (1 %). */
    private static final BigDecimal TOLERANCE_MONTANT = new BigDecimal("0.01");

    /**
     * Enregistre (ou modifie) un plein de carburant en appliquant les contrôles du CdC §11 :
     * validité du véhicule, cohérence du kilométrage, capacité du réservoir, type de carburant,
     * absence de doublon, cohérence du montant, validité/solde de la carte, puis RG05.
     */
    @Transactional
    public PleinCarburantDto enregistrerPlein(PleinCarburantRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé avec l'id : " + request.getVehiculeId()));

        boolean modification = request.getId() != null;
        PleinCarburant plein = new PleinCarburant();
        if (modification) {
            plein = pleinCarburantRepository.findById(request.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Plein non trouvé avec l'id : " + request.getId()));
        }

        // --- Contrôle 1 : validité du véhicule (CdC §11 / §24) ---
        StatutAdministratif statut = vehicule.getStatutAdministratif();
        if (statut == StatutAdministratif.REFORME || statut == StatutAdministratif.VENDU
                || statut == StatutAdministratif.ARCHIVE || statut == StatutAdministratif.TRANSFERE) {
            throw new IllegalArgumentException("Impossible d'enregistrer un plein : le véhicule " + vehicule.getImmatriculation()
                    + " est " + statut + " et n'est plus en service.");
        }

        // --- Contrôle 2 : type de carburant conforme au véhicule (CdC §24) ---
        TypeCarburant typeSaisi = request.getTypeCarburant() != null ? request.getTypeCarburant() : vehicule.getTypeCarburant();
        if (vehicule.getTypeCarburant() != null && typeSaisi != vehicule.getTypeCarburant()) {
            throw new IllegalArgumentException("Type de carburant incohérent : le véhicule " + vehicule.getImmatriculation()
                    + " fonctionne au " + vehicule.getTypeCarburant() + ", plein saisi en " + typeSaisi + ".");
        }

        // --- Contrôle 3 : capacité du réservoir (CdC §11) ---
        if (vehicule.getCapaciteReservoir() != null && vehicule.getCapaciteReservoir() > 0
                && request.getQuantiteLitres() > vehicule.getCapaciteReservoir()) {
            throw new IllegalArgumentException("Quantité incohérente : " + request.getQuantiteLitres()
                    + " L dépasse la capacité du réservoir du véhicule (" + vehicule.getCapaciteReservoir() + " L).");
        }

        // --- Contrôle 4 : cohérence du montant = quantité × prix unitaire (CdC §11) ---
        BigDecimal prixUnitaire = request.getPrixUnitaire();
        if (prixUnitaire == null && request.getMontantTTC() != null && request.getQuantiteLitres() > 0) {
            prixUnitaire = request.getMontantTTC().divide(BigDecimal.valueOf(request.getQuantiteLitres()), 3, java.math.RoundingMode.HALF_UP);
        }
        if (prixUnitaire != null && request.getMontantTTC() != null) {
            BigDecimal attendu = prixUnitaire.multiply(BigDecimal.valueOf(request.getQuantiteLitres()));
            BigDecimal ecart = attendu.subtract(request.getMontantTTC()).abs();
            BigDecimal tolerance = attendu.multiply(TOLERANCE_MONTANT).max(BigDecimal.ONE);
            if (ecart.compareTo(tolerance) > 0) {
                throw new IllegalArgumentException("Montant incohérent : " + request.getQuantiteLitres() + " L × "
                        + prixUnitaire + " MAD = " + attendu.setScale(2, java.math.RoundingMode.HALF_UP)
                        + " MAD attendu, " + request.getMontantTTC() + " MAD saisi.");
            }
        }

        // --- Contrôle 5 : cohérence du kilométrage (CdC §24) ---
        LocalDateTime datePlein = request.getDatePlein() != null ? request.getDatePlein() : LocalDateTime.now();
        if (datePlein.isAfter(LocalDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("La date du plein ne peut pas être dans le futur.");
        }
        List<PleinCarburant> historique = pleinCarburantRepository.findLatestByVehiculeId(vehicule.getId());
        final Long pleinId = plein.getId();
        List<PleinCarburant> historiqueAutres = historique.stream()
                .filter(p -> pleinId == null || !p.getId().equals(pleinId))
                .collect(Collectors.toList());
        PleinCarburant dernierPlein = historiqueAutres.isEmpty() ? null : historiqueAutres.get(0);
        long dernierKmConnu = Math.max(
                vehicule.getKilometrageActuel() != null ? vehicule.getKilometrageActuel() : 0L,
                dernierPlein != null && dernierPlein.getKilometrage() != null ? dernierPlein.getKilometrage() : 0L);
        if (!modification && request.getKilometrage() < dernierKmConnu) {
            throw new IllegalArgumentException("Le kilométrage saisi (" + request.getKilometrage()
                    + " km) doit être supérieur ou égal au dernier kilométrage connu du véhicule (" + dernierKmConnu + " km).");
        }
        if (modification && dernierPlein != null && dernierPlein.getKilometrage() != null
                && request.getKilometrage() < dernierPlein.getKilometrage()) {
            throw new IllegalArgumentException("Le kilométrage saisi (" + request.getKilometrage()
                    + " km) est inférieur au plein précédent (" + dernierPlein.getKilometrage() + " km).");
        }

        // --- Contrôle 6 : absence de doublon (CdC §11) ---
        boolean doublon = historiqueAutres.stream().anyMatch(p ->
                (request.getReferenceTicket() != null && !request.getReferenceTicket().isBlank()
                        && request.getReferenceTicket().equalsIgnoreCase(p.getReferenceTicket()))
                || (p.getDatePlein() != null && p.getDatePlein().equals(datePlein)
                        && p.getKilometrage() != null && p.getKilometrage().equals(request.getKilometrage())
                        && p.getQuantiteLitres() != null && Math.abs(p.getQuantiteLitres() - request.getQuantiteLitres()) < 0.001));
        if (doublon) {
            throw new DuplicateResourceException("Doublon détecté : un plein identique (même ticket, ou même date/kilométrage/quantité) "
                    + "existe déjà pour le véhicule " + vehicule.getImmatriculation() + ".");
        }

        Conducteur conducteur = null;
        if (request.getConducteurId() != null) {
            conducteur = conducteurRepository.findById(request.getConducteurId()).orElse(null);
        }

        // --- Contrôle 7 : carte carburant (statut, expiration, attribution, solde) — CdC §12 ---
        CarteCarburant carte = null;
        if (request.getCarteCarburantId() != null) {
            carte = carteCarburantRepository.findById(request.getCarteCarburantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Carte carburant non trouvée avec l'id : " + request.getCarteCarburantId()));
            if (carte.getStatut() != null && carte.getStatut() != CarteCarburantStatut.ACTIVE) {
                throw new IllegalArgumentException("Impossible d'enregistrer le plein : La carte carburant N° "
                        + carte.getNumeroCarte() + " est désactivée ou suspendue (" + carte.getStatut() + ").");
            }
            if (carte.getDateExpiration() != null && carte.getDateExpiration().isBefore(datePlein.toLocalDate())) {
                carte.setStatut(CarteCarburantStatut.EXPIREE);
                carteCarburantRepository.save(carte);
                throw new IllegalArgumentException("Impossible d'enregistrer le plein : La carte carburant N° "
                        + carte.getNumeroCarte() + " est expirée depuis le " + carte.getDateExpiration() + ".");
            }
            if (carte.getVehicule() != null && !carte.getVehicule().getId().equals(vehicule.getId())) {
                throw new IllegalArgumentException("Impossible d'utiliser la carte N° " + carte.getNumeroCarte()
                        + " : Cette carte est spécifiquement attribuée au véhicule " + carte.getVehicule().getImmatriculation()
                        + " et ne peut pas être utilisée pour " + vehicule.getImmatriculation() + ".");
            }
            if (carte.getSolde() != null && request.getMontantTTC() != null) {
                // En modification, on recrédite l'ancien montant avant de débiter le nouveau
                BigDecimal soldeDisponible = carte.getSolde();
                if (modification && plein.getCarteCarburant() != null
                        && plein.getCarteCarburant().getId().equals(carte.getId()) && plein.getMontantTTC() != null) {
                    soldeDisponible = soldeDisponible.add(plein.getMontantTTC());
                }
                if (soldeDisponible.compareTo(request.getMontantTTC()) < 0) {
                    throw new IllegalArgumentException("Solde insuffisant sur la carte N° " + carte.getNumeroCarte()
                            + " : solde disponible " + soldeDisponible + " MAD, montant du plein " + request.getMontantTTC() + " MAD.");
                }
                carte.setSolde(soldeDisponible.subtract(request.getMontantTTC()));
                carteCarburantRepository.save(carte);
            }
        }

        // --- Mise à jour automatique du kilométrage du véhicule ---
        if (vehicule.getKilometrageActuel() == null || request.getKilometrage() > vehicule.getKilometrageActuel()) {
            vehicule.setKilometrageActuel(request.getKilometrage());
            vehiculeRepository.save(vehicule);
        }

        plein.setVehicule(vehicule);
        plein.setConducteur(conducteur);
        plein.setCarteCarburant(carte);
        plein.setDatePlein(datePlein);
        plein.setStationService(request.getStationService() != null && !request.getStationService().isBlank()
                ? request.getStationService() : "Non renseignée");
        plein.setTypeCarburant(typeSaisi);
        plein.setQuantiteLitres(request.getQuantiteLitres());
        plein.setPrixUnitaire(prixUnitaire);
        plein.setMontantTTC(request.getMontantTTC());
        plein.setKilometrage(request.getKilometrage());
        plein.setReferenceTicket(request.getReferenceTicket());
        plein.setReferenceFacture(request.getReferenceFacture());
        plein.setObservation(request.getObservation());

        // --- Consommation moyenne réelle = quantité × 100 / km parcourus depuis le plein précédent (CdC §11) ---
        // Le premier plein d'un véhicule sert de point de référence : sans plein antérieur, la quantité
        // consommée sur la distance n'est pas mesurable (état initial du réservoir inconnu), la consommation reste nulle.
        Double consoMoy = null;
        if (dernierPlein != null && dernierPlein.getKilometrage() != null) {
            long diffKm = request.getKilometrage() - dernierPlein.getKilometrage();
            if (diffKm > 0) {
                consoMoy = arrondi2(request.getQuantiteLitres() * 100.0 / diffKm);
            }
        }
        plein.setConsommationMoyenne(consoMoy);

        // --- RG05 : surconsommation si conso > moyenne historique du véhicule × 1,25 ---
        // Référence = moyenne des consommations des pleins précédents du véhicule ;
        // à défaut d'historique, la consommation théorique constructeur sert de référence.
        Double reference = moyenneHistorique(historiqueAutres);
        if (reference == null) {
            reference = vehicule.getConsommationTheorique() != null && vehicule.getConsommationTheorique() > 0
                    ? vehicule.getConsommationTheorique() : null;
        }
        boolean estAnomalie = consoMoy != null && reference != null && consoMoy > reference * SEUIL_SURCONSOMMATION;
        plein.setAnomalieSurconsommation(estAnomalie);
        if (estAnomalie) {
            String message = "RG05 — Surconsommation détectée sur " + vehicule.getImmatriculation() + " : "
                    + consoMoy + " L/100km (référence " + arrondi2(reference) + " L/100km, seuil +25 %).";
            plein.setObservation(plein.getObservation() == null || plein.getObservation().isBlank()
                    ? message : plein.getObservation() + " | " + message);
            log.warn(message);
        }

        PleinCarburant saved = pleinCarburantRepository.save(plein);
        journalService.log("CARBURANT", modification ? "UPDATE" : "CREATE", "PleinCarburant", saved.getId(),
                null, "Véhicule: " + vehicule.getImmatriculation() + ", Quantité: " + saved.getQuantiteLitres() + "L, Montant: " + saved.getMontantTTC() + " MAD", null);
        return mapToPleinDto(saved);
    }

    private static double arrondi2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /** Bornes de plausibilité d'une consommation (L/100 km) prise en compte dans la moyenne de référence. */
    private static final double CONSO_MIN_PLAUSIBLE = 2.0;
    private static final double CONSO_MAX_PLAUSIBLE = 60.0;

    private static Double moyenneHistorique(List<PleinCarburant> pleins) {
        List<Double> valeurs = pleins.stream()
                .map(PleinCarburant::getConsommationMoyenne)
                .filter(c -> c != null && c >= CONSO_MIN_PLAUSIBLE && c <= CONSO_MAX_PLAUSIBLE)
                .collect(Collectors.toList());
        if (valeurs.isEmpty()) return null;
        return valeurs.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
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
        if (dto.getId() == null) {
            if (carteCarburantRepository.existsByNumeroCarte(dto.getNumeroCarte())) {
                throw new DuplicateResourceException("Action impossible : La carte carburant N° " + dto.getNumeroCarte() + " existe déjà dans le système.");
            }
        } else {
            if (carteCarburantRepository.existsByNumeroCarteAndIdNot(dto.getNumeroCarte(), dto.getId())) {
                throw new DuplicateResourceException("Action impossible : Le numéro de carte " + dto.getNumeroCarte() + " est déjà attribué à une autre carte.");
            }
        }

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
        journalService.log("CARBURANT", dto.getId() != null ? "UPDATE" : "CREATE", "CarteCarburant", saved.getId(),
                null, "Carte N°: " + saved.getNumeroCarte() + ", Fournisseur: " + saved.getFournisseur() + ", Solde: " + saved.getSolde() + " MAD", null);
        return mapToCarteDto(saved);
    }

    @Transactional
    public void deletePlein(Long id) {
        journalService.log("CARBURANT", "DELETE", "PleinCarburant", id, null, null, null);
        pleinCarburantRepository.deleteById(id);
    }

    @Transactional
    public void deleteCarte(Long id) {
        journalService.log("CARBURANT", "DELETE", "CarteCarburant", id, null, null, null);
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

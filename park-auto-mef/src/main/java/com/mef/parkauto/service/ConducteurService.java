package com.mef.parkauto.service;

import com.mef.parkauto.dto.ConducteurDto;
import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.StatutConducteur;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.mapper.ConducteurMapper;
import com.mef.parkauto.repository.ConducteurRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConducteurService {

    private final ConducteurRepository conducteurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ConducteurMapper conducteurMapper;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public List<ConducteurDto> getAllConducteurs() {
        return conducteurRepository.findAll().stream()
                .map(conducteurMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConducteurDto> searchConducteurs(String query) {
        String formattedQuery = (query != null && !query.trim().isEmpty()) ? "%" + query.trim().toLowerCase() + "%" : null;
        return conducteurRepository.searchConducteurs(formattedQuery).stream()
                .map(conducteurMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConducteurDto getConducteurById(Long id) {
        Conducteur conducteur = conducteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conducteur non trouvé avec l'id : " + id));
        return conducteurMapper.toDto(conducteur);
    }

    @Transactional(readOnly = true)
    public List<ConducteurDto> getConducteursActifs() {
        return conducteurRepository.findByStatut(StatutConducteur.ACTIF).stream()
                .map(conducteurMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConducteurDto> getConducteursHabilitesDisponibles() {
        return conducteurRepository.findConducteursHabilitesDisponibles(LocalDate.now()).stream()
                .map(conducteurMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConducteurDto createConducteur(ConducteurDto dto) {
        if (conducteurRepository.findByMatricule(dto.getMatricule()).isPresent()) {
            throw new IllegalArgumentException("Un conducteur avec le matricule " + dto.getMatricule() + " existe déjà.");
        }
        if (conducteurRepository.findByCin(dto.getCin()).isPresent()) {
            throw new IllegalArgumentException("Un conducteur avec le N° CIN " + dto.getCin() + " existe déjà.");
        }
        if (conducteurRepository.findByNumeroPermis(dto.getNumeroPermis()).isPresent()) {
            throw new IllegalArgumentException("Un conducteur avec le N° permis " + dto.getNumeroPermis() + " existe déjà.");
        }

        Conducteur conducteur = conducteurMapper.toEntity(dto);
        if (dto.getStatut() == null) {
            conducteur.setStatut(StatutConducteur.ACTIF);
        }

        if (dto.getUtilisateurId() != null) {
            Utilisateur u = utilisateurRepository.findById(dto.getUtilisateurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id : " + dto.getUtilisateurId()));
            conducteur.setUtilisateur(u);
        }

        Conducteur saved = conducteurRepository.save(conducteur);
        journalService.log("CONDUCTEUR", "CREATE", "Conducteur", saved.getId(), null,
                "Création du conducteur " + saved.getNom() + " " + saved.getPrenom() + " (Permis: " + saved.getNumeroPermis() + ")", null);

        return conducteurMapper.toDto(saved);
    }

    @Transactional
    public ConducteurDto updateConducteur(Long id, ConducteurDto dto) {
        Conducteur conducteur = conducteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conducteur non trouvé avec l'id : " + id));

        conducteurMapper.updateEntityFromDto(dto, conducteur);

        if (dto.getUtilisateurId() != null) {
            Utilisateur u = utilisateurRepository.findById(dto.getUtilisateurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id : " + dto.getUtilisateurId()));
            conducteur.setUtilisateur(u);
        } else {
            conducteur.setUtilisateur(null);
        }

        Conducteur updated = conducteurRepository.save(conducteur);
        journalService.log("CONDUCTEUR", "UPDATE", "Conducteur", updated.getId(), null,
                "Mise à jour des informations du conducteur " + updated.getNom() + " " + updated.getPrenom(), null);

        return conducteurMapper.toDto(updated);
    }

    @Transactional
    public void changeStatut(Long id, StatutConducteur nouveauStatut) {
        Conducteur conducteur = conducteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conducteur non trouvé avec l'id : " + id));

        conducteur.setStatut(nouveauStatut);
        conducteurRepository.save(conducteur);

        journalService.log("CONDUCTEUR", "UPDATE_STATUS", "Conducteur", id, null,
                "Changement du statut vers " + nouveauStatut, null);
    }

    @Transactional
    public void deleteConducteur(Long id) {
        Conducteur conducteur = conducteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conducteur non trouvé avec l'id : " + id));

        conducteurRepository.delete(conducteur);
        journalService.log("CONDUCTEUR", "DELETE", "Conducteur", id,
                "Nom: " + conducteur.getNom() + " " + conducteur.getPrenom(), null, null);
    }
}

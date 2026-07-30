package com.mef.parkauto.service.impl;

import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.user.UpdateRolesRequest;
import com.mef.parkauto.dto.user.UtilisateurRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.entity.Role;
import com.mef.parkauto.entity.RoleType;
import com.mef.parkauto.entity.UserStatus;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.exception.DuplicateResourceException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.mapper.UtilisateurMapper;
import com.mef.parkauto.repository.RoleRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.service.EmailService;
import com.mef.parkauto.service.JournalService;
import com.mef.parkauto.service.UtilisateurService;
import com.mef.parkauto.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Implémentation du service {@link UtilisateurService} de gestion des utilisateurs.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UtilisateurMapper utilisateurMapper;
    private final JournalService journalService;
    private final EmailService emailService;
    private final HttpServletRequest httpServletRequest;

    @Override
    @Transactional(readOnly = true)
    public Page<UtilisateurResponse> findAll(Pageable pageable) {
        log.debug("Récupération paginée de tous les utilisateurs");
        return utilisateurRepository.findAll(pageable)
                .map(utilisateurMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UtilisateurResponse findById(Long id) {
        log.debug("Récupération de l'utilisateur ID: {}", id);
        return utilisateurRepository.findById(id)
                .map(utilisateurMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'ID: " + id));
    }

    private String generateSecurePassword() {
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "@$!%*?&";
        SecureRandom random = new SecureRandom();
        
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(special.charAt(random.nextInt(special.length())));
        
        String all = upper + lower + digits + special;
        for (int i = 0; i < 8; i++) {
            sb.append(all.charAt(random.nextInt(all.length())));
        }
        
        List<Character> chars = new ArrayList<>();
        for (char c : sb.toString().toCharArray()) {
            chars.add(c);
        }
        Collections.shuffle(chars, random);
        
        StringBuilder result = new StringBuilder();
        for (char c : chars) {
            result.append(c);
        }
        return result.toString();
    }

    @Override
    public UtilisateurResponse create(RegisterRequest request) {
        log.info("Création de l'utilisateur email: {}, matricule: {}", request.email(), request.matricule());

        // Validations d'unicité
        if (utilisateurRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Un utilisateur existe déjà avec cet email: " + request.email());
        }
        if (utilisateurRepository.existsByMatricule(request.matricule())) {
            throw new DuplicateResourceException("Un utilisateur existe déjà avec ce matricule: " + request.matricule());
        }

        // Création de l'entité utilisateur
        Utilisateur user = new Utilisateur();
        user.setMatricule(request.matricule());
        user.setNom(request.nom());
        user.setPrenom(request.prenom());
        user.setEmail(request.email());
        user.setTelephone(request.telephone());
        user.setDirection(request.direction());
        user.setService(request.service());
        user.setRegion(request.region());
        user.setStatut(UserStatus.ACTIVE);
        user.setDoitChangerMotDePasse(true);

        // Génération d'un mot de passe temporaire aléatoire et sécurisé
        String rawPassword = generateSecurePassword();
        log.info("Mot de passe temporaire généré pour {}: {}", request.email(), rawPassword);
        String encodedPassword = passwordEncoder.encode(rawPassword);
        String[] parts = encodedPassword.split("\\$");
        user.setSel(parts.length > 0 ? parts[0] : "");
        user.setMotDePasse(encodedPassword);

        // Association du rôle unique
        RoleType roleType = request.role();
        if (roleType == null) {
            roleType = RoleType.CONSULTATION;
        }
        RoleType finalRoleType = roleType;
        Role role = roleRepository.findByNom(finalRoleType)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle non trouvé: " + finalRoleType));
        user.setRole(role);

        Utilisateur savedUser = utilisateurRepository.save(user);

        // Envoi du mot de passe temporaire par email
        emailService.sendTemporaryPassword(savedUser.getEmail(), savedUser.getNom(), savedUser.getPrenom(), rawPassword);

        // Audit log
        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_CREATE,
                "Utilisateur",
                savedUser.getId(),
                null,
                "Utilisateur créé avec succès",
                httpServletRequest.getRemoteAddr()
        );

        return utilisateurMapper.toResponse(savedUser);
    }

    @Override
    public UtilisateurResponse update(Long id, UtilisateurRequest request) {
        log.info("Mise à jour de l'utilisateur ID: {}", id);

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'ID: " + id));

        // Validation d'unicité de l'email
        if (!user.getEmail().equalsIgnoreCase(request.email()) &&
                utilisateurRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Un utilisateur existe déjà avec cet email: " + request.email());
        }

        // Validation d'unicité du matricule
        if (!user.getMatricule().equalsIgnoreCase(request.matricule()) &&
                utilisateurRepository.existsByMatricule(request.matricule())) {
            throw new DuplicateResourceException("Un utilisateur existe déjà avec ce matricule: " + request.matricule());
        }

        // Sauvegarde de l'état précédent pour la journalisation
        String oldState = String.format("Email: %s, Matricule: %s, Nom: %s, Prenom: %s, Statut: %s",
                user.getEmail(), user.getMatricule(), user.getNom(), user.getPrenom(), user.getStatut());

        // Mise à jour de l'entité via MapStruct
        utilisateurMapper.updateEntityFromRequest(request, user);

        Utilisateur updatedUser = utilisateurRepository.save(user);

        String newState = String.format("Email: %s, Matricule: %s, Nom: %s, Prenom: %s, Statut: %s",
                updatedUser.getEmail(), updatedUser.getMatricule(), updatedUser.getNom(), updatedUser.getPrenom(), updatedUser.getStatut());

        // Audit log
        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_UPDATE,
                "Utilisateur",
                updatedUser.getId(),
                oldState,
                newState,
                httpServletRequest.getRemoteAddr()
        );

        return utilisateurMapper.toResponse(updatedUser);
    }

    @Override
    public void deactivate(Long id) {
        log.info("Désactivation de l'utilisateur ID: {}", id);

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'ID: " + id));

        if (user.getStatut() == UserStatus.INACTIVE) {
            log.info("L'utilisateur ID: {} est déjà inactif", id);
            return;
        }

        user.setStatut(UserStatus.INACTIVE);
        utilisateurRepository.save(user);

        // Audit log
        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_DELETE,
                "Utilisateur",
                id,
                "Statut: ACTIVE",
                "Statut: INACTIVE",
                httpServletRequest.getRemoteAddr()
        );
    }

    @Override
    public UtilisateurResponse updateRole(Long id, UpdateRolesRequest request) {
        log.info("Mise à jour du rôle pour l'utilisateur ID: {}", id);

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'ID: " + id));

        String oldRoleStr = user.getRole() != null ? user.getRole().getNom().name() : "Aucun";

        // Résolution du nouveau rôle unique
        RoleType roleType = request.role();
        Role role = roleRepository.findByNom(roleType)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle non trouvé: " + roleType));

        user.setRole(role);
        Utilisateur updatedUser = utilisateurRepository.save(user);

        String newRoleStr = updatedUser.getRole().getNom().name();

        // Audit log
        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_CHANGE_ROLES,
                "Utilisateur",
                updatedUser.getId(),
                "Role: " + oldRoleStr,
                "Role: " + newRoleStr,
                httpServletRequest.getRemoteAddr()
        );

        return utilisateurMapper.toResponse(updatedUser);
    }
}

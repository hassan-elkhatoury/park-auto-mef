package com.mef.parkauto.security;

import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation personnalisée de {@link UserDetailsService} pour
 * Spring Security. Charge les utilisateurs depuis la base de données
 * en utilisant l'email comme identifiant.
 * <p>
 * Implémente également {@link UserDetailsPasswordService} : lorsqu'un utilisateur
 * s'authentifie avec un hachage historique (SHA-256 salé), Spring Security ré-encode
 * automatiquement son mot de passe avec l'algorithme par défaut (BCrypt).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService, UserDetailsPasswordService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Tentative d'authentification pour l'email: {}", email);

        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Échec d'authentification — aucun utilisateur trouvé avec l'email: {}", email);
                    return new UsernameNotFoundException(
                            "Aucun utilisateur trouvé avec l'email: " + email
                    );
                });
    }

    @Override
    @Transactional
    public UserDetails updatePassword(UserDetails user, String newPassword) {
        if (user instanceof Utilisateur utilisateur) {
            utilisateur.setMotDePasse(newPassword);
            // Le sel est désormais intégré au hachage BCrypt ; on conserve l'identifiant d'algorithme
            int idx = newPassword.indexOf('}');
            utilisateur.setSel(idx > 0 ? newPassword.substring(0, idx + 1) : "bcrypt");
            log.info("Mot de passe de {} migré vers BCrypt", utilisateur.getEmail());
            return utilisateurRepository.save(utilisateur);
        }
        return user;
    }
}

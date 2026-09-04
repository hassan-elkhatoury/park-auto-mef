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
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

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
}

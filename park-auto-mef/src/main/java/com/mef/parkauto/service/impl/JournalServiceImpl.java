package com.mef.parkauto.service.impl;

import com.mef.parkauto.entity.JournalAction;
import com.mef.parkauto.repository.JournalActionRepository;
import com.mef.parkauto.service.JournalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implémentation du service {@link JournalService} de journalisation.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class JournalServiceImpl implements JournalService {

    private final JournalActionRepository journalActionRepository;

    @Override
    public void log(String module, String action, String entityName, Long entityId,
                    String oldValue, String newValue, String ipAddress) {
        
        String username = "SYSTEM";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
            username = authentication.getName();
        }

        // Résolution automatique de l'adresse IP si non renseignée
        if (ipAddress == null || ipAddress.isBlank()) {
            try {
                org.springframework.web.context.request.ServletRequestAttributes attrs = 
                        (org.springframework.web.context.request.ServletRequestAttributes) 
                        org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attrs != null && attrs.getRequest() != null) {
                    jakarta.servlet.http.HttpServletRequest req = attrs.getRequest();
                    String xForwardedFor = req.getHeader("X-Forwarded-For");
                    if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                        ipAddress = xForwardedFor.split(",")[0].trim();
                    } else {
                        ipAddress = req.getRemoteAddr();
                    }
                }
            } catch (Exception ignored) {}
        }
        if (ipAddress == null || ipAddress.isBlank()) {
            ipAddress = "127.0.0.1";
        }

        JournalAction journalEntry = new JournalAction();
        journalEntry.setUsername(username);
        journalEntry.setTimestamp(LocalDateTime.now());
        journalEntry.setModule(module != null ? module.toUpperCase().trim() : "SYSTEM");
        journalEntry.setAction(action != null ? action.toUpperCase().trim() : "ACTION");
        journalEntry.setEntityName(entityName);
        journalEntry.setEntityId(entityId);
        journalEntry.setOldValue(oldValue);
        journalEntry.setNewValue(newValue);
        journalEntry.setIpAddress(ipAddress);

        journalActionRepository.save(journalEntry);
        
        log.info("Journalisation action [{}] sur le module [{}] par [{}]. ID entité : {}",
                action, module, username, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JournalAction> findByModule(String module, Pageable pageable) {
        log.debug("Récupération des journaux du module : {}", module);
        return journalActionRepository.findByModule(module, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JournalAction> findByUsername(String username, Pageable pageable) {
        log.debug("Récupération des journaux de l'utilisateur : {}", username);
        return journalActionRepository.findByUsername(username, pageable);
    }
}

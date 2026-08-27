package com.mef.parkauto.service;

import com.mef.parkauto.dto.AuditLogDto;
import com.mef.parkauto.entity.AuditLog;
import com.mef.parkauto.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Journalise une action — IMMUTABLE, pas de modification possible.
     */
    @Transactional
    public void logAction(Long utilisateurId, String utilisateurNom, String action,
                          String entite, Long entiteId, String ancienneValeur,
                          String nouvelleValeur, String adresseIp) {
        AuditLog log = AuditLog.builder()
                .utilisateurId(utilisateurId)
                .utilisateurNom(utilisateurNom)
                .action(action)
                .entite(entite)
                .entiteId(entiteId)
                .ancienneValeur(ancienneValeur)
                .nouvelleValeur(nouvelleValeur)
                .dateAction(LocalDateTime.now())
                .adresseIp(adresseIp)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAll(int page, int size) {
        return auditLogRepository.findAllByOrderByDateActionDesc(PageRequest.of(page, size))
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getByEntite(String entite, Long entiteId) {
        return auditLogRepository.findByEntiteAndEntiteIdOrderByDateActionDesc(entite, entiteId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private AuditLogDto mapToDto(AuditLog a) {
        return AuditLogDto.builder()
                .id(a.getId()).utilisateurId(a.getUtilisateurId())
                .utilisateurNom(a.getUtilisateurNom()).action(a.getAction())
                .entite(a.getEntite()).entiteId(a.getEntiteId())
                .ancienneValeur(a.getAncienneValeur()).nouvelleValeur(a.getNouvelleValeur())
                .dateAction(a.getDateAction()).adresseIp(a.getAdresseIp())
                .build();
    }
}

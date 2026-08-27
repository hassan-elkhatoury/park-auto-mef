package com.mef.parkauto.controller;

import com.mef.parkauto.dto.AuditLogDto;
import com.mef.parkauto.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<AuditLogDto>> getAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size) {
        return ResponseEntity.ok(auditLogService.getAll(page, size));
    }

    @GetMapping("/entite/{entite}/{entiteId}")
    public ResponseEntity<List<AuditLogDto>> getByEntite(
            @PathVariable String entite, @PathVariable Long entiteId) {
        return ResponseEntity.ok(auditLogService.getByEntite(entite, entiteId));
    }

    /**
     * AMÉLIORATION : Récupère l'IP réelle via X-Forwarded-For ou remoteAddr
     */
    public static String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

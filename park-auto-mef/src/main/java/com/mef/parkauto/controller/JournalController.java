package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.entity.JournalAction;
import com.mef.parkauto.repository.JournalActionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/journal")
@Tag(name = "Journal d'Audit", description = "Endpoints de consultation du journal d'audit et traçabilité des actions")
@RequiredArgsConstructor
@Slf4j
public class JournalController {

    private final JournalActionRepository journalActionRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_CENTRAL')")
    @Operation(summary = "Consulter le journal d'audit (Section 30 Cahier des Charges)", description = "Retourne la liste paginée de toutes les actions d'écriture enregistrées dans la base")
    public ResponseEntity<ApiResponse<Page<JournalAction>>> findAll(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String username,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Consultation du journal d'audit - module: {}, username: {}", module, username);

        Page<JournalAction> page;
        if (module != null && !module.isBlank()) {
            page = journalActionRepository.findByModule(module, pageable);
        } else if (username != null && !username.isBlank()) {
            page = journalActionRepository.findByUsername(username, pageable);
        } else {
            page = journalActionRepository.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(page, "Journal d'audit récupéré avec succès"));
    }
}

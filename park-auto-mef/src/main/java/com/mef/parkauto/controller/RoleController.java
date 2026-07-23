package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ApiResponse;
import com.mef.parkauto.dto.role.RoleResponse;
import com.mef.parkauto.mapper.RoleMapper;
import com.mef.parkauto.repository.RoleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour la gestion et la consultation des rôles.
 * <p>
 * Sécurisé par token JWT (Bearer Token).
 */
@RestController
@RequestMapping("/api/roles")
@Tag(name = "Rôles", description = "Endpoints de gestion et consultation des rôles utilisateurs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @GetMapping
    @Operation(summary = "Récupère la liste complète des rôles enregistrés en base de données")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        log.info("Requête GET reçue pour lister tous les rôles");
        
        List<RoleResponse> roles = roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(roles, "Liste des rôles récupérée"));
    }
}

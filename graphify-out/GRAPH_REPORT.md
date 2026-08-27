# Graph Report - park auto MEF  (2026-08-27)

## Corpus Check
- 304 files · ~198,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1981 nodes · 5704 edges · 113 communities (107 shown, 6 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 409 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad0aecf6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ReportingService
- BudgetView.jsx
- Sprint7BudgetDashboardTests
- VisiteTechniqueDto
- dependencies
- TaxeAutomobileDto
- DocumentGED
- app.js
- BudgetDirection
- ReformeVehiculeDto
- GarageAgreeController
- SecurityConfig.java
- finalize_main_report.py
- FICHE TECHNIQUE DÉTAILLÉE PAR SPRINT
- Infraction
- Conducteur
- App.jsx
- InterventionMaintenance
- MaintenanceService
- ExerciceBudgetaire
- lombok.Data
- api.js
- UtilisateurServiceImpl.java
- lombok.AllArgsConstructor
- DashboardView.jsx
- VehiculeRequest
- lombok.RequiredArgsConstructor
- Sinistre
- vehicule.jsx
- PanneVehicule
- ApiResponse
- org.springframework.data.jpa.repository.Query
- NatureMaintenance
- RoleType
- VehiculeResponse
- VisiteTechnique
- build_sprint8_planning.py
- org.springframework.transaction.annotation.Transactional
- generate_sprint7_rapport.py
- BudgetService
- PrevisionCarburant
- LoginResponse
- AssuranceRequest
- Affectation
- Assurance
- io.swagger.v3.oas.annotations.tags.Tag
- DemandeDeplacement
- Prompts détaillés des figures 13 à 32 - Chapitre 3
- JwtService
- PieceRemplacement
- CarburantService.java
- EmailServiceImpl
- .create
- NumberedCanvasRapport
- build_docx_from_latex.py
- NumberedCanvas
- .oxlintrc.json
- Utilisateur
- org.springframework.data.domain.Page
- build_overleaf_report.py
- Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF)
- NumberedCanvas
- AssuranceDto
- io.swagger.v3.oas.annotations.Operation
- UtilisateurResponse
- ParkAutoApplication
- EngagementBudgetaire
- org.springframework.data.jpa.repository.JpaRepository
- StatutAdministratif
- DemandeDetailView.jsx
- Paragraph
- BudgetDirectionDto
- DataInitializer
- VisitesTaxesReformeView.jsx
- AuditLog
- com.mef:park-auto-mef
- React + Vite
- AGENTS.md
- NatureDepense
- EngagementBudgetaireDto
- EtatTechnique
- TaxeAutomobile
- CompagnieAssurance
- JwtAuthenticationFilter.java
- AffectationService.java
- .getCurrentUser
- TypeGarantie
- ExerciceBudgetaireRequest
- LiquidationEngagementRequest
- AlerteBudgetaireDto
- BudgetDirectionRequest
- EngagementBudgetaireRequest
- org.springframework.http.ResponseEntity
- AssuranceController
- LoginView.jsx

## God Nodes (most connected - your core abstractions)
1. `ResourceNotFoundException` - 95 edges
2. `ApiResponse` - 77 edges
3. `BudgetService` - 45 edges
4. `Vehicule` - 43 edges
5. `Utilisateur` - 41 edges
6. `DataInitializer` - 38 edges
7. `StatutAdministratif` - 37 edges
8. `BadRequestException` - 36 edges
9. `UtilisateurResponse` - 34 edges
10. `Conducteur` - 33 edges

## Surprising Connections (you probably didn't know these)
- `BudgetView()` --calls--> `getApiErrorMessage()`  [EXTRACTED]
  park-auto-frontend/src/components/BudgetView.jsx → park-auto-frontend/src/services/api.js
- `VehiculesListView()` --calls--> `directionShort()`  [EXTRACTED]
  park-auto-frontend/src/components/VehiculesListView.jsx → park-auto-frontend/src/utils/vehicule.jsx
- `DataInitializer` --references--> `RoleType`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/entity/RoleType.java
- `DataInitializer` --references--> `AffectationRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/AffectationRepository.java
- `DataInitializer` --references--> `AssuranceRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/AssuranceRepository.java

## Import Cycles
- None detected.

## Communities (113 total, 6 thin omitted)

### Community 0 - "ReportingService"
Cohesion: 0.08
Nodes (29): com.lowagie.text.Document, com.lowagie.text.Font, com.lowagie.text.Image, com.lowagie.text.Paragraph, com.lowagie.text.pdf.PdfPageEventHelper, com.lowagie.text.pdf.PdfPCell, com.lowagie.text.pdf.PdfPTable, com.lowagie.text.pdf.PdfWriter (+21 more)

### Community 1 - "BudgetView.jsx"
Cohesion: 0.19
Nodes (10): BudgetView(), DIRECTIONS, MOIS_NOMS, NATURES_DEPENSE, PALETTE, PALETTE, RapportsView(), budgetService (+2 more)

### Community 2 - "Sprint7BudgetDashboardTests"
Cohesion: 0.20
Nodes (8): org.junit.jupiter.api.BeforeEach, org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, org.springframework.test.context.ActiveProfiles, ParkAutoApplicationTests, Sprint6MaintenancePanneSinistreTests, Sprint7BudgetDashboardTests

### Community 3 - "VisiteTechniqueDto"
Cohesion: 0.09
Nodes (20): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, VisiteTechniqueController, AllArgsConstructor (+12 more)

### Community 4 - "dependencies"
Cohesion: 0.04
Nodes (45): autoprefixer, axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion (+37 more)

### Community 5 - "TaxeAutomobileDto"
Cohesion: 0.07
Nodes (23): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TaxeAutomobileController, AllArgsConstructor (+15 more)

### Community 6 - "DocumentGED"
Cohesion: 0.09
Nodes (23): org.springframework.core.io.Resource, org.springframework.web.multipart.MultipartFile, DocumentGEDController, GetMapping, PostMapping, RequestMapping, RestController, DocumentGEDDto (+15 more)

### Community 7 - "app.js"
Cohesion: 0.13
Nodes (34): btnOpenCreateModal, closeModal(), confirmArchive(), createVehicleCardHTML(), dashboardLayout, escapeHTML(), fetchVehicules(), filterSearch (+26 more)

### Community 8 - "BudgetDirection"
Cohesion: 0.16
Nodes (10): BudgetDirection, AllArgsConstructor, Builder, Entity, Getter, NoArgsConstructor, Setter, Table (+2 more)

### Community 9 - "ReformeVehiculeDto"
Cohesion: 0.06
Nodes (30): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ReformeVehiculeController, AllArgsConstructor (+22 more)

### Community 10 - "GarageAgreeController"
Cohesion: 0.23
Nodes (5): GarageAgreeController, DeleteMapping, GetMapping, RequestMapping, RestController

### Community 11 - "SecurityConfig.java"
Cohesion: 0.09
Nodes (23): io.swagger.v3.oas.models.OpenAPI, java.security.SecureRandom, OpenAPI, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.data.domain.AuditorAware, org.springframework.data.jpa.repository.config.EnableJpaAuditing, org.springframework.lang.NonNull (+15 more)

### Community 12 - "finalize_main_report.py"
Cohesion: 0.19
Nodes (26): add_body_before(), add_bullet_before(), add_caption_before(), add_heading_before(), add_image_before(), add_table_before(), clear_paragraph(), enable_field_updates() (+18 more)

### Community 13 - "FICHE TECHNIQUE DÉTAILLÉE PAR SPRINT"
Cohesion: 0.09
Nodes (22): 1. FEUILLE DE ROUTE TECHNIQUE ET CHRONOLOGIE AGRÉGÉE (SPRINTS 1 À 8), 2.1. Architecture Logicielle en Couches Découplées (3-Tier Clean Architecture), 2.2. Architecture de Sécurité et Modèle RBAC, 2.3. Architecture de Déploiement et Haute Disponibilité, 2. CHOIX D'ARCHITECTURE ET FONDEMENTS TECHNIQUES, 3. AUDIT COMPARATIF ET ANALYSE DES ÉCARTS STRUCTURELS, 4.1. Référentiel des 39 Diagrammes UML et Schémas Graphiques, 4.2. Dictionnaire du Schéma de Données (MPD - 28 Entités JPA) (+14 more)

### Community 14 - "Infraction"
Cohesion: 0.07
Nodes (29): InfractionController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, InfractionDto (+21 more)

### Community 15 - "Conducteur"
Cohesion: 0.21
Nodes (4): ConducteurDto, Conducteur, ConducteurRepository, ConducteurService

### Community 16 - "App.jsx"
Cohesion: 0.09
Nodes (21): App(), isJwtValid(), AffectationDetailView(), fmtDateTime(), AffectationsView(), actionConfig, AuditView(), ConducteurDetailView() (+13 more)

### Community 17 - "InterventionMaintenance"
Cohesion: 0.12
Nodes (12): InterventionMaintenance, StatutMaintenance, ANNULEE, EN_COURS, PROGRAMMEE, TERMINEE, TypeMaintenance, CURATIVE (+4 more)

### Community 18 - "MaintenanceService"
Cohesion: 0.16
Nodes (9): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, MaintenanceController, InterventionMaintenanceDto (+1 more)

### Community 19 - "ExerciceBudgetaire"
Cohesion: 0.13
Nodes (12): ExerciceBudgetaire, AllArgsConstructor, Builder, Entity, Getter, NoArgsConstructor, Setter, Table (+4 more)

### Community 20 - "lombok.Data"
Cohesion: 0.14
Nodes (12): com.fasterxml.jackson.annotation.JsonInclude, lombok.Builder, lombok.Data, AlerteEcheanceDto, ClotureExerciceRequest, ClotureExerciceRequestBuilder, ClotureInterventionRequest, ExecutiveSummaryDto (+4 more)

### Community 21 - "api.js"
Cohesion: 0.15
Nodes (17): COMPAGNIES, GARANTIES, NATURES_ACCIDENT, MaintenanceView(), PannesView(), URGENCES, SinistresView(), STATUTS_SINISTRE (+9 more)

### Community 22 - "UtilisateurServiceImpl.java"
Cohesion: 0.16
Nodes (16): jakarta.servlet.http.HttpServletRequest, org.springframework.security.authentication.AuthenticationManager, org.springframework.security.crypto.password.PasswordEncoder, UtilisateurRequest, UserStatus, ACTIVE, ARCHIVED, INACTIVE (+8 more)

### Community 23 - "lombok.AllArgsConstructor"
Cohesion: 0.18
Nodes (16): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.MappedSuperclass, jakarta.persistence.Table, lombok.AllArgsConstructor, lombok.Getter, lombok.NoArgsConstructor, lombok.Setter (+8 more)

### Community 24 - "DashboardView.jsx"
Cohesion: 0.08
Nodes (8): DashboardView(), DEMAND_STATUS, FUEL_COLORS, isMaintenance(), ROLE_DESCRIPTIONS, ROLE_LABELS, TOOLTIP_STYLE, carburantService

### Community 25 - "VehiculeRequest"
Cohesion: 0.20
Nodes (9): org.mapstruct.BeanMapping, org.mapstruct.Mapper, org.mapstruct.Mapping, HistoriqueStatutResponse, VehiculeRequest, AffectationMapper, ConducteurMapper, HistoriqueStatutMapper (+1 more)

### Community 26 - "lombok.RequiredArgsConstructor"
Cohesion: 0.23
Nodes (12): lombok.extern.slf4j.Slf4j, lombok.RequiredArgsConstructor, org.springframework.security.core.userdetails.UserDetailsService, org.springframework.stereotype.Service, CustomUserDetailsService, AffectationService, AssuranceService, PanneService (+4 more)

### Community 27 - "Sinistre"
Cohesion: 0.05
Nodes (35): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, SinistreController, AllArgsConstructor (+27 more)

### Community 28 - "vehicule.jsx"
Cohesion: 0.18
Nodes (17): CarburantView(), formatDate(), formatKm(), VehiculeDetailView(), CAR_BRANDS_AND_MODELS, EMPTY_FORM, fetchNextInventaireNumber(), PLATE_LETTERS (+9 more)

### Community 29 - "PanneVehicule"
Cohesion: 0.08
Nodes (24): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PanneController, CloturePanneRequest, PanneDto (+16 more)

### Community 30 - "ApiResponse"
Cohesion: 0.23
Nodes (8): DataIntegrityViolationException, HttpMessageNotReadableException, org.springframework.security.access.AccessDeniedException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, ApiResponse, GlobalExceptionHandler

### Community 31 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.12
Nodes (11): org.springframework.data.jpa.repository.Query, PleinCarburantDto, PleinCarburantRequest, PleinCarburant, TypeCarburant, DIESEL, ELECTRIQUE, ESSENCE (+3 more)

### Community 32 - "NatureMaintenance"
Cohesion: 0.10
Nodes (19): NatureMaintenance, AMORTISSEURS_SUSPENSION, AUTRE, BATTERIE, CARROSSERIE_PEINTURE, CIRCUIT_REFROIDISSEMENT, CLIMATISATION, CONTROLE_TECHNIQUE (+11 more)

### Community 33 - "RoleType"
Cohesion: 0.15
Nodes (11): RoleResponse, UpdateRolesRequest, RoleType, ADMIN, CONDUCTEUR, CONSULTATION, GESTIONNAIRE_CENTRAL, GESTIONNAIRE_LOCAL (+3 more)

### Community 34 - "VehiculeResponse"
Cohesion: 0.24
Nodes (3): VehiculeController, VehiculeResponse, VehiculeService

### Community 35 - "VisiteTechnique"
Cohesion: 0.10
Nodes (11): org.springframework.scheduling.annotation.Scheduled, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, VisiteTechnique (+3 more)

### Community 36 - "build_sprint8_planning.py"
Cohesion: 0.29
Nodes (5): build_docx_planning(), build_pdf_planning(), NumberedCanvasMEF, set_cell_background(), set_cell_margins()

### Community 37 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.08
Nodes (7): org.springframework.transaction.annotation.Transactional, DeleteMapping, AffectationDto, PrePersist, BadRequestException, ResourceNotFoundException, PreUpdate

### Community 38 - "generate_sprint7_rapport.py"
Cohesion: 0.36
Nodes (5): add_screenshot_placeholder_docx(), build_docx_report(), NumberedCanvasMEF, set_cell_background(), set_cell_margins()

### Community 39 - "BudgetService"
Cohesion: 0.12
Nodes (8): DeleteMapping, ExerciceBudgetaireDto, AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter, BudgetService

### Community 40 - "PrevisionCarburant"
Cohesion: 0.18
Nodes (9): AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, Transient, PrevisionCarburant (+1 more)

### Community 41 - "LoginResponse"
Cohesion: 0.20
Nodes (5): ChangePasswordRequest, LoginRequest, LoginResponse, RefreshTokenRequest, AuthService

### Community 42 - "AssuranceRequest"
Cohesion: 0.22
Nodes (6): PostMapping, PutMapping, AssuranceRequest, AllArgsConstructor, Data, NoArgsConstructor

### Community 43 - "Affectation"
Cohesion: 0.20
Nodes (6): Affectation, StatutAffectation, ANNULEE, EN_COURS, RESTITUEE, AffectationRepository

### Community 44 - "Assurance"
Cohesion: 0.15
Nodes (12): Assurance, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, StatutAssurance (+4 more)

### Community 45 - "io.swagger.v3.oas.annotations.tags.Tag"
Cohesion: 0.18
Nodes (15): io.swagger.v3.oas.annotations.security.SecurityRequirement, io.swagger.v3.oas.annotations.tags.Tag, org.springframework.security.access.prepost.PreAuthorize, org.springframework.web.bind.annotation.DeleteMapping, org.springframework.web.bind.annotation.PatchMapping, org.springframework.web.bind.annotation.PostMapping, org.springframework.web.bind.annotation.PutMapping, org.springframework.web.bind.annotation.RequestMapping (+7 more)

### Community 46 - "DemandeDeplacement"
Cohesion: 0.14
Nodes (13): DemandeDeplacementDto, DemandeDeplacement, StatutDemande, ANNULEE, APPROUVEE_AFFECTEE, EN_ATTENTE_VALIDATION, EN_COURS, REJETEE (+5 more)

### Community 48 - "Prompts détaillés des figures 13 à 32 - Chapitre 3"
Cohesion: 0.08
Nodes (23): Charte commune à appliquer, Contrôle final avant insertion dans Word, Figure 13 - Cas d'utilisation des fonctions transverses de sécurité et d'administration, Figure 14 - Modèle de classes des habilitations et services transverses, Figure 15 - Séquence de contrôle d'accès et de traitement sécurisé, Figure 16 - Cas d'utilisation de la gestion des véhicules, Figure 17 - Diagramme de classes du module Véhicules, Figure 18 - Séquence d'enregistrement et de qualification d'un véhicule (+15 more)

### Community 49 - "JwtService"
Cohesion: 0.29
Nodes (4): io.jsonwebtoken.Claims, javax.crypto.SecretKey, org.springframework.security.core.userdetails.UserDetails, JwtService

### Community 50 - "PieceRemplacement"
Cohesion: 0.14
Nodes (9): PostMapping, GarageAgreeDto, GarageAgreeRequest, PieceRemplacementDto, Entity, Table, PieceRemplacement, PieceRemplacementRepository (+1 more)

### Community 51 - "CarburantService.java"
Cohesion: 0.15
Nodes (10): CarteCarburantDto, CarteCarburant, CarteCarburantStatut, ACTIVE, DESACTIVEE, EXPIREE, PERDUE, REMPLACEE (+2 more)

### Community 52 - "EmailServiceImpl"
Cohesion: 0.44
Nodes (4): org.springframework.mail.javamail.JavaMailSender, org.springframework.scheduling.annotation.Async, EmailServiceImpl, Override

### Community 55 - "build_docx_from_latex.py"
Cohesion: 0.31
Nodes (13): add_roadmap(), build(), enable_field_updates(), format_chapter3_headings(), insert_figure(), main(), Document, Path (+5 more)

### Community 56 - "NumberedCanvas"
Cohesion: 0.36
Nodes (3): generate_pdf_for_path(), main(), NumberedCanvas

### Community 57 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 58 - "Utilisateur"
Cohesion: 0.29
Nodes (3): org.springframework.security.core.GrantedAuthority, Override, Utilisateur

### Community 59 - "org.springframework.data.domain.Page"
Cohesion: 0.14
Nodes (10): org.springframework.data.domain.Page, org.springframework.data.domain.Pageable, GetMapping, RequestMapping, RestController, JournalController, JournalAction, JournalActionRepository (+2 more)

### Community 60 - "build_overleaf_report.py"
Cohesion: 0.15
Nodes (29): BodyElement, build(), chapter3_prefix(), chapter_wrapper(), compact_chapter3_tail(), copy_chapter3_assets(), cover_tex(), empty_frontmatter() (+21 more)

### Community 61 - "Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF)"
Cohesion: 0.15
Nodes (12): Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF), Authentification sous Swagger UI :, Configuration de la Base de Données, Documentation des Endpoints (Swagger UI), Exécution des Tests, Lancement de l'Application, Option A : Lancement par défaut (avec base de données PostgreSQL), Option B : Lancement en mode Développement (sans installation PostgreSQL, utilise H2 local) (+4 more)

### Community 63 - "AssuranceDto"
Cohesion: 0.25
Nodes (5): AssuranceDto, AllArgsConstructor, Builder, Data, NoArgsConstructor

### Community 64 - "io.swagger.v3.oas.annotations.Operation"
Cohesion: 0.11
Nodes (10): io.swagger.v3.oas.annotations.Operation, org.springframework.web.bind.annotation.GetMapping, AuthController, CarburantController, DeleteMapping, GetMapping, PostMapping, RequestMapping (+2 more)

### Community 65 - "UtilisateurResponse"
Cohesion: 0.18
Nodes (4): RegisterRequest, UtilisateurResponse, DuplicateResourceException, Override

### Community 66 - "ParkAutoApplication"
Cohesion: 0.53
Nodes (4): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableAsync, org.springframework.scheduling.annotation.EnableScheduling, ParkAutoApplication

### Community 67 - "EngagementBudgetaire"
Cohesion: 0.16
Nodes (9): EngagementBudgetaire, AllArgsConstructor, Builder, Entity, Getter, NoArgsConstructor, Setter, Table (+1 more)

### Community 68 - "org.springframework.data.jpa.repository.JpaRepository"
Cohesion: 0.24
Nodes (8): org.springframework.data.jpa.repository.JpaRepository, org.springframework.stereotype.Repository, GarageAgreeRepository, HistoriqueStatutRepository, RoleRepository, SinistreRepository, VehiculeRepository, VehiculeServiceImpl

### Community 69 - "StatutAdministratif"
Cohesion: 0.12
Nodes (16): StatutAdministratif, ACCIDENTE, AFFECTE, ARCHIVE, DISPONIBLE, EN_COURS_DE_REFORME, EN_COURS_REFORME, EN_ENTRETIEN (+8 more)

### Community 70 - "DemandeDetailView.jsx"
Cohesion: 0.50
Nodes (3): DemandeDetailView(), fmtDateTime(), STATUS_STYLES

### Community 71 - "Paragraph"
Cohesion: 0.50
Nodes (4): Paragraph, has_numbering(), paragraph_alignment_wrapper(), build_pdf_report()

### Community 72 - "BudgetDirectionDto"
Cohesion: 0.14
Nodes (10): BudgetDirectionDto, AllArgsConstructor, Builder, Data, NoArgsConstructor, BudgetSyntheseDto, AllArgsConstructor, Builder (+2 more)

### Community 73 - "DataInitializer"
Cohesion: 0.27
Nodes (4): JdbcTemplate, org.springframework.boot.CommandLineRunner, DataInitializer, Override

### Community 74 - "VisitesTaxesReformeView.jsx"
Cohesion: 0.21
Nodes (9): AssurancesView(), RESULTATS_VISITE, STATUTS_REFORME, TYPES_TAXE, VisitesTaxesReformeView(), getApiErrorMessage(), reformeService, taxeService (+1 more)

### Community 75 - "AuditLog"
Cohesion: 0.09
Nodes (19): AuditLogController, GetMapping, RequestMapping, RestController, AuditLogDto, AllArgsConstructor, Builder, Data (+11 more)

### Community 84 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 86 - "NatureDepense"
Cohesion: 0.14
Nodes (13): NatureDepense, ASSURANCE, AUTRES, CARBURANT, ENTRETIEN, LOCATION, LUBRIFIANTS, PIECES_RECHANGE (+5 more)

### Community 87 - "EngagementBudgetaireDto"
Cohesion: 0.17
Nodes (10): EngagementBudgetaireDto, AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter, StatutEngagement, ANNULE (+2 more)

### Community 88 - "EtatTechnique"
Cohesion: 0.18
Nodes (10): StatutChangeRequest, EtatTechnique, ACCIDENTE, BON_ETAT, EN_REPARATION, ENTRETIEN_NECESSAIRE, ETAT_MOYEN, HORS_SERVICE (+2 more)

### Community 89 - "TaxeAutomobile"
Cohesion: 0.21
Nodes (8): AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, TaxeAutomobile, TaxeAutomobileRepository

### Community 90 - "CompagnieAssurance"
Cohesion: 0.25
Nodes (7): CompagnieAssurance, ATLANTA, AUTRE, AXA, RMA, SAHAM, WAFA

### Community 91 - "JwtAuthenticationFilter.java"
Cohesion: 0.29
Nodes (7): jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletResponse, org.springframework.stereotype.Component, org.springframework.web.filter.OncePerRequestFilter, Override, Override, JwtAuthenticationFilter

### Community 92 - "AffectationService.java"
Cohesion: 0.29
Nodes (4): StatutConducteur, ACTIF, INACTIF, SUSPENDU

### Community 94 - "TypeGarantie"
Cohesion: 0.33
Nodes (5): TypeGarantie, INCENDIE, TIERS, TOUS_RISQUES, VOL

### Community 95 - "ExerciceBudgetaireRequest"
Cohesion: 0.29
Nodes (6): ExerciceBudgetaireRequest, AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter

### Community 96 - "LiquidationEngagementRequest"
Cohesion: 0.29
Nodes (6): AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter, LiquidationEngagementRequest

### Community 98 - "AlerteBudgetaireDto"
Cohesion: 0.29
Nodes (6): AlerteBudgetaireDto, AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter

### Community 99 - "BudgetDirectionRequest"
Cohesion: 0.33
Nodes (5): BudgetDirectionRequest, AllArgsConstructor, Builder, Data, NoArgsConstructor

### Community 100 - "EngagementBudgetaireRequest"
Cohesion: 0.29
Nodes (6): EngagementBudgetaireRequest, AllArgsConstructor, Builder, Getter, NoArgsConstructor, Setter

### Community 101 - "org.springframework.http.ResponseEntity"
Cohesion: 0.11
Nodes (17): org.springframework.http.ResponseEntity, org.springframework.security.core.Authentication, BudgetController, GetMapping, PostMapping, PutMapping, RestController, DeleteMapping (+9 more)

### Community 102 - "AssuranceController"
Cohesion: 0.18
Nodes (5): AssuranceController, DeleteMapping, GetMapping, RequestMapping, RestController

### Community 103 - "LoginView.jsx"
Cohesion: 0.50
Nodes (3): containerVariants, itemVariants, LoginView()

## Knowledge Gaps
- **275 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+270 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ResourceNotFoundException` connect `org.springframework.transaction.annotation.Transactional` to `ReportingService`, `Sprint7BudgetDashboardTests`, `VisiteTechniqueDto`, `DocumentGED`, `Infraction`, `Conducteur`, `MaintenanceService`, `UtilisateurServiceImpl.java`, `lombok.RequiredArgsConstructor`, `PanneVehicule`, `ApiResponse`, `org.springframework.data.jpa.repository.Query`, `BudgetService`, `DemandeDeplacement`, `JwtService`, `PieceRemplacement`, `CarburantService.java`, `.create`, `UtilisateurResponse`, `BudgetDirectionDto`, `AffectationService.java`, `.getCurrentUser`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `Vehicule` connect `lombok.AllArgsConstructor` to `ReportingService`, `Sprint7BudgetDashboardTests`, `ReformeVehiculeDto`, `Infraction`, `InterventionMaintenance`, `UtilisateurServiceImpl.java`, `VehiculeRequest`, `Sinistre`, `PanneVehicule`, `org.springframework.data.jpa.repository.Query`, `VisiteTechnique`, `PrevisionCarburant`, `Affectation`, `Assurance`, `CarburantService.java`, `.create`, `org.springframework.data.domain.Page`, `org.springframework.data.jpa.repository.JpaRepository`, `StatutAdministratif`, `EtatTechnique`, `TaxeAutomobile`, `AffectationService.java`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `BaseEntity` connect `lombok.AllArgsConstructor` to `BudgetDirection`, `ReformeVehiculeDto`, `Infraction`, `Conducteur`, `InterventionMaintenance`, `ExerciceBudgetaire`, `Sinistre`, `PanneVehicule`, `org.springframework.data.jpa.repository.Query`, `VisiteTechnique`, `PrevisionCarburant`, `Affectation`, `Assurance`, `DemandeDeplacement`, `PieceRemplacement`, `CarburantService.java`, `Utilisateur`, `EngagementBudgetaire`, `TaxeAutomobile`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _275 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ReportingService` be split into smaller, more focused modules?**
  _Cohesion score 0.083710407239819 - nodes in this community are weakly interconnected._
- **Should `VisiteTechniqueDto` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
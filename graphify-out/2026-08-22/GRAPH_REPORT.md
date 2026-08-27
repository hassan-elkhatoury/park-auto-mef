# Graph Report - park auto MEF  (2026-08-22)

## Corpus Check
- 272 files · ~148,044 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1735 nodes · 5134 edges · 88 communities (83 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 355 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad0aecf6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.springframework.data.jpa.repository.Query
- PanneService
- ConfirmModal.jsx
- VisiteTechniqueDto
- dependencies
- TaxeAutomobile
- DocumentGED
- app.js
- org.mapstruct.Mapping
- ReformeVehiculeDto
- UserStatus
- SecurityConfig.java
- BudgetDirection
- VehiculeRepository
- Infraction
- AffectationService.java
- App.jsx
- org.springframework.data.domain.Page
- .success
- AuditLog
- lombok.AllArgsConstructor
- api
- UtilisateurResponse
- Vehicule
- DashboardView.jsx
- VehiculeServiceImpl.java
- io.swagger.v3.oas.annotations.Operation
- SinistreDto
- vehicule.jsx
- StatutPanne
- ApiResponse
- PleinCarburant
- NatureMaintenance
- api.js
- PieceRemplacement
- StatutAdministratif
- DataInitializer
- org.springframework.transaction.annotation.Transactional
- Sprint6MaintenancePanneSinistreTests
- Sinistre
- PrevisionCarburant
- AffectationService
- AssuranceDto
- ReformeVehicule
- Assurance
- StatutMaintenance
- Conducteur
- PannesView.jsx
- Prompts détaillés des figures 13 à 32 - Chapitre 3
- JwtService
- org.springframework.data.jpa.repository.JpaRepository
- lombok.RequiredArgsConstructor
- EmailServiceImpl
- RoleType
- MaintenanceService
- build_docx_from_latex.py
- StatutSinistre
- .oxlintrc.json
- Utilisateur
- CompagnieAssurance
- build_overleaf_report.py
- Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF)
- ReportingController
- EmailService
- org.springframework.http.ResponseEntity
- JwtAuthenticationFilter.java
- ParkAutoApplication
- SinistreController
- Sha256PasswordEncoder
- AssuranceRequest
- DemandeDetailView.jsx
- .getCurrentUser
- NatureAccident
- org.springframework.web.bind.annotation.PostMapping
- UtilisateurServiceImpl.java
- com.mef:park-auto-mef
- React + Vite
- AGENTS.md
- BudgetService

## God Nodes (most connected - your core abstractions)
1. `ResourceNotFoundException` - 90 edges
2. `ApiResponse` - 66 edges
3. `Vehicule` - 43 edges
4. `Utilisateur` - 41 edges
5. `StatutAdministratif` - 38 edges
6. `DataInitializer` - 34 edges
7. `UtilisateurResponse` - 34 edges
8. `Conducteur` - 33 edges
9. `VehiculeRepository` - 33 edges
10. `api` - 32 edges

## Surprising Connections (you probably didn't know these)
- `DataInitializer` --references--> `RoleType`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/entity/RoleType.java
- `DataInitializer` --references--> `AffectationRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/AffectationRepository.java
- `DataInitializer` --references--> `AssuranceRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/AssuranceRepository.java
- `DataInitializer` --references--> `BudgetDirectionRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/BudgetDirectionRepository.java
- `DataInitializer` --references--> `CarteCarburantRepository`  [EXTRACTED]
  park-auto-mef/src/main/java/com/mef/parkauto/config/DataInitializer.java → park-auto-mef/src/main/java/com/mef/parkauto/repository/CarteCarburantRepository.java

## Import Cycles
- None detected.

## Communities (88 total, 5 thin omitted)

### Community 0 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.10
Nodes (20): com.lowagie.text.Document, com.lowagie.text.Font, com.lowagie.text.Image, com.lowagie.text.Paragraph, com.lowagie.text.pdf.PdfPageEventHelper, com.lowagie.text.pdf.PdfPCell, com.lowagie.text.pdf.PdfPTable, com.lowagie.text.pdf.PdfWriter (+12 more)

### Community 1 - "PanneService"
Cohesion: 0.16
Nodes (9): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PanneController, CloturePanneRequest, PanneDto (+1 more)

### Community 2 - "ConfirmModal.jsx"
Cohesion: 0.20
Nodes (7): CarburantView(), ConducteurDetailView(), ConducteursView(), ConfirmModal(), roleBadgeStyles, UtilisateursView(), carburantService

### Community 3 - "VisiteTechniqueDto"
Cohesion: 0.07
Nodes (29): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, VisiteTechniqueController, AllArgsConstructor (+21 more)

### Community 4 - "dependencies"
Cohesion: 0.04
Nodes (45): autoprefixer, axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion (+37 more)

### Community 5 - "TaxeAutomobile"
Cohesion: 0.06
Nodes (31): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TaxeAutomobileController, AllArgsConstructor (+23 more)

### Community 6 - "DocumentGED"
Cohesion: 0.08
Nodes (25): org.springframework.core.io.Resource, org.springframework.security.core.Authentication, org.springframework.web.multipart.MultipartFile, DocumentGEDController, DeleteMapping, GetMapping, PostMapping, RequestMapping (+17 more)

### Community 7 - "app.js"
Cohesion: 0.13
Nodes (34): btnOpenCreateModal, closeModal(), confirmArchive(), createVehicleCardHTML(), dashboardLayout, escapeHTML(), fetchVehicules(), filterSearch (+26 more)

### Community 8 - "org.mapstruct.Mapping"
Cohesion: 0.20
Nodes (7): org.mapstruct.BeanMapping, org.mapstruct.Mapper, org.mapstruct.Mapping, HistoriqueStatutResponse, AffectationMapper, HistoriqueStatutMapper, VehiculeMapper

### Community 9 - "ReformeVehiculeDto"
Cohesion: 0.11
Nodes (17): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ReformeVehiculeController, AllArgsConstructor (+9 more)

### Community 10 - "UserStatus"
Cohesion: 0.25
Nodes (6): UtilisateurRequest, UserStatus, ACTIVE, ARCHIVED, INACTIVE, LOCKED

### Community 11 - "SecurityConfig.java"
Cohesion: 0.11
Nodes (20): io.swagger.v3.oas.models.OpenAPI, OpenAPI, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.data.domain.AuditorAware, org.springframework.data.jpa.repository.config.EnableJpaAuditing, org.springframework.lang.NonNull, org.springframework.security.authentication.AuthenticationProvider (+12 more)

### Community 12 - "BudgetDirection"
Cohesion: 0.10
Nodes (16): BudgetDirection, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, Transient (+8 more)

### Community 13 - "VehiculeRepository"
Cohesion: 0.19
Nodes (3): VehiculeRepository, Override, VehiculeServiceImpl

### Community 14 - "Infraction"
Cohesion: 0.07
Nodes (29): InfractionController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, InfractionDto (+21 more)

### Community 15 - "AffectationService.java"
Cohesion: 0.10
Nodes (18): DemandeDeplacementDto, Affectation, DemandeDeplacement, StatutAffectation, ANNULEE, EN_COURS, RESTITUEE, StatutDemande (+10 more)

### Community 16 - "App.jsx"
Cohesion: 0.10
Nodes (21): App(), AffectationDetailView(), fmtDateTime(), AffectationsView(), AssurancesView(), actionConfig, AuditView(), BudgetView() (+13 more)

### Community 17 - "org.springframework.data.domain.Page"
Cohesion: 0.20
Nodes (7): org.springframework.data.domain.Page, org.springframework.data.domain.Pageable, GetMapping, JournalAction, JournalActionRepository, Override, JournalServiceImpl

### Community 18 - ".success"
Cohesion: 0.14
Nodes (8): AuthController, CarburantController, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, DeleteMapping

### Community 19 - "AuditLog"
Cohesion: 0.10
Nodes (15): GetMapping, AuditLogDto, AllArgsConstructor, Builder, Data, NoArgsConstructor, AuditLog, AllArgsConstructor (+7 more)

### Community 20 - "lombok.AllArgsConstructor"
Cohesion: 0.20
Nodes (16): com.fasterxml.jackson.annotation.JsonInclude, lombok.AllArgsConstructor, lombok.Builder, lombok.Data, lombok.NoArgsConstructor, AlerteEcheanceDto, CarteCarburantDto, ExecutiveSummaryDto (+8 more)

### Community 21 - "api"
Cohesion: 0.20
Nodes (11): COMPAGNIES, GARANTIES, NATURES_ACCIDENT, SinistresView(), STATUTS_SINISTRE, api, assuranceService, documentService (+3 more)

### Community 22 - "UtilisateurResponse"
Cohesion: 0.17
Nodes (7): LoginRequest, LoginResponse, RefreshTokenRequest, RegisterRequest, UtilisateurResponse, AuthService, UtilisateurService

### Community 23 - "Vehicule"
Cohesion: 0.21
Nodes (15): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.MappedSuperclass, jakarta.persistence.Table, lombok.Getter, lombok.Setter, BaseEntity, GarageAgree (+7 more)

### Community 24 - "DashboardView.jsx"
Cohesion: 0.09
Nodes (7): DashboardView(), DEMAND_STATUS, FUEL_COLORS, isMaintenance(), ROLE_DESCRIPTIONS, ROLE_LABELS, TOOLTIP_STYLE

### Community 25 - "VehiculeServiceImpl.java"
Cohesion: 0.11
Nodes (18): StatutChangeRequest, VehiculeRequest, VehiculeResponse, EtatTechnique, ACCIDENTE, BON_ETAT, EN_REPARATION, ENTRETIEN_NECESSAIRE (+10 more)

### Community 26 - "io.swagger.v3.oas.annotations.Operation"
Cohesion: 0.12
Nodes (7): io.swagger.v3.oas.annotations.Operation, org.springframework.security.access.prepost.PreAuthorize, org.springframework.web.bind.annotation.DeleteMapping, org.springframework.web.bind.annotation.GetMapping, org.springframework.web.bind.annotation.PatchMapping, org.springframework.web.bind.annotation.PutMapping, ConducteurController

### Community 27 - "SinistreDto"
Cohesion: 0.24
Nodes (6): GetMapping, AllArgsConstructor, Builder, Data, NoArgsConstructor, SinistreDto

### Community 28 - "vehicule.jsx"
Cohesion: 0.16
Nodes (19): RapportsView(), formatDate(), formatKm(), VehiculeDetailView(), CAR_BRANDS_AND_MODELS, EMPTY_FORM, fetchNextInventaireNumber(), PLATE_LETTERS (+11 more)

### Community 29 - "StatutPanne"
Cohesion: 0.12
Nodes (13): PanneRequest, StatutPanne, ANNULEE, DECLAREE, EN_DIAGNOSTIC, EN_REPARATION, REPAREE, UrgencePanne (+5 more)

### Community 30 - "ApiResponse"
Cohesion: 0.26
Nodes (8): DataIntegrityViolationException, HttpMessageNotReadableException, org.springframework.security.access.AccessDeniedException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, ApiResponse, GlobalExceptionHandler

### Community 31 - "PleinCarburant"
Cohesion: 0.10
Nodes (12): PleinCarburantRequest, CarteCarburant, CarteCarburantStatut, ACTIVE, DESACTIVEE, EXPIREE, PERDUE, REMPLACEE (+4 more)

### Community 32 - "NatureMaintenance"
Cohesion: 0.10
Nodes (19): NatureMaintenance, AMORTISSEURS_SUSPENSION, AUTRE, BATTERIE, CARROSSERIE_PEINTURE, CIRCUIT_REFROIDISSEMENT, CLIMATISATION, CONTROLE_TECHNIQUE (+11 more)

### Community 33 - "api.js"
Cohesion: 0.18
Nodes (10): DIRECTIONS, MOIS_NOMS, NATURES_DEPENSE, RESULTATS_VISITE, STATUTS_REFORME, TYPES_TAXE, budgetService, reformeService (+2 more)

### Community 34 - "PieceRemplacement"
Cohesion: 0.19
Nodes (8): PieceRemplacementDto, Entity, PrePersist, Table, PieceRemplacement, PieceRemplacementRepository, GarageAgreeService, PreUpdate

### Community 35 - "StatutAdministratif"
Cohesion: 0.12
Nodes (16): StatutAdministratif, ACCIDENTE, AFFECTE, ARCHIVE, DISPONIBLE, EN_COURS_DE_REFORME, EN_COURS_REFORME, EN_ENTRETIEN (+8 more)

### Community 36 - "DataInitializer"
Cohesion: 0.33
Nodes (3): org.springframework.boot.CommandLineRunner, DataInitializer, Override

### Community 37 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.09
Nodes (10): org.springframework.stereotype.Service, org.springframework.transaction.annotation.Transactional, BadRequestException, ResourceNotFoundException, AssuranceService, DemandeDeplacementService, Override, JournalService (+2 more)

### Community 38 - "Sprint6MaintenancePanneSinistreTests"
Cohesion: 0.31
Nodes (6): org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, org.springframework.test.context.ActiveProfiles, ParkAutoApplicationTests, Sprint6MaintenancePanneSinistreTests

### Community 39 - "Sinistre"
Cohesion: 0.21
Nodes (8): AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, Sinistre, SinistreRepository

### Community 40 - "PrevisionCarburant"
Cohesion: 0.18
Nodes (9): AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, Transient, PrevisionCarburant (+1 more)

### Community 42 - "AssuranceDto"
Cohesion: 0.12
Nodes (12): AssuranceController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, AssuranceDto (+4 more)

### Community 43 - "ReformeVehicule"
Cohesion: 0.12
Nodes (14): AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, ReformeVehicule, StatutReforme (+6 more)

### Community 44 - "Assurance"
Cohesion: 0.15
Nodes (13): org.springframework.scheduling.annotation.Scheduled, Assurance, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table (+5 more)

### Community 45 - "StatutMaintenance"
Cohesion: 0.12
Nodes (12): InterventionMaintenanceRequest, PieceRemplacementRequest, StatutMaintenance, ANNULEE, EN_COURS, PROGRAMMEE, TERMINEE, TypeMaintenance (+4 more)

### Community 46 - "Conducteur"
Cohesion: 0.17
Nodes (9): ConducteurDto, Conducteur, StatutConducteur, ACTIF, INACTIF, SUSPENDU, ConducteurMapper, ConducteurRepository (+1 more)

### Community 47 - "PannesView.jsx"
Cohesion: 0.22
Nodes (7): GaragesView(), MaintenanceView(), PannesView(), URGENCES, garageService, maintenanceService, panneService

### Community 48 - "Prompts détaillés des figures 13 à 32 - Chapitre 3"
Cohesion: 0.08
Nodes (23): Charte commune à appliquer, Contrôle final avant insertion dans Word, Figure 13 - Cas d'utilisation des fonctions transverses de sécurité et d'administration, Figure 14 - Modèle de classes des habilitations et services transverses, Figure 15 - Séquence de contrôle d'accès et de traitement sécurisé, Figure 16 - Cas d'utilisation de la gestion des véhicules, Figure 17 - Diagramme de classes du module Véhicules, Figure 18 - Séquence d'enregistrement et de qualification d'un véhicule (+15 more)

### Community 49 - "JwtService"
Cohesion: 0.29
Nodes (4): io.jsonwebtoken.Claims, javax.crypto.SecretKey, org.springframework.security.core.userdetails.UserDetails, JwtService

### Community 50 - "org.springframework.data.jpa.repository.JpaRepository"
Cohesion: 0.22
Nodes (5): org.springframework.data.jpa.repository.JpaRepository, org.springframework.stereotype.Repository, GarageAgreeRepository, HistoriqueStatutRepository, RoleRepository

### Community 51 - "lombok.RequiredArgsConstructor"
Cohesion: 0.18
Nodes (21): io.swagger.v3.oas.annotations.security.SecurityRequirement, io.swagger.v3.oas.annotations.tags.Tag, lombok.extern.slf4j.Slf4j, lombok.RequiredArgsConstructor, org.springframework.security.core.userdetails.UserDetailsService, org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController, AffectationController (+13 more)

### Community 52 - "EmailServiceImpl"
Cohesion: 0.45
Nodes (4): org.springframework.mail.javamail.JavaMailSender, org.springframework.scheduling.annotation.Async, EmailServiceImpl, Override

### Community 53 - "RoleType"
Cohesion: 0.13
Nodes (11): RoleResponse, UpdateRolesRequest, RoleType, ADMIN, CONDUCTEUR, CONSULTATION, GESTIONNAIRE_CENTRAL, GESTIONNAIRE_LOCAL (+3 more)

### Community 54 - "MaintenanceService"
Cohesion: 0.18
Nodes (9): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, MaintenanceController, ClotureInterventionRequest, InterventionMaintenanceDto (+1 more)

### Community 55 - "build_docx_from_latex.py"
Cohesion: 0.31
Nodes (13): add_roadmap(), build(), enable_field_updates(), format_chapter3_headings(), insert_figure(), main(), Document, Path (+5 more)

### Community 56 - "StatutSinistre"
Cohesion: 0.18
Nodes (10): StatutSinistre, ACCEPTE, CLOS, CLOTURE, DECLARE, EN_COURS_D_EXPERTISE, EN_EXPERTISE, INDEMNISE (+2 more)

### Community 57 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 58 - "Utilisateur"
Cohesion: 0.33
Nodes (3): org.springframework.security.core.GrantedAuthority, Override, Utilisateur

### Community 59 - "CompagnieAssurance"
Cohesion: 0.25
Nodes (7): CompagnieAssurance, ATLANTA, AUTRE, AXA, RMA, SAHAM, WAFA

### Community 60 - "build_overleaf_report.py"
Cohesion: 0.07
Nodes (39): Paragraph, BodyElement, build(), chapter3_prefix(), chapter_wrapper(), compact_chapter3_tail(), copy_chapter3_assets(), cover_tex() (+31 more)

### Community 61 - "Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF)"
Cohesion: 0.15
Nodes (12): Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF), Authentification sous Swagger UI :, Configuration de la Base de Données, Documentation des Endpoints (Swagger UI), Exécution des Tests, Lancement de l'Application, Option A : Lancement par défaut (avec base de données PostgreSQL), Option B : Lancement en mode Développement (sans installation PostgreSQL, utilise H2 local) (+4 more)

### Community 62 - "ReportingController"
Cohesion: 0.29
Nodes (4): GetMapping, RequestMapping, RestController, ReportingController

### Community 64 - "org.springframework.http.ResponseEntity"
Cohesion: 0.13
Nodes (8): org.springframework.http.ResponseEntity, GarageAgreeController, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, DeleteMapping

### Community 65 - "JwtAuthenticationFilter.java"
Cohesion: 0.29
Nodes (7): jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletResponse, org.springframework.stereotype.Component, org.springframework.web.filter.OncePerRequestFilter, Override, Override, JwtAuthenticationFilter

### Community 66 - "ParkAutoApplication"
Cohesion: 0.53
Nodes (4): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableAsync, org.springframework.scheduling.annotation.EnableScheduling, ParkAutoApplication

### Community 67 - "SinistreController"
Cohesion: 0.22
Nodes (6): DeleteMapping, PostMapping, PutMapping, RequestMapping, RestController, SinistreController

### Community 68 - "Sha256PasswordEncoder"
Cohesion: 0.48
Nodes (3): java.security.SecureRandom, Override, Sha256PasswordEncoder

### Community 69 - "AssuranceRequest"
Cohesion: 0.18
Nodes (9): AssuranceRequest, AllArgsConstructor, Data, NoArgsConstructor, TypeGarantie, INCENDIE, TIERS, TOUS_RISQUES (+1 more)

### Community 70 - "DemandeDetailView.jsx"
Cohesion: 0.50
Nodes (3): DemandeDetailView(), fmtDateTime(), STATUS_STYLES

### Community 71 - ".getCurrentUser"
Cohesion: 0.28
Nodes (3): ChangePasswordRequest, UnauthorizedException, Override

### Community 72 - "NatureAccident"
Cohesion: 0.29
Nodes (6): NatureAccident, AUTRE, COLLISION, INCENDIE, VANDALISME, VOL

### Community 74 - "UtilisateurServiceImpl.java"
Cohesion: 0.19
Nodes (9): jakarta.servlet.http.HttpServletRequest, org.springframework.security.authentication.AuthenticationManager, org.springframework.security.crypto.password.PasswordEncoder, DuplicateResourceException, UtilisateurMapper, UtilisateurRepository, AuthServiceImpl, UtilisateurServiceImpl (+1 more)

### Community 84 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 101 - "BudgetService"
Cohesion: 0.06
Nodes (30): BudgetController, DeleteMapping, GetMapping, PostMapping, PutMapping, RestController, BudgetDirectionDto, AllArgsConstructor (+22 more)

## Knowledge Gaps
- **245 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ResourceNotFoundException` connect `org.springframework.transaction.annotation.Transactional` to `org.springframework.data.jpa.repository.Query`, `PanneService`, `VisiteTechniqueDto`, `BudgetService`, `DocumentGED`, `.getCurrentUser`, `AffectationService`, `UtilisateurServiceImpl.java`, `ReformeVehiculeDto`, `VehiculeRepository`, `Conducteur`, `AffectationService.java`, `Infraction`, `JwtService`, `MaintenanceService`, `VehiculeServiceImpl.java`, `ApiResponse`, `PleinCarburant`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `Vehicule` connect `Vehicule` to `org.springframework.data.jpa.repository.Query`, `StatutAdministratif`, `VisiteTechniqueDto`, `TaxeAutomobile`, `Sprint6MaintenancePanneSinistreTests`, `Sinistre`, `PrevisionCarburant`, `org.mapstruct.Mapping`, `ReformeVehicule`, `Assurance`, `VehiculeRepository`, `Infraction`, `AffectationService.java`, `org.springframework.data.domain.Page`, `org.springframework.data.jpa.repository.JpaRepository`, `lombok.AllArgsConstructor`, `VehiculeServiceImpl.java`, `PleinCarburant`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `NatureMaintenance` connect `NatureMaintenance` to `lombok.AllArgsConstructor`, `StatutMaintenance`, `MaintenanceService`, `Vehicule`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.springframework.data.jpa.repository.Query` be split into smaller, more focused modules?**
  _Cohesion score 0.09725490196078432 - nodes in this community are weakly interconnected._
- **Should `VisiteTechniqueDto` be split into smaller, more focused modules?**
  _Cohesion score 0.07123034227567067 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
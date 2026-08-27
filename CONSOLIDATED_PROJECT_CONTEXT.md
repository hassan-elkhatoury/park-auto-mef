# RAPPORT DE CONTEXTE HAUTE DENSITÉ — PARK AUTO MEF
**Rôle :** Senior Context Optimization Engineer
**Projet :** Système Intégré de Gestion du Parc Automobile du Ministère de l'Économie et des Finances (Park Auto MEF)
**Auteur :** EL KHATOURY Hassan (ENSA Al Hoceima / Ministère de l'Économie et des Finances)
**Encadrant Professionnel :** M. ELKAOUMI Aimad (Direction du Budget — MEF)
**Date d'Agrégation :** 27 Août 2026
**Statut :** Référentiel Consolidé de Contexte Technique, Fonctionnel et Académique (Sprints 1 à 8)

---

## SOMMAIRE EXÉCUTIF

Le présent référentiel à haute densité a été conçu et consolidé par un Senior Context Optimization Engineer afin de fournir une **source de vérité technique, méthodologique et fonctionnelle absolue** pour le projet **Park Auto MEF**.
Il réalise une synthèse exhaustive à partir de l'ensemble des sources primaires du projet :
1. Les documents de planification et de spécification des **8 sprints hebdomadaires** (Sprints 1 à 8).
2. Les rapports de revue et de livraison de chaque sprint (Sprints 2, 3, 4, 5, 6, 7, 8).
3. Le code source réel de l'application (**Spring Boot 3 / Java 17-25** en backend, **React 18 / Vite** en frontend).
4. Le schéma de base de données relationnelle (**28 entités JPA persistantes, 16 énumérations métier, scripts Liquibase, base PostgreSQL**).
5. Le catalogue des assets graphiques (**39 figures et diagrammes UML normalisés, 47 captures d'écrans réelles**).
6. L'audit comparatif rigoureux face au rapport de référence d'inspiration (*rapport_insperation.pdf*, 78 pages, modèle PFE d'État).

---

## 1. FEUILLE DE ROUTE TECHNIQUE ET CHRONOLOGIE AGRÉGÉE (SPRINTS 1 À 8)

Le développement a suivi le cadre méthodologique **Agile Scrum**, cadencé en **8 sprints hebdomadaires successifs** (durée totale : 8 semaines, du 13/07/2026 au 04/09/2026), cumulant une vélocité totale de **354 Story Points (SP)**.

| Sprint | Périmètre & Désignation | Période Prévue | Vélocité | Composants Backend Clés | Vues Frontend Réalisées |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S1** | **Initialisation Technique & Sécurité RBAC** | 13/07 - 17/07 | 34 SP | Spring Security 6, JWT, User CRUD, Audit | LoginView, ForceChangePasswordModal |
| **S2** | **Référentiel Flotte & Cycle de Vie Véhicules** | 20/07 - 24/07 | 42 SP | Vehicule, HistoriqueStatut, Soft Delete | VehiculesListView, VehiculeDetailView, VehiculeFormModal |
| **S3** | **Chauffeurs, Demandes, Affectations & OM** | 27/07 - 31/07 | 48 SP | Conducteur, Demande, Affectation, iText OM | ConducteursView, DemandesView, AffectationsView |
| **S4** | **Carburant, Cartes Pétrolières & TCO Initial** | 03/08 - 07/08 | 38 SP | CarteCarburant, PleinCarburant, Conso L/100 | CarburantView, CartesModal, PleinModal |
| **S5** | **Assurances, Sinistres, Taxes & Réforme** | 10/08 - 14/08 | 52 SP | Assurance, Sinistre, Infraction, GED, Taxe | AssurancesView, SinistresView, VisitesTaxesReformeView |
| **S6** | **Maintenance, Pannes & Garages Agréés** | 17/08 - 21/08 | 46 SP | PanneVehicule, Intervention, Pieces, Garage | MaintenanceView, PannesView, GaragesView |
| **S7** | **Contrôle Budgétaire & Tableaux de Bord** | 24/08 - 29/08 | 54 SP | ExerciceBudgetaire, Budget, ReportingService | BudgetView, DashboardView, ReportingModal |
| **S8** | **Recette UAT, Exports Massifs & Déploiement** | 31/08 - 04/09 | 40 SP | Universal Export Engine, Docker Compose, PRA | RapportsView, AuditView, ProfilView |
| **TOTAL** | **8 Sprints de Réalisation Complète** | **8 Semaines** | **354 SP** | **28 Entités / 23 Services / 22 Controllers** | **17 Vues Métier / 4 Modales Principales** |

### FICHE TECHNIQUE DÉTAILLÉE PAR SPRINT

#### SPRINT 1 : Initialisation Technique, Sécurité RBAC & Gestion des Utilisateurs
- **Période :** 13/07/2026 au 17/07/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 34 Story Points
- **Objectifs :** Mise en place du socle applicatif Spring Boot 3 / Java 17-25, sécurité stateless par jetons JWT, gestion des 7 rôles du MEF, CRUD utilisateurs et journalisation d'audit.
- **Backlog MoSCoW :**
  - *Must Have :* Authentification JWT (Access 15 min / Refresh 7 j), 7 rôles RBAC (ADMIN, GESTIONNAIRE_CENTRAL, GESTIONNAIRE_LOCAL, RESPONSABLE_FINANCIER, RESPONSABLE_SERVICE, CONDUCTEUR, CONSULTATION), Hachage SHA-256 avec sel, Statuts (ACTIVE, LOCKED, ARCHIVED).
  - *Should Have :* Forçage de changement de mot de passe à la 1ère connexion (doitChangerMotDePasse = true), traçabilité JournalAction avec IP et timestamp.
  - *Could Have :* Filtres utilisateurs par direction/service et pagination des comptes.
- **Règles de Gestion Clés :**
  - **RG01 :** Unicité stricte de l'email et du matricule administratif.
  - **RG02 :** Hachage cryptographique fort SHA-256 avec sel ou BCrypt (facteur 12).
  - **RG03 :** Forçage immédiat du changement de mot de passe temporaire dès la 1ère connexion.
  - **RG04 :** Access Token expiré = HTTP 401 déclenchant rafraîchissement silencieux via Refresh Token.
  - **RG05 :** Piste d'audit non altérable dans journal_actions pour toute écriture.
- **Validation & Tests :** Tests unitaires Mockito sur AuthService, JwtService, UtilisateurService. Validation Swagger UI.

#### SPRINT 2 : Référentiel du Parc Automobile & Cycle de Vie des Véhicules
- **Période :** 20/07/2026 au 24/07/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 42 Story Points
- **Objectifs :** Modélisation de la flotte (40+ attributs), gestion dynamique des 12 statuts administratifs et 8 états techniques, historisation automatique et recherche paginée.
- **Backlog MoSCoW :**
  - *Must Have :* CRUD Véhicule complet, 12 statuts (DISPONIBLE, AFFECTE, EN_MISSION, EN_MAINTENANCE, EN_PANNE, ACCIDENTE, EN_REPARATION, IMMOBILISE, EN_COURS_DE_REFORME, REFORME, VENDU, RESTITUE), 8 états techniques (EXCELLENT à SINISTRE_TOTAL), contrôle d'unicité VIN/Immatriculation/Inventaire.
  - *Should Have :* Table historique_statuts_vehicule, Soft delete (isDeleted = true), calcul automatique de l'âge du véhicule.
  - *Could Have :* Export de la liste en Excel, galerie photo du véhicule.
- **Règles de Gestion Clés :**
  - **RG01 :** Unicité absolue de l'immatriculation marocaine, du VIN (17 car. ISO) et du numéro d'inventaire MEF.
  - **RG02 :** Cohérence kilométrique : Kilométrage actuel >= Kilométrage initial / dernier relevé.
  - **RG03 :** Archivage logique (Soft delete) préservant l'intégrité des affectations et factures passées.
  - **RG04 :** Transition d'état automatique sur action métier.
- **Validation & Tests :** VehiculeServiceTest, validation des contraintes d'intégrité et des filtres multicritères.

#### SPRINT 3 : Conducteurs, Demandes de Déplacement, Affectations & Ordres de Mission
- **Période :** 27/07/2026 au 31/07/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 48 Story Points
- **Objectifs :** Référentiel conducteurs (permis, validité médicale), workflow d'approbation à 2 niveaux (N1 Responsable -> N2 Gestionnaire), affectation de véhicule, génération Ordre de Mission PDF iText avec QR Code, contrôle retour.
- **Backlog MoSCoW :**
  - *Must Have :* Fiche conducteur (CIN, permis A/B/C/D, validité), Workflow Demande (EN_ATTENTE_VALIDATION, VALIDEE_SERVICE, APPROUVEE_AFFECTEE, REJETEE), Affectation avec contrôle de disponibilité, Générateur PDF officiel Ordre de Mission.
  - *Should Have :* Restitution de véhicule avec saisie kilométrage et carburant retour, QR code de vérification sur l'ordre de mission.
  - *Could Have :* Notification email automatique au demandeur et au chauffeur.
- **Règles de Gestion Clés :**
  - **RG01 :** Permis de conduire valide à la date de mission et catégorie conforme au type de véhicule.
  - **RG02 :** Véhicule obligatoirement DISPONIBLE et conducteur ACTIF pour valider une affectation.
  - **RG03 :** Validation N1 préalable obligatoire avant l'affectation opérationnelle N2.
  - **RG04 :** Contrôle kilométrique retour (Km_retour >= Km_depart) et détection des sur-distances.
  - **RG05 :** Ordre de mission PDF infalsifiable avec référence unique et horodatage certifié.
- **Validation & Tests :** Tests d'intégration du workflow de réservation, génération et vérification du binaire PDF iText.

#### SPRINT 4 : Suivi Carburant, Cartes Pétrolières & Calcul du TCO Initial
- **Période :** 03/08/2026 au 07/08/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 38 Story Points
- **Objectifs :** Gestion des cartes carburant et vignettes, enregistrement des transactions de plein, algorithme de consommation moyenne L/100km, détection d'anomalies de surconsommation, TCO initial.
- **Backlog MoSCoW :**
  - *Must Have :* Référentiel cartes pétrolières (fournisseur, plafond mensuel, solde), Saisie des pleins (litres, montant TTC, station, index km), Calcul automatique Conso = (Litres / Delta_Km) * 100.
  - *Should Have :* Détection automatique des surconsommations (> moyenne constructeur + 25%), calcul TCO initial.
  - *Could Have :* Tableau comparatif des consommations par marque et modèle.
- **Règles de Gestion Clés :**
  - **RG01 :** Carte carburant ACTIVE et montant du plein compatible avec le plafond mensuel restant.
  - **RG02 :** Index kilométrique cohérent et strictement supérieur à l'index du plein précédent.
  - **RG03 :** Alerte surconsommation générée automatiquement au gestionnaire de flotte si seuil dépassé de 25%.
  - **RG04 :** Rapprochement systématique véhicule / carte carburant assignée.
- **Validation & Tests :** Tests unitaires du moteur de calcul kilométrique et des déclencheurs d'alertes.

#### SPRINT 5 : Assurances Flotte, Sinistres, Visites Techniques, Taxes & Réforme
- **Période :** 10/08/2026 au 14/08/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 52 Story Points
- **Objectifs :** Polices d'assurance flotte (AXA, RMA, Wafa), garanties, primes, alertes J-30/J-7, gestion des sinistres (constats, photos GED, franchises, indemnisation), infractions radar, visites techniques et déclassement/réforme.
- **Backlog MoSCoW :**
  - *Must Have :* Suivi des polices d'assurance avec alertes d'expiration à J-30 et J-7, Déclaration de sinistre avec attachement GED, Imputation des infractions radar au chauffeur en mission, Suivi des visites techniques (favorable, contre-visite sous 15j) et vignettes.
  - *Should Have :* Workflow de réforme de véhicule (EN_COURS_DE_REFORME, REFORME, VENDU) avec PV de commission.
  - *Could Have :* Suivi des recours contre les compagnies d'assurance adverses.
- **Règles de Gestion Clés :**
  - **RG01 :** Alerte automatique à J-30 et J-7 avant toute expiration de police d'assurance ou de visite technique.
  - **RG02 :** Police d'assurance active obligatoire à la date de survenance de tout accident déclaré.
  - **RG03 :** Rapprochement horaire de l'infraction avec l'ordre de mission pour imputation nominative du PV.
  - **RG04 :** Blocage définitif de toute affectation dès le passage d'un véhicule au statut de réforme.
- **Validation & Tests :** Tests de notification des alertes d'échéance et de stockage sécurisé GED.

#### SPRINT 6 : Maintenance Préventive & Curative, Pannes & Garages Agréés
- **Période :** 17/08/2026 au 21/08/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 46 Story Points
- **Objectifs :** Planification des entretiens préventifs (vidanges, filtres, freins) avec alertes à 90% du seuil, cycle de vie complet des pannes et réparations en atelier agréé, gestion des pièces de rechange et main d'œuvre.
- **Backlog MoSCoW :**
  - *Must Have :* Planification des révisions par seuil kilométrique, Signalement des pannes avec niveau d'urgence (BLOQUANTE, MAJEURE, MINEURE), Workflow d'intervention en garage agréé, Décomposition des coûts (pièces + main d'œuvre).
  - *Should Have :* Référentiel des garages conventionnés MEF, Bon de sortie d'atelier et calcul de la prochaine échéance d'entretien.
  - *Could Have :* Historique des pièces détachées changées par véhicule.
- **Règles de Gestion Clés :**
  - **RG01 :** Véhicule basculé immédiatement à IMMOBILISE ou EN_MAINTENANCE dès l'ouverture de réparation.
  - **RG02 :** Km de l'intervention >= Km du dernier relevé enregistré.
  - **RG03 :** Recalcul automatique de la prochaine échéance (Km_prochain = Km_actuel + 10 000 km) à la clôture.
  - **RG04 :** Validation financière obligatoire de tout devis dépassant le plafond de délégation.
- **Validation & Tests :** Suite de tests unitaires et d'intégration Sprint6MaintenancePanneSinistreTests (100% succès Surefire).

#### SPRINT 7 : Contrôle Budgétaire Analytique, Tableaux de Bord & KPIs
- **Période :** 24/08/2026 au 29/08/2026 | **Durée :** 6 jours ouvrés | **Vélocité :** 54 Story Points
- **Objectifs :** Comptabilité budgétaire analytique (exercices fiscaux, dotations par Direction MEF), chaîne d'engagements (Crédits -> Engagements -> Liquidations -> Reste), alertes budgétaires (80% / 95%), tableaux de bord décisionnels, TCO complet, coût MAD/km, exports financiers.
- **Backlog MoSCoW :**
  - *Must Have :* Lignes budgétaires par Direction et nature de dépense, Contrôle d'engagement bloquant (Reste >= Montant), Alertes visuelles à 80% (orange) et 95% (rouge), Calcul dynamique du TCO et coût MAD/km, Dashboard analytique Recharts.
  - *Should Have :* États financiers consolidés exportables en PDF (iText) et Excel (Apache POI), Taux d'immobilisation de la flotte.
  - *Could Have :* Prévisions budgétaires glissantes pour l'exercice N+1.
- **Règles de Gestion Clés :**
  - **RG01 :** Rejet strict de tout engagement de dépense si le solde disponible de la ligne budgétaire est insuffisant.
  - **RG02 :** Imputation analytique rigoureuse par nature de charge (CARBURANT, MAINTENANCE, ASSURANCE, TAXES, SINISTRES).
  - **RG03 :** Déclenchement d'alerte préventive à 80% et alerte critique avec blocage à 95% de consommation.
  - **RG04 :** Calcul du TCO = Acquisition + Somme(Carburant) + Somme(Maintenance) + Somme(Assurances) + Somme(Taxes) + Somme(Sinistres).
- **Validation & Tests :** Suite de tests d'intégration Sprint7BudgetDashboardTests (100% succès Surefire).

#### SPRINT 8 : Recette Globale UAT, Moteur d'Exports Massifs, Sécurité & Déploiement
- **Période :** 31/08/2026 au 04/09/2026 | **Durée :** 5 jours ouvrés | **Vélocité :** 40 Story Points
- **Objectifs :** Recette fonctionnelle globale UAT couvrant 100% des exigences CdC MEF, moteur d'exportation universel multi-formats (PDF officiel, Excel stylé, CSV), durcissement de la sécurité (Audit Trail, CNDP/DGSSI), optimisation des performances et conteneurisation Docker Compose.
- **Backlog MoSCoW :**
  - *Must Have :* Recette de bout en bout validée sans anomalie P1/P2, Moteur d'exportation multi-formats dans ReportingService, Conteneurisation Docker Compose complète (Frontend Nginx, Backend Spring Boot, PostgreSQL, Redis).
  - *Should Have :* Traçabilité d'audit conservée sur 5 ans, Temps de réponse des API REST < 200 ms à 95%.
  - *Could Have :* Documentation interactive Swagger OpenAPI 3.0 exportée en statique.
- **Règles de Gestion Clés :**
  - **RG01 :** 100% des scénarios de test UAT validés sans anomalie bloquante.
  - **RG02 :** Conservation intègre et non altérable des journaux d'audit.
  - **RG03 :** Respect absolu de la charte graphique et du sceau institutionnel MEF sur tous les documents générés.
- **Validation & Tests :** Campagne de recette globale UAT, validation de non-régression et qualification finale de production.

---

## 2. CHOIX D'ARCHITECTURE ET FONDEMENTS TECHNIQUES

### 2.1. Architecture Logicielle en Couches Découplées (3-Tier Clean Architecture)
Le projet Park Auto MEF applique une stricte séparation des responsabilités :
1. **Couche Présentation (Frontend React 18 / Vite SPA) :**
   - Single Page Application modulaire développée sous React 18 avec Vite pour un rechargement à chaud instantané et un bundling optimisé.
   - Interface utilisateur conforme à la charte institutionnelle MEF (Bleu marine #0B2545, Or #C7922F, Gris #F7F9FC) utilisant TailwindCSS et Lucide Icons.
   - Gestion des requêtes asynchrones via Axios avec intercepteur d'authentification automatique (injection de l'Access Token Bearer et interception HTTP 401 pour renouvellement transparent).
   - Visualisation interactive des données au moyen de Recharts et Chart.js (courbes de consommation, jauges budgétaires, graphiques en anneau).
2. **Couche Métier et Services REST (Backend Spring Boot 3.x) :**
   - Contrôleurs REST exposant des endpoints documentés sous Swagger / OpenAPI 3.0 avec validation automatique des DTOs via Bean Validation.
   - Couche de Services métier encapsulant la logique d'entreprise, les algorithmes de calcul (L/100km, TCO, dotations) et les règles métier (RG01 à RG05).
   - Mappers MapStruct générant un mapping bidirectionnel compilé ultra-performant entre entités JPA et DTOs.
   - Moteur de génération documentaire intégrant iText 7 (ordres de mission officiels et bilans PDF) et Apache POI (tableaux Excel dynamiques).
3. **Couche Persistance et Données (Spring Data JPA / PostgreSQL) :**
   - ORM Hibernate assurant la persistance des 28 entités relationnelles.
   - Repositories dérivés et requêtes JPQL optimisées avec JOIN FETCH pour éliminer le problème N+1.
   - Gestion des migrations et de l'intégrité du schéma de base de données via Liquibase.
   - Base de données PostgreSQL 15+ en environnement de production et H2 Database en mémoire pour les tests unitaires.

### 2.2. Architecture de Sécurité et Modèle RBAC
- **Authentification Stateless JWT :** Système sans état garantissant une haute scalabilité horizontale. Access Token court (15 min) et Refresh Token sécurisé (7 jours).
- **Contrôle d'Accès Basé sur les Rôles (RBAC) :** 7 rôles métier étanches avec sécurisation par annotations de sécurité.
- **Politique de Mots de Passe et Forçage :** Hachage fort SHA-256 avec sel dynamique / BCrypt (coût 12). Forçage de réinitialisation à la première connexion (doitChangerMotDePasse = true).
- **Piste d'Audit (Audit Trail) :** Journalisation systématique non modifiable de chaque opération d'écriture dans journal_actions (Utilisateur, Action, Entité, Delta JSON, IP, Timestamp).

### 2.3. Architecture de Déploiement et Haute Disponibilité
- Conteneurisation intégrale avec **Docker Compose** structurée en 4 services isolés :
  - park-auto-frontend : Serveur Nginx Alpine servant l'application React et assurant le reverse-proxy vers /api.
  - park-auto-backend : Conteneur Eclipse Temurin JDK 17 exécutant l'application Spring Boot.
  - park-auto-db : Serveur PostgreSQL 15 avec volume persistant sécurisé.
  - park-auto-cache : Conteneur Redis pour le cache des référentiels et la révocation des tokens.
- Cluster Haute Disponibilité : Réplication de base de données primaire/secondaire, Load Balancer HAProxy/Nginx, et stratégie de sauvegarde quotidienne (RPO < 1h, RTO < 30 min).

---

## 3. AUDIT COMPARATIF ET ANALYSE DES ÉCARTS STRUCTURELS
*(Cross-référencement systématique : Rapport Actuel vs Rapport d'Inspiration rapport_insperation.pdf)*

| Critère / Section | Rapport de Référence (Inspiration PFE - 78 p.) | Draft Actuel du Projet (v2 - ~45 p.) | Diagnostic & Plan d'Action Correctif |
| :--- | :--- | :--- | :--- |
| **Philosophie Chapitre 2** | *Analyse et Spécification Fonctionnelle* : Analyse des besoins métier, acteurs, et modélisation UML complète (Use Cases, Classes, Séquences par module). | *Fondements méthodologiques et techniques* : Cours théorique générique de génie logiciel (Monolithe vs Microservices, Agile vs Cycle V, ORM, SDLC). | **Gap 1 (Majeur)** : Transformer le Chapitre 2 en véritable Analyse Fonctionnelle et Modélisation UML du projet pour aligner le rapport sur le standard PFE. |
| **Philosophie Chapitre 3** | *Environnement et Outils de Travail* : Architecture logicielle 3-tiers, Stack technique, Frameworks, Base de données, Outils agiles, CI/CD. | *Architecture, conception et réalisation* : Méga-chapitre surchargé fusionnant stack, UML et écrans de 5 modules. Sprints 6, 7 et 8 écrasés. | **Gap 2 (Majeur)** : Restreindre le Chapitre 3 au Socle Technique & Environnement, et basculer l'intégralité de la Réalisation dans le Chapitre 4. |
| **Philosophie Chapitre 4** | *Réalisation et Mise en Œuvre* : Implémentation détaillée des 8 modules avec captures réelles, formulaires, règles métier, cas de tests et validation. | *Recette, sécurité avancée et déploiement* : Chapitre squelettique (~4 pages), sous-développé, contenant des résidus de titres déplacés. | **Gap 3 (Majeur)** : Développer un Chapitre 4 dense présentant les interfaces réelles des 8 modules, les scénarios de test et la qualification. |
| **Couverture Sprints 6, 7, 8** | Traitement exhaustif de tous les modules livrés jusqu'à la clôture. | Sprints 6 (Pannes/Garages), 7 (Budget analytique/TCO) et 8 (Exports universels/UAT) sous-représentés. | **Gap 4** : Insérer des sections dédiées aux modules Pannes, Contrôle Budgétaire et Moteur d'Exports dans les chapitres 2 et 4. |
| **Richesse des Tableaux** | Tableaux de l'équipe projet, matrice MoSCoW, fiches cas d'utilisation, campagnes de tests. | Manque de tableaux de synthèse structurés dans le corps du texte. | **Gap 5** : Ajouter le tableau de l'équipe projet (Tableau 2), la matrice MoSCoW et le dictionnaire condensé du MPD. |

---

## 4. CATALOGUE CONSOLIDÉ DES ASSETS DU PROJET

### 4.1. Référentiel des 39 Diagrammes UML et Schémas Graphiques

| N° Figure | Titre Officiel du Schéma / Diagramme | Nature du Visuel | Emplacement / Source Asset |
| :--- | :--- | :--- | :--- |
| **Figure 1** | Logo officiel du Ministère de l'Économie et des Finances | Logo institutionnel | park-auto-frontend/public/assets/royaume_logo.png |
| **Figure 2** | Coordonnées et localisation du Ministère | Visuel informatif | assets/all_extracted_screenshots/Rapport_PFA_Gestion_Parc_Automobile_img2.png |
| **Figure 3** | Organigramme structurel du Ministère de l'Économie et des Finances | Schéma institutionnel | assets/all_extracted_screenshots/Rapport_PFA_Gestion_Parc_Automobile_img3.png |
| **Figure 4** | Cycle de vie d'un sprint et processus Scrum | Schéma méthodologique | assets/all_extracted_screenshots/Rapport_PFA_Gestion_Parc_Automobile_img5.png |
| **Figure 5** | Planning Gantt et découpage WBS des 8 sprints | Diagramme de planification | planning/Planning_Sprint_8_Finalisation_Recette_Et_Livraison_Finale.pdf |
| **Figure 6** | Architecture globale applicative 3-Tiers | Schéma d'architecture | assets/Figure_37_Architecture_Haute_Disponibilite_Cluster_Sprint7.png |
| **Figure 7** | Flux d'authentification stateless JWT (Access/Refresh Tokens) | Séquence UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 15A) |
| **Figure 8** | Modèle de classes des habilitations et sécurité RBAC | Classes UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 14) |
| **Figure 9** | Cas d'utilisation de la sécurité et de la gestion des utilisateurs | Use Case UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 13) |
| **Figure 10** | Interface de connexion et modal de changement obligatoire de mot de passe | Capture d'écran | tmp_final_render/page-01.png |
| **Figure 11** | Cas d'utilisation de la gestion du parc automobile | Use Case UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 16) |
| **Figure 12** | Modèle statique de classes du module Véhicules | Classes UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 17) |
| **Figure 13** | Séquence d'enregistrement et de qualification d'un véhicule | Séquence UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 18) |
| **Figure 14** | Diagramme d'états-transitions du cycle de vie d'un véhicule | États-Transitions UML | assets/all_extracted_screenshots/Sprint_2_Gestion_des_Vehicules_img6.png |
| **Figure 15** | Interface de consultation du parc et fiche détaillée véhicule | Capture d'écran | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 19) |
| **Figure 16** | Cas d'utilisation Conducteurs, Demandes et Affectations | Use Case UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 20) |
| **Figure 17** | Modèle de classes Conducteurs, Demandes et Affectations | Classes UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 21) |
| **Figure 18** | Séquence de réservation et d'affectation opérationnelle | Séquence UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 22) |
| **Figure 19** | Interface de suivi des demandes de déplacement | Capture d'écran | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 23) |
| **Figure 20** | Spécimen officiel d'Ordre de Mission PDF sécurisé par QR Code | Document PDF iText | assets/all_extracted_screenshots/Sprint_3_Gestion_des_Affectations_et_Conducteurs_img3.png |
| **Figure 21** | Cas d'utilisation Carburant et Cartes Pétrolières | Use Case UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 24) |
| **Figure 22** | Modèle de classes Carburant et Cartes Pétrolières | Classes UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 25) |
| **Figure 23** | Séquence de saisie d'un plein et contrôle kilométrique | Séquence UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 26) |
| **Figure 24** | Interface de suivi des consommations et alertes surconsommation | Capture d'écran | assets/all_extracted_screenshots/Rapport_Sprint_5_Assurances_Sinistres_Budget_Securite_img2.png |
| **Figure 25** | Cas d'utilisation Assurances, Sinistres, Taxes et Réforme | Use Case UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 27) |
| **Figure 26** | Modèle de classes Assurances, Sinistres, Taxes et Réforme | Classes UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 28) |
| **Figure 27** | Séquence de déclaration et d'instruction d'un sinistre | Séquence UML | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 29) |
| **Figure 28** | Interface de gestion des polices d'assurance et dossiers sinistres | Capture d'écran | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 30/31) |
| **Figure 29** | Cas d'utilisation Maintenance Préventive, Pannes et Garages Agréés | Use Case UML | assets/Figure_30_Diagramme_Cas_Utilisation_Sprint6.png |
| **Figure 30** | Modèle de classes des interventions de maintenance et pièces détachées | Classes UML | assets/Figure_31_Diagramme_Classes_Sprint6.png |
| **Figure 31** | Séquence de traitement d'une panne en atelier de réparation agréé | Séquence UML | assets/Figure_32_Diagramme_Sequence_Sprint6.png |
| **Figure 32** | Interface de suivi des réparations curatives et garages agréés | Capture d'écran | tmp_final_render/ch3-26.png |
| **Figure 33** | Cas d'utilisation du Contrôle Budgétaire et Tableaux de Bord MEF | Use Case UML | rapports/diagrams_sprint7/diagramme_use_case_sprint7.png |
| **Figure 34** | Modèle de classes de la comptabilité budgétaire analytique | Classes UML | rapports/diagrams_sprint7/diagramme_classes_sprint7.png |
| **Figure 35** | Séquence de validation d'un engagement budgétaire et contrôle de solde | Séquence UML | rapports/diagrams_sprint7/diagramme_sequence_engagement_sprint7.png |
| **Figure 36** | Séquence de consolidation du TCO et reporting financier | Séquence UML | rapports/diagrams_sprint7/diagramme_sequence_tco_reporting_sprint7.png |
| **Figure 37** | Diagramme d'activité du cycle de dépense budgétaire MEF | Activité UML | rapports/diagrams_sprint7/diagramme_activite_cycle_budgetaire_sprint7.png |
| **Figure 38** | Tableau de bord décisionnel budgétaire et suivi du TCO | Capture d'écran | rapports/Prompts_Detailles_Assets_Chapitre_3.md (Fig 32) |
| **Figure 39** | Architecture de Déploiement Haute Disponibilité et Cluster Docker | Schéma d'infrastructure | assets/Figure_37_Architecture_Haute_Disponibilite_Cluster_Sprint7.png |

### 4.2. Dictionnaire du Schéma de Données (MPD - 28 Entités JPA)
1. utilisateurs : Identifiants agents, email, matricule, mot de passe haché SHA-256, statut, indicateur première connexion.
2. roles : Définition des 7 rôles applicatifs du MEF.
3. utilisateurs_roles : Association N-N entre utilisateurs et rôles.
4. journal_actions : Piste d'audit immuable (Username, Module, Action, Delta JSON, IP, Date).
5. audit_logs : Journal des alertes de sécurité et événements critiques.
6. vehicules : Données de la flotte (Immatriculation, VIN, inventaire, marque, modèle, statuts, kilométrage).
7. historique_statuts_vehicule : Traçabilité des mutations d'états administratifs et techniques.
8. conducteurs : Fiche chauffeur (Matricule, CIN, permis, visite médicale, statut).
9. demandes_deplacement : Demandes de mission avec workflow d'approbation N1/N2.
10. affectations : Missions effectives liant véhicule, chauffeur, relevés kilométriques départ/retour.
11. ordres_mission : Métadonnées de l'ordre de mission PDF certifié par QR code.
12. cartes_carburant : Cartes pétrolières, numéro masqué, plafonds mensuels et soldes.
13. pleins_carburant : Transactions carburant, litrage, prix, calcul L/100km et anomalie.
14. previsions_carburant : Modèles prédictifs d'allocation énergétique par direction.
15. assurances : Contrats de flotte (AXA, RMA, Wafa), garanties, primes, alertes J-30/J-7.
16. sinistres : Déclarations d'accidents, dommages, franchise, indemnisation, statut.
17. infractions : Procès-verbaux radar rattachés nominativement aux chauffeurs en mission.
18. visites_techniques : Contrôles périodiques en centre agréé, PV et contre-visites.
19. taxes_automobiles : Vignettes et taxes annuelles avec suivi d'acquittement.
20. reformes_vehicule : Procédure de déclassement et de sortie d'inventaire ministériel.
21. documents_ged : Gestion électronique des pièces jointes (constats, PV, factures).
22. pannes_vehicule : Déclarations d'avaries mécaniques avec niveau d'urgence.
23. interventions_maintenance : Entretiens préventifs et réparations curatives en atelier.
24. pieces_remplacement : Pièces détachées neuves installées lors des réparations.
25. garages_agrees : Référentiel des prestataires automobiles conventionnés MEF.
26. exercices_budgetaires : Exercices budgétaires annuels (2026, etc.) et crédits votés.
27. budgets_direction : Lignes budgétaires par Direction MEF et par nature de dépense.
28. engagements_budgetaires : Chaîne d'exécution des dépenses avec contrôle de crédit disponible.

### 4.3. Catalogue des 17 Vues et Composants Frontend React
LoginView, ForceChangePasswordModal, Sidebar, Navbar, DashboardView, VehiculesListView, VehiculeDetailView, ConducteursView, ConducteurDetailView, DemandesView, DemandeDetailView, AffectationsView, CarburantView, MaintenanceView, PannesView, GaragesView, SinistresView, VisitesTaxesReformeView, BudgetView, RapportsView, AuditView, UtilisateursView.

---

## 5. PLAN D'ACTION ET RECOMMANDATIONS POUR LA RÉDACTION FINALE
1. **Restructurer en 4 chapitres académiques rigoureux :**
   - *Chapitre 1 :* Contexte Général, Organisme d'Accueil (MEF) & Méthodologie Scrum (Tableau de l'équipe projet + Planning Gantt des 8 sprints).
   - *Chapitre 2 :* Analyse Fonctionnelle, Spécification des Besoins & Modélisation UML Métier (Use Cases, Classes, Séquences par module).
   - *Chapitre 3 :* Socle Technologique, Architecture Système & Environnement de Développement (Spring Boot 3, React 18, Sécurité JWT, DevOps CI/CD).
   - *Chapitre 4 :* Réalisation Applicative, Interfaces Utilisateur, Qualification & Déploiement (Captures d'écrans des 8 modules, tests Surefire et conteneurs Docker).
2. **Mettre en valeur les Sprints 6, 7 et 8 :**
   - Consacrer des sous-sections entières à la gestion des pannes (Sprint 6), à la comptabilité budgétaire et au TCO (Sprint 7), et au moteur d'exportation universel (Sprint 8).
3. **Appliquer les scripts de finalisation :**
   - Exécuter scripts/finalize_main_report.py pour un alignement typographique irréprochable des tableaux et figures dans le document Word.
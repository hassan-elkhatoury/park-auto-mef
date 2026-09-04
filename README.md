# 🇲🇦 PARK AUTO MEF — Système Intégré de Gestion du Parc Automobile
### Ministère de l'Économie et des Finances (MEF) — Direction du Budget — Royaume du Maroc
### Projet de Fin d'Année (PFA) — Filière Génie Informatique — ENSA Al Hoceima (UAE)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Recette UAT](https://img.shields.io/badge/Recette%20UAT-160%2F160%20Validés%20(100%25)-emerald?logo=checkmarx&logoColor=white)](https://github.com/hassan-elkhatoury/park-auto-mef)
[![Conformité DGSSI](https://img.shields.io/badge/Sécurité-Conforme%20DGSSI%20%2F%20DNSSI-0A1E3F?logo=shield&logoColor=gold)](https://www.dgssi.gov.ma/)

---

## 🎓 Cadre Académique & Institutionnel

* **Projet** : Projet de Fin d'Année (PFA) — Diplôme d'Ingénieur d'État
* **Filière** : Génie Informatique
* **Établissement** : École Nationale des Sciences Appliquées d'Al Hoceima (ENSAH) — Université Abdelmalek Essaâdi
* **Auteur** : **Hassan EL KHATOURY** ([hassanelkhatoury@gmail.com](mailto:hassanelkhatoury@gmail.com))
* **Encadrant Professionnel** : **M. Aimad ELKAOUMI** (Direction du Budget — Ministère de l'Économie et des Finances)
* **Organisme d'Accueil** : Ministère de l'Économie et des Finances (MEF), Rabat, Royaume du Maroc
* **Année Universitaire** : 2026 / 2027
* **Dépôt Officiel** : [https://github.com/hassan-elkhatoury/park-auto-mef](https://github.com/hassan-elkhatoury/park-auto-mef)

---

## 🏛️ Présentation du Projet

**PARK AUTO MEF** est une solution logicielle d'entreprise fullstack conçue pour moderniser, centraliser et sécuriser l'intégralité du cycle de vie de la flotte automobile du **Ministère de l'Économie et des Finances du Royaume du Maroc**.

Conformément aux directives de la **DGSSI** (Direction Générale de la Sécurité des Systèmes d'Information) et aux exigences du Cahier des Charges de la Direction du Budget, la plateforme substitue aux processus papier et fichiers tableurs dispersés une application web intégrée, ergonomique, réactive et auditable.

Elle pilote le référentiel des véhicules de l'État, les conducteurs agréés, le workflow dématérialisé d'approbation des missions à deux niveaux (N1/N2), la consommation de carburant, la maintenance préventive/curative, les sinistres et assurances, ainsi que le contrôle budgétaire analytique et le Coût Global de Possession (**TCO - Total Cost of Ownership**).

---

## 🌟 Fonctionnalités & Modules Métier

| Module Métier | Périmètre Fonctionnel & Règles de Gestion |
| :--- | :--- |
| 🚗 **Référentiel Flotte Automobile** | Fiche technique détaillée (40+ paramètres), statuts opérationnels normalisés, gestion des affectations permanentes & temporaires, historique des kilométrages. |
| 📋 **Missions & Déplacements** | Circuit de validation à double niveau : N1 (Chef de Service) et N2 (Gestionnaire du Parc). Génération automatique des **Ordres de Mission officiels en PDF avec QR Code cryptographique** de vérification et contrôle de restitution contradictoire. |
| ⛽ **Carburant & Cartes Pétrolières** | Suivi des cartes, saisie des pleins, calcul automatique des moyennes (L/100km). Détection d'anomalies (**Règle RG05** : alerte automatique en cas de surconsommation > +25% par rapport à la moyenne du modèle). |
| 🔧 **Maintenance, Pannes & OR** | Maintenance préventive avec seuils d'anticipation à 90%, gestion des pannes curatives avec prise en charge du remorquage, émission des Ordres de Réparation (OR) et suivi des garages partenaires agréés. |
| 💥 **Assurances, Sinistres & GED** | Polices d'assurance flotte tous risques, déclaration et suivi des sinistres, bascule immédiate en statut `ACCIDENTÉ` (**Règle RG01**), téléversement et archivage électronique sécurisé des pièces justificatives (GED). |
| ⚖️ **Contrôle Technique, Taxes & Réforme** | Suivi des vignettes, alertes d'expiration des visites techniques, déclenchement d'OR sous 15 jours en cas de contre-visite (**Règle RG03**), et workflow irréversible de réforme sur PV de Commission (**Règle RG04**). |
| 📊 **Contrôle Budgétaire & Monitoring TCO** | Gestion des exercices budgétaires, dotations par direction, engagements et liquidations. Seuils d'alerte automatique à 80% et 95%. Calcul analytique du TCO global et unitaire (MAD/km). |
| 🛡️ **Journal d'Audit & Sécurité DGSSI** | Registre immuable de toutes les actions d'écriture (INSERT, UPDATE, DELETE, LOGIN) consignant l'horodatage, l'opérateur, le module, l'adresse IP et les valeurs avant/après. Affichage continu responsive. |

---

## 🏗️ Architecture Technique (Clean 3-Tier)

```text
               ┌────────────────────────────────────────────────────────┐
               │              Navigateur Client (Desktop / Mobile)      │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTPS / WSS
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │          Reverse Proxy Nginx (Port 3000 / 80)           │
               │   • En-têtes de sécurité HSTS, CSP, X-Frame-Options    │
               │   • Compression Gzip & Cache statique                  │
               └─────────────┬────────────────────────────┬─────────────┘
                             │                            │
                     /assets │                            │ /api/*
                             ▼                            ▼
              ┌──────────────────────────────┐   ┌──────────────────────────────┐
              │    Frontend Single Page App  │   │    Backend REST API (8080)   │
              │  • React 19 / JSX / Vite     │   │  • Spring Boot 3.3.0         │
              │  • Tailwind CSS 4            │   │  • Spring Security 6 (JWT)   │
              │  • Recharts & Lucide         │   │  • Scope-Based Access (SBAC) │
              │  • Architecture par vue      │   │  • OpenPDF & ZXing Engines   │
              └──────────────────────────────┘   └──────────────┬───────────────┘
                                                                │
                                              JPA / Hibernate   │ JDBC Pool HikariCP
                                                                ▼
                                                 ┌──────────────────────────────┐
                                                 │   PostgreSQL 16 (Port 5432)  │
                                                 │   • 28 Tables relationnelles │
                                                 │   • AuditLog immuable        │
                                                 │   • Sauvegardes automatisées │
                                                 └──────────────────────────────┘
```

---

## 📂 Structure du Répertoire

```text
park-auto-mef/
├── park-auto-mef/                  # ⚙️ Backend Spring Boot 3
│   ├── src/main/java/com/mef/parkauto/
│   │   ├── config/                 # Sécurité WebSecurity, JWT, CORS, Swagger OpenAPI
│   │   ├── controller/             # Endpoints REST API (Vehicule, Mission, Budget, Audit...)
│   │   ├── dto/                    # Objets de transfert de données et requêtes validées
│   │   ├── entity/                 # Entités JPA / Hibernate mappées sur PostgreSQL (28 entités)
│   │   ├── exception/              # Gestionnaire global des erreurs et codes d'erreur
│   │   ├── repository/             # Interfaces Spring Data JPA avec requêtes optimisées
│   │   ├── security/               # Filtre JWT, UserDetailsService, RBAC / SBAC
│   │   └── service/                # Couche Métier (Règles RG01-RG05, TCO, PDF, Alertes)
│   ├── src/main/resources/         # application.properties (profils dev / prod), schema SQL
│   ├── src/test/java/              # Suites de tests automatisés (Unitaires, Intégration, UAT)
│   ├── Dockerfile                  # Image conteneurisée multi-stage Eclipse Temurin Java 17
│   └── pom.xml                     # Dépendances Maven officielles
│
├── park-auto-frontend/             # 💻 Frontend React 19 & Tailwind CSS
│   ├── src/
│   │   ├── components/             # Vues complètes (Vehicules, Demandes, Budget, Audit...)
│   │   ├── services/               # Clients API Axios configurés avec intercepteurs JWT
│   │   ├── context/                # Contextes React globaux (Authentification, Thème)
│   │   └── styles/                 # Feuilles de style Tailwind et charte graphique MEF
│   ├── public/assets/              # Blasons officiels du Royaume, logos du Ministère
│   ├── Dockerfile                  # Image Nginx Alpine pour production
│   ├── nginx.conf                  # Configuration Nginx avec reverse proxy et headers sécurisés
│   └── package.json                # Dépendances Node, Vite et scripts de build
│
├── docker-compose.yml              # 🐳 Orchestration 3 conteneurs (Frontend, Backend, SGBD)
├── .env.example                    # 🔐 Gabarit des variables d'environnement
├── Rapport_PFA_Gestion_Parc_Automobile.docx # 📘 Mémoire officiel du projet de fin d'année
└── README.md                       # 📖 Documentation de référence du projet
```

---

## ⚡ Guide d'Installation & Déploiement

### Prérequis Système
* **Java Development Kit (JDK)** : Version 17 LTS ou supérieure
* **Node.js** : Version 18 LTS ou supérieure avec **npm**
* **PostgreSQL** : Version 15 ou 16
* **Docker & Docker Compose** *(pour le déploiement conteneurisé)*

---

### Méthode 1 : Déploiement Conteneurisé via Docker Compose (Recommandé)

1. **Cloner le dépôt officiel** :
   ```bash
   git clone https://github.com/hassan-elkhatoury/park-auto-mef.git
   cd park-auto-mef
   ```

2. **Générer le fichier d'environnement** :
   ```bash
   cp .env.example .env
   ```

3. **Lancer les conteneurs (Build & Démarrage en tâche de fond)** :
   ```bash
   docker compose up -d --build
   ```

4. **Vérifier l'état de santé des services** :
   ```bash
   docker compose ps
   ```

5. **Accéder à l'application** :
   * **Portail Web Utilisateur** : [http://localhost:3000](http://localhost:3000)
   * **API REST Backend** : [http://localhost:8080/api](http://localhost:8080/api)
   * **Console Swagger OpenAPI** : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Méthode 2 : Lancement en Environnement Local de Développement

#### 1. Configuration de la base de données PostgreSQL
Créer une base de données dédiée sous PostgreSQL :
```sql
CREATE DATABASE park_auto_db;
```

#### 2. Démarrage de l'API Backend (Spring Boot)
```bash
cd park-auto-mef
mvn clean compile
mvn spring-boot:run
```
> Le serveur démarre sur le port `8080`. Les tables et le jeu de données d'initialisation (profils, véhicules de test, exercices) sont insérés automatiquement.

#### 3. Démarrage de l'Interface Utilisateur (React)
```bash
cd ../park-auto-frontend
npm install
npm run dev
```
> L'interface web est immédiatement disponible sur [http://localhost:3000](http://localhost:3000).

---

## 👥 Profils d'Accès & Matrice des Habilitations (RBAC)

Le système initialise automatiquement des comptes de démonstration pour chaque profil prévu par la gouvernance du Ministère :

| Rôle Système | Identifiant (Email) | Mot de passe | Périmètre & Habilitations |
| :--- | :--- | :--- | :--- |
| **Administrateur Système** | `admin@mef.gov.ma` | `admin123` | Gestion globale des utilisateurs, habilitations, journal d'audit immuable et configurations de sécurité. |
| **Gestionnaire Central** | `gestionnaire.central@mef.gov.ma` | `admin123` | Pilotage complet de la flotte, validation N2 des missions, ordonnancement des réparations et réformes. |
| **Responsable Financier** | `responsable.financier@mef.gov.ma` | `admin123` | Gestion des dotations budgétaires par Direction, suivi des engagements/liquidations et monitoring du TCO. |
| **Responsable de Service** | `responsable.service@mef.gov.ma` | `admin123` | Validation N1 d'opportunité des demandes d'ordre de mission formulées par les agents de son entité. |
| **Conducteur / Chauffeur** | `conducteur@mef.gov.ma` | `admin123` | Consultation de ses missions assignées, saisie des pleins de carburant et signalement d'incidents / pannes. |

---

## 🔒 Sécurité & Conformité Réglementaire

* **Sécurité Stateless JWT** : Access Token (validité 24 heures) et Refresh Token (validité 4 heures) avec révocation instantanée lors de la déconnexion (`TokenRevocationService`).
* **Hachage Cryptographique des Mots de Passe** : Algorithme **SHA-256** avec salage aléatoire individuel (16 octets) par utilisateur (`Sha256PasswordEncoder`).
* **Contrôle d'Accès par Périmètre (SBAC)** : Cloisonnement strict des données garantissant qu'une Direction ministérielle n'accède qu'à ses propres budgets et demandes.
* **Intégrité Cryptographique des Ordres de Mission** : Génération de QR Codes contenant un condensat d'intégrité permettant la vérification sur le terrain par les services de contrôle routier.
* **Auditabilité Intégrale** : Horodatage précis, conservation de l'IP source et archivage des valeurs avant/après pour toute opération critique.

---

## 🧪 Qualification & Recette Fonctionnelle (UAT)

Le projet a fait l'objet d'une campagne de qualification complète structurée en 8 sprints Scrum, totalisant **160 cas de tests d'acceptation utilisateur (UAT)** validés avec un taux de réussite de **100%** :

* **Sprint 1** : Sécurité, Authentification JWT, Gestion des Utilisateurs & Audit (15 cas de test) — *Validé*
* **Sprint 2** : Inventaire du Parc Automobile & Gestion des Véhicules (20 cas de test) — *Validé*
* **Sprint 3** : Conducteurs, Demandes & Workflow des Ordres de Mission PDF (25 cas de test) — *Validé*
* **Sprint 4** : Gestion du Carburant, Cartes Pétrolières & Détection d'Anomalies (20 cas de test) — *Validé*
* **Sprint 5** : Maintenance, Ordres de Réparation & Garages Partenaires (20 cas de test) — *Validé*
* **Sprint 6** : Assurances Flotte, Sinistres, Contrôle Technique & Réforme (25 cas de test) — *Validé*
* **Sprint 7** : Suivi Budgétaire Analytique, Calcul du TCO & Tableaux de Bord (20 cas de test) — *Validé*
* **Sprint 8** : Recette Globale UAT, Moteur d'Exports & Déploiement Docker (15 cas de test) — *Validé*

---

## 📄 Propriété & Licence

Ce projet est réalisé dans le cadre du **Projet de Fin d'Année (PFA)** pour le **Ministère de l'Économie et des Finances du Royaume du Maroc**.  
Tous droits réservés © 2026 — Direction du Budget / ENSAH.

# 🇲🇦 PARK AUTO MEF — Système Intégré de Gestion du Parc Automobile
### Ministère de l'Économie et des Finances — Royaume du Maroc

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.x-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Conformité DGSSI](https://img.shields.io/badge/Sécurité-Conforme%20DGSSI-0A1E3F?logo=shield&logoColor=gold)](https://www.dgssi.gov.ma/)

---

## 🏛️ Présentation du Projet

**PARK AUTO MEF** est la plateforme numérique officielle dédiée à la gestion, au pilotage opérationnel, au suivi financier et à la traçabilité intégrale du parc automobile du **Ministère de l'Économie et des Finances (MEF) du Royaume du Maroc**.

Conçue selon les standards les plus stricts de gouvernance publique et de sécurité de l'information (directives **DGSSI** et **ISO/IEC 27001**), l'application centralise l'ensemble du cycle de vie des véhicules de l'État, des dotations en carburant, de la maintenance, des missions, des sinistres et des engagements budgétaires.

---

## 📁 Structure du Répertoire

Le projet est structuré sous forme de monorepo épuré et modulaire :

```text
park-auto-mef/
├── park-auto-mef/            # ⚙️ Backend Spring Boot 3 (API REST, Métier, Sécurité JWT)
│   ├── src/main/java/        # Code source Java (Contrôleurs, Services, Entités, Sécurité)
│   ├── src/main/resources/   # Configurations (application-prod, application-dev)
│   ├── src/test/             # Suites de tests automatisés (UAT, Recette, Audit CdC)
│   ├── Dockerfile            # Image Docker du backend
│   └── pom.xml               # Descripteur de dépendances Maven
│
├── park-auto-frontend/       # 💻 Frontend React 19 (Portail web institutionnel)
│   ├── src/                  # Composants React, Vues métiers, Services API
│   ├── public/assets/        # Logos officiels MEF, blasons royaux, iconographie
│   ├── Dockerfile            # Image Docker du frontend
│   ├── nginx.conf            # Configuration Nginx pour le déploiement
│   └── package.json          # Dépendances Node / React / Tailwind
│
├── docker-compose.yml        # 🐳 Orchestration multi-conteneurs (App + Frontend + PostgreSQL)
├── .env.example              # 🔐 Gabarit des variables d'environnement
├── .gitignore                # 🛡️ Règles d'exclusion Git
└── README.md                 # 📖 Documentation officielle
```

---

## 🚀 Périmètres & Modules Métiers Couverts

| Module | Fonctionnalités Clés |
| :--- | :--- |
| 🚗 **Gestion du Parc Automobile** | Inventaire, affectations temporaires & permanentes, vignettes/taxes, visites techniques, commissions de réforme. |
| 📋 **Missions & Déplacements** | Workflow de demande de déplacement, validation hiérarchique N1/N2, génération d'Ordres de Mission officiels avec **QR Code cryptographique (CdC §9)**. |
| ⛽ **Gestion du Carburant** | Cartes carburant, enregistrement des pleins, calcul des consommations moyennes réelles, détection automatique des surconsommations (**Règle RG05** : seuil +25%). |
| 🔧 **Maintenance & Dépannage** | Interventions préventives et curatives, déclarations de pannes, gestion des garages partenaires agréés et pièces de rechange. |
| 💥 **Sinistres & Assurances** | Déclarations de sinistres, constats amiables, suivi des expertises et règlements, gestion des polices d'assurance flotte tous risques. |
| 🏛️ **Pilotage Budgétaire (TCO)** | Exercices budgétaires annuels, engagements et liquidations de dépenses, calcul automatique du coût total de possession (**TCO**). |
| 🛡️ **Audit & Traçabilité (DGSSI)** | Registre immuable de toutes les écritures avec horodatage, identité de l'opérateur, adresse IP source et snapshot des valeurs modifiées. |

---

## ⚡ Démarrage Rapide

### Prérequis
- **Java 17 LTS** ou supérieur
- **Node.js 18+** & **npm**
- **PostgreSQL 15+** (ou Docker)
- **Docker & Docker Compose** *(optionnel mais recommandé)*

---

### Option 1 : Déploiement via Docker Compose (Recommandé)

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-compte/park-auto-mef.git
   cd park-auto-mef
   ```

2. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env
   ```

3. **Lancer l'ensemble des services** :
   ```bash
   docker-compose up -d --build
   ```

4. **Accéder aux applications** :
   - **Portail Web MEF** : [http://localhost:3000](http://localhost:3000)
   - **API Backend REST** : [http://localhost:8080/api](http://localhost:8080/api)
   - **Documentation OpenAPI Swagger** : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Option 2 : Exécution Locale (Développement)

#### 1. Démarrer la base de données PostgreSQL
Créer une base `park_auto_db` :
```sql
CREATE DATABASE park_auto_db;
```

#### 2. Démarrer le Backend Spring Boot
```bash
cd park-auto-mef
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```
> Le backend s'exécute sur le port `8080`.

#### 3. Démarrer le Frontend React
```bash
cd ../park-auto-frontend
npm install
npm run dev
```
> Le portail s'exécute sur [http://localhost:3000](http://localhost:3000).

---

## 👥 Profils & Comptes de Démonstration

L'application initialise automatiquement des profils d'accès conformes à la séparation des pouvoirs :

| Rôle | Identifiant / Email | Mot de passe | Périmètre d'action |
| :--- | :--- | :--- | :--- |
| **Administrateur Système** | `admin@mef.gov.ma` | `admin123` | Accès global, gestion des utilisateurs, audit complet |
| **Gestionnaire Central** | `gestionnaire.central@mef.gov.ma` | `admin123` | Pilotage global du parc, affectations, réformes |
| **Responsable Financier** | `responsable.financier@mef.gov.ma` | `admin123` | Budgets, engagements, assurances, carburant |
| **Responsable de Service** | `responsable.service@mef.gov.ma` | `admin123` | Validation N1 des demandes de déplacement |
| **Conducteur** | `conducteur@mef.gov.ma` | `admin123` | Déclaration de pannes, saisie de pleins, suivi missions |

---

## 🔒 Sécurité & Conformité

- **Authentification Stateless** via JWT (JSON Web Tokens) avec révocation active (`TokenRevocationService`).
- **Chiffrement fort** des mots de passe avec BCrypt (coût 12).
- **Politique de complexité DGSSI** : Minimum 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux.
- **Journalisation légale immuable** (`JournalAction`) conforme aux exigences d'auditabilité des systèmes d'information de l'État.
- **Protection CORS stricte** et en-têtes de sécurité HTTP (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options).

---

## 📄 Licence

Ce projet est la propriété exclusive du **Ministère de l'Économie et des Finances — Royaume du Maroc**. Tous droits réservés.

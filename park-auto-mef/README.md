# Application de Gestion du Parc Automobile — Ministère de l'Économie et des Finances (MEF)

Ce projet est l'application de gestion administrative, technique, opérationnelle et financière du parc automobile du Ministère de l'Économie et des Finances (MEF).

## Sprint 1 — Initialisation Technique

Ce premier sprint met en place les fondations techniques du projet :
- Architecture modulaire en couches (Controller, Service, Repository, Entity, DTO, Mapper, Audit, Security)
- Configuration de la base de données PostgreSQL
- Sécurité stateless par jetons JWT (Authentification, Génération, Validation, Token Refresh)
- CRUD complet des Utilisateurs avec validation, pagination et historisation générique des actions
- Gestion des Rôles (7 rôles métiers définis dans le cahier des charges)

---

## Prérequis

- **Java Development Kit (JDK)** : Version 17 ou supérieure (Testé et validé sous JDK 25)
- **Apache Maven** : Version 3.8+ ou supérieure
- **PostgreSQL** : Version 12 ou supérieure

---

## Configuration de la Base de Données

1. Démarrez votre serveur PostgreSQL.
2. Créez une base de données vide nommée `park_auto_mef` :
   ```sql
   CREATE DATABASE park_auto_mef;
   ```
3. Par défaut, l'application se connecte sur `localhost:5432` avec les identifiants `postgres` / `postgres`. Vous pouvez modifier ces valeurs via des variables d'environnement (voir ci-dessous).

---

## Variables d'Environnement (Secrets & Configuration)

Les secrets et paramètres de connexion de l'application sont externalisés de façon sécurisée et peuvent être configurés via les variables d'environnement suivantes :

| Variable d'Environnement | Description | Valeur par Défaut |
|-------------------------|-------------|-------------------|
| `DB_USERNAME` | Nom d'utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT (min. 256 bits) | Clé de développement |
| `ADMIN_EMAIL` | Adresse email du compte administrateur initial | `admin@mef.gov.ma` |
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur initial | `Admin@2026` |

---

## Lancement de l'Application

Depuis le répertoire racine du projet `park-auto-mef`, vous pouvez lancer l'application de deux façons :

### Option A : Lancement par défaut (avec base de données PostgreSQL)
Assurez-vous que PostgreSQL est démarré et qu'une base de données nommée `park_auto_mef` a été créée, puis lancez :
```bash
mvn spring-boot:run
```

### Option B : Lancement en mode Développement (sans installation PostgreSQL, utilise H2 local)
Si vous n'avez pas PostgreSQL d'installé localement, vous pouvez lancer l'application en utilisant le profil de développement `dev` qui s'appuiera sur une base de données locale fichier **H2** :
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Dans les deux cas, l'application démarrera sur le port **8080**.

### Seeding Initial Automatique
Au premier démarrage, l'application crée automatiquement :
1. Les 7 rôles métiers requis (`ADMIN`, `GESTIONNAIRE_CENTRAL`, `GESTIONNAIRE_LOCAL`, `RESPONSABLE_FINANCIER`, `RESPONSABLE_SERVICE`, `CONDUCTEUR`, `CONSULTATION`).
2. Le compte administrateur initial avec l'email et le mot de passe définis par les variables d'environnement `ADMIN_EMAIL` et `ADMIN_PASSWORD` (par défaut : `admin@mef.gov.ma` / `Admin@2026`).

---

## Exécution des Tests

Le projet est configuré avec une base de données en mémoire **H2** pour la phase de test. Pour compiler et exécuter l'ensemble de la suite de tests sans nécessiter PostgreSQL, lancez :

```bash
mvn clean test
```

---

## Documentation des Endpoints (Swagger UI)

Une fois l'application démarrée, vous pouvez visualiser et tester l'ensemble des API via l'interface Swagger UI à l'adresse :

👉 **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

### Authentification sous Swagger UI :
1. Ouvrez l'interface Swagger UI.
2. Déroulez la section **Authentification** et effectuez un appel `POST /api/auth/login` avec les identifiants de l'administrateur par défaut.
3. Copiez le jeton d'accès (`accessToken`) reçu dans la réponse.
4. Cliquez sur le bouton **Authorize** en haut à droite de l'écran Swagger UI.
5. Saisissez votre jeton au format `Bearer <votre_token>` (ex: `Bearer eyJhbGci...`) et validez.
6. Vous pouvez désormais tester l'ensemble des endpoints sécurisés de l'application !

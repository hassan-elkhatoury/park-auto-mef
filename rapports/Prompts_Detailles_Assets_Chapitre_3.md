# Prompts détaillés des figures 13 à 32 - Chapitre 3

Ce cahier couvre uniquement les figures effectivement citées dans le chapitre 3 du rapport : figures 13 à 32. Il sert à générer des diagrammes UML, des captures d'interface et des visuels techniques cohérents avec l'application Park Auto MEF.

## Charte commune à appliquer

- Style institutionnel, académique et moderne, adapté à un rapport PFA.
- Palette : bleu marine `#0B2545`, bleu `#1F5D9B`, turquoise `#1597A8`, or discret `#C7922F`, fond `#F7F9FC`, texte `#202733`.
- Typographie : Arial, Inter ou Source Sans 3 ; aucun texte inférieur à 16 px dans l'export final.
- Diagrammes : fond clair, traits nets, connecteurs sans croisement inutile, alignements réguliers, espaces généreux.
- Interfaces : format 16:9, résolution minimale 1920 x 1080, données marocaines fictives, navigation Park Auto MEF cohérente.
- Exporter chaque diagramme en source éditable et en SVG, puis fournir un PNG haute résolution.
- Ne jamais afficher de nom réel, CIN réel, mot de passe, jeton JWT, adresse IP privée ou donnée confidentielle.
- Conserver les noms de classes, rôles, statuts et endpoints techniques indiqués dans chaque prompt.

---

## Figure 13 - Cas d'utilisation des fonctions transverses de sécurité et d'administration

**Outil conseillé :** PlantUML Use Case ou Draw.io UML.  
**Fichier conseillé :** `CH3_Figure_13_UseCase_Securite.svg`

**Prompt détaillé :**

> Créer un diagramme UML professionnel intitulé « Sécurité et administration des utilisateurs - Cas d'utilisation ». Représenter quatre acteurs : `Utilisateur MEF`, `Administrateur système`, `Responsable hiérarchique` et `Service d'audit`. Organiser le système Park Auto MEF en trois zones horizontales. Zone « Session utilisateur » : Se connecter, Vérifier les identifiants et le statut, Générer les Access/Refresh Tokens JWT, Rafraîchir la session, Changer le mot de passe, Forcer le changement du mot de passe lors de la première connexion, Consulter ou modifier son profil, Se déconnecter. Zone « Administration des comptes » : Créer un compte, Modifier un compte, Activer/Désactiver/Verrouiller, Réinitialiser le mot de passe, Générer un mot de passe temporaire, Attribuer ou retirer un rôle. Zone « Traçabilité » : Journaliser les actions sensibles et Consulter les journaux d'audit. Ajouter les relations `include` entre connexion, vérification des identifiants et génération JWT ; entre gestion/réinitialisation et génération du mot de passe temporaire ; entre les opérations sensibles et la journalisation. Ajouter `extend` entre connexion et changement obligatoire du mot de passe. Limiter les croisements de flèches et rendre les droits de chaque acteur immédiatement lisibles.

**À éviter :** diagramme vertical excessivement long, acteurs dupliqués, permissions incohérentes, fonctions métier des véhicules dans ce visuel.

---

## Figure 14 - Modèle de classes des habilitations et services transverses

**Outil conseillé :** PlantUML Class Diagram.  
**Fichier conseillé :** `CH3_Figure_14_Classes_Securite.svg`

**Prompt détaillé :**

> Générer un diagramme UML de classes intitulé « Habilitations et services transverses ». Placer `BaseEntity` en superclasse avec `id`, `dateCreation`, `dateModification`, `createdBy` et `updatedBy`. Ajouter `Utilisateur` héritant de BaseEntity et implémentant UserDetails, avec matricule, nom, prénom, email, motDePasse, sel, doitChangerMotDePasse, téléphone, direction, service, région et statut. Ajouter `Role` avec nom de type `RoleType` et description ; modéliser la relation N-N entre Utilisateur et Role via une association claire. Ajouter les énumérations `RoleType` contenant ADMIN, GESTIONNAIRE_CENTRAL, GESTIONNAIRE_LOCAL, RESPONSABLE_FINANCIER, RESPONSABLE_SERVICE, CONDUCTEUR et CONSULTATION, ainsi que `UserStatus` contenant ACTIVE, LOCKED et ARCHIVED. Ajouter `JwtService` avec génération, validation et extraction des tokens ; `AuditService` ; et `JournalAction` avec username, timestamp, module, action, entityName, entityId, oldValue, newValue et ipAddress. Montrer que les opérations de l'utilisateur sont tracées dans JournalAction et que JwtService dépend de l'identité utilisateur. Afficher toutes les cardinalités.

**À éviter :** attributs illisibles, méthodes Java complètes inutiles, relations sans cardinalité, mélange entre RoleType et UserStatus.

---

## Figure 15 - Séquence de contrôle d'accès et de traitement sécurisé

**Outil conseillé :** PlantUML Sequence Diagram.  
**Livraison conseillée :** trois SVG `15A`, `15B`, `15C` et un composite 16:9 `CH3_Figure_15_Sequences_Securite.png`.

**Prompt 15A - Authentification :**

> Créer un diagramme de séquence intitulé « A. Authentification JWT ». Participants : Utilisateur, LoginView React, AuthController, AuthenticationManager, UtilisateurService, UtilisateurRepository, PasswordEncoder, JwtService et AuditService. Décrire la saisie email/mot de passe, `POST /api/auth/login`, chargement de l'utilisateur, vérification du hash, contrôle du statut ACTIVE, génération de l'Access Token et du Refresh Token, journalisation LOGIN_SUCCESS et retour HTTP 200 avec profil, rôle et indicateur `doitChangerMotDePasse`. Ajouter des fragments `alt` pour identifiants invalides avec HTTP 401 et compte verrouillé/archivé avec HTTP 403. Ne jamais afficher un token réel.

**Prompt 15B - Rafraîchissement :**

> Créer un diagramme de séquence intitulé « B. Rafraîchissement sécurisé de session ». Participants : Utilisateur, Application React, Axios Interceptor, AuthController, JwtService, UtilisateurRepository et AuditService. Une requête métier retourne HTTP 401 car l'Access Token est expiré. L'intercepteur envoie `POST /api/auth/refresh` avec un Refresh Token masqué. JwtService contrôle signature, type et expiration, retrouve l'utilisateur et vérifie son statut. En cas de succès, produire un nouvel Access Token, journaliser TOKEN_REFRESHED, répéter la requête initiale et mettre à jour l'interface. Ajouter les branches Refresh Token invalide ou expiré avec suppression de la session et redirection vers `/login`, et utilisateur non actif avec HTTP 403.

**Prompt 15C - Changement obligatoire :**

> Créer un diagramme de séquence intitulé « C. Changement obligatoire du mot de passe ». Participants : Utilisateur, ForceChangePasswordModal React, UtilisateurController, UtilisateurService, PasswordPolicyValidator, PasswordEncoder, UtilisateurRepository et AuditService. Après connexion avec `doitChangerMotDePasse = true`, bloquer la navigation métier. Envoyer `PUT /api/utilisateurs/me/password` avec ancien mot de passe, nouveau mot de passe et confirmation. Vérifier l'ancien hash, la politique de complexité et la concordance de confirmation. En cas de succès, encoder le nouveau secret, sauvegarder avec `doitChangerMotDePasse = false`, journaliser PASSWORD_CHANGED, retourner HTTP 200 et ouvrir le tableau de bord. Ajouter des branches pour ancien mot de passe incorrect et politique invalide.

**À éviter :** trois diagrammes miniatures dans une seule image illisible, tokens ou mots de passe en clair, numérotation incohérente.

---

## Figure 16 - Cas d'utilisation de la gestion des véhicules

**Outil conseillé :** PlantUML Use Case.  
**Fichier conseillé :** `CH3_Figure_16_UseCase_Vehicules.svg`

**Prompt détaillé :**

> Générer un diagramme UML intitulé « Gestion du parc automobile - Cas d'utilisation ». Acteurs : Gestionnaire local, Gestionnaire central, Responsable financier, Profil consultation et Service d'audit. Cas principaux : Consulter le parc, Rechercher et filtrer, Consulter une fiche véhicule, Ajouter un véhicule, Modifier un véhicule, Archiver logiquement un véhicule, Changer le statut administratif, Mettre à jour le kilométrage, Consulter l'historique des statuts, Consulter les échéances légales et Exporter Excel/PDF. Ajouter les contrôles inclus : Vérifier l'unicité de l'immatriculation, du numéro d'inventaire et du VIN ; Valider les caractéristiques techniques ; Vérifier l'absence de conflits historiques avant archivage ; Journaliser les mutations. Le gestionnaire local agit dans son périmètre, le gestionnaire central supervise globalement, le responsable financier consulte les valeurs/coûts, et le profil consultation reste strictement en lecture/export.

**À éviter :** autoriser le profil consultation à modifier, représenter une suppression physique, omettre les contrôles d'unicité.

---

## Figure 17 - Diagramme de classes du module Véhicules

**Outil conseillé :** PlantUML Class Diagram.  
**Fichier conseillé :** `CH3_Figure_17_Classes_Vehicules.svg`

**Prompt détaillé :**

> Créer un diagramme de classes intitulé « Modèle statique du module Véhicules ». Classe centrale `Vehicule` héritant de BaseEntity. Regrouper ses attributs par identification, caractéristiques techniques, acquisition, rattachement administratif, kilométrage et statuts. Inclure notamment immatriculation, numeroInventaire, numeroChassis, marque, modele, typeCarburant, puissanceFiscale, capaciteReservoir, kilometrageInitial, kilometrageActuel, dateAcquisition, montantAcquisition, direction, service, statutAdministratif et etatTechnique. Ajouter `Marque`, `Modele`, `Direction`, `Service` et `HistoriqueStatutVehicule`. Cardinalités : Marque 1-N Modèles, Modèle 1-N Véhicules, Direction 1-N Services, Direction 1-N Véhicules, Service 1-N Véhicules, Vehicule 1-N Historiques. Ajouter les énumérations `TypeCarburant`, `StatutAdministratif` et `EtatTechnique`. Montrer les dépendances futures de Vehicule vers Affectation, PleinCarburant, InterventionMaintenance et Assurance sous forme de références légères.

**À éviter :** une classe Vehicule trop haute ; utiliser des compartiments ou notes pour conserver une largeur lisible sur A4.

---

## Figure 18 - Séquence d'enregistrement et de qualification d'un véhicule

**Outil conseillé :** PlantUML Sequence Diagram.  
**Fichier conseillé :** `CH3_Figure_18_Sequence_Enregistrement_Vehicule.svg`

**Prompt détaillé :**

> Créer un diagramme de séquence intitulé « Enregistrement et qualification d'un véhicule ». Participants : Gestionnaire du parc, VehiculeFormModal React, VehiculeController, VehiculeService, VehiculeValidator, VehiculeRepository, HistoriqueStatutRepository et AuditService. Montrer la saisie des blocs Identification, Technique, Acquisition et Rattachement, la validation frontend puis `POST /api/vehicules`. Le service contrôle l'autorisation et vérifie l'unicité de l'immatriculation, du numéro d'inventaire et du VIN. Il valide les dates, le kilométrage et les caractéristiques techniques. Ajouter un fragment `alt` retournant HTTP 409 pour un doublon et HTTP 400 pour une donnée incohérente. En succès, créer le véhicule avec statut DISPONIBLE, enregistrer un historique initial, journaliser CREATE VEHICULE, retourner HTTP 201 avec le DTO, afficher une notification de succès et ouvrir la fiche détaillée.

---

## Figure 19 - Interface de consultation du parc automobile

**Outil conseillé :** capture réelle de l'application React ; à défaut, maquette HTML/Figma fidèle.  
**Fichier conseillé :** `CH3_Figure_19_Interface_Parc.png`

**Prompt détaillé :**

> Produire un visuel 16:9 composé de deux captures cohérentes de Park Auto MEF. À gauche, écran « Parc automobile » avec sidebar institutionnelle, barre supérieure, bouton Nouveau véhicule, recherche, filtres Direction/Statut/Marque/Carburant, cartes KPI Total flotte, Disponibles, En mission et En maintenance, puis tableau Photo, Immatriculation, Inventaire, Marque/Modèle, Direction, Kilométrage, Statut, Échéance et Actions. Utiliser des immatriculations marocaines fictives et badges DISPONIBLE vert, AFFECTE bleu, EN_MAINTENANCE orange et REFORME gris. À droite, fiche du véhicule sélectionné avec photo générique, immatriculation fictive `12345-A-6`, inventaire `MEF-VH-2026-0142`, onglets Identification, Technique, Acquisition, Affectation, Échéances et Historique ; afficher alertes assurance, visite technique et entretien, ainsi qu'une timeline de statut. La capture doit sembler issue du frontend réel, sans texte inventé de présentation.

**À éviter :** rendu de landing page, données personnelles réelles, texte minuscule, tableau coupé ou navigateur visible.

---

## Figure 20 - Cas d'utilisation Conducteurs et Affectations

**Outil conseillé :** PlantUML Use Case.  
**Fichier conseillé :** `CH3_Figure_20_UseCase_Affectations.svg`

**Prompt détaillé :**

> Générer un diagramme UML intitulé « Conducteurs, demandes et affectations - Cas d'utilisation ». Acteurs : Agent demandeur, Responsable de service, Gestionnaire du parc, Conducteur, Service PDF et Service d'audit. Cas : Gérer le référentiel conducteurs, Contrôler la validité du permis, Soumettre une demande de déplacement, Modifier ou annuler une demande, Valider N1, Rejeter avec motif, Rechercher les ressources disponibles, Affecter un véhicule, Affecter un conducteur, Générer l'ordre de mission PDF, Démarrer la mission, Restituer le véhicule, Saisir le kilométrage retour, Signaler une anomalie et Consulter l'historique. Relations `include` : affecter véhicule inclut vérifier disponibilité ; affecter conducteur inclut vérifier permis et habilitations ; rejeter inclut saisir motif ; générer OM inclut demande approuvée et affectation complète ; restituer inclut contrôle kilométrique. Toutes les mutations importantes incluent la journalisation.

---

## Figure 21 - Modèle de classes Conducteurs et Affectations

**Outil conseillé :** PlantUML Class Diagram.  
**Fichier conseillé :** `CH3_Figure_21_Classes_Affectations.svg`

**Prompt détaillé :**

> Créer un diagramme de classes UML intitulé « Modèle statique Conducteurs et Affectations ». Inclure `Utilisateur`, `Conducteur`, `DemandeDeplacement`, `Affectation`, `Vehicule` et `OrdreDeMission`. Conducteur : matricule, nom, prénom, CIN masquée, direction, service, téléphone, email, numeroPermis, categoriePermis, dateExpirationPermis, statut et habilitationsSpeciales. DemandeDeplacement : reference, demandeur, motif, destination, dates de départ/retour estimée, nombrePassagers, listePassagers, statut, motifRejet, valideurService et dates de validation. Affectation : reference, demande, véhicule, conducteur, dates, kilometrageDepart, kilometrageRetour, niveauCarburantRetour, anomalies, remarques et statut. OrdreDeMission : reference, dateEmission, cheminPdf, codeVerification et statut. Cardinalités : Utilisateur 1-N Demandes ; Demande 1-0..1 Affectation ; Vehicule 1-N Affectations ; Conducteur 1-N Affectations ; Affectation 1-0..1 OrdreDeMission. Ajouter StatutDemande, StatutAffectation et StatutConducteur.

---

## Figure 22 - Séquence de réservation et d'affectation

**Outil conseillé :** PlantUML Sequence Diagram.  
**Fichier conseillé :** `CH3_Figure_22_Sequence_Reservation_Affectation.svg`

**Prompt détaillé :**

> Générer un diagramme de séquence couvrant le workflow complet. Participants : Agent, DemandesView React, DemandeDeplacementController, DemandeService, Responsable de service, Gestionnaire du parc, AffectationService, VehiculeRepository, ConducteurRepository, OrdreMissionService et AuditService. L'agent soumet une demande qui passe à EN_ATTENTE_VALIDATION ; le responsable reçoit une notification et valide N1 vers VALIDEE_SERVICE ou rejette avec motif vers REJETEE. Le gestionnaire recherche un véhicule DISPONIBLE compatible et un conducteur ACTIF avec permis valide. Créer l'affectation, passer le véhicule à AFFECTE, la demande à APPROUVEE_AFFECTEE, générer l'ordre de mission PDF puis démarrer la mission. Au retour, saisir kilométrage et carburant, vérifier kilométrage retour supérieur ou égal au départ, clôturer l'affectation en RESTITUEE, la demande en TERMINEE et remettre le véhicule à DISPONIBLE. Ajouter des fragments `alt` pour rejet N1, aucun véhicule disponible et permis expiré.

---

## Figure 23 - Interface de suivi des demandes de déplacement

**Outil conseillé :** capture réelle React, avec aperçu réel ou maquetté de l'ordre de mission.  
**Fichier conseillé :** `CH3_Figure_23_Interface_Demandes.png`

**Prompt détaillé :**

> Produire une capture 16:9 de l'écran « Demandes de déplacement » de Park Auto MEF. Afficher KPI En attente, Validées service, Affectées et Rejetées ; filtres Référence, Demandeur, Direction, Destination, Période et Statut ; tableau Référence, Demandeur, Motif, Destination, Départ, Retour, Statut, Validation N1, Affectation et Actions. Sélectionner une demande fictive `DEM-2026-0082` et ouvrir un panneau détaillé avec timeline Soumise, Validée service, En attente d'affectation. Afficher uniquement les actions autorisées par le rôle actif : Valider, Rejeter, Affecter et Générer OM. Ajouter un aperçu réduit d'un ordre de mission A4 institutionnel avec référence, agent fictif, véhicule, conducteur, destination, dates, QR code factice et zones de validation. Le document ne doit contenir aucune donnée personnelle réelle.

---

## Figure 24 - Cas d'utilisation Carburant et Maintenance

**Outil conseillé :** PlantUML Use Case.  
**Fichier conseillé :** `CH3_Figure_24_UseCase_Carburant_Maintenance.svg`

**Prompt détaillé :**

> Créer un diagramme de cas d'utilisation intitulé « Carburant, maintenance et TCO ». Acteurs : Conducteur, Gestionnaire du parc, Responsable financier, Prestataire/Garage et Service d'alertes. Zone Carburant : Gérer les cartes carburant, Affecter une carte, Enregistrer un plein, Joindre ticket/facture, Contrôler le kilométrage, Calculer la consommation L/100 km, Détecter une surconsommation et Consulter les dépenses. Zone Maintenance : Programmer un entretien préventif, Déclarer une panne, Créer une intervention curative, Affecter un prestataire, Enregistrer pièces et main-d'œuvre, Immobiliser le véhicule, Clôturer l'intervention et Mettre à jour le prochain seuil. Zone Pilotage : Calculer le TCO et Exporter les rapports. Ajouter les relations include pour validations et calculs automatiques ; utiliser extend pour l'alerte de surconsommation et l'immobilisation conditionnelle.

---

## Figure 25 - Modèle de classes Carburant et Maintenance

**Outil conseillé :** PlantUML Class Diagram.  
**Fichier conseillé :** `CH3_Figure_25_Classes_Carburant_Maintenance.svg`

**Prompt détaillé :**

> Générer un diagramme de classes UML avec `Vehicule`, `Conducteur`, `CarteCarburant`, `PleinCarburant`, `InterventionMaintenance` et `GarageAgree`. CarteCarburant : numeroCarte masqué, fournisseur, vehicule, serviceAttribue, plafondMensuel, solde, dates activation/expiration, statut et observation. PleinCarburant : vehicule, conducteur, carte, datePlein, stationService, typeCarburant, quantiteLitres, prixUnitaire, montantTTC, kilometrage, consommationMoyenne, anomalieSurconsommation, referenceTicket et observation. InterventionMaintenance : vehicule, typeMaintenance, natureOperation, dates prévue/réalisée, kilométrages, prestataire, coutMainOeuvre, coutPieces, montantTotal, piecesRemplacees, statut, immobilisation et description. GarageAgree : raisonSociale, adresse, contact, spécialités et agrément. Cardinalités : Vehicule 1-N Pleins, Conducteur 0..1-N Pleins, Carte 0..1-N Pleins, Vehicule 1-N Interventions, Garage 1-N Interventions. Ajouter les énumérations de carburant, carte et maintenance.

---

## Figure 26 - Séquence de saisie d'un plein et de contrôle kilométrique

**Outil conseillé :** PlantUML Sequence Diagram.  
**Fichier conseillé :** `CH3_Figure_26_Sequence_Plein_Carburant.svg`

**Prompt détaillé :**

> Créer un diagramme de séquence intitulé « Saisie d'un plein et contrôle kilométrique ». Participants : Conducteur, CarburantView React, PleinCarburantController, CarburantService, VehiculeRepository, CarteCarburantRepository, PleinCarburantRepository, NotificationService et AuditService. Le conducteur sélectionne véhicule et carte puis saisit date, station, litres, prix, montant, kilométrage et référence ticket. Le service charge le véhicule et le dernier plein, vérifie que le kilométrage est cohérent, que la carte est ACTIVE, non expirée, avec solde et plafond suffisants. Calculer distance parcourue et consommation `litres / distance x 100`. Si le seuil est dépassé, marquer `anomalieSurconsommation = true` et notifier le gestionnaire. Enregistrer le plein, mettre à jour le kilométrage du véhicule, débiter la carte, journaliser CREATE PLEIN et retourner le DTO. Ajouter des branches pour kilométrage invalide, carte bloquée/expirée et plafond dépassé.

---

## Figure 27 - Cas d'utilisation Assurances, Sinistres et Budget

**Outil conseillé :** PlantUML Use Case.  
**Fichier conseillé :** `CH3_Figure_27_UseCase_Risques_Budget.svg`

**Prompt détaillé :**

> Générer un diagramme de cas d'utilisation intitulé « Assurances, risques réglementaires et budget ». Acteurs : Gestionnaire du parc, Responsable financier, Conducteur, Compagnie d'assurance, Commission de réforme et Service d'alertes. Organiser en cinq zones. Assurances : gérer les polices, joindre les documents, contrôler la validité, renouveler et alerter à J-30. Sinistres : déclarer un accident, joindre constat/photos, identifier le conducteur, enregistrer les dommages, lancer l'expertise, suivre l'indemnisation et clôturer. Infractions : enregistrer le PV, identifier le conducteur et suivre le paiement. Visites/Taxes/Réforme : planifier la visite, enregistrer le résultat, payer la taxe, initier la réforme, joindre expertise et PV de commission, valider la sortie d'inventaire. Budget : allouer une enveloppe, engager et réaliser une dépense, calculer le restant, alerter un dépassement et produire un rapport. Ajouter les contrôles et notifications automatiques en include/extend.

---

## Figure 28 - Modèle de classes Assurances, Sinistres et Budget

**Outil conseillé :** PlantUML Class Diagram.  
**Fichier conseillé :** `CH3_Figure_28_Classes_Risques_Budget.svg`

**Prompt détaillé :**

> Créer un diagramme UML lisible comprenant `Vehicule`, `Conducteur`, `Assurance`, `Sinistre`, `Infraction`, `VisiteTechnique`, `TaxeAutomobile`, `ReformeVehicule`, `BudgetDirection`, `DocumentGED` et `AuditLog`. Assurance : numeroPolice, compagnie, typeGarantie, dates début/fin, montantPrime, franchise, statut et documents. Sinistre : véhicule, conducteur, assurance, dateAccident, lieu, description, tiers, natureAccident, montantDommages, franchise, indemnisation, statut et referenceExpertise. Infraction : véhicule, conducteur, date, lieu, type, montantAmende, statut et référence. VisiteTechnique : véhicule, date, centre, résultat, dateProchaine et PV. TaxeAutomobile : véhicule, année, type, montant, statut et échéance. ReformeVehicule : véhicule, motif, dateDecision, pvCommission, statut et prixCession. BudgetDirection : année, direction, natureDepense, montantAlloue, montantEngage, montantRealise et montantRestant calculé. Montrer toutes les cardinalités et statuts, en regroupant les classes par sous-domaine pour éviter un schéma surchargé.

---

## Figure 29 - Séquence de déclaration et de traitement d'un sinistre

**Outil conseillé :** PlantUML Sequence Diagram.  
**Fichier conseillé :** `CH3_Figure_29_Sequence_Sinistre.svg`

**Prompt détaillé :**

> Générer un diagramme de séquence complet intitulé « Déclaration et traitement d'un sinistre ». Participants : Conducteur/Agent, Interface Sinistres React, SinistreController, SinistreService, VehiculeRepository, AssuranceRepository, DocumentGEDService, NotificationService, AuditService et Compagnie d'assurance. L'utilisateur sélectionne véhicule et conducteur, saisit date, lieu, nature, description, tiers et montant estimé, puis joint constat et photos. Le service vérifie une assurance active à la date de l'accident. Créer le sinistre au statut DECLARE, passer le véhicule à ACCIDENTE ou EN_REPARATION, archiver les pièces dans la GED, notifier gestionnaire et responsable financier, puis transmettre le dossier à l'assureur. Enregistrer expertise, dommages, franchise et indemnisation. Montrer les transitions DECLARE, EXPERTISE_EN_COURS, ACCEPTE ou REFUSE, INDEMNISE et CLOTURE, avec journalisation de chaque changement. Ajouter une branche sans assurance active générant une alerte critique sans masquer la déclaration.

---

## Figure 30 - Interface de suivi des assurances et échéances

**Outil conseillé :** capture réelle de `AssurancesView` React.  
**Fichier conseillé :** `CH3_Figure_30_Interface_Assurances.png`

**Prompt détaillé :**

> Produire une capture d'interface 16:9 intitulée « Assurances flotte ». Conserver la sidebar et la barre supérieure Park Auto MEF. Afficher quatre KPI : Polices actives, Échéances sous 30 jours, Primes annuelles et Dossiers incomplets. Ajouter filtres Compagnie, Statut, Direction et Échéance. Tableau : Véhicule, Immatriculation, N° police, Compagnie, Garantie, Début, Fin, Prime, Franchise, Statut, Documents et Actions. Utiliser des compagnies fictives AXA, RMA et Wafa Assurance. Matérialiser les échéances J-7 en rouge, J-30 en orange et les contrats valides en vert. Ouvrir un panneau latéral pour une police sélectionnée avec documents PDF, historique des renouvellements, détails financiers et bouton Renouveler la police. Le rendu doit être celui d'un outil administratif dense, lisible et réaliste.

---

## Figure 31 - Interface de suivi des dossiers de sinistres

**Outil conseillé :** capture réelle si l'écran existe ; sinon maquette HTML/Figma strictement cohérente avec le frontend.  
**Fichier conseillé :** `CH3_Figure_31_Interface_Sinistres.png`

**Prompt détaillé :**

> Créer une interface Park Auto MEF 16:9 intitulée « Sinistres et réparations ». Afficher KPI Déclarés, Expertise en cours, En réparation et Clôturés ce mois. Présenter les dossiers en tableau ou kanban par statut, avec référence, véhicule, date, lieu, conducteur, compagnie, montant des dommages et progression. Sélectionner le dossier fictif `SIN-2026-0031` et ouvrir un panneau détaillé contenant une timeline : Déclaration, Constat reçu, Expertise programmée, Accord assurance, Réparation, Remboursement et Clôture. Afficher les pièces GED, montant dommages, franchise, indemnisation et reste à charge. Ajouter les commandes Mettre à jour le statut, Ajouter expertise, Joindre document et Clôturer. Utiliser des données entièrement fictives et la même typographie, sidebar, badges et palette que les autres écrans.

---

## Figure 32 - Tableau de bord de suivi budgétaire

**Outil conseillé :** capture réelle de `BudgetView` React/Recharts.  
**Fichier conseillé :** `CH3_Figure_32_Dashboard_Budget.png`

**Prompt détaillé :**

> Produire un tableau de bord 16:9 intitulé « Suivi budgétaire du parc - Exercice 2026 ». Afficher filtres Année, Direction et Nature de dépense. KPI : Budget alloué, Engagé, Réalisé, Disponible et Taux de consommation, tous en MAD avec valeurs fictives cohérentes. Ajouter un histogramme Alloué/Engagé/Réalisé par direction, une courbe mensuelle de consommation, un diagramme en anneau par nature de dépense Carburant/Maintenance/Assurance/Taxes/Sinistres, et une table Direction, Alloué, Réalisé, Restant, Taux, Prévision fin d'année et Alerte. Afficher des jauges orange au-delà de 80 % et rouges au-delà de 95 %. Ajouter une carte « Prévisions carburant » et les commandes Export PDF et Export Excel. Le visuel doit donner une impression de pilotage financier institutionnel, sans composition marketing.

---

## Contrôle final avant insertion dans Word

1. Vérifier les accents, les noms d'entités et les statuts.
2. Vérifier les cardinalités et les relations `include`/`extend`.
3. Contrôler que chaque figure reste lisible à une largeur de 15 à 16 cm dans une page A4.
4. Utiliser les numéros 13 à 32 sans renumérotation automatique incohérente.
5. Insérer les diagrammes en SVG ou PNG haute résolution comme images en ligne, jamais comme objets flottants.
6. Placer la légende immédiatement sous le visuel et conserver le visuel avec sa légende sur la même page.

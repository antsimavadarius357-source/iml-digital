# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE (CdCF/T)
## PROJET : PLATEFORME INTÉGRÉE DE GESTION ET D'INCUBATION — IML DIGIT

---

### FICHE D'IDENTIFICATION DU PROJET
* **Intitulé du projet :** Système Intégré de Pilotage, de Sélection et d'Accompagnement Entrepreneurial (IML Digit).
* **Organisme commanditaire :** Incubateur Mugheli Lab / IML (Libreville, Gabon).
* **Auteur du document :** Alexandre MBA / Équipe de développement (Stagiaire INPTIC).
* **Destinataires :** Direction Générale de l'Incubateur, Maîtrise d'ouvrage, Jury d'évaluation académique.
* **Version du document :** 1.0 — Document de référence validé.

---

## 1. CONTEXTE ET JUSTIFICATION DU BESOIN

### 1.1. Contexte général
Au Gabon, la diversification économique et la valorisation des compétences locales passent par la promotion de l'entrepreneuriat des jeunes et la consolidation des PME/Startups. L'Incubateur Mugheli Lab (IML) a pour mission d'accueillir, d'orienter, de former et d'accompagner les porteurs de projets à fort potentiel de création de valeur et d'emplois.

### 1.2. Problématique et état initial (L'existant)
Avant la mise en place de la plateforme, la gestion opérationnelle de l'incubateur reposait sur des processus manuels et fragmentés :
* **Dispersion des candidatures :** Dépôts physiques sur papier, courriels non centralisés ou formulaires épars entraînant des retards de traitement et des pertes de dossiers.
* **Absence de suivi longitudinal :** Difficulté pour les agents et la direction à mesurer la progression réelle d'une entreprise entre son diagnostic d'entrée et sa phase d'accélération.
* **Conflits de ressources :** Gestion sur papier des salles de masterclass et des créneaux de coaching provoquant des chevauchements d'horaires.
* **Déficit d'indicateurs consolidés :** Impossibilité d'éditer instantanément des rapports fiables (taux de survie, heures d'accompagnement, statistiques sectorielles) pour les partenaires et bailleurs de fonds.

---

## 2. OBJECTIFS DU SYSTÈME

### 2.1. Objectif général
Développer et déployer une plateforme logicielle intégrée, sécurisée et accessible en ligne, permettant de centraliser l'instruction des candidatures, le suivi individualisé des parcours d'incubation, la planification logistique et le pilotage stratégique de l'incubateur.

### 2.2. Objectifs spécifiques
1. **Zéro papier pour les candidatures :** Automatiser la collecte des dossiers, l'attribution d'un numéro d'immatriculation officiel unique (`IML-AAAA-XXXX`) et le suivi autonome par les candidats.
2. **Diagnostic et cartographie de maturité :** Évaluer les porteurs de projet selon un modèle standardisé en 5 piliers (Stratégie, Commercial, Finance/Juridique, Technique, Gouvernance).
3. **Traçabilité du mentorat :** Enregistrer chaque heure de mentorat, rédiger les comptes-rendus d'experts et valider formellement les livrables par étapes.
4. **Gestion multicanale des échanges :** Convoquer les bénéficiaires par e-mail et via l'API WhatsApp avec lien direct et émargement numérique.
5. **Aide à la décision pour la Direction :** Fournir un cockpit statistique en temps réel avec exportations aux formats institutionnels (Excel, PDF).
6. **Certification infalsifiable :** Délivrer des attestations de fin de parcours munies d'un QR code de vérification publique en ligne.

---

## 3. PÉRIMÈTRE ET PROFILS UTILISATEURS (MATRICE RBAC)

Le système implémente un contrôle d'accès strict basé sur les rôles (**Role-Based Access Control**) :

| Rôle | Profil métier | Responsabilités dans le système |
|---|---|---|
| **PUBLIC** | Porteurs de projet, Dirigeants de PME, Public externe. | Consulter la vitrine des offres, soumettre une candidature en ligne, suivre l'état de son dossier par numéro unique, formuler une demande de réservation de salle. |
| **AGENT** | Chargé de dossier, Agent d'accueil guichet. | Enrôler les bénéficiaires, instruire les dossiers, affecter les parcours et jalons, planifier les rendez-vous, assigner les coachs référents, émettre les certificats. |
| **COACH** | Mentor, Expert sectoriel ou consultant externe. | Consulter son agenda personnalisé d'entretiens, accéder aux dossiers de ses entrepreneurs assignés (accès étanche), rédiger les notes d'accompagnement. |
| **DIRECTION** | Directeur Général, Responsables de comités. | Arbitrer les admissions et les réservations de salle, consulter le cockpit stratégique global, analyser les métriques financières et d'insertion, exporter les rapports officiels. |
| **ADMIN** | Administrateur technique et système. | Gestion des comptes utilisateurs, attribution des permissions, supervision du journal d'audit immuable et maintenance technique. |

---

## 4. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### MODULE 1 : PORTAIL PUBLIC & CANDIDATURES DÉMATÉRIALISÉES
* **EF-01.1 (Tunnel de candidature dynamique) :** Le candidat doit pouvoir renseigner un formulaire structuré en étapes (Identité, Profil entreprise, Pitch, Besoins d'accompagnement, Préférence d'entretien présentiel ou visio) avec sauvegarde automatique locale de brouillon.
* **EF-01.2 (Immatriculation unique) :** À la soumission, le système génère un identifiant incrémental infalsifiable (ex. `IML-2026-0001`).
* **EF-01.3 (Portail de suivi autonome) :** Le candidat doit pouvoir saisir son numéro de dossier et consulter en temps réel l'état d'instruction (`Brouillon`, `Soumise`, `En cours d'examen`, `Acceptée`, `Refusée`) sans créer de compte complexe.
* **EF-01.4 (Réservation d'espaces) :** Formulaire public de demande de privatisation de la salle de formation avec sélection de la formule (Atelier, Masterclass, Conférence) et des créneaux horaires.

### MODULE 2 : GUICHET OPÉRATIONNEL & GESTION DES BÉNÉFICIAIRES
* **EF-02.1 (Répertoire unifié) :** Recherche multi-critères instantanée et filtrage par typologie (`PME`, `Start-up`, `Porteur d'idée`), secteur d'activité et ville.
* **EF-02.2 (Radar de maturité à 5 piliers) :** Notation diagnostique de 0 à 100% sur 5 axes (Modèle économique, Commercialisation, Juridique & Fiscalité, Production/Technique, Équipe) avec visualisation graphique.
* **EF-02.3 (Fiche dossier 360°) :** Vue consolidée comprenant l'état civil, les pièces justificatives, les coachs affectés, l'historique complet des séances et le pourcentage d'avancement.

### MODULE 3 : PARCOURS D'INCUBATION & JALONS
* **EF-03.1 (Modèles de parcours) :** Bibliothèque de parcours personnalisables (Accélération 6 mois, Amorçage 3 mois, Maturation d'idée).
* **EF-03.2 (Validation séquentielle des jalons) :** Découpage du parcours en étapes opérationnelles (`À faire`, `En cours`, `Terminé`) validées par le coach ou l'agent avec horodatage.
* **EF-03.3 (Calcul automatique du taux de complétion) :** Mise à jour en temps réel de la progression globale du bénéficiaire.

### MODULE 4 : AGENDA, CONVOCATIONS & ÉMARGEMENT
* **EF-04.1 (Gestion des créneaux) :** Calendrier interactif partagé entre l'agent et les coachs avec détection automatique des conflits d'horaires.
* **EF-04.2 (Convocations multicanales) :** Génération automatique de messages WhatsApp formatés avec lien direct de confirmation et envoi d'invitations par e-mail avec détails logistiques.
* **EF-04.3 (Feuilles d'émargement officielles) :** Génération en 1 clic de la feuille d'émargement administrative officielle (en-tête, tableau des présences, zone d'émargement et signature) imprimable ou exportable en PDF.

### MODULE 5 : ESPACE COACHS & MENTORAT
* **EF-05.1 (Étancheité des accès) :** Le coach n'a accès qu'aux dossiers des entrepreneurs qui lui ont été expressément affectés par l'agent ou la direction.
* **EF-05.2 (Comptes-rendus d'évaluation) :** Formulaire de saisie rapide post-séance pour consigner les points bloquants, les devoirs à faire et les recommandations.

### MODULE 6 : GESTION DES SALLES & MASTERCLASSES
* **EF-06.1 (Planning des infrastructures) :** Calendrier d'occupation visuel de la salle événementielle IML.
* **EF-06.2 (Workflow d'arbitrage) :** Traitement des demandes avec possibilité pour la Direction de confirmer ou de refuser la réservation avec notification automatique du demandeur.

### MODULE 7 : COCKPIT STRATÉGIQUE DIRECTION & AUDIT
* **EF-07.1 (Tableau de bord décisionnel) :** Indicateurs synthétiques : nombre d'admissions, taux de sélection, heures dispensées, typologie des entreprises, flux mensuel des candidatures.
* **EF-07.2 (Journal d'audit certifié) :** Traçabilité immuable de chaque événement sensible (création, modification, validation d'étape, suppression) avec identité de l'auteur, date, heure et adresse IP.
* **EF-07.3 (Exportation de bilans) :** Exportation intégrale des données au format tableur Excel (`.xlsx`) structuré en plusieurs onglets pour les bailleurs de fonds.

### MODULE 8 : CERTIFICATION NUMÉRIQUE VÉRIFIABLE
* **EF-08.1 (Génération des diplômes) :** Édition de certificats numériques (Fin de parcours, Validation Business Plan, Mérite entrepreneurial) avec styles officiels et signatures intégrées.
* **EF-08.2 (Vérification publique par QR Code) :** Tout certificat comporte un QR code et une URL publique sécurisée permettant à un tiers (banque, investisseur, administration) d'authentifier la validité du document sans authentification préalable.

---

## 5. SPÉCIFICATIONS NON-FONCTIONNELLES (QUALITÉ & PERFORMANCE)

### 5.1. Sécurité et intégrité
* **Authentification sécurisée :** Jetons chiffrés **JWT** (JSON Web Tokens) avec cookies sécurisés (`HttpOnly`, `SameSite`).
* **Hachage des secrets :** Algorithme **Bcrypt** avec salage dynamique pour tous les mots de passe.
* **Protection réseau :** Validation des requêtes côté serveur (Zod), protection contre les injections SQL (Prisma ORM) et limitation de débit (**Rate Limiting**) contre les attaques par déni de service (DDoS) sur les formulaires publics.

### 5.2. Ergonomie et compatibilité
* **Conception responsive (Mobile First) :** Interface optimisée pour smartphones, tablettes et ordinateurs de bureau via TailwindCSS.
* **Temps de chargement et fluidité :** Navigation instantanée sans rechargement de page (**SPA** - Single Page Application) avec mise en cache TanStack Query.

### 5.3. Disponibilité et hébergement
* Architecture modulaire découplée (Frontend autonome / API RESTful indépendante / Base de données managée).
* Possibilité d'hébergement sur des infrastructures Cloud gratuites ou à très faible coût (Vercel, Render, Supabase) avec certificats HTTPS / SSL automatiques Let's Encrypt.

---

## 6. CONTRAINTES TECHNIQUES ET CHOIX TECHNOLOGIQUES

| Domaine | Technologie sélectionnée | Justification académique & technique |
|---|---|---|
| **Langage** | **TypeScript (v5.x)** | Typage statique assurant la robustesse du code et limitant drastiquement les erreurs d'exécution. |
| **Frontend** | **React 18 + Vite** | Vitesse de construction ultra-rapide, composabilité modulaire et standard moderne de l'industrie. |
| **Style & UI** | **TailwindCSS + Lucide** | Feuilles de style optimisées, légèreté et conformité avec la charte graphique de l'incubateur. |
| **Backend** | **Node.js (v20+) + Express** | Modèle asynchrone performant, traitement non-bloquant des requêtes et large écosystème d'API. |
| **Persistance** | **PostgreSQL (v15+)** | SGBD relationnel robuste, prise en charge native des colonnes JSON, conformité ACID totale. |
| **ORM** | **Prisma ORM** | Typage direct des entités, migrations de schéma automatisées et requêtes SQL sécurisées par défaut. |
| **Exportations** | **SheetJS (xlsx) + Print CSS** | Génération fluide de rapports tableurs et de documents PDF officiels directement exploitables. |

---

## 7. LIVRABLES DU PROJET

1. **Dépôt Git du code source :** Code source complet et structuré en deux sous-projets indépendants (`frontend/` et `backend/`).
2. **Schéma de base de données documenté :** Fichier `schema.prisma` avec relations, clés étrangères, indexations et script d'amorçage (`seed.ts`).
3. **Manuel d'utilisation opérationnel :** Guide de prise en main pour les Agents, les Coachs et la Direction Générale.
4. **Plateforme fonctionnelle déployée :** Application opérationnelle prête pour l'environnement de production.


# Mémorisation des Interrogations & Cadrage Produit — IML Digit

> **Date d'enregistrement** : 14 Octobre 2026  
> **Statut** : Document de référence produit & mémoire active  
> **Objet** : Résolution des incohérences de parcours entre le Back-Office Agent et le Bénéficiaire / Candidat

---

## 1. Synthèse des Interrogations Clés du Porteur de Projet

### A. Visioconférence & Entretien Vidéo
- **Constat** : Le candidat/bénéficiaire envoie sa candidature mais rien ne garantit ou n'indique qu'il a les moyens techniques ou la volonté de passer un entretien en visio.
- **Points de blocage identifiés** :
  1. Absence de choix du mode d'entretien préféré dans le formulaire de candidature initial.
  2. Absence de génération d'un lien de visioconférence réel (salle Jitsi, Meet, Teams) partagé entre l'agent et le bénéficiaire.
  3. Comment le bénéficiaire rejoint-il l'appel sans compte ou sans lien direct ?

### B. Entretien en Présentiel & Convocation
- **Constat** : L'agent programme un rendez-vous présentiel (date, heure, lieu), mais la transmission de l'information vers le bénéficiaire est manquante.
- **Points de blocage identifiés** :
  1. Comment le bénéficiaire sait-il qu'il a un entretien tel jour et à tel endroit ?
  2. Nécessité d'un déclenchement automatique d'une convocation (par Email et/ou SMS) avec confirmation/report.
  3. Génération d'une trace administrative / justificatif de convocation téléchargeable.

### C. Messagerie & Canaux d'Interaction
- **Constat** : Une interface de messagerie existe côté coach/agent, mais le canal d'entrée des messages est ambigu.
- **Points de blocage identifiés** :
  1. D'où arrivent les messages des bénéficiaires si ceux-ci n'ont pas encore d'espace connecté ?
  2. Choix d'architecture à trancher :
     - **Option 1 (Portail Bénéficiaire dédié)** : Espace léger pour le candidat/bénéficiaire pour chatter, voir son agenda et rejoindre ses visios.
     - **Option 2 (Passerelle Email / SMS)** : Les échanges se font par mail/SMS et sont synchronisés dans le dossier de la plateforme sans exiger de compte.

---

## 2. Pistes de Résolution Validées pour la Suite

1. **Formulaire de Candidature** :
   - Ajouter le champ : *« Préférence d'entretien : Présentiel (Locaux IML) ou Visioconférence »*.
   - Ajouter un champ d'acceptation et de vérification des prérequis de connexion.

2. **Module de Rendez-vous & Convocations** :
   - Génération automatique de l'invitation (lien visio direct en 1 clic sans installation ou adresse des locaux avec plan).
   - Envoi automatique d'un récapitulatif par email/SMS au candidat.

3. **Espace Bénéficiaire vs Notifications** :
   - Définir avec l'utilisateur l'expérience souhaitée pour l'entrepreneur (portail web ou notifications par messagerie externe).

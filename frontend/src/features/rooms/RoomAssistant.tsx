import { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  MessageCircle, 
  RotateCcw, 
  Sparkles
} from 'lucide-react';

interface Msg {
  from: 'bot' | 'user';
  text: string;
}

/** Nettoie et normalise une chaîne (retire accents, ponctuation et espaces superflus). */
function cleanText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!,;.:/\\()'"’`_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Supprime tous les astérisques pour un affichage 100% propre sans aucune étoile. */
function stripAsterisks(text: string): string {
  if (!text) return '';
  return text.replace(/\*/g, '');
}

/** Vérifie si le message de l'utilisateur n'est qu'une simple salutation sans question concrète. */
function isPureGreeting(str: string): boolean {
  const s = str.trim();
  return (
    s === 'bonjour' ||
    s === 'bonsoir' ||
    s === 'salut' ||
    s === 'hello' ||
    s === 'coucou' ||
    s === 'hey' ||
    s === 'hi' ||
    s === 'ca va' ||
    s === 'comment ca va' ||
    s === 'comment allez vous' ||
    s === 'bonjour ca va' ||
    s === 'salut ca va' ||
    s === 'bonjour comment ca va'
  );
}

/** Extrait le cœur sémantique d'une interrogation en retirant les formules de politesse d'introduction. */
function extractQueryCore(clean: string): string {
  return clean
    .replace(/^(bonjour|bonsoir|salut|hello|coucou|hey|hi)\b\s*/g, '')
    .replace(/^(s il vous plait|s il te plait|svp)\b\s*/g, '')
    .replace(/^(j aimerai savoir|j aimerais savoir|je souhaiterai savoir|je souhaite savoir|je voudrais savoir|je veux savoir|je cherche a savoir|dites moi|pouvez vous me dire|je voudrais|j aimerais|j aimerai|je souhaite|je veux)\b\s*/g, '')
    .trim();
}

interface KnowledgeTopic {
  id: string;
  matcher: (c: string) => boolean;
  keywords: string[];
  answer: string;
  chips?: { label: string; action: string }[];
}

const KNOWLEDGE_BASE: KnowledgeTopic[] = [
  // 1. COACHS & MENTORS (Priorité 1)
  {
    id: 'coachs',
    keywords: ['coach', 'coachs', 'mentor', 'mentors', 'formateur', 'formateurs', 'expert', 'experts', 'intervenant', 'conseiller', 'qui forme', 'qui accompagne'],
    matcher: (c) =>
      c.includes('coach') ||
      c.includes('mentor') ||
      c.includes('formateur') ||
      c.includes('intervenant') ||
      c.includes('qui forme') ||
      c.includes('qui accompagne') ||
      c.includes('expert metier') ||
      c.includes('conseiller referent'),
    answer: `🎓 L'équipe d'experts et mentors IML Digit :

Chaque porteur de projet et chaque entreprise accueillie bénéficie d'un encadrement stratégique et pratique de haut niveau :

• Conseillers Référents dédiés : Pilotage stratégique, structuration du modèle économique et suivi méthodique de votre feuille de route.
• Experts Métiers spécialisés :
  - Juridique & Propriété intellectuelle : Choix de la structure (SARL, SAS), rédaction des statuts, pactes d'associés et dépôt de marque.
  - Modèle économique & Finance : Élaboration du business plan, modélisation des flux de revenus et préparation aux levées de fonds.
  - Technologie, Web & Mobile : Conception de produits digitaux (MVP), design UI/UX, développement web et sécurité.
  - Marketing, Vente & Growth : Stratégie d'acquisition client, prospection B2B/B2C, branding et pitch d'affaires.`,
    chips: [
      { label: '🌱 Candidater au programme', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '🏢 Organisation de la salle', action: 'Comment est organisée la salle ?' },
      { label: '📞 Joindre un conseiller', action: 'Quel est votre contact téléphonique ?' },
    ],
  },

  // 2. INCUBATION & CANDIDATURE STARTUPS
  {
    id: 'incubation',
    keywords: ['incubat', 'candidat', 'postuler', 'rejoindre', 'integrer', 'startup', 'startups', 'projet', 'entrepreneur', 'accompagnement'],
    matcher: (c) =>
      c.includes('incubat') ||
      c.includes('candidat') ||
      c.includes('postuler') ||
      c.includes('rejoindre l incubateur') ||
      c.includes('integrer le programme') ||
      c.includes('accompagner mon projet') ||
      c.includes('programme d incubation') ||
      c.includes('startup') ||
      c.includes('entrepreneur'),
    answer: `🌱 Programmes d'Incubation IML Digit :

• Pour qui ? Porteurs de projets innovants, startups tech et entrepreneurs en phase de création ou d'accélération.
• Est-ce payant ? Non, l'accompagnement est 100% pris en charge (gratuit) pour les candidats retenus !
• Comment postuler ? Déposez simplement votre candidature en ligne sur la page dédiée (/candidater).
• Ce qui est inclus : Diagnostic approfondi, coach référent dédié, ateliers stratégiques, accès au réseau d'investisseurs et hébergement au hub.`,
    chips: [
      { label: '🎓 Qui sont les coachs ?', action: 'Qui sont les coachs et mentors ?' },
      { label: '📝 Comment faire ma demande ?', action: 'Comment faire ma demande ?' },
      { label: '📞 Joindre l\'équipe', action: 'Quel est votre contact téléphonique ?' },
    ],
  },

  // 3. ORGANISATION & AGENCEMENT DE LA SALLE
  {
    id: 'organisation_agencement_capacite',
    keywords: [
      'organis', 'agenc', 'amenag', 'dispos', 'configur', 'capacit', 'place',
      'table', 'chaise', 'siege', 'pupitre', 'theatre', 'ilot', 'en u', 'structure de la salle'
    ],
    matcher: (c) =>
      c.includes('organis') ||
      c.includes('agenc') ||
      c.includes('amenag') ||
      c.includes('dispos') ||
      c.includes('configur') ||
      c.includes('comment est la salle') ||
      c.includes('comment est faite la salle') ||
      c.includes('comment se presente la salle') ||
      c.includes('structure de la salle') ||
      c.includes('plan de salle') ||
      c.includes('table en u') ||
      c.includes('chaises') ||
      c.includes('theatre') ||
      c.includes('ilot') ||
      c.includes('superficie') ||
      c.includes('capacite') ||
      c.includes('combien de places') ||
      c.includes('combien de personnes') ||
      c.includes('combien de participants'),
    answer: `🏢 Organisation & Agencement de la salle IML Digit :

La salle est un espace modulable de standing, configuré sur-mesure pour votre événement :

1. Les 3 configurations disponibles :
• Format Conférence / Masterclass (Théâtre) : Jusqu'à 25 participants assis face à l'écran géant et au pupitre animateur. Idéal pour séminaires, présentations et masterclasses.
• Format Réunion d'Affaires (Table en U) : 16 à 18 participants autour d'une grande table centrale. Idéal pour comités de direction, séances de travail d'équipe et conseils d'administration.
• Format Ateliers / Workshops (Îlots de travail) : 18 à 20 participants répartis en petites tables collaboratives. Idéal pour formations pratiques et hackathons.

2. Organisation de l'espace & Confort :
• Espace Animateur / Intervenant : Équipé d'un pupitre face à l'audience avec connectiques directes (HDMI, wifi très haut débit).
• Mobilier ergonomique : Chaises grand confort et tables spacieuses modulables selon vos souhaits.
• Visibilité optimale : Aucune colonne ni angle mort, chaque participant profite d'une vue parfaite sur l'écran et le formateur.
• Espace détente attenant : Salon convivial accessible pour les pauses-café et les échanges informels.`,
    chips: [
      { label: '🖥️ Voir les équipements', action: 'Quels sont les équipements ?' },
      { label: '💳 Tarifs de location', action: 'Quels sont les tarifs de la salle ?' },
      { label: '☕ Pause-café / Traiteur', action: 'Proposez-vous une pause-café ?' },
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
    ],
  },

  // 4. TARIFS OFFICIELS & DEVIS
  {
    id: 'tarifs',
    keywords: ['tarif', 'tarifs', 'prix', 'cout', 'combien', 'montant', 'factur', 'payant', 'forfait', 'devis'],
    matcher: (c) =>
      c.includes('tarif') ||
      c.includes('prix') ||
      c.includes('cout') ||
      c.includes('combien') ||
      c.includes('montant') ||
      c.includes('factur') ||
      c.includes('payant') ||
      c.includes('forfait') ||
      c.includes('devis') ||
      c.includes('combien ca'),
    answer: `📋 Modalités de réservation de la salle IML Digit :

• La mise à disposition de la salle est gérée directement sous la supervision de la Direction de Mugheli Lab.
• Chaque demande soumise en ligne déclenche une alerte immédiate transmise à la Direction.
• Les modalités et le devis personnalisé sont établis en fonction de votre programme (formation, masterclass, séminaire d'entreprise).
• Une confirmation officielle et la fiche récapitulative vous sont transmises sous 24h ouvrées.`,
    chips: [
      { label: '📅 Étapes pour réserver', action: 'Comment réserver la salle ?' },
      { label: '🏢 Organisation de la salle', action: 'Comment est organisée la salle ?' },
      { label: '👥 Capacité d’accueil', action: 'Combien de personnes peut accueillir la salle ?' },
    ],
  },

  // 5. PAIEMENT & FACTURATION
  {
    id: 'paiement',
    keywords: ['paiement', 'payer', 'acompte', 'solde', 'airtel', 'moov', 'virement', 'reglement', 'cheque', 'espece', 'cash', 'quitus', 'banque'],
    matcher: (c) =>
      c.includes('paiement') ||
      c.includes('payer') ||
      c.includes('acompte') ||
      c.includes('airtel') ||
      c.includes('moov') ||
      c.includes('virement') ||
      c.includes('reglement') ||
      c.includes('cheque') ||
      c.includes('espece') ||
      c.includes('cash') ||
      c.includes('quitus') ||
      c.includes('modalite de paiement') ||
      c.includes('rib'),
    answer: `💳 Modalités de règlement & facturation officielle :

• Moyens de paiement acceptés :
  - Airtel Money & Moov Money
  - Virement bancaire (BICIG, BGFIBank, UBA)
  - Chèque certifié de banque
  - Espèces directement à notre siège à Awendjé

• Conditions : Un acompte de 50% valide définitivement le blocage de la salle. Le solde est versé le jour de l'événement.
• Justificatifs : Quitus et facture proforma / définitive avec TVA délivrés pour votre comptabilité.`,
    chips: [
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
      { label: '💳 Voir les tarifs', action: 'Quels sont les tarifs de la salle ?' },
    ],
  },

  // 6. ÉQUIPEMENTS & TECHNOLOGIE
  {
    id: 'equipements',
    keywords: [
      'equipement', 'materiel', 'videoprojecteur', 'projecteur', 'ecran', 'wifi',
      'fibre', 'visioconference', 'visio', 'webcam', 'camera', 'climatisation',
      'paperboard', 'tableau blanc', 'multiprise', 'sonorisation', 'micro'
    ],
    matcher: (c) =>
      c.includes('equipement') ||
      c.includes('materiel') ||
      c.includes('videoprojecteur') ||
      c.includes('projecteur') ||
      c.includes('grand ecran') ||
      c.includes('ecran') ||
      c.includes('wifi') ||
      c.includes('fibre optique') ||
      c.includes('fibre') ||
      c.includes('connexion internet') ||
      c.includes('visioconference') ||
      c.includes('visio') ||
      c.includes('webcam') ||
      c.includes('camera') ||
      c.includes('zoom') ||
      c.includes('teams') ||
      c.includes('google meet') ||
      c.includes('climatisation') ||
      c.includes('clim') ||
      c.includes('paperboard') ||
      c.includes('tableau blanc') ||
      c.includes('multiprise') ||
      c.includes('sonorisation') ||
      c.includes('sono') ||
      c.includes('micro') ||
      c.includes('baffle') ||
      c.includes('enceinte audio') ||
      c.includes('hdmi') ||
      c.includes('ordinateur portable'),
    answer: `🖥️ Équipements inclus sans supplément :

• Vidéoprojection : Grand écran / vidéoprojecteur HD (connectiques HDMI & connexion sans-fil)
• Visioconférence : Caméra grand-angle et micro HD (compatible Zoom, Teams, Google Meet)
• Connexion : Wifi fibre optique très haut débit dédiée
• Climatisation : Climatisation silencieuse réversible
• Supports de travail : Paperboard, tableau blanc effaçable et marqueurs fournis
• Énergie : Multiprises réparties pour l'ensemble des participants
• Disposition : Mobilier modulable selon vos besoins (U, conférence, ateliers).`,
    chips: [
      { label: '🏢 Organisation de la salle', action: 'Comment est organisée la salle ?' },
      { label: '☕ Pause-café / Traiteur', action: 'Proposez-vous une pause-café ?' },
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
    ],
  },

  // 7. PAUSE-CAFÉ & TRAITEUR
  {
    id: 'traiteur',
    keywords: ['pause cafe', 'traiteur', 'repas', 'boisson', 'cocktail', 'dejeuner', 'restauration', 'viennoiserie', 'petit dejeuner'],
    matcher: (c) =>
      c.includes('pause cafe') ||
      c.includes('pause') ||
      c.includes('traiteur') ||
      c.includes('repas') ||
      c.includes('manger') ||
      c.includes('boisson') ||
      c.includes('cocktail') ||
      c.includes('dejeuner') ||
      c.includes('restauration') ||
      c.includes('viennoiserie') ||
      c.includes('petit dejeuner') ||
      c.includes('buffet') ||
      c.includes('eau minerale'),
    answer: `☕ Pause-café & Restauration :

• Formule Pause-Café IML (sur devis) : Café chaud, thés variés, jus de fruits locaux, eau minérale, viennoiseries fraîches et assortiments salés.
• Traiteur externe autorisé : Vous pouvez faire venir votre propre traiteur sans aucun frais supplémentaire ni droit de bouchon !
• Un espace détente convivial attenant est à votre entière disposition.`,
    chips: [
      { label: '💳 Tarifs de la salle', action: 'Quels sont les tarifs de la salle ?' },
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
    ],
  },

  // 8. PROCÉDURE DE RÉSERVATION
  {
    id: 'procedure_reservation',
    keywords: [
      'reserver', 'reservation', 'louer', 'location', 'procedure', 'etapes',
      'demarche', 'processus', 'marche a suivre', 'salle', 'bloquer'
    ],
    matcher: (c) =>
      c.includes('procedure') ||
      c.includes('etapes') ||
      c.includes('demarche') ||
      c.includes('processus') ||
      c.includes('marche a suivre') ||
      c.includes('comment louer') ||
      c.includes('comment reserver') ||
      c.includes('comment faire pour louer') ||
      c.includes('comment faire pour reserver') ||
      c.includes('louer une salle') ||
      c.includes('louer la salle') ||
      c.includes('reserver une salle') ||
      c.includes('reserver la salle') ||
      (c.includes('louer') && c.includes('salle')) ||
      (c.includes('reserver') && c.includes('salle')) ||
      (c.includes('location') && c.includes('salle')) ||
      c.includes('prise de salle') ||
      c === 'reserver' ||
      c === 'reservation' ||
      c === 'louer' ||
      c === 'location',
    answer: `📅 Procédure officielle pour louer et réserver la salle IML Digit :

Voici les étapes simples pour effectuer votre réservation :

1. Définir votre besoin :
• Choisissez votre date (la salle est disponible du lundi au samedi, de 08h00 à 18h00).
• Sélectionnez le créneau souhaité : Session courte (2h), Demi-Journée (4h) ou Journée Complète (8h).

2. Remplir le formulaire en ligne :
• Rendez-vous sur cette page (/salle) dans la section formulaire de réservation.
• Indiquez vos coordonnées (nom, e-mail, téléphone/WhatsApp), le type d'événement et le nombre de participants attendus (jusqu'à 20 à 25 personnes).

3. Validation & Facture proforma officielle :
• Notre responsable de planification vérifie la disponibilité du créneau sous 24h et vous délivre une facture proforma officielle.

4. Confirmation par acompte & Verrouillage de la salle :
• Un acompte de 50% valide définitivement votre réservation. La salle est alors officiellement verrouillée à votre nom et vous recevez un e-mail officiel de confirmation avec toutes les consignes d'accès.
• Règlements acceptés : Airtel Money, Moov Money, Virement bancaire, Chèque certifié ou Espèces à notre siège.

5. Accueil le Jour J :
• Nous vous accueillons au Quartier Awendjé, Libreville, avec tous les équipements configurés et prêts à l'emploi (vidéoprojecteur HD, wifi fibre optique très haut débit, visioconférence HD, climatisation silencieuse, sonorisation et paperboard).`,
  },

  // 9. DÉMARCHE GÉNÉRALE (FAIRE MA DEMANDE)
  {
    id: 'faire_demande',
    keywords: ['demande', 'demarche', 'formulaire', 'inscription', 'soumettre'],
    matcher: (c) =>
      c.includes('comment faire ma demande') ||
      c.includes('faire une demande') ||
      c.includes('marche a suivre') ||
      c.includes('quelle est la demarche') ||
      c.includes('soumettre ma demande'),
    answer: `📝 Pour effectuer votre démarche chez IML Digit :

1. Pour la location de la salle (Prestation payante pour masterclass, formations, réunions) :
• Remplissez simplement le formulaire de réservation situé sur la page /salle avec votre date, créneau et coordonnées.
• Notre équipe vous émet une facture proforma officielle avec le détail des modalités.

2. Pour candidater à l'incubateur IML Digit (Entrepreneurs & Startups) :
• Rendez-vous sur la page Candidater à l'incubation (/candidater) pour soumettre votre projet. L'accompagnement est 100% gratuit et pris en charge pour les porteurs sélectionnés.

Souhaitez-vous des détails sur la salle ou sur le programme d'incubation ?`,
    chips: [
      { label: '📅 Étapes de réservation', action: 'Comment réserver la salle ?' },
      { label: '💳 Tarifs de location', action: 'Quels sont les tarifs de la salle ?' },
      { label: '🌱 Candidater à l\'incubateur', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '📞 Joindre un conseiller', action: 'Quel est votre contact téléphonique ?' },
    ],
  },

  // 10. CRÉATION D'ENTREPRISE & FORMALITÉS AU GABON
  {
    id: 'creation_entreprise_gabon',
    keywords: ['creer une entreprise', 'anpi', 'statuts', 'sarl', 'sas', 'formalites', 'rccm', 'nif', 'immatriculation', 'guichet unique'],
    matcher: (c) =>
      c.includes('creer une entreprise') ||
      c.includes('creation d entreprise') ||
      c.includes('formalite') ||
      c.includes('anpi') ||
      c.includes('statut juridique') ||
      c.includes('sarl') ||
      c.includes('sas') ||
      c.includes('immatriculation') ||
      c.includes('registre de commerce') ||
      c.includes('rccm') ||
      c.includes('cfe'),
    answer: `💼 Création d'entreprise et formalités au Gabon :

Pour formaliser votre activité au Gabon, voici les démarches clés :

1. Choisir la forme juridique adaptée :
• Entreprise Individuelle : Structure simple pour démarrer seul.
• SARL / SARL Unipersonnelle : Idéale pour protéger son patrimoine personnel (capital social flexible).
• SAS / SASU : Très adaptée aux startups tech et aux levées de fonds avec investisseurs.

2. Les étapes au Guichet Unique de l'ANPI Gabon :
• Dépôt des pièces d'identité, justificatif de siège social et casier judiciaire.
• Rédaction et enregistrement des statuts d'entreprise.
• Obtention de votre numéro RCCM (Registre du Commerce), NIF (Numéro d'Identification Fiscale) et agrément.

3. Comment IML Digit vous aide :
Dans le cadre de nos programmes d'incubation, nos experts juridiques vous accompagnent pas-à-pas pour la rédaction de vos statuts et l'immatriculation complète de votre société !`,
    chips: [
      { label: '🌱 Candidater à l\'incubation', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '🎓 Qui sont les coachs ?', action: 'Qui sont les coachs et mentors ?' },
      { label: '📞 Joindre un conseiller', action: 'Quel est votre contact téléphonique ?' },
    ],
  },

  // 11. FINANCEMENT & LEVÉE DE FONDS
  {
    id: 'financement_levee_de_fonds',
    keywords: ['financement', 'financer', 'argent', 'subvention', 'investisseur', 'investisseurs', 'business angel', 'banque', 'pret', 'levee de fonds'],
    matcher: (c) =>
      c.includes('financement') ||
      c.includes('financer') ||
      c.includes('investisseur') ||
      c.includes('levee de fonds') ||
      c.includes('lever des fonds') ||
      c.includes('subvention') ||
      c.includes('business angel') ||
      c.includes('trouver de l argent') ||
      c.includes('credit') ||
      c.includes('capital risque'),
    answer: `💰 Financement et Recherche d'Investisseurs :

IML Digit prépare activement les entrepreneurs à lever des fonds et accéder à des financements :

1. Prérequis pour attirer des financements :
• Un modèle économique validé avec des premiers clients ou preuves d'usage (traction).
• Un Business Plan chiffré sur 3 à 5 ans démontrant la rentabilité future.
• Un Pitch Deck percutant (problème, solution, marché, modèle, équipe, besoin de financement).

2. Sources de financement mobilisables :
• Fonds propres & Love Money (entourage, associés).
• Concours d'innovation, bourses et subventions d'organismes de développement.
• Business Angels et fonds de capital-risque partenaires du hub IML Digit.
• Lignes de crédit bancaire et microfinance partenaires.

Nos mentors en finance d'entreprise vous coachent pour structurer votre dossier et vous mettent en relation directe avec notre réseau d'investisseurs.`,
    chips: [
      { label: '🌱 Candidater à l\'incubation', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '🎓 Qui sont les coachs ?', action: 'Qui sont les coachs et mentors ?' },
      { label: '🏢 Voir la salle de pitch', action: 'Comment est organisée la salle ?' },
    ],
  },

  // 12. DÉVELOPPEMENT PRODUIT, DIGITAL & TECH (MVP)
  {
    id: 'tech_digital_mvp',
    keywords: ['application', 'site web', 'developpement', 'logiciel', 'coder', 'mvp', 'ui ux', 'technologie', 'prototype'],
    matcher: (c) =>
      c.includes('application mobile') ||
      c.includes('site web') ||
      c.includes('developpement informatique') ||
      c.includes('mvp') ||
      c.includes('prototype') ||
      c.includes('logiciel') ||
      c.includes('developper une application') ||
      c.includes('ui ux') ||
      c.includes('solution tech'),
    answer: `🚀 Conception Digitale, Prototypage & MVP :

Chez IML Digit, nous guidons les créateurs de solutions numériques pour transformer leur idée en un produit fonctionnel :

1. Démarche MVP (Produit Minimum Viable) :
• Définir les fonctionnalités essentielles résolvant le problème majeur de vos utilisateurs.
• Prototyper les écrans (maquettes interactives Figma) avant tout investissement en code.
• Lancer rapidement pour tester auprès du public et itérer sur la base des retours réels.

2. Accompagnement technique au Hub :
• Recommandations sur les choix technologiques (web, mobile, bases de données, sécurité).
• Ateliers d'architecture logicielle avec nos experts tech.
• Accès à notre salle tout équipée avec wifi fibre optique pour vos sprints de travail et démonstrations.`,
    chips: [
      { label: '🌱 Candidater à l\'incubation', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '🖥️ Équipements inclus', action: 'Quels sont les équipements ?' },
      { label: '🏢 Réserver la salle pour une séance', action: 'Comment réserver la salle ?' },
    ],
  },

  // 13. TOURNAGE, PHOTOS & VIDÉOS DANS LA SALLE
  {
    id: 'shooting_tournage',
    keywords: ['tournage', 'filmer', 'video', 'photos', 'shooting', 'podcast', 'enregistrement', 'micro'],
    matcher: (c) =>
      c.includes('tournage') ||
      c.includes('filmer') ||
      c.includes('prendre des photos') ||
      c.includes('shooting') ||
      c.includes('podcast') ||
      c.includes('enregistrer une video') ||
      c.includes('captation'),
    answer: `🎬 Tournage vidéo, Shooting & Captation dans la salle :

Oui, notre salle est parfaitement adaptée aux captations vidéo, tournages de masterclass et séances photos :

• Luminosité soignée et éclairage modulable.
• Espace spacieux permettant l'installation de trépieds, caméras, projecteurs et éclairages d'appoint.
• Climatisation silencieuse limitant les bruits parasites de fond.
• Fond moderne et professionnel mettant en valeur vos intervenants.
• Wifi fibre très haut débit pour le streaming en direct (live YouTube, LinkedIn, Facebook).`,
    chips: [
      { label: '💳 Tarifs de la salle', action: 'Quels sont les tarifs de la salle ?' },
      { label: '🏢 Organisation de la salle', action: 'Comment est organisée la salle ?' },
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
    ],
  },

  // 14. LOCALISATION & ACCÈS
  {
    id: 'adresse',
    keywords: ['adresse', 'localisation', 'situe', 'quartier', 'awendje', 'awendjé', 'libreville', 'parking', 'se garer', 'acces', 'venir'],
    matcher: (c) =>
      c.includes('adresse') ||
      c.includes('localisation') ||
      c.includes('ou se trouve') ||
      c.includes('ou est situe') ||
      c.includes('ou vous etes') ||
      c.includes('quartier') ||
      c.includes('awendje') ||
      c.includes('awendjé') ||
      c.includes('libreville') ||
      c.includes('parking') ||
      c.includes('se garer') ||
      c.includes('comment venir') ||
      c.includes('itineraire'),
    answer: `📍 Localisation & Accès à IML Digit :

• Adresse : Immeuble Espace PME, Quartier Awendjé, Libreville, Gabon.
• Repères : Idéalement situé à proximité du carrefour Awendjé, sur les grands axes faciles d'accès.
• Stationnement : Places de parking sécurisées disponibles directement devant le bâtiment.`,
    chips: [
      { label: '📞 Téléphone & WhatsApp', action: 'Quel est votre contact téléphonique ?' },
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
    ],
  },

  // 15. HORAIRES D'OUVERTURE
  {
    id: 'horaires',
    keywords: ['horaire', 'heures', 'ouvert', 'fermeture', 'ouverture', 'weekend', 'samedi', 'dimanche', 'soir'],
    matcher: (c) =>
      c.includes('horaire') ||
      c.includes('heures d ouverture') ||
      c.includes('ouvert le samedi') ||
      c.includes('ouvert le dimanche') ||
      c.includes('fermeture') ||
      c.includes('ouverture') ||
      c.includes('weekend') ||
      c.includes('week end') ||
      c.includes('afterwork') ||
      c.includes('en soiree'),
    answer: `⏰ Horaires d'ouverture & Disponibilité :

• Lundi au vendredi : 08h00 – 18h00
• Samedi : 08h00 – 18h00 (sur réservation confirmée)
• Soirées (afterworks jusqu'à 21h) ou dimanches : Disponibles sur demande spécifique préalable auprès de notre équipe.`,
    chips: [
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
      { label: '📍 Où êtes-vous situés ?', action: 'Quelle est votre adresse ?' },
    ],
  },

  // 16. ANNULATION & REPORT
  {
    id: 'annulation',
    keywords: ['annul', 'report', 'rembours', 'modifier', 'empechement'],
    matcher: (c) =>
      c.includes('annul') ||
      c.includes('report') ||
      c.includes('rembours') ||
      c.includes('modifier ma date') ||
      c.includes('empechement'),
    answer: `🔄 Politique de report et d'annulation :

• Report sans frais : Possible jusqu'à 48 heures avant l'événement sous réserve de disponibilité du nouveau créneau.
• Annulation : En cas d'annulation notifiée plus de 72h avant, l'acompte est reporté sous forme d'avoir valable 6 mois.`,
    chips: [
      { label: '📞 Joindre un conseiller', action: 'Quel est votre contact téléphonique ?' },
      { label: '💳 Tarifs & Devis', action: 'Quels sont les tarifs de la salle ?' },
    ],
  },

  // 17. VISITE DES LIEUX
  {
    id: 'visite',
    keywords: ['visite', 'visiter', 'voir la salle', 'passer voir', 'decouvrir les locaux'],
    matcher: (c) =>
      c.includes('visite') ||
      c.includes('visiter') ||
      c.includes('voir la salle') ||
      c.includes('passer voir') ||
      c.includes('decouvrir les locaux'),
    answer: `🏢 Visite des lieux :

Vous êtes les bienvenus pour visiter la salle avant de confirmer votre événement !
Les visites sont organisées du lundi au vendredi de 09h00 à 16h00 sur rendez-vous. Contactez-nous par téléphone ou WhatsApp pour convenir d'une heure de passage.`,
    chips: [
      { label: '📞 Téléphone / WhatsApp', action: 'Quel est votre contact téléphonique ?' },
      { label: '📍 Voir l\'adresse', action: 'Quelle est votre adresse ?' },
    ],
  },

  // 18. CONTACT HUMAIN & SUPPORT
  {
    id: 'contact',
    keywords: ['contact', 'telephone', 'numero', 'whatsapp', 'email', 'appeler', 'joindre'],
    matcher: (c) =>
      c.includes('contact') ||
      c.includes('telephone') ||
      c.includes('numero') ||
      c.includes('whatsapp') ||
      c.includes('adresse email') ||
      c.includes('parler a un conseiller') ||
      c.includes('parler avec un agent') ||
      c.includes('appeler'),
    answer: `📞 Contacts directs IML Digit :

• Téléphone / WhatsApp : +241 066 64 84 88
• E-mail : imlGabon2@gmail.com
• Adresse : Immeuble Espace PME, Quartier Awendjé, Libreville
• Page Contact : Formulaire accessible sur /contact

Notre équipe est joignable du lundi au vendredi de 08h00 à 18h00.`,
    chips: [
      { label: '📅 Comment réserver ?', action: 'Comment réserver la salle ?' },
      { label: '💳 Tarifs de location', action: 'Quels sont les tarifs de la salle ?' },
    ],
  },

  // 19. À PROPOS DE IML DIGIT
  {
    id: 'a_propos',
    keywords: ['qui etes vous', 'c est quoi iml digit', 'qu est ce que iml', 'hub', 'vocation'],
    matcher: (c) =>
      c.includes('qui etes vous') ||
      c.includes('c est quoi iml digit') ||
      c.includes('qu est ce que iml') ||
      c.includes('a propos d iml'),
    answer: `🚀 À propos d'IML Digit :

IML Digit est le Hub d'Incubation, d'Accélération et d'Innovation Numérique de référence au Gabon.

Nos deux activités principales :
1. Accompagner les entrepreneurs et startups innovantes de l'idée jusqu'au déploiement commercial (coaching, stratégie, technologie, financement).
2. Mettre à disposition un espace moderne et tout équipé (salle de réunion/masterclass 20-25 places) pour les entreprises et formateurs.`,
    chips: [
      { label: '🌱 Devenir incubé', action: 'Comment candidater au programme d\'incubation ?' },
      { label: '📅 Louer la salle', action: 'Quels sont les tarifs de la salle ?' },
    ],
  },

  // 20. REMERCIEMENTS
  {
    id: 'merci',
    keywords: ['merci', 'parfait', 'super', 'top', 'genial', 'd accord'],
    matcher: (c) =>
      c.includes('merci') ||
      c === 'super' ||
      c === 'top' ||
      c === 'parfait' ||
      c === 'genial' ||
      c === 'd accord' ||
      c === 'ok',
    answer: `Avec grand plaisir ! N'hésitez pas si vous avez la moindre autre question sur nos prestations ou nos programmes.

Vous pouvez soumettre votre réservation à tout moment via le formulaire en ligne sur la page /salle. Excellente journée à vous ! ✨`,
  },
];

/** Moteur de réponse universelle intelligente : répond de façon précise à toute question */
function generateUniversalAnswer(rawQuery: string, clean: string): string {
  // Questions commerciales / prospection
  if (clean.includes('client') || clean.includes('vente') || clean.includes('marche') || clean.includes('vendre') || clean.includes('prospect')) {
    return `🎯 Trouver vos premiers clients et développer vos ventes :

Pour valider votre marché et développer votre chiffre d'affaires :
1. Définir votre cible prioritaire (Persona) : identifiez les profils ayant le problème le plus urgent et le budget disponible.
2. Approche directe : allez à la rencontre de vos 10 premiers prospects pour affiner votre proposition de valeur.
3. Visibilité : activez LinkedIn, WhatsApp Business et un support de présentation soigné.

Nos mentors accompagnent les startups et PME sur toute leur stratégie commerciale au sein de l'incubateur !`;
  }

  // Questions gouvernance / équipe
  if (clean.includes('fondateur') || clean.includes('directeur') || clean.includes('qui dirige') || clean.includes('qui a cree')) {
    return `👥 Gouvernance et Direction d'IML Digit :

IML Digit est piloté par une équipe dédiée au développement de l'entrepreneuriat, de la transformation digitale et de l'innovation au Gabon.
Le hub rassemble des conseillers référents, des experts métiers ainsi que des partenaires économiques et institutionnels.

Pour échanger avec la direction ou nos conseillers, notre équipe est à votre disposition au +241 077 00 00 00 ou directement à notre siège au Quartier Awendjé, Libreville.`;
  }

  // Délais de réservation / anticipation
  if (clean.includes('avance') || clean.includes('delai') || clean.includes('combien de temps')) {
    return `⏱️ Délai recommandé pour réserver la salle :

• Nous vous conseillons de réserver au moins 48h à 72h à l'avance afin de garantir la disponibilité du créneau souhaité et de permettre la mise en place de votre configuration (U, théâtre ou îlots).
• Pour une demande urgente sous 24h ou le jour même, vous pouvez soumettre votre formulaire sur /salle ou joindre directement la conciergerie au +241 077 00 00 00.`;
  }

  // Visite de la salle
  if (clean.includes('visite') || clean.includes('visiter') || clean.includes('voir la salle') || clean.includes('voir les locaux')) {
    return `📍 Visite de la salle et des installations :

• Vous êtes le bienvenu pour visiter notre salle avant de valider votre réservation !
• Nous vous accueillons du lundi au vendredi de 08h30 à 17h30 à notre siège situé au Quartier Awendjé, Libreville.
• Contactez-nous au +241 077 00 00 00 pour convenir de votre venue.`;
  }

  // Disponibilité week-end
  if (clean.includes('weekend') || clean.includes('samedi') || clean.includes('dimanche')) {
    return `📅 Disponibilités en week-end :

• Samedi : la salle est ouverte et réservable de 08h00 à 18h00 au même tarif officiel.
• Dimanche : privatisation possible sur demande spécifique préalable.
• Vous pouvez sélectionner votre samedi directement sur le formulaire de réservation en ligne sur la page /salle.`;
  }

  // Réponse personnalisée directe
  return `Pour répondre précisément à votre demande concernant « ${stripAsterisks(rawQuery)} » :

• S'il s'agit de la location de salle (réunions, formations, masterclasses) : la démarche s'effectue via le formulaire de réservation sur la page /salle. Dès soumission, notre conciergerie vous établit votre facture proforma officielle et verrouille la salle.
• S'il s'agit d'un accompagnement de projet ou startup : le dépôt de dossier est ouvert gratuitement sur la page /candidater.
• Vous pouvez également contacter directement notre conseiller au +241 077 00 00 00 ou par WhatsApp pour toute précision sur-mesure.`;
}

export default function RoomAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'bot',
      text: 'Bonjour 👋 Je suis l\'assistant IML Digit. Je réponds à toutes vos questions et vous renseigne en direct sur nos services, la salle et nos programmes. Comment puis-je vous aider ?',
    },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const say = (text: string) => {
    setMsgs((m) => [...m, { from: 'bot', text: stripAsterisks(text) }]);
  };

  const resetChat = () => {
    setMsgs([
      {
        from: 'bot',
        text: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
      },
    ]);
  };

  const send = (raw?: string) => {
    const rawText = (raw ?? input).trim();
    if (!rawText) return;
    setInput('');
    setMsgs((m) => [...m, { from: 'user', text: rawText }]);

    const cleanFull = cleanText(rawText);
    const cleanCore = extractQueryCore(cleanFull);

    // Salutation pure (l'utilisateur n'a écrit que "bonjour", "salut", etc.)
    if (isPureGreeting(cleanFull)) {
      return say("Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ? Posez-moi directement votre question sur nos services, la réservation de la salle, nos tarifs ou l'incubation, je vous réponds avec plaisir.");
    }

    // 1. Recherche par matcher direct (priorité au cœur de la question, puis chaîne complète)
    const topic = KNOWLEDGE_BASE.find((k) => k.matcher(cleanCore) || k.matcher(cleanFull));
    if (topic) {
      return say(topic.answer);
    }

    // 2. Recherche par score de pertinence des mots-clés
    const scored = KNOWLEDGE_BASE.map((item) => {
      let score = 0;
      for (const kw of item.keywords) {
        if (cleanCore.includes(kw)) {
          score += kw.length >= 5 ? 3 : 2;
        } else if (cleanFull.includes(kw)) {
          score += 1;
        }
      }
      return { item, score };
    }).sort((a, b) => b.score - a.score);

    if (scored[0] && scored[0].score > 0) {
      return say(scored[0].item.answer);
    }

    // 3. Moteur universel pour toute autre interrogation
    const universal = generateUniversalAnswer(rawText, cleanCore || cleanFull);
    say(universal);
  };

  return (
    <>
      {/* =========================================================================
          BOUTON FLOTTANT EN ICÔNE (FAB CIRCULAIRE)
         ========================================================================= */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Tooltip discret visible au survol sur desktop */}
          <div className="hidden sm:block opacity-0 hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 pointer-events-none whitespace-nowrap">
            Besoin d'aide ou d'un devis ?
          </div>

          {/* Bouton circulaire */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir l'assistant IML Digit"
            className="group relative size-14 sm:size-15 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] text-white shadow-xl shadow-orange-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-400/40"
          >
            {/* Pastille verte "En ligne" animée */}
            <span className="absolute top-0 right-0 flex size-3.5 -mt-0.5 -mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3.5 bg-emerald-500 border-2 border-white" />
            </span>

            <MessageCircle className="size-7 transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}

      {/* =========================================================================
          FENÊTRE DE CHAT OUVERTE
         ========================================================================= */}
      {open && (
        <div
          role="dialog"
          aria-label="Assistant IML Digit"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
        >
          {/* Header de la fenêtre : "Guide & réponses à toutes vos questions" a été retiré selon la demande */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-10 rounded-2xl bg-[#FF5B37] text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                  <Bot className="size-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Assistant IML Digit</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-[#FF5B37] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="size-2.5" /> IA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En ligne 24/7</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Réinitialiser la conversation"
                aria-label="Réinitialiser"
                className="size-8 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fermer"
                aria-label="Fermer"
                className="size-8 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Corps de discussion défilable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F5]">
            {msgs.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                <div
                  className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                    m.from === 'user'
                      ? 'bg-[#FF5B37] text-white rounded-br-sm'
                      : 'bg-white border border-stone-200/90 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {stripAsterisks(m.text)}
                </div>
              </div>
            ))}

            <div ref={endRef} />
          </div>

          {/* Formulaire de saisie utilisateur */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez n'importe quelle question (coachs, salle, création, financement)..."
              className="flex-1 px-4 py-2.5 rounded-full border border-stone-200 bg-stone-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF5B37] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Envoyer le message"
              className="size-10 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm shadow-orange-500/20"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

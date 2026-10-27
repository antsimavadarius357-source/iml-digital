import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Network, 
  BookOpen, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Check, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { openAuthModal } from '../auth/AuthModal';

interface ModuleDetail {
  id: string;
  badge: string;
  badgeColor: string;
  category: 'PILOTAGE & SUIVI DE PROJET' | 'BÉNÉFICIAIRES & ACCRÉDITATION';
  title: string;
  shortDesc: string;
  longDesc: string;
  icon: any;
  color: string;
  bgLight: string;
  borderColor: string;
  etapesOrHighlights: {
    title: string;
    description: string;
    tag?: string;
  }[];
  keyFeatures: string[];
  operationalBenefits: {
    label: string;
    value: string;
  }[];
  deliverables: string[];
}

const MODULES_DATA: ModuleDetail[] = [
  {
    id: 'parcours',
    badge: '5 étapes séquentielles',
    badgeColor: 'bg-orange-100 text-[#f06553] border-orange-200',
    category: 'PILOTAGE & SUIVI DE PROJET',
    title: 'Parcours & Jalons Opérationnels',
    shortDesc: 'Structuration séquentielle par paliers avec déblocage conditionné aux livrables et comités.',
    longDesc: 'Le module Parcours & Jalons organise la trajectoire de chaque entreprise accompagnée à travers un cycle méthodique en 5 grandes étapes. Aucun palier ne peut être franchi sans le dépôt des livrables requis et la validation formelle des mentors référents.',
    icon: Network,
    color: '#f06553',
    bgLight: 'bg-orange-50/70',
    borderColor: 'border-orange-200',
    etapesOrHighlights: [
      {
        title: 'Étape 1 : Idéation & Cadrage de l’Opportunité',
        description: 'Formalisation du problème résolu, ciblage des personas, validation de la proposition de valeur et cartographie des hypothèses critiques.',
        tag: 'Jalon 1'
      },
      {
        title: 'Étape 2 : Structuration & Modèle Économique',
        description: 'Construction du Business Model Canvas, analyse de rentabilité unitaire, étude de marché concurrentielle et choix de la forme juridique OHADA.',
        tag: 'Jalon 2'
      },
      {
        title: 'Étape 3 : Prototypage & Produit Minimum Viable (MVP)',
        description: 'Conception des spécifications clés, maquettage, développement de la version test et confrontation directe avec les utilisateurs cibles.',
        tag: 'Jalon 3'
      },
      {
        title: 'Étape 4 : Go-to-Market & Premiers Clients',
        description: 'Mise en œuvre du plan commercial, activation des canaux d’acquisition, signature des premières ventes et calcul du coût d’acquisition client.',
        tag: 'Jalon 4'
      },
      {
        title: 'Étape 5 : Financement, Levée & Passage à l’Échelle',
        description: 'Élaboration du plan financier prévisionnel sur 3 ans, plan de trésorerie, pitch deck investisseurs et mise en relation avec les banques et fonds partenaires.',
        tag: 'Jalon 5'
      }
    ],
    keyFeatures: [
      'Gating automatique : le passage au jalon suivant est conditionné aux livrables validés',
      'Calcul en temps réel de la vélocité et du temps moyen passé sur chaque étape',
      'Alertes proactives envoyées aux coordinateurs en cas de stagnation prolongée',
      'Personnalisation complète du nombre d’étapes selon la filière (Agri, Tech, Artisanat, Services)',
      'Génération d’une feuille de route visuelle partagée entre porteur et mentors'
    ],
    operationalBenefits: [
      { label: 'Taux de survie des projets', value: '+35%' },
      { label: 'Visibilité sur l’avancement', value: '100% temps réel' },
      { label: 'Durée moyenne de passage', value: '6 à 9 mois' }
    ],
    deliverables: [
      'Fiche diagnostic d’opportunité',
      'Business Model Canvas validé',
      'Spécifications fonctionnelles MVP',
      'Matrice commerciale Go-to-Market',
      'Plan financier prévisionnel sur 3 ans'
    ]
  },
  {
    id: 'notes',
    badge: 'Journal officiel inaltérable',
    badgeColor: 'bg-orange-100 text-[#f06553] border-orange-200',
    category: 'PILOTAGE & SUIVI DE PROJET',
    title: 'Notes & Comptes-rendus de Séance',
    shortDesc: 'Journal officiel d’accompagnement, relevé d’engagements réciproques et procès-verbaux certifiés.',
    longDesc: 'Chaque heure de mentorat ou de conseil donne lieu à une traçabilité rigoureuse. Les notes de suivi permettent de consigner les décisions stratégiques, d’attribuer des plans d’actions concrets et de constituer le dossier historique officiel de l’entreprise.',
    icon: BookOpen,
    color: '#f06553',
    bgLight: 'bg-orange-50/70',
    borderColor: 'border-orange-200',
    etapesOrHighlights: [
      {
        title: 'Prise de notes guidée & thématique',
        description: 'Formulaires structurés par dimensions : stratégie, finance, commercial, technique, ressources humaines et conformité administrative.'
      },
      {
        title: 'Matrice d’engagements & Actions to-do',
        description: 'Attribution claire de tâches avec échéances précises pour le porteur et le mentor. Suivi de réalisation lors de la session suivante.'
      },
      {
        title: 'Horodatage & Inaltérabilité',
        description: 'Chaque compte-rendu est signé numériquement et horodaté, empêchant toute modification a posteriori et garantissant l’intégrité des audits.'
      },
      {
        title: 'Génération de Procès-Verbaux PDF',
        description: 'Exportation en un clic de PV officiels sous la charte de l’incubateur pour transmission aux comités techniques ou aux bailleurs.'
      }
    ],
    keyFeatures: [
      'Éditeur riche avec insertion d’objectifs, de pièces jointes et d’indicateurs chiffrés',
      'Classification par degré de confidentialité (partagé avec le porteur ou note interne superviseur)',
      'Historique chronologique complet disponible sur la fiche 360° du porteur',
      'Notification automatique par email au bénéficiaire avec la synthèse des actions convenues',
      'Suivi du taux de respect des engagements d’une séance à l’autre'
    ],
    operationalBenefits: [
      { label: 'Temps de rédaction des PV', value: '-60%' },
      { label: 'Taux de réalisation des actions', value: '88%' },
      { label: 'Conformité d’audit', value: '100% certifiée' }
    ],
    deliverables: [
      'Procès-verbal de séance horodaté',
      'Relevé d’engagements réciproques',
      'Fiche d’alerte sur point de blocage',
      'Synthèse trimestrielle de mentorat'
    ]
  },
  {
    id: 'agenda',
    badge: 'Planification certifiée',
    badgeColor: 'bg-orange-100 text-[#f06553] border-orange-200',
    category: 'PILOTAGE & SUIVI DE PROJET',
    title: 'Agenda & Convocations Officielles',
    shortDesc: 'Planification synchronisée des rendez-vous de mentorat et lettres de convocation officielles.',
    longDesc: 'Finis les rendez-vous manqués et les convocations informelles. Le module Agenda gère les disponibilités des experts de l’Espace PME Libreville, émet des convocations officielles opposables et garantit un taux de présence maximal.',
    icon: Calendar,
    color: '#f06553',
    bgLight: 'bg-orange-50/70',
    borderColor: 'border-orange-200',
    etapesOrHighlights: [
      {
        title: 'Planning dynamique multi-intervenants',
        description: 'Visualisation des créneaux des coachs permanents, des mentors bénévoles et des salles de réunion de l’incubateur.'
      },
      {
        title: 'Génération automatique des convocations',
        description: 'Émission de lettres de convocation officielles précisant l’ordre du jour, les livrables attendus et le cadre d’engagement.'
      },
      {
        title: 'Émargement électronique en direct',
        description: 'Pointage de présence horodaté dès l’ouverture de séance avec notification instantanée au coordinateur.'
      },
      {
        title: 'Gestion des reports & assiduité',
        description: 'Règles strictes de préavis en cas d’empêchement et calcul automatique du taux d’assiduité par bénéficiaire.'
      }
    ],
    keyFeatures: [
      'Synchronisation calendrier Outlook / Google Calendar pour mentors et porteurs',
      'Envoi de rappels automatiques par email et SMS 48h et 2h avant le rendez-vous',
      'Gestion des séances individuelles et des ateliers de cohorte collectifs',
      'Intégration native des liens de visioconférence sécurisée si séance à distance',
      'Tableau de bord de suivi des no-shows avec alertes automatiques à la direction'
    ],
    operationalBenefits: [
      { label: 'Taux de présence aux séances', value: '96%' },
      { label: 'Temps de coordination planning', value: 'Divisé par 3' },
      { label: 'Délais de convocation', value: 'Immédiat' }
    ],
    deliverables: [
      'Lettre de convocation officielle',
      'Feuille d’émargement dématérialisée',
      'Attestation de présence nominative',
      'Rapport d’assiduité de cohorte'
    ]
  },
  {
    id: 'porteurs',
    badge: 'Diagnostic & Coffre-fort',
    badgeColor: 'bg-teal-100 text-[#178578] border-teal-200',
    category: 'BÉNÉFICIAIRES & ACCRÉDITATION',
    title: 'Porteurs & PME 360°',
    shortDesc: 'Fiches d’entreprises complètes, diagnostic entrepreneurial, conformité légale et coffre-fort documentaire.',
    longDesc: 'Une vue panoramique exhaustive sur chaque entrepreneur et structure accompagnée. De l’immatriculation RCCM au diagnostic de maturité initiale, toutes les informations clés sont réunies en un point unique et sécurisé.',
    icon: Users,
    color: '#178578',
    bgLight: 'bg-teal-50/70',
    borderColor: 'border-teal-200',
    etapesOrHighlights: [
      {
        title: 'Fiche d’identité juridique & administrative',
        description: 'Raison sociale, sigle, numéro RCCM, NIF, forme juridique OHADA (SARL, SAS, ETS), secteur d’activité et localisation géographique.'
      },
      {
        title: 'Diagnostic entrepreneurial multidimensionnel',
        description: 'Évaluation initiale sur 6 axes (Stratégie, Marché, Équipe, Produit, Finance, Juridique) pour identifier les priorités d’accompagnement.'
      },
      {
        title: 'Coffre-fort documentaire sécurisé',
        description: 'Stockage centralisé des statuts, attestations fiscales, pièces d’identité des fondateurs, brevets, bail commercial et justificatifs.'
      },
      {
        title: 'Historique consolidé & référents',
        description: 'Traçabilité des promotions, coachs et mentors affectés, jalons franchis et historique de tous les échanges passés.'
      }
    ],
    keyFeatures: [
      'Radar entrepreneurial visuel généré automatiquement lors du diagnostic initial',
      'Système de tags et segmentation avancée (filières, niveau de maturité, zone géographique)',
      'Suivi de la composition de l’équipe fondatrice et des recrutements réalisés',
      'Recherche instantanée et filtres multicritères sur l’ensemble du vivier PME',
      'Exports de données conformes aux formats exigés par les ministères et bailleurs'
    ],
    operationalBenefits: [
      { label: 'Temps de constitution dossier', value: '-70%' },
      { label: 'Exhaustivité documentaire', value: '99%' },
      { label: 'Visibilité équipe', value: '360° unifiée' }
    ],
    deliverables: [
      'Rapport de diagnostic d’entrée',
      'Fiche d’entreprise certifiée 360°',
      'Dossier de conformité légale',
      'Bilan annuel d’évolution PME'
    ]
  },
  {
    id: 'prestations',
    badge: 'Pointage horodaté',
    badgeColor: 'bg-teal-100 text-[#178578] border-teal-200',
    category: 'BÉNÉFICIAIRES & ACCRÉDITATION',
    title: 'Prestations & Quotas d’Accompagnement',
    shortDesc: 'Pointage horodaté des heures d’accompagnement et suivi en direct des quotas alloués par convention.',
    longDesc: 'Pour justifier les subventions et piloter l’efficacité des interventions, ce module enregistre chaque prestation délivrée, contrôle la consommation des heures allouées et valorise les coûts d’accompagnement pour les bailleurs de fonds.',
    icon: Clock,
    color: '#178578',
    bgLight: 'bg-teal-50/70',
    borderColor: 'border-teal-200',
    etapesOrHighlights: [
      {
        title: 'Pointage horodaté par type d’intervention',
        description: 'Enregistrement précis de la durée : coaching individuel, atelier collectif, expertise juridique, expertise comptable ou revue de livrables.'
      },
      {
        title: 'Contrôle des quotas alloués en temps réel',
        description: 'Suivi du forfait d’heures attribué par bénéficiaire (ex: 40h de mentorat + 15h d’expertise technique) avec jauge d’avancement.'
      },
      {
        title: 'Valorisation financière & taux horaires',
        description: 'Application des grilles tarifaires de référence pour calculer le coût réel de l’accompagnement apporté à chaque porteur.'
      },
      {
        title: 'Justificatifs pour bailleurs de fonds',
        description: 'Génération d’états récapitulatifs complets avec signatures des parties pour les audits des bailleurs (AFD, BAD, PNUD, État).'
      }
    ],
    keyFeatures: [
      'Jauge visuelle de consommation des heures par bénéficiaire et par expert',
      'Notification automatique lorsque 80% puis 100% du quota d’heures est atteint',
      'Validation obligatoire du pointage par le coach et contre-signature du porteur',
      'Consolidation analytique globale par cohorte, par secteur et par programme',
      'Export Excel et PDF certifié pour le contrôle de gestion et les commissaires aux comptes'
    ],
    operationalBenefits: [
      { label: 'Précision de refacturation / audit', value: '100% justifié' },
      { label: 'Élimination des heures non pointées', value: '0 perte' },
      { label: 'Gain sur la reddition de comptes', value: '15 jours / cohorte' }
    ],
    deliverables: [
      'Bordereau mensuel d’heures d’expertise',
      'Relevé de consommation de quota',
      'État récapitulatif pour bailleurs',
      'Attestation de fin de forfait'
    ]
  },
  {
    id: 'validation',
    badge: 'Qualité & Homologation',
    badgeColor: 'bg-teal-100 text-[#178578] border-teal-200',
    category: 'BÉNÉFICIAIRES & ACCRÉDITATION',
    title: 'Validation des Jalons & Contrôle Qualité',
    shortDesc: 'Contrôle qualité, passage officiel des étapes d’incubation et certification des livrables clés.',
    longDesc: 'Garant du standard d’excellence de l’Incubateur Multisectoriel de Libreville, ce module encadre les comités d’homologation. Les jurys évaluent les livrables selon une grille rigoureuse avant d’autoriser le passage à l’étape suivante.',
    icon: CheckCircle2,
    color: '#178578',
    bgLight: 'bg-teal-50/70',
    borderColor: 'border-teal-200',
    etapesOrHighlights: [
      {
        title: 'Revue formelle des livrables clés',
        description: 'Dépôt des documents exigés (BMC, prototype, étude de marché, bilan financier) avec historique des versions et commentaires.'
      },
      {
        title: 'Grille d’évaluation multicritères normalisée',
        description: 'Notation sur des critères objectifs : faisabilité technique, traction marché, viabilité financière, posture de l’équipe dirigeante.'
      },
      {
        title: 'Décision collégiale de commission',
        description: 'Délibération formalisée : Validation avec félicitations, Validation simple, Validation sous réserves ou Ajournement motivé.'
      },
      {
        title: 'Certificat officiel d’homologation de palier',
        description: 'Émission d’un diplôme ou attestation officielle de franchissement de jalon avec signature de la Direction de l’incubateur.'
      }
    ],
    keyFeatures: [
      'Gestion des sessions de jury et comités d’étape avec ordre de passage',
      'Espace de notation en direct sur tablette ou ordinateur pour les membres du jury',
      'Consolidation automatique des notes et calcul de la moyenne décisionnelle',
      'Notification immédiate et motivée transmise au porteur de projet',
      'Archivage probant des PV de délibération pour la gouvernance de l’établissement'
    ],
    operationalBenefits: [
      { label: 'Rigueur du filtre de sélection', value: 'Excellence garantie' },
      { label: 'Délai de décision de jury', value: 'Instantané' },
      { label: 'Transparence pour les porteurs', value: '100% justifié' }
    ],
    deliverables: [
      'Procès-verbal de délibération de jury',
      'Fiche d’évaluation multicritères',
      'Certificat officiel de passage de jalon',
      'Recommandations écrites du comité'
    ]
  }
];

export default function FonctionnalitesPage() {
  const location = useLocation();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('parcours');

  useEffect(() => {
    // Si un hash est présent dans l'URL (#parcours, #notes, etc.)
    if (location.hash) {
      const hashId = location.hash.replace('#', '');
      const found = MODULES_DATA.find(m => m.id === hashId);
      if (found) {
        setSelectedModuleId(found.id);
        const element = document.getElementById(found.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-slate-900 font-sans selection:bg-[#f06553] selection:text-white">
      
      {/* =========================================================================
          HERO BANNER
         ========================================================================= */}
      <section className="relative bg-[#14233c] text-white pt-16 pb-20 px-6 overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/10 via-[#f06553]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-6">
            <span className="size-2 rounded-full bg-[#f06553] animate-pulse" />
            <span>Architecture Opérationnelle Complète</span>
            <span className="text-slate-500">|</span>
            <span className="text-teal-400">Espace PME Libreville</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-4xl mb-6">
            Spécifications détaillées des <span className="text-[#38d9a9]">6 modules clés</span> de la plateforme
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
            Découvrez en profondeur l'outillage professionnel conçu pour encadrer chaque étape de l'incubation, garantir la traçabilité des financements et accélérer la croissance des PME gabonaises.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/candidater"
              className="px-6 py-3 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-lg shadow-[#f06553]/25 transition-all text-sm flex items-center gap-2"
            >
              <Sparkles className="size-4" />
              <span>Déposer un projet en ligne</span>
            </Link>
            <button
              type="button"
              onClick={() => openAuthModal('connexion')}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition-all text-sm flex items-center gap-2"
            >
              <span>Accéder à l'espace équipe</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ARCHITECTURE OVERVIEW CARD (Matching official reference)
         ========================================================================= */}
      <section className="relative z-20 max-w-[1100px] mx-auto px-6 -mt-12 mb-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200/80 text-slate-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-[#f06553] shrink-0" />
              <h3 className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide text-slate-800">
                ARCHITECTURE DES MODULES OPÉRATIONNELS IML DIGIT
              </h3>
            </div>
            <span className="text-[11px] sm:text-[11.5px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
              Plateforme Souveraine d'Accompagnement
            </span>
          </div>

          {/* 2 Columns of Tiles (Carreaux) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 py-6">
            {/* Colonne 1 : PILOTAGE & SUIVI DE PROJET */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#f06553] mb-3">
                PILOTAGE & SUIVI DE PROJET
              </h4>

              {/* Tile 1 : Parcours & Jalons */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('parcours');
                  document.getElementById('parcours')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-2 rounded-2xl hover:bg-orange-50/60 transition-all group cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Network className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-slate-900 group-hover:text-[#f06553] transition-colors">
                      Parcours & Jalons
                    </span>
                    <span className="text-[10px] font-bold text-[#f06553] bg-orange-100/80 px-2 py-0.5 rounded-md">
                      5 étapes
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">
                    Structuration par jalons : Idéation, Structuration, MVP, Go-to-Market, Financement.
                  </p>
                </div>
              </button>

              {/* Tile 2 : Notes & Comptes-rendus */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('notes');
                  document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-2 rounded-2xl hover:bg-orange-50/60 transition-all group cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-900 group-hover:text-[#f06553] transition-colors">
                    Notes & Comptes-rendus
                  </div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">
                    Journal officiel d'accompagnement, relevé d'engagements & procès-verbaux.
                  </p>
                </div>
              </button>

              {/* Tile 3 : Agenda & Convocations */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('agenda');
                  document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-2 rounded-2xl hover:bg-orange-50/60 transition-all group cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-900 group-hover:text-[#f06553] transition-colors">
                    Agenda & Convocations
                  </div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">
                    Planification des rendez-vous de mentorat et lettres de convocation officielles.
                  </p>
                </div>
              </button>
            </div>

            {/* Colonne 2 : BÉNÉFICIAIRES & ACCRÉDITATION */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#178578] mb-3">
                BÉNÉFICIAIRES & ACCRÉDITATION
              </h4>

              {/* Tile 4 : Porteurs & PME 360° (Highlighted border card matching exact image!) */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('porteurs');
                  document.getElementById('porteurs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-3 rounded-2xl bg-[#e6fbf5]/70 border border-[#b8f0e0] shadow-xs group transition-all hover:bg-[#dcf8ef] cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-[#d0f6ec] text-[#178578] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-[#178578]">
                    Porteurs & PME 360°
                  </div>
                  <p className="text-[12px] text-slate-600 leading-snug mt-1">
                    Fiches d'entreprises, diagnostic entrepreneurial, conformité légale et documents.
                  </p>
                </div>
              </button>

              {/* Tile 5 : Prestations & Quotas */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('prestations');
                  document.getElementById('prestations')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-2 rounded-2xl hover:bg-teal-50/60 transition-all group cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-[#e8f8f5] text-[#178578] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Clock className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-900 group-hover:text-[#178578] transition-colors">
                    Prestations & Quotas
                  </div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">
                    Pointage horodaté des heures d'accompagnement et suivi des quotas alloués.
                  </p>
                </div>
              </button>

              {/* Tile 6 : Validation des Jalons */}
              <button 
                type="button"
                onClick={() => {
                  setSelectedModuleId('validation');
                  document.getElementById('validation')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left flex items-start gap-3.5 p-2 rounded-2xl hover:bg-teal-50/60 transition-all group cursor-pointer"
              >
                <div className="size-11 rounded-2xl bg-[#e8f8f5] text-[#178578] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-slate-900 group-hover:text-[#178578] transition-colors">
                      Validation des Jalons
                    </span>
                    <span className="text-[10px] font-bold text-[#178578] bg-[#d7f5ee] px-2 py-0.5 rounded-md">
                      Qualité
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">
                    Contrôle qualité, passage officiel des étapes d'incubation et validation des livrables clés.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Fast Action / Conformité Bar */}
          <div className="-mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-3.5 bg-slate-50/90 border-t border-slate-100 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <ShieldCheck className="size-4 text-[#178578] shrink-0" />
              <span>Plateforme sécurisée & conforme aux normes de gestion des cohortes</span>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Espace PME Libreville
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE MODULE SELECTOR BAR
         ========================================================================= */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
              Modules :
            </span>
            {MODULES_DATA.map((module) => {
              const Icon = module.icon;
              const isSelected = selectedModuleId === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(module.id);
                    const el = document.getElementById(module.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                    isSelected 
                      ? module.category.includes('PILOTAGE')
                        ? 'bg-[#f06553] text-white border-[#f06553] shadow-md shadow-orange-500/20'
                        : 'bg-[#178578] text-white border-[#178578] shadow-md shadow-teal-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{module.title.split('&')[0]}</span>
                </button>
              );
            })}
          </div>

          <Link
            to="/candidater"
            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#f06553] hover:text-[#d94f3e] shrink-0"
          >
            <span>Candidater</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* =========================================================================
          MAIN DETAILED SECTIONS FOR EACH OF THE 6 MODULES
         ========================================================================= */}
      <div className="max-w-[1300px] mx-auto px-6 py-12 space-y-20">
        
        {MODULES_DATA.map((module, idx) => {
          const Icon = module.icon;
          const isPilotage = module.category.includes('PILOTAGE');
          const accentColor = isPilotage ? '#f06553' : '#178578';
          const themeLightBg = isPilotage ? 'bg-orange-50/60' : 'bg-teal-50/60';
          const themeBorder = isPilotage ? 'border-orange-200/80' : 'border-teal-200/80';

          return (
            <section 
              key={module.id} 
              id={module.id} 
              className={`p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all scroll-mt-24 ${
                selectedModuleId === module.id ? 'ring-2 ring-offset-4 ring-[#f06553]/40' : ''
              }`}
            >
              {/* Subtle corner glow */}
              <div 
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 -mr-20 -mt-20"
                style={{ backgroundColor: accentColor }}
              />

              {/* Module Header */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div 
                    className="size-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Icon className="size-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Module 0{idx + 1}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isPilotage ? 'bg-orange-100 text-[#f06553]' : 'bg-teal-100 text-[#178578]'
                      }`}>
                        {module.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${module.badgeColor}`}>
                        {module.badge}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {module.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
                      {module.longDesc}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics pill */}
                <div className="shrink-0 flex sm:flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {module.operationalBenefits.map((metric, mIdx) => (
                    <div key={mIdx} className="text-center sm:text-left px-2">
                      <div className="text-xs text-slate-500 font-medium">{metric.label}</div>
                      <div className="text-base font-extrabold text-slate-900" style={{ color: accentColor }}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Grid: 2 Columns */}
              <div className="grid lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left: Detailed Steps or Highlights */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Layers className="size-4" style={{ color: accentColor }} />
                    <span>Déroulement opérationnel & Jalons de contrôle</span>
                  </h3>

                  <div className="space-y-3">
                    {module.etapesOrHighlights.map((step, sIdx) => (
                      <div 
                        key={sIdx}
                        className="p-4 rounded-2xl bg-[#FAF7F2] border border-slate-200/70 hover:border-slate-300 transition-colors flex items-start gap-3.5"
                      >
                        <div 
                          className="size-7 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          {sIdx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900">
                              {step.title}
                            </h4>
                            {step.tag && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                                {step.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Key Features & Deliverables Checklist */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Features list */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Sparkles className="size-4" style={{ color: accentColor }} />
                      <span>Capacités logicielles natives</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {module.keyFeatures.map((feat, fIdx) => (
                        <li key={fIdx} className="text-xs text-slate-700 flex items-start gap-2.5 leading-snug">
                          <div 
                            className="size-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: accentColor }}
                          >
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Official Deliverables box */}
                  <div className={`p-6 rounded-2xl border ${themeBorder} ${themeLightBg} space-y-3`}>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <FileText className="size-4" style={{ color: accentColor }} />
                      <span>Livrables officiels & Documents générés</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {module.deliverables.map((doc, dIdx) => (
                        <span 
                          key={dIdx}
                          className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span>{doc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Card Footer Actions */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Module certifié conforme aux exigences de gestion de l’Espace PME Libreville</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link
                    to="/candidater"
                    className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-transform hover:-translate-y-0.5 shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    Intégrer ce parcours →
                  </Link>
                </div>
              </div>

            </section>
          );
        })}

      </div>

    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface SolutionConfig {
  title: string;
  tagline: string;
  description: string;
  heroBadge: string;
  stats: { value: string; label: string }[];
  painPoints: { problem: string; solution: string }[];
  features: string[];
  testimonial: { quote: string; author: string; role: string };
}

const SOLUTIONS_DATA: Record<string, SolutionConfig> = {
  coach: {
    title: 'Votre pratique de coach, fluide dès la première heure',
    tagline: 'Pour les coachs professionnels indépendants & superviseurs',
    heroBadge: 'Pratique Individuelle & Supervision',
    description: 'Gagnez des heures sur l’administratif, automatisez vos rendez-vous, centralisez les notes de vos séances et construisez votre dossier Qualiopi sans y penser.',
    stats: [
      { value: '1 heure', label: 'Pour être 100% opérationnel' },
      { value: '5h / sem', label: 'Gagnées sur la logistique & relances' },
      { value: '100%', label: 'Conformité Qualiopi en arrière-plan' }
    ],
    painPoints: [
      {
        problem: 'Vos notes de séance, liens visio et factures sont éparpillés dans plusieurs outils.',
        solution: 'Un espace unique partagé coach / coaché : prise de notes sécurisée, visio intégrée et suivi des objectifs.'
      },
      {
        problem: 'La préparation du dossier Qualiopi et les feuilles d’émargement sont un cauchemar administratif.',
        solution: 'Génération automatique des conventions, questionnaires d’évaluation à chaud/froid et émargements horodatés.'
      }
    ],
    features: [
      'Synchronisation automatique des agendas Google Calendar / Outlook',
      'Questionnaires d’alignement et cadrage d’objectifs pré-séance',
      'Espace sécurisé partagé coach / coaché pour ressources & exercices',
      'Dossier Qualiopi et attestations générés en temps réel',
      'Facturation automatique, gestion des forfaits et paiements en ligne'
    ],
    testimonial: {
      quote: 'IML a transformé ma pratique. Mes coachés adorent leur espace dédié et je n’angoisse plus à l’idée de mes audits qualité.',
      author: 'Sophie Delaunay',
      role: 'Coach certifiée ICF & Formatrice'
    }
  },
  cabinet: {
    title: 'La plateforme de pilotage complète pour cabinets de coaching & accompagnement',
    tagline: 'Pour les cabinets, réseaux et groupements de coachs',
    heroBadge: 'Gestion Multi-Coachs & Grands Comptes',
    description: 'Supervisez vos missions multi-coachs, consolidez les indicateurs de progrès pour vos commanditaires RH et professionnalisez votre facturation.',
    stats: [
      { value: '+40%', label: 'De capacité d’accompagnement' },
      { value: '360°', label: 'Visibilité sur les parcours collaborateurs' },
      { value: '0', label: 'Retard de reporting pour les clients RH' }
    ],
    painPoints: [
      {
        problem: 'Difficile d’avoir une vue globale sur les missions confiées à un pool de coachs.',
        solution: 'Console d’administration multi-coachs avec métriques consolidées et alertes d’avancement.'
      },
      {
        problem: 'Les DRH et commanditaires exigent des rapports d’impact rigoureux et anonymisés.',
        solution: 'Exports automatiques de dashboards RH avec taux d’atteinte des objectifs et satisfaction.'
      }
    ],
    features: [
      'Attribution dynamique des missions aux coachs partenaires',
      'Tableau de bord de reporting pour les commanditaires RH',
      'Centralisation des contrats-cadres, bons de commande et factures',
      'Garantie de confidentialité totale et respect de la déontologie',
      'Support dédié et intégration sur mesure avec vos SIRH'
    ],
    testimonial: {
      quote: 'Grâce à IML Cabinet, nous avons remporté un appel d’offres de 80 coachings de dirigeants pour un grand groupe bancaire.',
      author: 'Laurent Garnier',
      role: 'Associé Gérant, Cabinet Horizon Dirigeants'
    }
  },
  porteurs: {
    title: 'De l’Idée au Premier Dossier de Financement Solide',
    tagline: 'Pour les porteurs de projet et primo-entrepreneurs',
    heroBadge: 'Validation & Amorçage',
    description: 'Structurez votre vision, validez l’adéquation problème-solution et construisez un dossier irréprochable pour séduire banques, jurys et premiers partenaires.',
    stats: [
      { value: '3x', label: 'Plus rapide pour valider son idée' },
      { value: '94%', label: 'Des dossiers financés au 1er passage' },
      { value: '250+', label: 'Projets accompagnés cette année' }
    ],
    painPoints: [
      {
        problem: 'Vous ne savez pas par quoi commencer ni comment prouver votre marché.',
        solution: 'Une méthodologie guidée pas à pas avec fiches de synthèse et audits continus.'
      },
      {
        problem: 'Peur d’échouer face aux questions financières des comités.',
        solution: 'Un simulateur de rentabilité et des simulations orales avec nos mentors.'
      }
    ],
    features: [
      'Cadrage du Business Model Canvas interactif',
      'Matrice d’étude de concurrence et persona client',
      'Génération automatique du prévisionnel financier',
      'Accès aux permanences d’avocats et comptables partenaires'
    ],
    testimonial: {
      quote: 'Sans IML Digital, j’aurais mis 6 mois de plus à formaliser mon offre. J’ai obtenu mon prêt d’honneur de 25k€ dès le premier comité !',
      author: 'Maxime R.',
      role: 'Fondateur de GreenRoute'
    }
  },
  startups: {
    title: 'Accélérez votre Traction et Réussissez votre Levée de Fonds',
    tagline: 'Pour les fondateurs de startups early-stage',
    heroBadge: 'Croissance & Pre-Seed / Seed',
    description: 'Pilotez vos métriques clés, perfectionnez votre pitch deck et accédez à notre réseau de business angels et fonds d’amorçage qualifiés.',
    stats: [
      { value: '1.8M€', label: 'Levés en moyenne par nos startups' },
      { value: '-40%', label: 'De temps passé sur le reporting' },
      { value: '80+', label: 'Fonds d’investissement partenaires' }
    ],
    painPoints: [
      {
        problem: 'Vos métriques sont dispersées entre plusieurs outils sans vision unifiée.',
        solution: 'Tableau de bord centralisé reliant MRR, CAC, LTV et runway en direct.'
      },
      {
        problem: 'Le temps passé à chercher des investisseurs freine le développement produit.',
        solution: 'Mise en relation directe et ciblée avec des VCs selon votre thèse et secteur.'
      }
    ],
    features: [
      'Data room investisseur sécurisée et pré-structurée',
      'Audit expert du pitch deck et sessions de répétition intensives',
      'Suivi automatisé du runway et alertes de trésorerie',
      'Mises en relation privées lors de nos Demo Days exclusifs'
    ],
    testimonial: {
      quote: 'Le format structuré d’IML nous a permis de boucler notre tour de table Seed de 800k€ en seulement 7 semaines.',
      author: 'Camille V.',
      role: 'CEO & Co-fondatrice de FlowData'
    }
  },
  incubateurs: {
    title: 'La Plateforme Tout-en-Un pour Piloter vos Promotions d’Incubation',
    tagline: 'Pour les incubateurs, accélérateurs et pôles d’innovation',
    heroBadge: 'Gestion Multi-Projets & Mentoring',
    description: 'Centralisez les candidatures, suivez les jalons de chaque promotion, planifiez les sessions de mentorat et mesurez l’impact réel de votre programme.',
    stats: [
      { value: '500+', label: 'Startups gérées simultanément' },
      { value: '100%', label: 'Visibilité sur l’avancement des cohortes' },
      { value: '4.9/5', label: 'Satisfaction des accompagnateurs' }
    ],
    painPoints: [
      {
        problem: 'Le suivi des promotions se perd dans des feuilles Excel obsolètes.',
        solution: 'Un CRM incubation complet avec alertes de décrochage et fiches de suivi en temps réel.'
      },
      {
        problem: 'La coordination des mentors et des rendez-vous est chronophage.',
        solution: 'Agenda partagé intégré avec synthèses automatiques des entretiens.'
      }
    ],
    features: [
      'Portail de candidature public personnalisable aux couleurs de votre structure',
      'Gestion des jurys de sélection avec notation collaborative en ligne',
      'Tableau de bord de santé des projets (taux de franchissement des étapes)',
      'Export des indicateurs d’impact pour vos financeurs et partenaires publics'
    ],
    testimonial: {
      quote: 'IML Digital a métamorphosé la productivité de notre équipe. Nous accompagnons désormais deux fois plus de projets avec la même exigence.',
      author: 'Julien Bertin',
      role: 'Directeur Général, Le Hub Innovation'
    }
  },
  pme: {
    title: 'Digitalisez vos Processus et Financez votre Croissance Externe',
    tagline: 'Pour les dirigeants de TPE & PME en transition',
    heroBadge: 'Transformation & Efficacité',
    description: 'Identifiez vos leviers de rentabilité, sécurisez vos financements bancaires et accélérez la transformation numérique de vos équipes sans friction.',
    stats: [
      { value: '+35%', label: 'De gains de productivité opérationnelle' },
      { value: '100k€', label: 'D’économies identifiées en moyenne' },
      { value: '0', label: 'Rupture d’activité pendant le déploiement' }
    ],
    painPoints: [
      {
        problem: 'Vos méthodes traditionnelles limitent votre capacité à passer à l’échelle.',
        solution: 'Automatisation des workflows récurrents et adoption d’outils modernes.'
      },
      {
        problem: 'Les banques demandent des garanties chiffrées très complexes.',
        solution: 'Dossiers prévisionnels conformes aux exigences des analystes de crédit.'
      }
    ],
    features: [
      'Diagnostic complet de maturité numérique et plan d’action priorisé',
      'Optimisation des coûts de fonctionnement et des marges commerciales',
      'Accompagnement à l’obtention de subventions de modernisation industrielle',
      'Formation continue des managers aux outils collaboratifs'
    ],
    testimonial: {
      quote: 'Nous avons pu restructurer nos opérations et obtenir le soutien de notre banque partenaire pour notre nouvel atelier.',
      author: 'Stéphane Morel',
      role: 'Président, Ateliers Métalliques Rhône'
    }
  },
  independants: {
    title: 'Une Équipe Stratégique Complète sans Recruter',
    tagline: 'Pour les consultants, freelances et créateurs solos',
    heroBadge: 'Solo-Entrepreneurs & Consultants',
    description: 'Structurez votre activité comme une entreprise de premier plan : proposition de valeur percutante, facturation optimisée et réseau de pairs bienveillants.',
    stats: [
      { value: '2.5x', label: 'Augmentation du TJM moyen' },
      { value: '10h', label: 'Gagnées par semaine sur l’administratif' },
      { value: '1.2k', label: 'Indépendants actifs dans le réseau' }
    ],
    painPoints: [
      {
        problem: 'Vous vous sentez isolé face aux décisions stratégiques et tarifaires.',
        solution: 'Des sessions de co-développement régulières avec des pairs expérimentés.'
      },
      {
        problem: 'Difficulté à convertir des prospects frileux sur vos tarifs.',
        solution: 'Repositionnement vers une offre à haute valeur perçue et contrats types.'
      }
    ],
    features: [
      'Templates de propositions commerciales et grilles tarifaires haut de gamme',
      'Méthode de fidélisation client et mise en place d’abonnements récurrents',
      'Accès à notre communauté privée d’entraide et de co-working virtuel',
      'Permanence juridique mensuelle pour sécuriser vos conditions de mission'
    ],
    testimonial: {
      quote: 'J’ai doublé mon taux journalier en reformulant mon offre grâce aux feedbacks de l’équipe IML. Un investissement rentabilisé en 10 jours.',
      author: 'Nathalie Dupont',
      role: 'Consultante Stratégie Digitale'
    }
  }
};

export default function SolutionsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const data = (slug && SOLUTIONS_DATA[slug]) ? SOLUTIONS_DATA[slug] : SOLUTIONS_DATA['porteurs'];

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-[1240px] mx-auto px-6">
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="size-4 text-teal-600" />
            {data.heroBadge}
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            {data.title}
          </h1>

          <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
            {data.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/candidater"
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 text-sm transition-all flex items-center justify-center gap-2"
            >
              Rejoindre le programme <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/tarifs"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-all"
            >
              Découvrir les offres & tarifs
            </Link>
          </div>
        </div>

        {/* Chiffres Clés */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {data.stats.map((stat, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-4xl lg:text-5xl font-black text-indigo-600 mb-2">{stat.value}</p>
              <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Problématique vs Solution */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              En finir avec les blocages classiques
            </h2>
            <p className="text-slate-600 text-sm md:text-base">
              Nous avons pensé chaque brique d'IML Digital pour éliminer les points de friction majeurs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {data.painPoints.map((item, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Le Problème</h3>
                    <p className="text-slate-700 text-sm">{item.problem}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">La Réponse IML</h3>
                    <p className="text-slate-900 font-medium text-sm">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fonctionnalités & Avantages */}
        <div className="bg-slate-900 rounded-3xl p-10 md:p-14 text-white mb-24 relative overflow-hidden">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">
              Fonctionnalités Incluses
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Tout le nécessaire pour aller vite et bien
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Un arsenal complet de technologies, de modèles et d'accompagnement humain à portée de clic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {data.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-teal-400/20 text-teal-300 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="size-4" />
                </div>
                <span className="text-sm font-medium text-slate-100">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Témoignage */}
        <div className="p-10 rounded-3xl bg-indigo-50/60 border border-indigo-100 max-w-3xl mx-auto text-center mb-20">
          <p className="text-lg md:text-xl font-medium text-slate-800 italic leading-relaxed mb-6">
            « {data.testimonial.quote} »
          </p>
          <div>
            <p className="font-bold text-slate-900">{data.testimonial.author}</p>
            <p className="text-xs text-indigo-700 font-semibold">{data.testimonial.role}</p>
          </div>
        </div>

        {/* Call to Action Final */}
        <div className="text-center max-w-xl mx-auto space-y-5">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Prêt à donner une nouvelle dimension à votre projet ?
          </h2>
          <p className="text-slate-600 text-sm">
            Déposez votre dossier de candidature en moins de 5 minutes ou contactez nos équipes pour une présentation personnalisée.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/candidater"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              Candidater maintenant
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-all"
            >
              Prendre rendez-vous
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

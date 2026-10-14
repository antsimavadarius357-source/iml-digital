import { useState } from 'react';
import { BookOpen, Search, Download, Clock, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Guide {
  id: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
  downloads: string;
  difficulty: string;
  popular?: boolean;
}

const GUIDES_DATA: Guide[] = [
  {
    id: 'guide-pitch',
    category: 'Financement & Levée',
    title: 'Le Guide Ultime du Pitch Deck pour Business Angels',
    description: 'Structure éprouvée en 12 slides pour capter l’attention des investisseurs en moins de 3 minutes chrono.',
    readTime: '15 min de lecture',
    downloads: '2.4k téléchargements',
    difficulty: 'Intermédiaire',
    popular: true
  },
  {
    id: 'guide-bm',
    category: 'Modèle Économique',
    title: 'Construire un Business Model SaaS Rentable dès le J1',
    description: 'Unit economics, CAC, LTV, churn rate : maîtriser les formules mathématiques qui garantissent votre rentabilité.',
    readTime: '20 min de lecture',
    downloads: '1.8k téléchargements',
    difficulty: 'Avancé',
    popular: true
  },
  {
    id: 'guide-validation',
    category: 'Validation Marché',
    title: 'Tester son Idée sans Écrire une Seule Ligne de Code',
    description: 'La méthode No-Code / Smoke Testing pour valider la demande client avant d’engager le moindre euro.',
    readTime: '10 min de lecture',
    downloads: '3.1k téléchargements',
    difficulty: 'Débutant'
  },
  {
    id: 'guide-subvention',
    category: 'Aides & Subventions',
    title: 'Cartographie des Aides Publiques et Prêts d’Honneur 2026',
    description: 'BPI France, subventions régionales, CIR/CII : les étapes concrètes pour débloquer jusqu’à 100k€ non-dilutifs.',
    readTime: '25 min de lecture',
    downloads: '1.5k téléchargements',
    difficulty: 'Tous niveaux'
  },
  {
    id: 'guide-recrutement',
    category: 'Équipe & RH',
    title: 'Trouver et S’associer avec son Co-fondateur Idéal',
    description: 'Pacte d’associés, vesting, alignement des visions et répartition de capital sans conflit.',
    readTime: '12 min de lecture',
    downloads: '950 téléchargements',
    difficulty: 'Essentiel'
  },
  {
    id: 'guide-gtm',
    category: 'Marketing B2B',
    title: 'Stratégie Go-To-Market : Décrocher ses 10 Premiers Clients Payants',
    description: 'Prospection multicanale, cold outreach éthique et scripts d’appels de découverte à fort taux de transformation.',
    readTime: '18 min de lecture',
    downloads: '2.9k téléchargements',
    difficulty: 'Intermédiaire',
    popular: true
  }
];

export default function GuidesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadModal, setDownloadModal] = useState<string | null>(null);

  const categories = ['Tous', 'Financement & Levée', 'Modèle Économique', 'Validation Marché', 'Aides & Subventions', 'Marketing B2B'];

  const filteredGuides = GUIDES_DATA.filter((guide) => {
    const matchesCat = activeCategory === 'Tous' || guide.category === activeCategory;
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20">
      <div className="max-w-[1240px] mx-auto px-6">
        
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="size-4 text-teal-600" />
            Bibliothèque de Ressources Pratiques
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Guides, méthodologies et playbooks d’incubation
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Des ressources concrètes rédigées par des entrepreneurs et des mentors d'expérience pour faire décoller votre projet étape par étape.
          </p>
        </div>

        {/* Barre de recherche et Filtres */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-12 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un guide, un mot-clé (ex: Pitch, CAC, BPI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des Guides */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-7">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                    {guide.category}
                  </span>
                  {guide.popular && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Star className="size-3 fill-indigo-600 text-indigo-600" /> Populaire
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {guide.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {guide.readTime}</span>
                  <span>•</span>
                  <span>{guide.difficulty}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{guide.downloads}</span>
                <button
                  onClick={() => setDownloadModal(guide.title)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors shadow-sm"
                >
                  <Download className="size-3.5" /> Télécharger PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de téléchargement fonctionnelle */}
        {downloadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Guide prêt au téléchargement</h3>
              <p className="text-sm text-slate-600 mb-6">
                Vous avez sélectionné : <span className="font-semibold text-slate-800">« {downloadModal} »</span>. Accédez immédiatement au PDF complet ainsi qu'aux fiches d'exercices associées.
              </p>
              
              <div className="space-y-3">
                <a
                  href="#download-simulation"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Téléchargement lancé pour : ${downloadModal}`);
                    setDownloadModal(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 text-sm"
                >
                  <Download className="size-4" /> Démarrer le téléchargement direct
                </a>
                <button
                  onClick={() => setDownloadModal(null)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Incubation */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl z-10">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">
              Accompagnement Sur Mesure
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
              Besoin d'un mentor pour appliquer ces méthodes à votre projet ?
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Rejoignez le programme IML Digital et profitez d'ateliers hebdomadaires avec des experts du secteur.
            </p>
          </div>
          <div className="z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/candidater"
              className="px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-400/20 text-center flex items-center justify-center gap-2"
            >
              Postuler au programme <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

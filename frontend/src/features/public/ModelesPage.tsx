import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Check, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Template {
  id: string;
  type: 'excel' | 'doc' | 'notion';
  title: string;
  category: string;
  description: string;
  format: string;
  fields: string[];
}

const TEMPLATES_DATA: Template[] = [
  {
    id: 'financial-plan',
    type: 'excel',
    title: 'Plan Financier Prévisionnel sur 3 Ans (Excel / Sheets)',
    category: 'Finance',
    description: 'Modèle automatisé avec calcul de marge brute, point mort, trésorerie mensuelle et plan de financement pré-configuré.',
    format: '.XLSX & Google Sheets',
    fields: ['Compte de résultat', 'Trésorerie mensuelle', 'Calcul de BFR', 'Seuil de rentabilité']
  },
  {
    id: 'pacte-associes',
    type: 'doc',
    title: 'Trame de Pacte d’Associés & Clauses de Good/Bad Leaver',
    category: 'Juridique',
    description: 'Document standard relu par avocats partenaires pour encadrer les droits de vote, clauses de cession et vesting.',
    format: '.DOCX & PDF',
    fields: ['Clause de préemption', 'Droit de sortie conjointe', 'Calendrier de vesting 4 ans']
  },
  {
    id: 'pitch-deck-notion',
    type: 'notion',
    title: 'Template Notion : Workspace de Pilotage d’Incubation',
    category: 'Productivité',
    description: 'Structure complète pour centraliser vos OKRs, CRM investisseurs, roadmap produit et compte-rendus de mentoring.',
    format: 'Template Notion Duplicable',
    fields: ['Roadmap Gantt', 'Tableau Kanban Produit', 'Pipeline Investisseurs', 'Fiches Personas']
  },
  {
    id: 'grille-entretien',
    type: 'doc',
    title: 'Grille d’Entretiens Découverte Client (Jobs To Be Done)',
    category: 'Produit',
    description: 'Scripts de questions ouvertes pour interviewer 20 prospects sans biais et identifier les vrais points de douleur.',
    format: '.DOCX',
    fields: ['Questions d’ouverture', 'Identification des freins', 'Test de sensibilité au prix']
  },
  {
    id: 'one-pager',
    type: 'doc',
    title: 'One-Pager Exécutif pour Investisseurs & Business Angels',
    category: 'Finance',
    description: 'Présentation synthétique ultra-efficace sur une seule page recto-verso pour les premiers contacts VC.',
    format: '.PPTX & Figma',
    fields: ['Chiffres clés', 'Problème / Solution', 'Équipe & Cap Table', 'Besoin de financement']
  },
  {
    id: 'cgu-cgv',
    type: 'doc',
    title: 'Modèle de Conditions Générales d’Utilisation SaaS',
    category: 'Juridique',
    description: 'Trame de CGU / CGV conforme RGPD avec clauses de limitation de responsabilité et SLAs types.',
    format: '.DOCX',
    fields: ['Protection des données RGPD', 'Politique de remboursement', 'Droit applicable']
  }
];

export default function ModelesPage() {
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const categories = ['Tous', 'Finance', 'Juridique', 'Productivité', 'Produit'];

  const filtered = TEMPLATES_DATA.filter(
    (t) => selectedCat === 'Tous' || t.category === selectedCat
  );

  const handleDownload = (title: string) => {
    setDownloadSuccess(title);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20">
      <div className="max-w-[1240px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="size-4 text-teal-600" />
            Modèles & Templates Clés en Main
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Gagnez des semaines de travail avec nos templates prêts à l'emploi
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Finances, juridique, prospection, gestion d'équipe : téléchargez gratuitement nos matrices standardisées et validées par nos experts.
          </p>
        </div>

        {/* Message de succès toast */}
        {downloadSuccess && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-300">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Check className="size-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Téléchargement initialisé</p>
              <p className="text-sm font-semibold">{downloadSuccess}</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
          <div className="flex items-center gap-2 mr-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="size-3.5" /> Filtrer :
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCat === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille des Templates */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      {item.type === 'excel' && <FileSpreadsheet className="size-5" />}
                      {item.type === 'doc' && <FileText className="size-5" />}
                      {item.type === 'notion' && <Sparkles className="size-5" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium">{item.format}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {item.description}
                </p>

                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inclus dans le modèle :</p>
                  {item.fields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="size-3.5 text-teal-600 flex-shrink-0" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => handleDownload(item.title)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                >
                  <Download className="size-3.5" /> Télécharger ce modèle
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pre-footer */}
        <div className="text-center py-10 bg-indigo-50/50 rounded-3xl border border-indigo-100/60 p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Vous avez un besoin spécifique de modèle ?</h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6">
            Nos mentors et experts conçoivent des documents personnalisés pour chaque entrepreneur incubé dans le cadre du suivi individuel.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            Demander un modèle sur mesure <ExternalLink className="size-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

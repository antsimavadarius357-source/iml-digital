import { Check, X } from 'lucide-react';

export default function ComparatifsPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            IML face aux outils<br />que vous utilisez déjà.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Pourquoi utiliser 5 outils différents quand IML rassemble tout ce dont un incubateur et un porteur de projet ont besoin ?
          </p>
        </div>

        {/* Comparatif Table */}
        <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
           <div className="grid grid-cols-4 bg-slate-50 p-6 border-b border-slate-200 text-sm font-bold text-slate-900">
              <div className="col-span-1">Fonctionnalité</div>
              <div className="text-center text-indigo-600 text-lg">IML Digital</div>
              <div className="text-center text-slate-500">Notion / Airtable</div>
              <div className="text-center text-slate-500">Outils isolés (Typeform, etc.)</div>
           </div>
           
           {[
             { nom: "Suivi d'avancement des startups", iml: true, autres1: true, autres2: false },
             { nom: "IA Second Cerveau intégrée", iml: true, autres1: false, autres2: false },
             { nom: "Génération de Pitch Deck", iml: true, autres1: false, autres2: false },
             { nom: "Gestion des candidatures unifiée", iml: true, autres1: true, autres2: true },
             { nom: "Mise en relation Investisseurs", iml: true, autres1: false, autres2: false },
           ].map((row, i) => (
             <div key={i} className="grid grid-cols-4 p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
                <div className="font-medium text-slate-700">{row.nom}</div>
                <div className="flex justify-center text-indigo-600">
                   {row.iml ? <Check className="size-6" /> : <X className="size-6 text-slate-300" />}
                </div>
                <div className="flex justify-center text-slate-400">
                   {row.autres1 ? <Check className="size-6" /> : <X className="size-6 text-slate-200" />}
                </div>
                <div className="flex justify-center text-slate-400">
                   {row.autres2 ? <Check className="size-6" /> : <X className="size-6 text-slate-200" />}
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}

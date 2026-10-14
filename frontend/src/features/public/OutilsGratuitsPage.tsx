import { Calculator, FileText, CheckCircle } from 'lucide-react';

export default function OutilsGratuitsPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Outils gratuits pour<br />porteurs de projet.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Un audit ou un calcul en deux minutes, sans compte. Utilisez nos outils pour évaluer rapidement la viabilité de votre projet.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Outil 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="size-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Calculator className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Calculateur de Runway</h3>
            <p className="text-slate-500 mb-8">
               Combien de mois votre startup peut-elle survivre avec sa trésorerie actuelle ? Simulez vos dépenses.
            </p>
            <button className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2">
               Utiliser l'outil &rarr;
            </button>
          </div>

          {/* Outil 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="size-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <FileText className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Générateur de Business Model</h3>
            <p className="text-slate-500 mb-8">
               Remplissez 9 questions simples et générez instantanément votre Business Model Canvas en PDF.
            </p>
            <button className="text-teal-600 font-bold hover:text-teal-700 flex items-center gap-2">
               Générer un Canvas &rarr;
            </button>
          </div>

          {/* Outil 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="size-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <CheckCircle className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Audit Pitch Deck</h3>
            <p className="text-slate-500 mb-8">
               Notre IA analyse votre Pitch Deck et vous donne un score de clarté avant de l'envoyer aux investisseurs.
            </p>
            <button className="text-orange-600 font-bold hover:text-orange-700 flex items-center gap-2">
               Lancer l'audit &rarr;
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

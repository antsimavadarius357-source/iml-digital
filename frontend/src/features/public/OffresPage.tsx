import { CheckCircle2, Lightbulb, Rocket, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OffresPage() {
  return (
    <div className="py-16 sm:py-24 bg-[#FAF9F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold uppercase tracking-wider inline-block">
            Programmes & Accompagnement
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Trouvez le parcours adapté à votre stade
          </h1>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            De l'idée initiale jusqu'à la mise sur le marché et la levée de fonds, découvrez un accompagnement sur-mesure structuré en jalons certifiés.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Programme 1 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-12 rounded-2xl bg-orange-50 text-[#FF5B37] flex items-center justify-center">
                <Lightbulb className="size-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-slate-700 text-xs font-bold">
                Jalon 01 & 02 • Idéation
              </div>
              <h3 className="text-2xl font-black text-slate-900">Pré-Incubation (Émergence)</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Passez de l'idée au concept viable. Nous vous aidons à structurer votre proposition de valeur et tester l'intérêt réel des clients.
              </p>
              
              <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Durée : 3 mois intensifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Ateliers Business Model & Pitch</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Diagnostic d'adéquation porteur/projet</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link 
                to="/candidater" 
                className="w-full py-3 block text-center bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs rounded-full transition-all"
              >
                Candidater à Émergence
              </Link>
            </div>
          </div>

          {/* Programme 2 (Focus principal) */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-between relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#FF5B37] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
              Cœur de mission
            </div>

            <div className="space-y-4">
              <div className="size-12 rounded-2xl bg-[#FF5B37] text-white flex items-center justify-center shadow-md">
                <Rocket className="size-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[#FF8E75] text-xs font-bold border border-slate-700">
                Jalons 01 à 04 • Accompagnement Complet
              </div>
              <h3 className="text-2xl font-black text-white">Incubation Nationale</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Construisez votre produit, trouvez vos premiers clients payants et validez les livrables d'homologation pour accéder aux financements partenaires.
              </p>
              
              <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Durée : 6 à 12 mois avec coach attitré</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Séances individuelles régulières (présentiel / visio)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Montage du dossier bancable officiel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Attestation certifiée par le comité IML</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link 
                to="/candidater" 
                className="w-full py-3.5 block text-center bg-[#FF5B37] hover:bg-[#e94d29] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-orange-500/30"
              >
                Déposer ma candidature
              </Link>
            </div>
          </div>

          {/* Programme 3 */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="size-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Target className="size-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-slate-700 text-xs font-bold">
                PME & Filières • Scale-up
              </div>
              <h3 className="text-2xl font-black text-slate-900">Accélération & PME</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pour les entreprises et coopératives établies nécessitant restructuration financière, optimisation des marges et accès aux marchés sous-régionaux.
              </p>
              
              <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                  <span>Durée : 6 mois ciblés</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                  <span>Expert financier senior dédié</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                  <span>Levée de fonds d'amorçage ou dette bancaire</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link 
                to="/contact" 
                className="w-full py-3 block text-center bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs rounded-full transition-all"
              >
                Prendre rendez-vous
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

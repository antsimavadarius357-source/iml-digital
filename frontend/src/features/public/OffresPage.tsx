import { CheckCircle2, Lightbulb, Rocket, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OffresPage() {
  return (
    <div className="py-24 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-iml-600 font-bold tracking-wide uppercase text-sm animate-fade-in-up">Nos Offres et Programmes</h1>
          <h2 className="text-4xl font-extrabold text-slate-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Trouvez le parcours adapté à votre stade
          </h2>
          <p className="text-lg text-slate-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            De l'idée griffonnée sur un carnet jusqu'au développement à l'international, découvrez un accompagnement sur-mesure structuré en 3 grandes phases.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Programme 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <Lightbulb className="size-12 text-indigo-500 mb-6" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6">Phase 1 : Idéation</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Pré-Incubation</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Durée : <strong>3 mois</strong> <br />
              Passez de l'idée au concept. Nous vous aidons à structurer votre projet et élaborer votre premier Business Model.
            </p>
            <div className="space-y-4 mb-8">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-indigo-500 mt-0.5 shrink-0" /> Ateliers Design Thinking</li>
                <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-indigo-500 mt-0.5 shrink-0" /> Étude de marché</li>
              </ul>
            </div>
            <Link to="/contact" className="w-full py-3 block text-center bg-white text-indigo-600 font-semibold rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 transition-all">Nous contacter</Link>
          </div>

          {/* Programme 2 */}
          <div className="bg-white p-8 rounded-3xl border-2 border-iml-500 shadow-xl shadow-iml-500/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 lg:-mt-4 lg:mb-4 relative">
            <Rocket className="size-12 text-iml-500 mb-6" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-iml-500 text-white text-sm font-semibold mb-6">Phase 2 : Lancement</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Incubation</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Durée : <strong>6 à 9 mois</strong> <br />
              Construisez votre MVP, trouvez vos premiers clients et générez vos premiers revenus.
            </p>
            <div className="space-y-4 mb-8">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-iml-500 mt-0.5 shrink-0" /> Développement MVP</li>
                <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-iml-500 mt-0.5 shrink-0" /> Co-working 24/7</li>
                <li className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-iml-500 mt-0.5 shrink-0" /> Crédits Cloud</li>
              </ul>
            </div>
            <Link to="/candidater" className="w-full py-3 block text-center bg-iml-600 text-white font-semibold rounded-xl hover:bg-iml-700 transition-all shadow-lg shadow-iml-500/20">Déposer mon dossier</Link>
          </div>

          {/* Programme 3 */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-xl text-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <Target className="size-12 text-sky-400 mb-6" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-sky-400 text-sm font-semibold mb-6 border border-slate-600">Phase 3 : Croissance</div>
            <h3 className="text-2xl font-bold mb-4">Accélération</h3>
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              Durée : <strong>12 mois</strong> <br />
              Accélérez vos ventes, levez des fonds et préparez votre expansion internationale.
            </p>
            <div className="space-y-4 mb-8">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="size-4 text-sky-400 mt-0.5 shrink-0" /> Mentoring C-Level</li>
                <li className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="size-4 text-sky-400 mt-0.5 shrink-0" /> Levée de fonds</li>
              </ul>
            </div>
            <Link to="/contact" className="w-full py-3 block text-center bg-slate-800 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700 transition-all">Nous contacter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

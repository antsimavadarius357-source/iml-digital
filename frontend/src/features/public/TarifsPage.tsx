import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TarifsPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      
      {/* HEADER & TOGGLE */}
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-8">Nos tarifs.</h1>
        
        <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${!isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mensuel
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Annuel <span className="text-[10px] uppercase tracking-wider bg-teal-400/20 text-teal-300 px-2 py-0.5 rounded-full">-20%</span>
          </button>
        </div>
      </div>

      {/* PRICING CARDS */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
        {/* FREE */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold text-slate-900">0€</span>
            <span className="text-slate-500">/mois</span>
          </div>
          <p className="text-sm text-slate-500 mb-8 min-h-[40px]">L'essentiel pour structurer votre idée.</p>
          <button className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8">
            Commencer
          </button>
          <div className="flex-1 bg-slate-50 rounded-2xl p-6 -mx-4 -mb-4">
            <p className="text-xs font-bold text-slate-900 mb-4">Inclus :</p>
            <ul className="space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> 1 projet actif</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Business Model Canvas basique</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Accès aux ressources publiques</li>
            </ul>
          </div>
        </div>

        {/* STARTER */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold text-slate-900">{isAnnual ? '16€' : '20€'}</span>
            <span className="text-slate-500">/mois</span>
          </div>
          <p className="text-sm text-slate-500 mb-8 min-h-[40px]">Pour les porteurs qui avancent vite.</p>
          <button className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8">
            Commencer
          </button>
          <div className="flex-1 bg-slate-50 rounded-2xl p-6 -mx-4 -mb-4">
            <p className="text-xs font-bold text-slate-900 mb-4">Tout de Free, plus :</p>
            <ul className="space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Jusqu'à 3 projets actifs</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Génération de Pitch Deck</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Support par email</li>
            </ul>
          </div>
        </div>

        {/* PRO (Highlighted) */}
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 flex flex-col relative transform lg:-translate-y-4">
          <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
             <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Recommandé</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold text-slate-900">{isAnnual ? '33€' : '41€'}</span>
            <span className="text-slate-500">/mois</span>
          </div>
          <p className="text-sm text-slate-500 mb-8 min-h-[40px]">Accompagnement complet pour startups.</p>
          <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors mb-8 shadow-md shadow-indigo-600/20">
            Essayer Pro
          </button>
          <div className="flex-1 bg-indigo-50/50 rounded-2xl p-6 -mx-4 -mb-4 border border-indigo-100/50">
            <p className="text-xs font-bold text-slate-900 mb-4">Tout de Starter, plus :</p>
            <ul className="space-y-3 text-sm text-slate-700">
               <li className="flex gap-2"><Check className="size-4 text-indigo-500 shrink-0" /> Projets illimités</li>
               <li className="flex gap-2"><Check className="size-4 text-indigo-500 shrink-0" /> Mentoring C-Level (1h/mois)</li>
               <li className="flex gap-2"><Check className="size-4 text-indigo-500 shrink-0" /> Mise en relation Investisseurs</li>
               <li className="flex gap-2"><Check className="size-4 text-indigo-500 shrink-0" /> Espace de co-working</li>
            </ul>
          </div>
        </div>

        {/* MAX */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Max</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-extrabold text-slate-900">{isAnnual ? '129€' : '160€'}</span>
            <span className="text-slate-500">/mois</span>
          </div>
          <p className="text-sm text-slate-500 mb-8 min-h-[40px]">Pour les PME et équipes en forte croissance.</p>
          <button className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors mb-8">
            Nous contacter
          </button>
          <div className="flex-1 bg-slate-50 rounded-2xl p-6 -mx-4 -mb-4">
            <p className="text-xs font-bold text-slate-900 mb-4">Tout de Pro, plus :</p>
            <ul className="space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Support prioritaire 24/7</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Accompagnement juridique avancé</li>
               <li className="flex gap-2"><Check className="size-4 text-slate-400 shrink-0" /> Bureaux dédiés</li>
            </ul>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="max-w-5xl mx-auto px-6 mb-32">
         <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-slate-900 mb-2">Comparez sans décoder.</h2>
           <p className="text-slate-500">Retrouvez le détail de toutes les fonctionnalités de nos offres.</p>
         </div>

         <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-5 p-6 border-b border-slate-100 bg-slate-50/50 text-sm font-bold text-slate-900">
               <div className="col-span-1"></div>
               <div className="text-center">Free</div>
               <div className="text-center">Starter</div>
               <div className="text-center text-indigo-600">Pro</div>
               <div className="text-center">Max</div>
            </div>
            
            {/* Rows */}
            {[
               { name: "Projets actifs", free: "1", starter: "3", pro: "Illimité", max: "Illimité" },
               { name: "Mentoring", free: "-", starter: "-", pro: "1h/mois", max: "5h/mois" },
               { name: "Support", free: "Communauté", starter: "Email (48h)", pro: "Email & Chat (24h)", max: "Téléphone (24/7)" },
            ].map((row, i) => (
               <div key={i} className="grid grid-cols-5 p-6 border-b border-slate-50 text-sm hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-1 font-semibold text-slate-700">{row.name}</div>
                  <div className="text-center text-slate-500">{row.free}</div>
                  <div className="text-center text-slate-500">{row.starter}</div>
                  <div className="text-center font-bold text-indigo-600">{row.pro}</div>
                  <div className="text-center text-slate-900 font-medium">{row.max}</div>
               </div>
            ))}
         </div>
      </div>

      {/* FAQ SECTION */}
      <div className="max-w-3xl mx-auto px-6 mb-32">
         <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Avant de commencer</h2>
         
         <div className="space-y-3">
            {[
              "Puis-je changer d'offre en cours de route ?",
              "Est-ce qu'il y a un engagement de durée ?",
              "Quels moyens de paiement acceptez-vous ?",
              "Comment fonctionne le mentoring C-Level ?",
              "Proposez-vous des tarifs pour les étudiants ?"
            ].map((q, i) => (
              <div key={i} className="border-b border-slate-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-4 flex items-center justify-between font-medium text-slate-800 hover:text-indigo-600 transition-colors text-left"
                >
                  {q}
                  <ChevronDown className={`size-4 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="pb-6 text-sm text-slate-500 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                  </div>
                )}
              </div>
            ))}
         </div>
      </div>

      {/* PRE-FOOTER CTA */}
      <div className="max-w-4xl mx-auto px-6 text-center">
         <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Votre prochaine décision<br />
            peut commencer ici.
         </h2>
         <p className="text-slate-600 mb-10">
            Rejoignez des centaines de fondateurs qui construisent l'avenir avec IML.
         </p>
         <Link to="/candidater" className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
            Commencer gratuitement
         </Link>
      </div>

    </div>
  );
}

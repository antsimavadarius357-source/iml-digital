import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TarifsPage() {
  return (
    <div className="bg-[#FAF9F5] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold uppercase tracking-wider inline-block">
            Modèle & Financement
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Transparence sur les modalités d'accès
          </h1>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            L'accès aux programmes d'incubation IML Digit est principalement financé par nos partenaires institutionnels et bailleurs de fonds pour maximiser l'impact économique national.
          </p>
        </div>

        {/* 3 Cartes de Tarification & Financement */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Formule 1 : Cohorte Nationale Financement Public */}
          <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
              Pris en charge 100%
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Cohorte Nationale</h3>
                <p className="text-xs text-slate-500 mt-1">Programme soutenu par l'État et le PNPE</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">0 FCFA</span>
                <span className="text-xs text-emerald-600 font-bold ml-2">Pour le porteur sélectionné</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Accessible sur appel à candidatures et sélection en jury. L'intégralité des heures d'expertise, du mentorat et de l'accès plateforme est subventionnée.
              </p>

              <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Diagnostic 360° initial complet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Coach expert certifié dédié (2x/mois)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Espace porteur pour dépôt de livrables</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Attestation officielle pour guichets bancaires</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/candidater"
                className="w-full py-3.5 block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-emerald-600/20"
              >
                Candidater à la sélection
              </Link>
            </div>
          </div>

          {/* Formule 2 : PME Autonome / Hors cohorte */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-slate-900">PME & Entreprise</h3>
                <p className="text-xs text-slate-500 mt-1">Accompagnement privé sur-mesure</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">Sur devis</span>
                <span className="text-xs text-slate-500 ml-1">Selon périmètre d'audit</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Pour les dirigeants souhaitant un audit financier express, une restructuration juridique ou un coaching de gouvernance sans attendre l'ouverture d'une cohorte.
              </p>

              <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Audit d'organisation et de trésorerie</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Consultant senior spécialisé par industrie</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Accès illimité aux modules de la plateforme</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/contact"
                className="w-full py-3.5 block text-center bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs rounded-full transition-all"
              >
                Demander un devis PME
              </Link>
            </div>
          </div>

          {/* Formule 3 : Bailleurs & Institutions */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-white">Bailleurs & Programmes</h3>
                <p className="text-xs text-slate-400 mt-1">Déploiement de cohortes régionales</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#FF5B37]">Partenariat</span>
                <span className="text-xs text-slate-400 ml-1">Convention cadre</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Mise à disposition de la plateforme souveraine en marque blanche ou cobranding avec tableau de bord de suivi d'impact et conformité des dépenses de formation.
              </p>

              <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Gestion jusqu'à 500 bénéficiaires simultanés</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Export des indicateurs d'impact pour bailleurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-[#FF5B37] shrink-0" />
                  <span>Pointage certifié et traçabilité des heures coachs</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to="/contact"
                className="w-full py-3.5 block text-center bg-[#FF5B37] hover:bg-[#e94d29] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-orange-500/30"
              >
                Échanger avec la direction
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Sparkles, 
  Star, 
  ArrowRight, 
  Users, 
  Rocket, 
  Building2, 
  UserCheck, 
  Clock, 
  Globe,
  PenTool,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openAuthModal } from '../auth/AuthModal';

export default function LandingPage() {
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Interactive Demo Modal state
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Comment IML Digital s'adapte-t-il à la taille de notre structure ?",
      a: "Que vous soyez un coach indépendant accompagnant 5 dirigeants ou un incubateur régional gérant plus de 150 porteurs avec 40 mentors, IML Digital propose des forfaits modulaires. Vous configurez vos programmes, vos cohortes et vos accès en toute autonomie."
    },
    {
      q: "Les porteurs de projet et mentors ont-ils un accès dédié ?",
      a: "Oui, absolument ! Chaque porteur de projet dispose d'un espace personnel pour déposer ses livrables, consulter son plan d'action et échanger avec son mentor. Les mentors ont quant à eux une console simplifiée pour saisir leurs comptes-rendus et valider les jalons."
    },
    {
      q: "Est-il possible de migrer nos données existantes (fichiers Excel, Airtable...) ?",
      a: "Tout à fait. Nous proposons un outil d'import rapide en format CSV/Excel pour charger vos listes d'entrepreneurs, historiques et contacts en quelques secondes. Notre équipe technique peut également vous accompagner pour une migration sur-mesure."
    },
    {
      q: "Quelles sont les garanties de confidentialité et sécurité (RGPD) ?",
      a: "La sécurité et la déontologie sont au cœur d'IML Digital. Toutes les données sont chiffrées en transit et au repos, hébergées en Europe sur des serveurs certifiés ISO 27001, et nous appliquons une stricte séparation des espaces de confidentialité entre projets."
    },
    {
      q: "Peut-on personnaliser les étapes de parcours et les critères de sélection ?",
      a: "Oui. Vous pouvez définir librement le nombre de jalons de vos programmes (Idéation, Prototypage, MVP, Go-to-Market, Levée de fonds...), ainsi que vos formulaires de candidature et vos grilles de notation pour les jurys."
    },
    {
      q: "Y a-t-il un engagement ou une période d'essai ?",
      a: "Vous bénéficiez d'une période d'essai gratuit de 14 jours, sans carte bancaire requise. Nos abonnements sont sans engagement de durée et résiliables à tout moment."
    }
  ];

  return (
    <div className="bg-[#FAF7F2] text-slate-900 font-sans selection:bg-[#f06553] selection:text-white">
      
      {/* =========================================================================
          1. HERO SECTION (Dark Navy #14233c matching reference)
         ========================================================================= */}
      <section className="relative bg-[#14233c] text-white pt-16 pb-24 px-6 overflow-hidden">
        {/* Soft background ambient gradient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-500/10 via-[#f06553]/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-[#38d9a9]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <span className="size-2 rounded-full bg-[#f06553] animate-pulse"></span>
              Plateforme SaaS dédiée à l'accompagnement
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[4.2rem] font-black leading-[1.08] tracking-tight">
              Accompagnez.<br />
              <span className="text-[#38d9a9]">Nous gérons</span><br />
              le reste.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              La plateforme tout-en-un pour les incubateurs, accélérateurs et professionnels de l'accompagnement. Centralisez vos porteurs de projet, vos séances, vos jalons et vos livrables.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button 
                type="button"
                id="btn-hero-connexion"
                onClick={() => openAuthModal('connexion')}
                className="px-6 py-3.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-xl shadow-[#f06553]/30 transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                Connexion
                <ArrowRight className="size-4" />
              </button>

              <Link
                to="/candidater"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base backdrop-blur-sm shadow-md"
              >
                <Rocket className="size-4 text-[#38d9a9]" />
                Déposer mon projet
              </Link>
              
              <button 
                onClick={() => setDemoModalOpen(true)}
                className="px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <div className="size-5 rounded-full bg-[#f06553]/20 flex items-center justify-center text-[#f06553]">
                  <Play className="size-2.5 fill-current" />
                </div>
                Voir la démo
              </button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#38d9a9]" /> Espace Équipe & Agents
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#38d9a9]" /> Dépôt de projet ouvert
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#38d9a9]" /> Conforme RGPD
              </span>
            </div>
          </div>

          {/* Right Column: Visual Mockup matching screenshot composition */}
          <div className="lg:col-span-6 relative">
            <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center">
              
              {/* Card 1: Calendar & Planning Mockup (Background main card) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-5 border border-slate-100 text-slate-900 relative z-10"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Planning d'accompagnement</h4>
                      <p className="text-xs text-slate-400">Semaine du 12 au 16 Octobre</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    4 sessions aujourd'hui
                  </span>
                </div>

                {/* Days Strip */}
                <div className="grid grid-cols-5 gap-2 my-4 text-center">
                  {[
                    { day: 'Lun', date: '12', active: true },
                    { day: 'Mar', date: '13', active: false },
                    { day: 'Mer', date: '14', active: false },
                    { day: 'Jeu', date: '15', active: false },
                    { day: 'Ven', date: '16', active: false },
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`py-2 rounded-xl text-xs transition-colors ${
                        item.active 
                          ? 'bg-[#14233c] text-white font-bold shadow-md shadow-[#14233c]/20' 
                          : 'bg-slate-50 text-slate-500 font-medium hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-75">{item.day}</div>
                      <div className="text-sm font-extrabold">{item.date}</div>
                    </div>
                  ))}
                </div>

                {/* Event Cards inside planning */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-9 rounded-full bg-[#f06553]"></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Point Jalon MVP</span>
                          <span className="text-[10px] font-semibold bg-[#f06553]/15 text-[#f06553] px-2 py-0.5 rounded-full">EcoTech</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-slate-400" /> 09:30 - 10:30 • Avec Thomas R.
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#f06553]">En cours</span>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-9 rounded-full bg-teal-500"></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Comité d'évaluation</span>
                          <span className="text-[10px] font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Cohorte #4</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-slate-400" /> 11:00 - 12:30 • 12 dossiers
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-700">Validé</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-9 rounded-full bg-slate-400"></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Mentoring Levée & BP</span>
                          <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">AgriSmart</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-slate-400" /> 14:30 - 15:30 • Expert Finance
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">À venir</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Floating Smartphone Preview (Bottom Right overlapping) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="absolute -right-2 sm:-right-6 -bottom-6 sm:-bottom-8 w-60 sm:w-64 bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-slate-700/80 z-20"
              >
                {/* Speaker Notch */}
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3"></div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-full bg-gradient-to-tr from-[#f06553] to-amber-400 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                      AD
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white">Awa Diallo</h5>
                    <p className="text-[10px] text-slate-400">Fondatrice CleanTech</p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                      <Star className="size-3 fill-current" />
                      <span className="font-bold text-white">4.9</span>
                      <span className="text-slate-400">(18 séances)</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-slate-800/90 rounded-xl p-2.5 mb-2.5 border border-slate-700">
                  <div className="flex justify-between text-[10px] mb-1 font-semibold">
                    <span className="text-slate-300">Jalon 3 : Go-to-Market</span>
                    <span className="text-[#38d9a9]">78%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#38d9a9] to-teal-400 w-[78%] rounded-full"></div>
                  </div>
                </div>

                <div className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-[#38d9a9]" />
                  <span>Prêt pour le comité investisseurs</span>
                </div>
              </motion.div>

              {/* Card 3: Floating Notification Pill (Top Left overlapping) */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hidden sm:flex absolute -left-4 top-4 bg-white/95 backdrop-blur-md text-slate-900 px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200 items-center gap-2.5 z-20 text-xs font-semibold"
              >
                <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold">Livrable validé</div>
                  <div className="text-[10px] text-slate-500">Business Plan v2 • il y a 4 min</div>
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          2. LOGOS BAND (White background bar matching screenshot)
         ========================================================================= */}
      <section className="bg-white py-10 px-6 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Ils propulsent leurs programmes avec iml digit
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800">IncubAlliance</span>
            <span className="font-black text-lg sm:text-xl tracking-wider text-slate-700">STATION <span className="text-[#f06553]">F</span></span>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">Bpifrance <span className="font-light">Hub</span></span>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-700">HEC <span className="text-teal-600">Incubateur</span></span>
            <span className="font-bold text-lg sm:text-xl tracking-wide text-slate-800">TechHub <span className="text-[#f06553]">Afrique</span></span>
            <span className="font-semibold text-lg sm:text-xl tracking-tight text-slate-700">50 Partners</span>
          </div>
        </div>
      </section>


      {/* =========================================================================
          3. SECTION: "Pensé pour ceux qui accompagnent." (Warm Ivory #FAF7F2)
         ========================================================================= */}
      <section className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f06553] bg-orange-100/60 px-3.5 py-1.5 rounded-full inline-block">
              Une plateforme, deux approches
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight">
              Pensé pour ceux qui <span className="text-teal-600">accompagnent.</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Une solution conçue sur-mesure pour chaque type de structure d'accompagnement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            
            {/* Card 1: Pour les incubateurs & indépendants */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className="space-y-6">
                <div className="size-14 rounded-2xl bg-[#f06553]/10 text-[#f06553] flex items-center justify-center shadow-inner">
                  <Rocket className="size-7" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pour les incubateurs & accélérateurs</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Pilotez vos promotions d'entrepreneurs de l'appel à projets jusqu'à la levée de fonds avec une gouvernance claire.
                  </p>
                </div>

                <ul className="space-y-3.5 pt-2">
                  {[
                    "Suivi centralisé multi-cohortes et passage de jalons (Idée → MVP → Levée)",
                    "Tableaux de bord de comités de sélection et scoring collégial des candidatures",
                    "Coordination fluide de votre pool de mentors et experts métiers",
                    "Centralisation sécurisée des livrables (Pitch decks, prévisionnels, contrats)",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                      <div className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Button */}
              <div className="pt-8">
                <Link 
                  to="/solutions/coach" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-md shadow-[#f06553]/20 transition-colors text-sm"
                >
                  Découvrir pour les incubateurs
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Pour les cabinets & réseaux */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className="space-y-6">
                <div className="size-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shadow-inner">
                  <Building2 className="size-7" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pour les cabinets & consultants</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Offrez une expérience premium à vos clients, fiabilisez votre facturation et générez vos dossiers de conformité.
                  </p>
                </div>

                <ul className="space-y-3.5 pt-2">
                  {[
                    "Espaces d'échanges privés et sécurisés pour chaque entreprise cliente",
                    "Feuilles de route sur-mesure et prise de notes d'entretiens synchronisée",
                    "Émargements électroniques horodatés et conformité d'audit",
                    "Reporting consolidé et synthèses pour commanditaires RH / bailleurs",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                      <div className="size-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Button */}
              <div className="pt-8">
                <Link 
                  to="/solutions/cabinet" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md shadow-slate-900/20 transition-colors text-sm"
                >
                  Découvrir pour les cabinets
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          4. HORIZONTAL DARK BANNER STRIP (Dark Navy #14233c matching reference)
         ========================================================================= */}
      <section className="px-6 py-4 bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto bg-[#14233c] text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-800">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Incubateurs, universités, investisseurs, et autres professionnels,
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              découvrez nos cas d'usage dédiés à vos programmes et à vos spécificités d'accompagnement.
            </p>
          </div>
          
          <Link 
            to="/offres" 
            className="shrink-0 px-7 py-3.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-lg shadow-[#f06553]/25 transition-all text-sm flex items-center gap-2"
          >
            Découvrir les solutions
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>


      {/* =========================================================================
          5. SECTION: "L'essentiel de votre métier, en un seul outil" (Light #FFFFFF)
         ========================================================================= */}
      <section className="py-24 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f06553] bg-orange-100/60 px-3.5 py-1.5 rounded-full inline-block">
              Fonctionnalités
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight">
              L'essentiel de votre métier, <span className="text-[#f06553]">en un seul outil</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Toutes les fonctionnalités dont vous avez besoin réunies dans une interface unique et intuitive.
            </p>
          </div>

          {/* 6 Feature Cards Grid matching iml digit features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Gestion des Accompagnants et Coachs */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-[#f06553]/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-[#f06553]/10 text-[#f06553] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Gestion des Accompagnants et Coachs</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Centralisez votre pool d'experts et de coachs, suivez leurs disponibilités et attribuez les bénéficiaires et missions en un clic.
              </p>
            </div>

            {/* 2. Gestion des Bénéficiaires 360° */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-teal-500/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <UserCheck className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Gestion des Bénéficiaires 360°</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vision panoramique sur chaque porteur de projet : avancement des étapes, livrables déposés, historique des séances et documents légaux.
              </p>
            </div>

            {/* 3. Portail Bénéficiaire Web et Mobile */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-[#f06553]/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-[#f06553]/10 text-[#f06553] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Globe className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Portail Bénéficiaire Web et Mobile</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Espace dédié et sécurisé pour l'entrepreneur : plan d'action, dépôt de fichiers, prise de rendez-vous en ligne et messagerie avec le mentor.
              </p>
            </div>

            {/* 4. Agenda et Planification */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-slate-800/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Agenda et Planification</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prise de rendez-vous fluide, synchronisation calendriers Google & Outlook, gestion des créneaux et rappels automatiques.
              </p>
            </div>

            {/* 5. Nath (Assistant IA & Copilote) */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-purple-500/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Nath (Assistant IA intelligent)</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Votre copilote intelligent : génération automatique de synthèses de rendez-vous, suggestions d'objectifs et aide à la rédaction de bilans.
              </p>
            </div>

            {/* 6. Prise de Notes & Compteur d'heures */}
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-slate-200/70 hover:border-blue-500/40 hover:shadow-xl transition-all group">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PenTool className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Prise de Notes & Compteur d'heures</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Notes de séance confidentielles et compteur d'heures horodaté dédié aux bilans de compétences et aux exigences de conformité.
              </p>
            </div>

          </div>

          <div className="text-center mt-12">
            <Link 
              to="/offres" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-colors text-sm"
            >
              Découvrir toutes les fonctionnalités
              <ChevronRight className="size-4" />
            </Link>
          </div>

        </div>
      </section>


      {/* =========================================================================
          6. SECTION: "Trois principes qui guident IML Digital" (Dark Navy #14233c)
         ========================================================================= */}
      <section className="py-24 px-6 bg-[#14233c] text-white">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black leading-tight tracking-tight">
              Trois <span className="text-[#38d9a9]">principes</span> qui<br />
              guident iml digit.
            </h2>
            
            <p className="text-slate-300 text-base leading-relaxed">
              Nous avons pensé iml digit avec une conviction forte : la technologie doit simplifier la gestion pour remettre l'humain et l'impact au cœur de l'accompagnement.
            </p>

            <div>
              <button 
                type="button"
                onClick={() => openAuthModal('inscription')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-lg shadow-[#f06553]/25 transition-all text-sm cursor-pointer"
              >
                Commencer maintenant
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Column: 3 Numbered Principle Cards */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-700/80 flex items-start gap-5 hover:bg-slate-800 transition-colors">
              <div className="size-11 rounded-full bg-[#f06553] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-[#f06553]/30">
                1
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white">La simplicité avant tout</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Une interface limpide et ergonomique que vos entrepreneurs et vos mentors adoptent instantanément sans formation lourde.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-700/80 flex items-start gap-5 hover:bg-slate-800 transition-colors">
              <div className="size-11 rounded-full bg-[#f06553] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-[#f06553]/30">
                2
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white">Tout en un seul lieu</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Fini l'éparpillement entre tableurs Excel, dossiers drives et fils de mails. Toute la mémoire et l'historique d'un projet sont unifiés.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-700/80 flex items-start gap-5 hover:bg-slate-800 transition-colors">
              <div className="size-11 rounded-full bg-[#f06553] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-[#f06553]/30">
                3
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white">L'humain au cœur du digital</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  La plateforme automatise les tâches administratives pour vous libérer du temps dédié à l'écoute, au mentorat et au conseil stratégique.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          7. SECTION: "Ce qu'en disent les utilisateurs" (Témoignages - Ivory #FAF7F2)
         ========================================================================= */}
      <section className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f06553] bg-orange-100/60 px-3.5 py-1.5 rounded-full inline-block">
              Témoignages
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight">
              Ce qu'en disent <span className="text-teal-600">les utilisateurs</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Découvrez les retours d'expérience de ceux qui utilisent IML Digital au quotidien.
            </p>
          </div>

          {/* 3 Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6">
                  "IML Digital a totalement transformé le suivi de nos 45 startups incubées. Les comités d'étape sont fluides, les mentors sont enfin alignés et nous avons divisé le temps de reporting par trois !"
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="font-bold text-slate-900 text-sm">Karim Traoré</div>
                <div className="text-xs text-slate-500">Directeur de l'Incubation • Tech Hub</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6">
                  "Avant IML, nous perdions un temps fou en relances manuelles pour les livrables et conventions. La centralisation a tout changé : chaque entrepreneur sait exactement où il en est."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="font-bold text-slate-900 text-sm">Florence Duval</div>
                <div className="text-xs text-slate-500">Responsable des Programmes • Pôle Innovation</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6">
                  "L'interface est d'une clarté absolue. En tant que mentor, je prépare mes séances en 2 minutes en consultant les derniers jalons et notes. C'est l'outil indispensable du métier."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="font-bold text-slate-900 text-sm">David Mercier</div>
                <div className="text-xs text-slate-500">Mentor & Business Angel</div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          8. SECTION: FEATURED RESOURCES (2 Cards - #FAF7F2 matching screenshot)
         ========================================================================= */}
      <section className="pb-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between group hover:border-[#f06553]/50 transition-colors">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#f06553] bg-orange-100/60 px-3 py-1 rounded-full inline-block">
                Guide méthodologique
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Comment structurer l'évaluation de maturité de vos projets incubés ?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Découvrez notre framework en 5 étapes pour faire passer vos porteurs de projet de l'idée au premier chiffre d'affaires récurrent.
              </p>
            </div>
            <div className="pt-6">
              <Link to="/ressources/guides" className="text-sm font-bold text-[#f06553] hover:text-[#e05341] flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Lire le guide complet <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between group hover:border-teal-500/50 transition-colors">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/60 px-3 py-1 rounded-full inline-block">
                Outil offert
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Grille d'évaluation pour Comités de Sélection & Jurys d'Admission
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Téléchargez gratuitement notre matrice de notation pondérée pour comparer objectivement les dossiers candidats de vos futurs programmes.
              </p>
            </div>
            <div className="pt-6">
              <Link to="/ressources/outils" className="text-sm font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Télécharger l'outil gratuitement <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          9. SECTION: FAQ ("Vos questions, nos réponses")
         ========================================================================= */}
      <section className="py-24 px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f06553] bg-orange-100/60 px-3.5 py-1.5 rounded-full inline-block">
              Questions fréquentes
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight">
              Vos <span className="text-[#f06553]">questions</span>, nos réponses
            </h2>
            <p className="text-slate-600 text-base">
              Retrouvez toutes les réponses aux questions les plus courantes.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all bg-[#FAF7F2]"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-slate-900 hover:text-[#f06553] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#f06553]' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 sm:px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-200/50 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          10. FINAL CTA BANNER (Dark Navy #14233c with rounded corners)
         ========================================================================= */}
      <section className="py-20 px-6 bg-[#FAF7F2]">
        <div className="max-w-[1400px] mx-auto bg-[#14233c] text-white rounded-3xl p-10 sm:p-16 text-center space-y-8 shadow-2xl border border-slate-800 relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-[3rem] font-black tracking-tight leading-tight">
              Prêt à structurer votre<br />
              <span className="text-[#38d9a9]">accompagnement</span> ?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Rejoignez les structures et professionnels qui font confiance à iml digit pour faire grandir leurs porteurs de projet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              type="button"
              onClick={() => openAuthModal('connexion')}
              className="w-full sm:w-auto px-8 py-4 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-xl shadow-[#f06553]/30 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              Connexion (Espace Équipe)
              <ArrowRight className="size-4" />
            </button>

            <Link 
              to="/candidater" 
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-600 transition-colors text-base flex items-center justify-center gap-2"
            >
              <Rocket className="size-4 text-[#38d9a9]" />
              Déposer un projet
            </Link>
          </div>

        </div>
      </section>


      {/* =========================================================================
          DEMO MODAL POPIN
         ========================================================================= */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100"
            >
              <button 
                onClick={() => setDemoModalOpen(false)}
                className="absolute top-5 right-5 size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-xs font-bold text-[#f06553]">
                  <Sparkles className="size-3.5" /> Visite guidée en direct
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900">
                  Découvrez iml digit en 2 minutes
                </h3>
                
                <div className="aspect-video bg-[#14233c] rounded-2xl flex flex-col items-center justify-center text-white p-6 text-center space-y-3 relative overflow-hidden">
                  <div className="size-16 rounded-full bg-[#f06553] flex items-center justify-center shadow-lg shadow-[#f06553]/40 cursor-pointer hover:scale-105 transition-transform">
                    <Play className="size-7 fill-white ml-1" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Présentation interactive de la plateforme</h4>
                    <p className="text-xs text-slate-400">Suivi des promotions, jury de sélection et portails porteurs</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Gestion multi-cohortes
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Émargements certifiés
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button 
                    onClick={() => setDemoModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoModalOpen(false);
                      openAuthModal('inscription');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-sm shadow-md cursor-pointer"
                  >
                    Commencer l'essai gratuit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

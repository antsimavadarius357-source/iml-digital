import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

import heroIncubatorHub from '../../assets/hero_incubator_hub.jpg';
import heroExecutiveCoaching from '../../assets/hero_executive_coaching.jpg';
import heroAgrobusinessMakers from '../../assets/hero_agrobusiness_makers.jpg';
import heroCertificationSuccess from '../../assets/hero_certification_success.jpg';

import {
  LogoGEW,
  LogoAPJA,
  LogoMinisterePME,
  LogoPNPE,
  LogoFEG,
  LogoChambreCommerce,
  LogoAfricaUnited,
  LogoGabonMeca,
  LogoMultipress,
  LogoCecaGadis,
  LogoDGI,
  LogoEDG,
  LogoOGAPI,
  LogoONEC,
  LogoAkewa,
  LogoVocalcentre,
  LogoCyberschool,
  LogoEDNComm,
  LogoDTGNet,
  LogoHokano,
} from '../../components/partners/PartnerLogos';

// Diapositives animées de fond du Hero (défilement automatique et continu)
const HERO_SLIDES = [
  {
    image: heroIncubatorHub,
    title: "Espaces modernes d'incubation & hub d'innovation"
  },
  {
    image: heroExecutiveCoaching,
    title: "Séances de mentorat et coaching stratégique personnalisé"
  },
  {
    image: heroAgrobusinessMakers,
    title: "Prototypage concret et valorisation des filières locales"
  },
  {
    image: heroCertificationSuccess,
    title: "Homologation officielle, certification et financement"
  }
];

// Partenaires et institutions de référence (issus de la bannière officielle GEW 2025 Libreville)
const PARTNERS = [
  { 
    name: "Ministère de l'Entrepreneuriat, du Commerce et des PME/PMI", 
    short: "Ministère PME",
    badge: "République Gabonaise",
    category: "Tutelle & Institutionnel",
    color: "#059669",
    Logo: LogoMinisterePME
  },
  { 
    name: "PNPE", 
    short: "PNPE Gabon",
    badge: "Pôle National de Promotion de l'Emploi",
    category: "Emploi & Insertion",
    color: "#2563eb",
    Logo: LogoPNPE
  },
  { 
    name: "FEG", 
    short: "FEG Gabon",
    badge: "Fédération des Entreprises du Gabon",
    category: "Organisation Patronale",
    color: "#0d9488",
    Logo: LogoFEG
  },
  { 
    name: "Chambre de Commerce du Gabon", 
    short: "Chambre de Commerce",
    badge: "Agriculture, Industrie, Mines & Artisanat",
    category: "Développement Économique",
    color: "#16a34a",
    Logo: LogoChambreCommerce
  },
  { 
    name: "AFRICA UNITED airlines", 
    short: "Africa United",
    badge: "Compagnie Aérienne & Mobilité",
    category: "Aérien & Transport",
    color: "#dc2626",
    Logo: LogoAfricaUnited
  },
  { 
    name: "GABON MECA", 
    short: "Gabon Meca",
    badge: "La Solution Bureau",
    category: "Solutions Pro & Bureautique",
    color: "#0284c7",
    Logo: LogoGabonMeca
  },
  { 
    name: "multipress gabon", 
    short: "Multipress",
    badge: "Presse, Édition & Impression",
    category: "Édition & Médias",
    color: "#4f46e5",
    Logo: LogoMultipress
  },
  { 
    name: "CECA GADIS", 
    short: "CECA GADIS",
    badge: "Grande Distribution & Commerce",
    category: "Distribution & Agroalimentaire",
    color: "#1e3a8a",
    Logo: LogoCecaGadis
  },
  { 
    name: "DGi", 
    short: "DGI Gabon",
    badge: "Direction Générale des Impôts",
    category: "Partenaire Fiscal & Juridique",
    color: "#0891b2",
    Logo: LogoDGI
  },
  { 
    name: "EDG", 
    short: "EDG Gabon",
    badge: "Entrepreneuriat & Développement",
    category: "Formation & Incubation",
    color: "#ea580c",
    Logo: LogoEDG
  },
  { 
    name: "OGAPI", 
    short: "OGAPI",
    badge: "Office Gabonais de la Propriété Industrielle",
    category: "Propriété Intellectuelle & Brevets",
    color: "#15803d",
    Logo: LogoOGAPI
  },
  { 
    name: "ONEC", 
    short: "ONEC Gabon",
    badge: "Ordre National des Experts Comptables",
    category: "Audit & Comptabilité",
    color: "#1d4ed8",
    Logo: LogoONEC
  },
  { 
    name: "AKEWA ACCÉLÉRATEUR", 
    short: "Akewa Accélérateur",
    badge: "Finance - Incubation - Accélération",
    category: "Financement & Accélération",
    color: "#b91c1c",
    Logo: LogoAkewa
  },
  { 
    name: "vocalcentre", 
    short: "Vocalcentre",
    badge: "Relation Client & Télécoms",
    category: "Services & Relation Client",
    color: "#64748b",
    Logo: LogoVocalcentre
  },
  { 
    name: "CYBERSCHOOL - ENTREPRENEURIAT", 
    short: "Cyberschool",
    badge: "Incubateur NTIC - Formation Logiciels",
    category: "Technologies & Numérique",
    color: "#4338ca",
    Logo: LogoCyberschool
  },
  { 
    name: "EDN'COMM", 
    short: "EDN'COMM",
    badge: "Communication 360° & Événementiel",
    category: "Communication & Publicité",
    color: "#84cc16",
    Logo: LogoEDNComm
  },
  { 
    name: "DTG+Net PROPRE", 
    short: "DTG+Net",
    badge: "Services & Logistique Pro",
    category: "Services aux Entreprises",
    color: "#0ea5e9",
    Logo: LogoDTGNet
  },
  { 
    name: "HOKANO", 
    short: "Hokano",
    badge: "Conseil & Solutions Partenaires",
    category: "Conseil Stratégique",
    color: "#7c3aed",
    Logo: LogoHokano
  },
  { 
    name: "APJA", 
    short: "APJA",
    badge: "Agir Pour une Jeunesse Autonome (Depuis 2013)",
    category: "Jeunesse & Insertion",
    color: "#9333ea",
    Logo: LogoAPJA
  },
  { 
    name: "GLOBAL ENTREPRENEURSHIP WEEK", 
    short: "GEW Libreville",
    badge: "Semaine Mondiale de l'Entrepreneuriat (#GEW2025)",
    category: "Réseau Mondial",
    color: "#FF5B37",
    Logo: LogoGEW
  }
];

export default function LandingPage() {
  // Slide active pour le carrousel animé en arrière-plan du Hero
  const [currentSlide, setCurrentSlide] = useState(0);

  // Défilement automatique et répété en continu (toutes les 4.5 secondes)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Accordéon FAQ
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Qui peut candidater aux programmes d'incubation IML Digit ?",
      a: "Nos programmes s'adressent à toute personne ou équipe porteuse d'une idée innovante, d'un projet en amorçage, ainsi qu'aux PME et coopératives gabonaises en activité souhaitant se restructurer, digitaliser leurs processus et accélérer leur croissance."
    },
    {
      q: "Comment se déroule la sélection des dossiers ?",
      a: "La sélection se fait en 3 temps : un formulaire de candidature en ligne, une analyse technique d'éligibilité par nos conseillers guichet, puis un entretien d'adéquation porteur/projet pour intégrer la cohorte correspondante."
    },
    {
      q: "L'accompagnement et les séances de coaching sont-ils payants ?",
      a: "Pour les porteurs sélectionnés dans le cadre des cohortes nationales financées par nos partenaires institutionnels, l'accompagnement est 100% pris en charge. Des forfaits sur-mesure existent également pour les entreprises matures souhaitant un audit spécifique."
    },
    {
      q: "Comment fonctionne le suivi avec mon coach référent ?",
      a: "Dès votre admission, un coach expert vous est personnellement assigné. Vous planifiez des séances régulières (en présentiel ou visioconférence sécurisée), consignez vos livrables sur la plateforme et validez étape par étape chaque jalon d'incubation."
    },
    {
      q: "La plateforme IML Digit m'aide-t-elle à trouver des financements ?",
      a: "Oui. Le passage réussi des 4 jalons donne lieu à une attestation officielle d'incubation et à la constitution d'un dossier bancable certifié, présenté directement aux guichets partenaires de crédit et aux fonds d'amorçage."
    }
  ];

  return (
    <div className="bg-[#FAF9F5] text-slate-900 selection:bg-[#FF5B37] selection:text-white">

      {/* =========================================================================
          1. HERO SECTION CINÉMATIQUE AVEC DÉFILEMENT D'IMAGES ANIMÉES CONTINU
         ========================================================================= */}
      <section 
        className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden text-white min-h-[580px] flex flex-col justify-center items-center"
      >
        {/* CARROUSEL D'IMAGES DE FOND AVEC EFFET KEN BURNS & CROSS-FADE RÉPÉTÉ */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {HERO_SLIDES.map((slide, idx) => (
            <motion.div
              key={idx}
              initial={false}
              animate={{ 
                opacity: idx === currentSlide ? 1 : 0,
                scale: idx === currentSlide ? 1 : 1.08
              }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]" 
              />
            </motion.div>
          ))}

          {/* Dégradés d'overlay de luxe pour garantir une lisibilité absolue */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5B37]/25 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          
          {/* Header text content */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            


            {/* Titre Principal percutant */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-md"
            >
              Donnez une trajectoire solide{' '}
              <span className="bg-gradient-to-r from-[#FF7A5C] via-[#FFA085] to-[#FF5B37] bg-clip-text text-transparent">
                à vos ambitions d'entreprise.
              </span>
            </motion.h1>

            {/* Sous-titre rassurant */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-sm"
            >
              IML Digit est la plateforme souveraine qui structure l'incubation de vos projets : 
              mentorat personnalisé, suivi certifié étape par étape et mise en relation directe avec les financements.
            </motion.p>

            {/* CTAs d'action directe */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            >
              <Link
                to="/candidater"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#FF5B37] to-[#FA4620] hover:from-[#e94d29] hover:to-[#df3711] text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Candidater à une cohorte</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>


            </motion.div>

            {/* Micro réassurance */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-300 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Accompagnement 100% certifié</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>45 coachs experts attitrés</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Plateforme souveraine sécurisée</span>
              </div>
            </motion.div>

          </div>

          {/* Indicateurs discrets et élégants du défilement automatique répété */}
          <div className="pt-8 flex items-center justify-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  idx === currentSlide 
                    ? 'w-8 bg-[#FF5B37]' 
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Diapositive ${idx + 1}`}
              />
            ))}
          </div>


        </div>
      </section>

      {/* =========================================================================
          2. BANDEAU DES PARTENAIRES & ÉCOSYSTÈME (DÉFILEMENT DE DROITE À GAUCHE)
         ========================================================================= */}
      <section className="py-10 border-y border-stone-200/80 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ils soutiennent, financent et accompagnent l'écosystème entrepreneurial avec IML Digit
            </p>
            <span className="text-[11px] font-semibold text-[#FF5B37] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60 shrink-0">
              Écosystème GEW 2025 Libreville
            </span>
          </div>
        </div>

        {/* Conteneur défilant de droite à gauche avec masques en dégradé sur les bords */}
        <div className="relative w-full overflow-hidden">
          {/* Dégradé flou à gauche */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          
          {/* Dégradé flou à droite */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Bande animée continue de droite à gauche (glisse vers la gauche en boucle infinie) */}
          <div className="animate-marquee-left flex items-center gap-10 sm:gap-14 py-3">
            {[...PARTNERS, ...PARTNERS].map((partner, idx) => {
              const LogoComp = partner.Logo;
              return (
                <div 
                  key={idx}
                  className="shrink-0 flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-default select-none px-2"
                  title={partner.name}
                >
                  <LogoComp className="h-9 sm:h-11 w-auto max-w-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. NOTRE MÉTHODOLOGIE EN 4 ÉTAPES (Jalons certifiés)
         ========================================================================= */}
      <section id="methodologie" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2.5xl mx-auto space-y-3 mb-16">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold uppercase tracking-wider">
              Parcours d'Incubation Rigoureux
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Une méthode éprouvée en 4 étapes clés pour sécuriser votre succès.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Chaque étape est validée de concert entre le porteur de projet et son coach expert. 
              Pas de théorie superflue : uniquement des livrables concrets et actionnables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Étape 1 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-orange-50 text-[#FF5B37] border border-orange-100 flex items-center justify-center font-black text-xl group-hover:scale-105 transition-transform">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900">Diagnostic & Diagnostic 360°</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Évaluation approfondie de l'adéquation porteur/projet, audit des forces, identification des freins réglementaires et fixation de la feuille de route.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Livrables validés :</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Fiche d'identification KYC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Feuille de route 6 mois</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black text-xl group-hover:scale-105 transition-transform">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900">Structuration & Prototypage</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Séances de coaching hebdomadaires pour affiner l'offre de valeur, construire le business model, prototyper le produit/service et tester le marché.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Livrables validés :</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Business Model Canvas validé</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Premières ventes / MVP testé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xl group-hover:scale-105 transition-transform">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900">Homologation & Finance</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Élaboration du plan financier prévisionnel, formalisation juridique de l'entreprise et passage devant le comité d'évaluation stratégique.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Livrables validés :</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Dossier bancable complet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Attestation d'homologation IML</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-black text-xl group-hover:scale-105 transition-transform">
                  04
                </div>
                <h3 className="text-lg font-bold text-slate-900">Accélération & Marché</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mise en relation avec les banques et fonds d'amorçage partenaires, accès aux marchés publics et privés, et intégration au club des alumni.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Livrables validés :</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Financement mobilisé</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Adhésion au réseau d'affaires</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          4. PROGRAMMES D'ACCOMPAGNEMENT DÉDIÉS
         ========================================================================= */}
      <section id="programmes" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2.5xl mx-auto space-y-3 mb-16">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Offres & Programmes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Des programmes sur-mesure pour chaque stade de maturité.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Que vous partiez d'une idée ou dirigiez déjà une entreprise établie, nous avons le cadre d'incubation adapté à votre réalité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Programme 1 : Émergence */}
            <div className="rounded-3xl bg-[#FAF9F5] border border-stone-200/90 p-8 flex flex-col justify-between hover:border-[#FF5B37]/40 hover:shadow-xl transition-all">
              <div className="space-y-5">
                <div className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold">
                  Idéation & Amorce
                </div>
                <h3 className="text-2xl font-black text-slate-900">Programme Émergence</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Idéal pour les primo-entrepreneurs, étudiants et jeunes diplômés porteurs d'un projet innovant nécessitant validation du marché et formalisation.
                </p>

                <div className="space-y-2.5 pt-4 border-t border-stone-200/70 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Durée : 3 à 6 mois d'incubation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>2 séances de coaching par mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Ateliers thématiques (Marketing, Pitch, Juridique)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Accompagnement à l'immatriculation (ANPI/DGI)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Programme 2 : Croissance PME (Populaire) */}
            <div className="rounded-3xl bg-slate-900 text-white p-8 flex flex-col justify-between relative shadow-xl hover:-translate-y-1 transition-all">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5B37] to-[#FA4620] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                Plus Demandé
              </div>

              <div className="space-y-5">
                <div className="inline-flex px-3 py-1 rounded-full bg-slate-800 text-[#FF8E75] text-xs font-bold border border-slate-700">
                  Entreprises Existantes & PME
                </div>
                <h3 className="text-2xl font-black text-white">Programme Croissance PME</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pour les dirigeants de PME souhaitant restructurer leurs finances, digitaliser leur gestion et lever de la dette ou du capital d'expansion.
                </p>

                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Durée : 6 à 12 mois intensifs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Mentorat individuel avec expert financier dédié</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Audit 360° et plan de redressement de trésorerie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#FF5B37] shrink-0" />
                    <span>Mise en relation directe avec les guichets de crédit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Programme 3 : Filières & Coopératives */}
            <div className="rounded-3xl bg-[#FAF9F5] border border-stone-200/90 p-8 flex flex-col justify-between hover:border-[#FF5B37]/40 hover:shadow-xl transition-all">
              <div className="space-y-5">
                <div className="inline-flex px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                  Organisations & Filières
                </div>
                <h3 className="text-2xl font-black text-slate-900">Coopératives & Filières</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accompagnement de groupements agricoles, coopératives artisanales et filières rurales pour structurer leur gouvernance et accéder aux marchés.
                </p>

                <div className="space-y-2.5 pt-4 border-t border-stone-200/70 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Structuration juridique et registre OHADA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Gestion financière collective et transparence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Négociation des débouchés avec grands distributeurs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Accompagnement aux subventions de développement</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. CHIFFRES D'IMPACT CLÉS
         ========================================================================= */}
      <section id="impact" className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#FF5B37]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-[#FF8E75] text-xs font-bold uppercase tracking-wider border border-slate-700">
              Impact National Mesurable
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Des résultats concrets sur l'économie réelle.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-[#FF5B37]">520+</div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Entreprises Accompagnées</h4>
              <p className="text-xs text-slate-400">Dossiers instruits avec succès sur tout le territoire.</p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400">88%</div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Taux de Pérennité</h4>
              <p className="text-xs text-slate-400">Des entreprises toujours en activité après 3 années.</p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-blue-400">45+</div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Coachs & Experts</h4>
              <p className="text-xs text-slate-400">Mobilisés sur la finance, le juridique et le commercial.</p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-amber-400">2,4 Mds</div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">FCFA Mobilisés</h4>
              <p className="text-xs text-slate-400">De crédits, subventions et financements partenaires.</p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          6. TÉMOIGNAGES DE LAURÉATS ET EXPERTS
         ========================================================================= */}
      <section id="temoignages" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2.5xl mx-auto space-y-3 mb-16">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold uppercase tracking-wider">
              Témoignages & Succès
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Ceux qui ont transformé leur projet témoignent.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                « Avant d'intégrer IML Digit, nous avions d'excellents produits agroalimentaires mais aucune comptabilité structurée. Notre coach nous a guidés pas à pas. Nous avons obtenu notre financement de 15 millions en 4 mois. »
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                <div className="size-11 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  BO
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Bertrand Ondo</h4>
                  <p className="text-[11px] text-slate-500">Fondateur ManiBio • Cohorte 2025</p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                « En tant que coach certifié, la plateforme IML Digit m'a fait gagner un temps précieux. Fini les comptes-rendus Word éparpillés : chaque séance est horodatée, les jalons sont clairs et l'entrepreneur sait exactement ce qu'il doit livrer. »
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                <div className="size-11 rounded-full bg-orange-100 text-[#FF5B37] font-bold flex items-center justify-center text-sm">
                  DM
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Darius M.</h4>
                  <p className="text-[11px] text-slate-500">Coach Consultant en Stratégie Financière</p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-6">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                « Nous avons pu fédérer 40 planteurs de café et cacao dans le Woleu-Ntem. Grâce au programme Filières, notre coopérative dispose aujourd'hui d'un agrément officiel et d'un contrat direct d'approvisionnement avec Libreville. »
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                <div className="size-11 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                  NE
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Nathalie Essono</h4>
                  <p className="text-[11px] text-slate-500">Présidente Coopérative Agricole d'Oyem</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          7. FOIRE AUX QUESTIONS (FAQ Accordéon)
         ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-stone-200/80">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5B37]">
              Réponses Claires
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Questions Fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-stone-200/80 bg-[#FAF9F5] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#FF5B37] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#FF5B37]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-stone-200/60 pt-3 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          8. BANNIÈRE D'APPEL À L'ACTION FINALE (Grande immersion)
         ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5]">
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-slate-900 via-[#18283d] to-slate-900 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl border border-slate-800">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5B37]/15 rounded-full blur-[90px] pointer-events-none" />
          
          <div className="max-w-2.5xl mx-auto space-y-6 relative z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-[#FF5B37]/20 border border-[#FF5B37]/30 text-[#FF8E75] text-xs font-bold uppercase tracking-wider inline-block">
              Lancez-vous dès aujourd'hui
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Prêt à concrétiser et financer votre projet d'entreprise ?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Rejoignez les centaines d'entrepreneurs gabonais accompagnés par nos experts certifiés. 
              Le formulaire de candidature ne prend que 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/candidater"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Déposer ma candidature (Gratuit)</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm sm:text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Poser une question</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

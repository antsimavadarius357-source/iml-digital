import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Users, 
  Video, 
  Building2, 
  Briefcase, 
  Layers,
  ShieldCheck,
  Clock,
  Check,
  FileCheck,
  UploadCloud,
  FileText,
  Trash2,
  Paperclip,
  Search
} from 'lucide-react';
import { api } from '../../lib/api';

import cohortCoaching from '../../assets/cohort_coaching.jpg';
import cohortPitch from '../../assets/cohort_pitch.jpg';
import cohortProduct from '../../assets/cohort_product.jpg';

const showcaseSlides = [
  {
    image: cohortCoaching,
    badge: "Mentorat & Diagnostic",
    title: "Coaching individuel & Stratégie",
    description: "Travaillez en tête-à-tête avec des consultants seniors et mentors sectoriels de la plateforme.",
    statNumber: "94%",
    statLabel: "Taux de survie à 3 ans",
  },
  {
    image: cohortPitch,
    badge: "Comité & Investisseurs",
    title: "Pitch & Financements Partenaires",
    description: "Défendez votre modèle d'affaires devant les comités d'investissement, banques et business angels gabonais.",
    statNumber: "1.2 Md",
    statLabel: "FCFA mobilisés pour les cohortes",
  },
  {
    image: cohortProduct,
    badge: "Showroom & Marché",
    title: "Prototypage & Traction B2B/B2C",
    description: "De l'idée au déploiement : accédez au showroom, signez vos premiers contrats et accélérez vos ventes.",
    statNumber: "+450",
    statLabel: "Entreprises & PME accélérées",
  },
];

export default function PublicApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Défilement automatique continu des images en arrière-plan
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [referenceCode, setReferenceCode] = useState('');
  
  // Étape 1 : Profil & Stade (aucun sélectionné par défaut, la couleur sort au clic)
  const [structureType, setStructureType] = useState<'PORTEUR_IDEE' | 'STARTUP' | 'PME' | 'ORGANISATION' | ''>('');
  const [stage, setStage] = useState('');

  // Étape 2 : Dirigeant / Représentant
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Libreville');

  // Étape 3 : Entreprise / Projet
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [legalStatus, setLegalStatus] = useState('SARL');
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [companySize, setCompanySize] = useState('MICRO');
  const [creationYear, setCreationYear] = useState<number>(new Date().getFullYear());
  const [annualRevenue, setAnnualRevenue] = useState('MOINS_10M');
  const [description, setDescription] = useState('');

  // Pièces jointes & Documents pour le suivi
  interface UploadedDoc {
    fileId: string;
    originalName: string;
    size: number;
    mimeType: string;
    category: string;
  }
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);
    setUploadDocError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setUploadDocError(`Le fichier "${file.name}" dépasse la taille maximale autorisée (10 Mo).`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/v1/applications/public/attachments', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'iml-digital',
          },
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error?.message || 'Erreur lors du téléversement');
        }

        const data = await res.json();
        if (data?.attachment) {
          const lower = file.name.toLowerCase();
          let cat = 'AUTRE';
          if (lower.includes('business') || lower.includes('plan') || lower.includes('bp')) cat = 'BUSINESS_PLAN';
          else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('presentation')) cat = 'PITCH_DECK';
          else if (lower.includes('rccm') || lower.includes('statut') || lower.includes('kbis') || lower.includes('nif')) cat = 'JURIDIQUE';
          else if (lower.includes('cni') || lower.includes('passeport') || lower.includes('identite')) cat = 'IDENTITE';
          else if (lower.includes('devis') || lower.includes('financier') || lower.includes('bilan')) cat = 'FINANCIER';

          setDocuments(prev => [
            ...prev,
            {
              fileId: data.attachment.fileId,
              originalName: data.attachment.originalName,
              size: data.attachment.size,
              mimeType: data.attachment.mimeType,
              category: cat,
            }
          ]);
        }
      } catch (err: any) {
        setUploadDocError(err?.message || `Échec du téléversement de ${file.name}`);
      }
    }

    setIsUploadingDoc(false);
    e.target.value = '';
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDocCategory = (index: number, category: string) => {
    setDocuments(prev => prev.map((doc, i) => i === index ? { ...doc, category } : doc));
  };

  // Étape 4 : Besoins & Modalités
  const [needs, setNeeds] = useState<string[]>([]);
  const [interviewPreference, setInterviewPreference] = useState<'PRESENTIEL' | 'VIDEO'>('PRESENTIEL');
  const [hasVideoEquipment, setHasVideoEquipment] = useState(true);

  // Erreurs de validation par étape
  const [stepError, setStepError] = useState('');

  const mut = useMutation({
    mutationFn: (data: any) => api<{ application: any }>('/applications/submit', { method: 'POST', body: data }),
    onSuccess: (res: any) => {
      const seq = res?.application?.seqNumber;
      const code = seq ? `IML-2026-${String(seq).padStart(4, '0')}` : 'IML-' + Math.floor(100000 + Math.random() * 900000);
      setReferenceCode(code);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      setStepError(err?.message || "Une erreur est survenue lors de l'enregistrement de votre candidature.");
    }
  });

  const toggleNeed = (item: string) => {
    setNeeds(prev => 
      prev.includes(item) ? prev.filter(n => n !== item) : [...prev, item]
    );
  };

  const validateStep = (stepNumber: number): boolean => {
    setStepError('');
    if (stepNumber === 1) {
      if (!structureType) {
        setStepError('Veuillez sélectionner le profil de votre structure.');
        return false;
      }
      if (!stage) {
        setStepError('Veuillez sélectionner votre stade de développement actuel.');
        return false;
      }
      return true;
    }
    if (stepNumber === 2) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError('Veuillez renseigner votre prénom et votre nom.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setStepError('Veuillez renseigner une adresse email valide.');
        return false;
      }
      if (!phone.trim()) {
        setStepError('Veuillez renseigner votre numéro de téléphone.');
        return false;
      }
      return true;
    }
    if (stepNumber === 3) {
      if (!companyName.trim()) {
        setStepError('Veuillez renseigner le nom de votre entreprise ou projet.');
        return false;
      }
      if (!sector.trim()) {
        setStepError('Veuillez préciser votre secteur d’activité.');
        return false;
      }
      if (!description.trim()) {
        setStepError('Veuillez présenter brièvement vos activités et vos défis.');
        return false;
      }
      return true;
    }
    if (stepNumber === 4) {
      if (needs.length === 0) {
        setStepError('Veuillez cocher au moins un besoin prioritaire pour votre accompagnement.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStepError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      handleNext();
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    const compName = companyName.trim() || 'Entreprise sans nom';

    mut.mutate({
      applicantData: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim() || 'Libreville',
        structureType,
        companyName: compName,
        rccm: (structureType === 'PME' || structureType === 'STARTUP') && rccm.trim() ? rccm.trim() : undefined,
        nif: (structureType === 'PME' || structureType === 'STARTUP') && nif.trim() ? nif.trim() : undefined,
        legalStatus: (structureType === 'PME' || structureType === 'STARTUP') ? legalStatus : undefined,
        companySize: (structureType === 'PME' || structureType === 'STARTUP') ? companySize : undefined,
        annualRevenue: (structureType === 'PME' || structureType === 'STARTUP') ? annualRevenue : undefined,
        creationYear: (structureType === 'PME' || structureType === 'STARTUP') ? creationYear : undefined,
        interviewPreference,
        hasVideoEquipment: interviewPreference === 'VIDEO' ? hasVideoEquipment : false,
      },
      projectData: {
        title: compName,
        description: description.trim(),
        sector: sector.trim(),
        stage: stage,
        needs: needs,
        documents: documents,
      }
    });
  };

  const stagesList = structureType === 'PME' ? [
    { id: 'DEMARRAGE', label: '1 à 3 ans', desc: 'Consolidation & premiers bilans' },
    { id: 'CROISSANCE', label: 'En développement', desc: 'Expansion commerciale & recrutements' },
    { id: 'RESTRUCTURATION', label: 'Mise à niveau', desc: 'Digitalisation & restructuration' },
    { id: 'MATURITE', label: 'Maturité (> 5 ans)', desc: 'Diversification & investissements' },
  ] : [
    { id: 'IDEE', label: 'Idée & Cadrage', desc: 'Concept en cours de réflexion' },
    { id: 'PROTOTYPE', label: 'Prototype / MVP', desc: 'Première version en test' },
    { id: 'COMMERCIAL', label: 'Lancement marché', desc: 'Premiers clients & ventes' },
    { id: 'CROISSANCE', label: 'En développement', desc: 'Recherche d’échelle & fonds' },
  ];

  const availableNeeds = structureType === 'PME' ? [
    'Diagnostic stratégique & Financier',
    'Mise à niveau organisationnelle & RH',
    'Transition numérique & Outils digitaux',
    'Accès aux financements & Banques',
    'Conformité fiscale & Juridique',
    'Accès aux marchés & Partenariats'
  ] : [
    'Diagnostic & Stratégie',
    'Accompagnement méthodologique',
    'Mentorat & Coaching individuel',
    'Recherche de financements & Subventions',
    'Développement commercial & Pitch',
    'Réseau & Partenariats'
  ];

  const stepsList = [
    { num: 1, title: 'Profil de structure', icon: Briefcase, desc: 'Type & maturité' },
    { num: 2, title: 'Dirigeant', icon: Users, desc: 'Contact & localisation' },
    { num: 3, title: 'Entreprise & Projet', icon: Building2, desc: 'Activité & juridique' },
    { num: 4, title: 'Besoins & Entretien', icon: Target, desc: 'Forfait & rendez-vous' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#f06553] selection:text-white">
      <div className="max-w-[1360px] mx-auto space-y-6">
        
        {/* Navigation retour & Suivi de dossier */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f06553] transition-colors"
            >
              <ArrowLeft className="size-4" /> Retour au site IML Digit
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/suivi-candidature"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#f06553] bg-white hover:bg-orange-50/70 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
            >
              <Search className="size-3.5 text-[#f06553] group-hover:scale-110 transition-transform" />
              <span>Suivre mon dossier</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Guichet de candidature • Incubateur IML Digit</span>
          </div>
        </div>

        {submitted ? (
          /* =========================================================================
              CONFIRMATION DE SOUMISSION AVEC SUCCÈS
             ========================================================================= */
          <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-orange-100 text-[#f06553] text-xs font-bold uppercase tracking-wider">
                Numéro de dossier : {referenceCode}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Candidature enregistrée avec succès !
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Votre dossier a bien été transmis aux agents et experts de l'<strong>incubateur IML Digit</strong>.
              </p>
            </div>

            {/* Étapes suivantes */}
            <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-200/80 max-w-md mx-auto space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prochaines étapes :</h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Examen de recevabilité de votre dossier sous <strong>48 à 72 heures</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Envoi automatique d'une convocation officielle pour votre entretien d'évaluation (Présentiel à B2 ou Visioconférence).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Restitution du diagnostic de maturité et intégration dans la cohorte d'accompagnement.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                to={`/suivi-candidature?code=${encodeURIComponent(referenceCode)}`} 
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#f06553]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="size-4" />
                <span>Suivre mon dossier en direct</span>
              </Link>
              <Link 
                to="/" 
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-md"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
              LAYOUT HORIZONTAL SPLIT (Sidebar d'accueil à gauche + Formulaire par étapes à droite)
             ========================================================================= */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* -----------------------------------------------------------------------
                PANNEAU GAUCHE : IDENTITÉ & CONTEXTE DE LA PLATEFORME (Sticky)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
              
              {/* ===================================================================
                  CARROUSEL D'IMAGES ANIMÉ EN JAVASCRIPT (Framer Motion + Auto-Play)
                 =================================================================== */}
              <div 
                className="relative overflow-hidden rounded-3xl bg-[#0e1726] shadow-xl border border-slate-800 text-white min-h-[420px] flex flex-col justify-end group"
              >
                {/* Image d'arrière-plan épousant 100% des dimensions exactes du cadre */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl w-full h-full">
                  {showcaseSlides.map((slide, idx) => {
                    const isActive = idx === currentSlide;
                    return (
                      <motion.div
                        key={idx}
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                          scale: isActive ? 1.04 : 1,
                          zIndex: isActive ? 1 : 0,
                        }}
                        transition={{
                          opacity: { duration: 0.8, ease: "easeInOut" },
                          scale: { duration: 5, ease: "easeOut" }
                        }}
                        className="absolute inset-0 pointer-events-none w-full h-full"
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
                      >
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="w-full h-full object-cover object-center"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Voile translucide pour laisser l'image visible sur 100% de la surface du cadre tout en assurant la lisibilité */}
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={{
                            background: 'linear-gradient(to top, rgba(14, 23, 38, 0.92) 0%, rgba(14, 23, 38, 0.6) 42%, rgba(14, 23, 38, 0.2) 75%, rgba(14, 23, 38, 0.05) 100%)'
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Contenu textuel animé de la diapositive */}
                <div className="relative z-10 p-6 pt-12 space-y-3.5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45 }}
                      className="space-y-3"
                    >
                      <div className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-sm">
                        {showcaseSlides[currentSlide].badge}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug drop-shadow-md text-white">
                        {showcaseSlides[currentSlide].title}
                      </h2>

                      <p className="text-slate-100 text-xs sm:text-sm leading-relaxed drop-shadow-sm font-medium">
                        {showcaseSlides[currentSlide].description}
                      </p>

                      {/* Statistique clé */}
                      <div className="pt-2 flex items-center gap-3">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 shadow-sm">
                          <div className="leading-tight">
                            <div className="text-base font-black text-white">
                              {showcaseSlides[currentSlide].statNumber}
                            </div>
                            <div className="text-[10px] font-medium text-slate-300">
                              {showcaseSlides[currentSlide].statLabel}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Badges de Réassurance Opérationnelle */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <Clock className="size-4 text-[#f06553] shrink-0" />
                  <span>Formulaire en ligne : <strong>~3 minutes</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>Examen & retour sous <strong>48 à 72h ouvrées</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <FileCheck className="size-4 text-slate-500 shrink-0" />
                  <span>Conforme aux normes d'admission IML Digit</span>
                </div>
              </div>

              {/* Stepper Vertical de Suivi dans la Colonne de Gauche */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 hidden lg:block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Progression de votre dossier
                </span>
                <div className="space-y-2">
                  {stepsList.map((st) => {
                    const isDone = currentStep > st.num;
                    const isCurrent = currentStep === st.num;
                    const IconC = st.icon;

                    return (
                      <button
                        key={st.num}
                        type="button"
                        onClick={() => {
                          if (st.num < currentStep || validateStep(currentStep)) {
                            setCurrentStep(st.num);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all ${
                          isCurrent 
                            ? 'bg-orange-50/80 border border-[#f06553]/30 shadow-2xs' 
                            : isDone
                            ? 'bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100'
                            : 'opacity-50 pointer-events-none'
                        }`}
                      >
                        <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isDone 
                            ? 'bg-emerald-600 text-white' 
                            : isCurrent
                            ? 'bg-[#f06553] text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isDone ? <Check className="size-4 stroke-[3]" /> : <IconC className="size-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isCurrent ? 'text-[#f06553]' : 'text-slate-800'}`}>
                              Étape {st.num}. {st.title}
                            </span>
                            {isDone && <span className="text-[10px] font-bold text-emerald-600">Prêt</span>}
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">{st.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* -----------------------------------------------------------------------
                PANNEAU DROIT : FORMULAIRE HORIZONTAL AVEC STEPPER SUPÉRIEUR
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
                
                {/* Barre de Stepper Horizontale Supérieure */}
                <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {stepsList.map((st, i) => {
                      const isDone = currentStep > st.num;
                      const isCurrent = currentStep === st.num;
                      const IconComp = st.icon;

                      return (
                        <div key={st.num} className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (st.num < currentStep || validateStep(currentStep)) {
                                setCurrentStep(st.num);
                              }
                            }}
                            className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-white text-[#f06553] shadow-xs border border-orange-200 ring-2 ring-[#f06553]/20'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <div className={`size-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                              isDone ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-[#f06553] text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isDone ? <Check className="size-3.5 stroke-[3]" /> : <IconComp className="size-3.5" />}
                            </div>
                            <span className="hidden sm:inline whitespace-nowrap">{st.title}</span>
                          </button>

                          {i < stepsList.length - 1 && (
                            <div className="w-4 sm:w-8 h-0.5 bg-slate-200 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Barre de progression continue - Couleur Unie Simple */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-[#f06553] h-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Formulaire Contenu */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                  
                  {/* Alerte Erreur de validation */}
                  {stepError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
                      <div className="size-2 rounded-full bg-red-500 animate-ping" />
                      <span>{stepError}</span>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 1 : PROFIL DE LA STRUCTURE & MATURITÉ
                     =================================================================== */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">1. Quel est le profil de votre structure ?</h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Sélectionnez la catégorie qui décrit le mieux votre activité pour calibrer le parcours d'incubation.
                        </p>
                      </div>

                      {/* 4 Cartes de sélection en Grille Horizontale */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { id: 'PORTEUR_IDEE', label: "Porteur d'Idée", desc: "Création / Idéation", icon: Lightbulb, badge: 'Phase 1' },
                          { id: 'STARTUP', label: "Startup Tech", desc: "Produit innovant / Scale", icon: Rocket, badge: 'Tech / MVP' },
                          { id: 'PME', label: "TPE / PME", desc: "Entreprise en activité", icon: Building2, badge: 'Croissance' },
                          { id: 'ORGANISATION', label: "Organisation / Coop", desc: "Groupement / GIE", icon: Layers, badge: 'Filière' }
                        ].map((type) => {
                          const IconComp = type.icon;
                          const isSelected = structureType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setStructureType(prev => (prev === type.id ? '' : (type.id as any)));
                                setStepError('');
                              }}
                              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between h-36 select-none ${
                                isSelected
                                  ? 'border-[#23c3b1] bg-[#23c3b1]/10 text-slate-900 ring-2 ring-[#23c3b1]/30 shadow-sm'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`size-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#23c3b1] text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                                  <IconComp className="size-5" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isSelected ? 'bg-[#23c3b1] text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                                  {type.badge}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 leading-tight">{type.label}</div>
                                <div className="text-xs text-slate-500 mt-1 leading-snug">{type.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Stade d'avancement horizontal */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Stade de développement actuel
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {stagesList.map((item) => {
                            const isSelected = stage === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setStage(prev => (prev === item.id ? '' : item.id));
                                  setStepError('');
                                }}
                                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'border-[#f06553] bg-orange-50/80 text-slate-900 ring-2 ring-[#f06553]/20 shadow-2xs'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="text-xs font-bold leading-tight text-slate-900">{item.label}</div>
                                <div className="text-[11px] text-slate-500 mt-1 leading-tight">{item.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 2 : DIRIGEANT OU REPRÉSENTANT
                     =================================================================== */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">2. Coordonnées du Dirigeant ou Porteur</h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Ces informations serviront pour les convocations officielles et la création de votre espace sécurisé.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Prénom <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required 
                            placeholder="Ex: Jean-Marc"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Nom de famille <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required 
                            placeholder="Ex: Ondo"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Adresse e-mail <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder="contact@entreprise.ga"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Téléphone WhatsApp / Appel <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required 
                            placeholder="+241 77 00 00 00"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Ville / Localisation au Gabon
                          </label>
                          <input 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Libreville, Port-Gentil, Franceville..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 3 : ENTREPRISE & PROJET
                     =================================================================== */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">
                            3. Présentation de votre Entreprise ou Projet
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Détails juridiques, secteur d'activité et synthèse de vos produits ou services.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {structureType === 'PME' ? "Raison sociale / Nom commercial" : "Nom du projet ou de la structure"} <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required 
                            placeholder={structureType === 'PME' ? "Ex: Gabon Services & Logistique SARL" : "Ex: PayGabon Tech"}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Secteur d'activité <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            required 
                            placeholder="Agro, Tech, BTP, Santé..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>

                      {/* Renseignements juridiques PME / STARTUP en grille horizontale */}
                      {(structureType === 'PME' || structureType === 'STARTUP') && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Données administratives & juridiques (OHADA)
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">Optionnel mais recommandé</span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Forme juridique
                              </label>
                              <select 
                                value={legalStatus}
                                onChange={(e) => setLegalStatus(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="SARL">SARL / SARLU</option>
                                <option value="SAS">SAS / SASU</option>
                                <option value="ETS">Établissement (ETS)</option>
                                <option value="COOPERATIVE">Coopérative / GIE</option>
                                <option value="EN_COURS">En cours d'immatriculation</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                N° RCCM
                              </label>
                              <input 
                                value={rccm}
                                onChange={(e) => setRccm(e.target.value)}
                                placeholder="RG/LIB/2022/B/..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                NIF
                              </label>
                              <input 
                                value={nif}
                                onChange={(e) => setNif(e.target.value)}
                                placeholder="123456 A"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Taille effectif
                              </label>
                              <select 
                                value={companySize}
                                onChange={(e) => setCompanySize(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="MICRO">Micro (1 à 5 salariés)</option>
                                <option value="PETITE">Petite (6 à 20 salariés)</option>
                                <option value="MOYENNE">Moyenne (21 à 100 salariés)</option>
                                <option value="GRANDE">Grande (&gt; 100 salariés)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Année de création
                              </label>
                              <input 
                                type="number" 
                                value={creationYear}
                                onChange={(e) => setCreationYear(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                CA annuel estimé
                              </label>
                              <select 
                                value={annualRevenue}
                                onChange={(e) => setAnnualRevenue(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="MOINS_10M">&lt; 10M FCFA</option>
                                <option value="10M_50M">10M à 50M FCFA</option>
                                <option value="50M_250M">50M à 250M FCFA</option>
                                <option value="PLUS_250M">&gt; 250M FCFA</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description des activités & défis */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Présentation des activités & défis actuels <span className="text-[#f06553]">*</span>
                        </label>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required 
                          rows={4} 
                          placeholder="Présentez brièvement vos activités, vos produits ou services, et vos principaux défis (marché, financement, structuration, etc.)..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all resize-none" 
                        />
                      </div>

                      {/* Téléversement de documents pour le suivi du projet */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/90 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/70 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                              <UploadCloud className="size-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Documents & Pièces jointes pour le suivi
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Business Plan, Pitch Deck, Statuts, RCCM, Devis, Pièce d'identité...
                              </p>
                            </div>
                          </div>
                          <span className="self-start sm:self-auto text-[10px] font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200/70">
                            Recommandé pour un meilleur suivi
                          </span>
                        </div>

                        {/* Zone de glisser-déposer / sélection de fichiers */}
                        <div className="relative">
                          <input
                            type="file"
                            id="beneficiary-docs-input"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileUpload}
                            disabled={isUploadingDoc}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                          />
                          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-[#23c3b1] rounded-2xl bg-white/80 hover:bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                            {isUploadingDoc ? (
                              <div className="flex flex-col items-center gap-2 text-emerald-600 py-2">
                                <Loader2 className="size-6 animate-spin" />
                                <span className="text-xs font-medium">Téléversement de votre document en cours...</span>
                              </div>
                            ) : (
                              <>
                                <div className="size-11 rounded-full bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-500 flex items-center justify-center mb-2 transition-all">
                                  <Paperclip className="size-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  Cliquez pour choisir un ou plusieurs documents, ou glissez-déposez ici
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Formats acceptés : PDF, Word, Excel, PowerPoint, Images (Max 10 Mo par fichier)
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Message d'erreur de téléversement */}
                        {uploadDocError && (
                          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{uploadDocError}</span>
                          </div>
                        )}

                        {/* Liste des documents déjà téléversés */}
                        {documents.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                              <span>{documents.length} document{documents.length > 1 ? 's' : ''} joint{documents.length > 1 ? 's' : ''} au dossier :</span>
                              <span className="text-[11px] text-emerald-600 font-bold">✓ Prêt pour l'analyse</span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2.5">
                              {documents.map((doc, idx) => (
                                <div 
                                  key={idx}
                                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-8 rounded-lg bg-slate-100 text-[#14233c] flex items-center justify-center shrink-0">
                                      <FileText className="size-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 truncate" title={doc.originalName}>
                                        {doc.originalName}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                        <span>{(doc.size / 1024).toFixed(0)} Ko</span>
                                        <span>•</span>
                                        <select
                                          value={doc.category}
                                          onChange={(e) => handleUpdateDocCategory(idx, e.target.value)}
                                          className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                                        >
                                          <option value="BUSINESS_PLAN">Business Plan</option>
                                          <option value="PITCH_DECK">Pitch Deck</option>
                                          <option value="JURIDIQUE">Statuts / RCCM</option>
                                          <option value="IDENTITE">Pièce d'identité</option>
                                          <option value="FINANCIER">Financier / Devis</option>
                                          <option value="AUTRE">Autre document</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDoc(idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Supprimer ce document"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 4 : BESOINS & MODALITÉS D'ENTRETIEN
                     =================================================================== */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">
                            4. Besoins prioritaires & Modalités d'échange
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Identifiez vos attentes d'accompagnement et choisissez votre modalité d'entretien.
                        </p>
                      </div>

                      {/* Grille horizontale des besoins */}
                      <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Vos priorités (cochez les plus pertinentes)
                        </label>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {availableNeeds.map((need) => {
                            const isSelected = needs.includes(need);
                            return (
                              <button
                                type="button"
                                key={need}
                                onClick={() => toggleNeed(need)}
                                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left w-full ${
                                  isSelected
                                    ? 'border-[#f06553] bg-orange-50/70 text-slate-900 font-bold shadow-2xs ring-2 ring-[#f06553]/20'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs'
                                }`}
                              >
                                <span className="text-xs">{need}</span>
                                <input 
                                  type="checkbox" 
                                  readOnly 
                                  checked={isSelected} 
                                  className="rounded accent-[#f06553] size-4 pointer-events-none shrink-0" 
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Modalités d'entretien */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Modalité souhaitée pour votre entretien de cadrage
                        </label>
                        
                        <div className="grid sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setInterviewPreference('PRESENTIEL')}
                            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all cursor-pointer text-left w-full ${
                              interviewPreference === 'PRESENTIEL'
                                ? 'border-[#23c3b1] bg-[#23c3b1]/10 ring-2 ring-[#23c3b1]/20 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 className={`size-4.5 ${interviewPreference === 'PRESENTIEL' ? 'text-[#23c3b1]' : 'text-slate-500'}`} />
                                <span className="font-bold text-xs sm:text-sm text-slate-900">En présentiel</span>
                              </div>
                              <input
                                type="radio"
                                name="interviewPref"
                                checked={interviewPreference === 'PRESENTIEL'}
                                readOnly
                                className="accent-[#23c3b1] size-4 pointer-events-none"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Dans les locaux d'<strong>IML Digit - Espace PME (Quartier B2, Libreville)</strong>.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInterviewPreference('VIDEO')}
                            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all cursor-pointer text-left w-full ${
                              interviewPreference === 'VIDEO'
                                ? 'border-[#f06553] bg-orange-50/70 ring-2 ring-[#f06553]/20 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Video className={`size-4.5 ${interviewPreference === 'VIDEO' ? 'text-[#f06553]' : 'text-slate-500'}`} />
                                <span className="font-bold text-xs sm:text-sm text-slate-900">En visioconférence</span>
                              </div>
                              <input
                                type="radio"
                                name="interviewPref"
                                checked={interviewPreference === 'VIDEO'}
                                readOnly
                                className="accent-[#f06553] size-4 pointer-events-none"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Lien vidéo sécurisé en 1 clic (aucun logiciel à installer, depuis mobile ou PC).
                            </p>
                          </button>
                        </div>

                        {interviewPreference === 'VIDEO' && (
                          <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200/80 animate-in fade-in duration-200 flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              id="hasVideoEquipment"
                              checked={hasVideoEquipment}
                              onChange={(e) => setHasVideoEquipment(e.target.checked)}
                              className="accent-[#f06553] size-4 mt-0.5 shrink-0 cursor-pointer"
                            />
                            <label htmlFor="hasVideoEquipment" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                              <strong>Confirmation technique</strong> : Je dispose d'un smartphone ou ordinateur avec caméra, micro et connexion Internet stable.
                            </label>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* ===================================================================
                      BARRE DE NAVIGATION DU STEPPER (Boutons Précédent / Suivant / Valider)
                     =================================================================== */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="size-4" />
                        <span>Étape précédente</span>
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm shadow-lg shadow-[#f06553]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Continuer vers l'étape {currentStep + 1}</span>
                          <ArrowRight className="size-4" />
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          disabled={mut.isPending} 
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm shadow-xl shadow-[#f06553]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                          {mut.isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              <span>Envoi de votre dossier...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="size-4" />
                              <span>Soumettre ma candidature au programme</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-slate-400">
                    Vos données sont confidentielles et transmises uniquement aux conseillers certifiés de l'Incubateur Multisectoriel de Libreville.
                  </p>

                </form>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Rocket, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Users,
  Video,
  Building2,
  Briefcase,
  Layers,
  Search
} from 'lucide-react';
import { api } from '../../lib/api';

export default function PublicApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [structureType, setStructureType] = useState<'PORTEUR_IDEE' | 'STARTUP' | 'PME' | 'ORGANISATION'>('PORTEUR_IDEE');
  const [stage, setStage] = useState('PROTOTYPE');
  const [needs, setNeeds] = useState<string[]>(['Accompagnement méthodologique']);
  const [referenceCode, setReferenceCode] = useState('');
  const [interviewPreference, setInterviewPreference] = useState<'PRESENTIEL' | 'VIDEO'>('PRESENTIEL');
  const [hasVideoEquipment, setHasVideoEquipment] = useState(true);

  const mut = useMutation({
    mutationFn: (data: any) => api<{ application: any }>('/applications/submit', { method: 'POST', body: data }),
    onSuccess: (res: any) => {
      const seq = res?.application?.seqNumber;
      const code = seq ? `IML-2026-${String(seq).padStart(4, '0')}` : 'IML-' + Math.floor(100000 + Math.random() * 900000);
      setReferenceCode(code);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const toggleNeed = (item: string) => {
    setNeeds(prev => 
      prev.includes(item) ? prev.filter(n => n !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const compName = (fd.get('companyName') as string) || (fd.get('title') as string) || 'Entreprise sans nom';

    mut.mutate({
      applicantData: {
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        city: fd.get('city') || 'Libreville',
        structureType,
        companyName: compName,
        rccm: fd.get('rccm') || undefined,
        nif: fd.get('nif') || undefined,
        legalStatus: fd.get('legalStatus') || undefined,
        companySize: fd.get('companySize') || undefined,
        annualRevenue: fd.get('annualRevenue') || undefined,
        creationYear: fd.get('creationYear') || undefined,
        interviewPreference,
        hasVideoEquipment: interviewPreference === 'VIDEO' ? hasVideoEquipment : false,
      },
      projectData: {
        title: compName,
        description: fd.get('description'),
        sector: fd.get('sector'),
        stage: stage,
        needs: needs,
        website: fd.get('website') || '',
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#f06553] selection:text-white">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation retour */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f06553] transition-colors"
          >
            <ArrowLeft className="size-4" /> Retour au site iml digit.
          </Link>
          <Link 
            to="/suivi-candidature" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#f06553] transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs"
          >
            <Search className="size-3.5 text-[#23c3b1]" />
            <span>Suivre une candidature existante</span>
          </Link>
        </div>

        {submitted ? (
          /* =========================================================================
              CONFIRMATION DE SOUMISSION AVEC SUCCÈS
             ========================================================================= */
          <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
                Votre dossier a bien été transmis aux conseillers et experts d'<strong>IML Digit - Espace PME (Quartier B2, Libreville)</strong>.
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
                to={`/suivi-candidature?code=${referenceCode}`}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-sm transition-all shadow-lg shadow-[#f06553]/25 flex items-center justify-center gap-2"
              >
                <Search className="size-4" />
                <span>Suivre mon dossier en direct</span>
              </Link>
              <Link 
                to="/" 
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-md"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
              FORMULAIRE COMPLET DE DÉPÔT DE CANDIDATURE
             ========================================================= */
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Header Sombre Style iml digit */}
            <div className="bg-[#14233c] text-white p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-8 translate-x-12 w-64 h-64 bg-[#f06553]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#38d9a9] backdrop-blur-sm">
                  <Rocket className="size-3.5 text-[#38d9a9]" />
                  Portail Candidature • Startups, PME & Porteurs de Projet
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                  Postulez à l'accompagnement <span className="text-[#f06553]">iml digit.</span>
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Que vous soyez une PME établie cherchant à structurer sa croissance, une startup innovante ou un porteur d'idée, bénéficiez de notre expertise à l'Espace PME (Quartier B2, Libreville).
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
              
              {/* SECTION 0 : PROFIL DE LA STRUCTURE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Briefcase className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">1. Profil de votre structure</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'PORTEUR_IDEE', label: "Porteur d'Idée", desc: "Création / Idéation", icon: Lightbulb },
                    { id: 'STARTUP', label: "Startup Tech", desc: "Produit innovant / Scale", icon: Rocket },
                    { id: 'PME', label: "TPE / PME", desc: "Entreprise en activité", icon: Building2 },
                    { id: 'ORGANISATION', label: "Organisation / Coop", desc: "Groupement / GIE", icon: Layers }
                  ].map((type) => {
                    const IconComp = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setStructureType(type.id as any)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          structureType === type.id
                            ? 'border-[#23c3b1] bg-[#23c3b1]/10 text-slate-900 ring-2 ring-[#23c3b1]/30 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <IconComp className={`size-4 mb-2 ${structureType === type.id ? 'text-[#23c3b1]' : 'text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-bold leading-tight">{type.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{type.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 1 : VOS COORDONNÉES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Users className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">2. Dirigeant ou Représentant</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Prénom <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="firstName" 
                      required 
                      placeholder="Ex: Jean-Marc"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nom <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="lastName" 
                      required 
                      placeholder="Ex: Ondo"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Adresse e-mail <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="Ex: contact@entreprise.ga"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Numéro de téléphone <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      placeholder="Ex: +241 77 00 00 00"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ville / Localisation
                    </label>
                    <input 
                      name="city" 
                      defaultValue="Libreville"
                      placeholder="Ex: Libreville, Port-Gentil, Franceville..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 : ENTREPRISE OU PROJET */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">
                    3. {structureType === 'PME' ? "Votre Entreprise" : structureType === 'STARTUP' ? "Votre Startup" : "Votre Projet"}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {structureType === 'PME' ? "Raison sociale / Nom commercial" : "Nom du projet ou de la structure"} <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="companyName" 
                      required 
                      placeholder={structureType === 'PME' ? "Ex: Gabon Services & Logistique SARL" : "Ex: PayGabon Tech"}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Secteur d'activité <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="sector" 
                      required 
                      placeholder="Ex: Agro-industrie, Numérique, Services aux entreprises, Transport..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>

                {/* Champs spécifiques PME / STARTUP (Forme juridique, RCCM, NIF, Effectif) */}
                {(structureType === 'PME' || structureType === 'STARTUP') && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Renseignements administratifs & juridiques
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Forme juridique
                        </label>
                        <select 
                          name="legalStatus" 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
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
                          N° RCCM (facultatif)
                        </label>
                        <input 
                          name="rccm" 
                          placeholder="Ex: RG/LIB/2021/B/1234"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          NIF (facultatif)
                        </label>
                        <input 
                          name="nif" 
                          placeholder="Ex: 123456 A"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Taille de l'effectif
                        </label>
                        <select 
                          name="companySize" 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                        >
                          <option value="MICRO">Micro-entreprise (1 à 5 salariés)</option>
                          <option value="PETITE">Petite entreprise (6 à 20 salariés)</option>
                          <option value="MOYENNE">Moyenne entreprise (21 à 100 salariés)</option>
                          <option value="GRANDE">Grande entreprise (&gt; 100 salariés)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Année de création
                        </label>
                        <input 
                          type="number" 
                          name="creationYear" 
                          defaultValue={new Date().getFullYear()}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tranche de CA annuel
                        </label>
                        <select 
                          name="annualRevenue" 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                        >
                          <option value="MOINS_10M">&lt; 10 Millions FCFA</option>
                          <option value="10M_50M">10M à 50 Millions FCFA</option>
                          <option value="50M_250M">50M à 250 Millions FCFA</option>
                          <option value="PLUS_250M">&gt; 250 Millions FCFA</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stade d'avancement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Stade de développement actuel <span className="text-[#f06553]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {stagesList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStage(item.id)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          stage === item.id
                            ? 'border-[#f06553] bg-orange-50/70 text-slate-900 ring-2 ring-[#f06553]/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description de l'activité */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Présentation des activités & défis actuels <span className="text-[#f06553]">*</span>
                  </label>
                  <textarea 
                    name="description" 
                    required 
                    rows={4} 
                    placeholder="Présentez brièvement vos activités, vos produits ou services, et vos principaux défis (marché, financement, structuration, etc.)..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all resize-none" 
                  />
                </div>
              </div>

              {/* SECTION 3 : BESOINS EN ACCOMPAGNEMENT */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Target className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">4. Vos besoins prioritaires en accompagnement</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {availableNeeds.map((need) => (
                    <div
                      key={need}
                      onClick={() => toggleNeed(need)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        needs.includes(need)
                          ? 'border-[#f06553] bg-orange-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm'
                      }`}
                    >
                      <span className="text-xs">{need}</span>
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={needs.includes(need)} 
                        className="rounded accent-[#f06553] size-4 pointer-events-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4 : MODALITÉS SOUHAITÉES POUR LES ENTRETIENS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Video className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">5. Modalités de vos futurs entretiens</h2>
                </div>

                <p className="text-xs text-slate-500">
                  Comment préférez-vous échanger avec l'équipe IML Digit pour l'évaluation de votre dossier et les sessions d'accompagnement ?
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setInterviewPreference('PRESENTIEL')}
                    className={`p-4 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                      interviewPreference === 'PRESENTIEL'
                        ? 'border-[#23c3b1] bg-[#23c3b1]/5 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className={`size-4.5 ${interviewPreference === 'PRESENTIEL' ? 'text-[#23c3b1]' : 'text-slate-500'}`} />
                        <span className="font-semibold text-xs sm:text-sm text-slate-800">En présentiel</span>
                      </div>
                      <input
                        type="radio"
                        name="interviewModeRadio"
                        checked={interviewPreference === 'PRESENTIEL'}
                        onChange={() => setInterviewPreference('PRESENTIEL')}
                        className="accent-[#23c3b1] size-4"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dans les locaux d'<strong>IML Digit - Espace PME (Quartier B2, Libreville)</strong>. Recommandé pour les échanges de fond.
                    </p>
                  </div>

                  <div
                    onClick={() => setInterviewPreference('VIDEO')}
                    className={`p-4 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                      interviewPreference === 'VIDEO'
                        ? 'border-[#f06553] bg-orange-50/50 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className={`size-4.5 ${interviewPreference === 'VIDEO' ? 'text-[#f06553]' : 'text-slate-500'}`} />
                        <span className="font-semibold text-xs sm:text-sm text-slate-800">En visioconférence</span>
                      </div>
                      <input
                        type="radio"
                        name="interviewModeRadio"
                        checked={interviewPreference === 'VIDEO'}
                        onChange={() => setInterviewPreference('VIDEO')}
                        className="accent-[#f06553] size-4"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Entretien vidéo en ligne via un lien direct sécurisé en 1 clic (aucun logiciel à installer).
                    </p>
                  </div>
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
                      <strong>Confirmation technique</strong> : Je confirme disposer d'un smartphone ou d'un ordinateur équipé d'une caméra, d'un microphone et d'une connexion Internet stable.
                    </label>
                  </div>
                )}
              </div>

              {/* Bouton de validation */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={mut.isPending} 
                  className="w-full py-4 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-base shadow-xl shadow-[#f06553]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {mut.isPending ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Envoi de votre dossier en cours...
                    </>
                  ) : (
                    <>
                      <Rocket className="size-5" />
                      Soumettre ma candidature au programme
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-3">
                  En soumettant ce formulaire, vos données d'entreprise sont traitées en toute confidentialité par les conseillers agréés d'IML Digit.
                </p>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}

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
  Users
} from 'lucide-react';
import { api } from '../../lib/api';

export default function PublicApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState('PROTOTYPE');
  const [needs, setNeeds] = useState<string[]>(['Accompagnement méthodologique']);
  const [referenceCode, setReferenceCode] = useState('');

  const mut = useMutation({
    mutationFn: (data: any) => api('/applications/submit', { method: 'POST', body: data }),
    onSuccess: () => {
      const randomCode = 'IML-' + Math.floor(100000 + Math.random() * 900000);
      setReferenceCode(randomCode);
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
    mut.mutate({
      applicantData: {
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        city: fd.get('city') || 'Non spécifié',
      },
      projectData: {
        title: fd.get('title'),
        description: fd.get('description'),
        sector: fd.get('sector'),
        stage: stage,
        needs: needs,
        website: fd.get('website') || '',
      }
    });
  };

  const stagesList = [
    { id: 'IDEE', label: 'Idée & Cadrage', desc: 'Concept en cours de réflexion' },
    { id: 'PROTOTYPE', label: 'Prototype / MVP', desc: 'Première version en test' },
    { id: 'COMMERCIAL', label: 'Lancement marché', desc: 'Premiers clients & ventes' },
    { id: 'CROISSANCE', label: 'En développement', desc: 'Recherche d’échelle & fonds' },
  ];

  const availableNeeds = [
    'Diagnostic & Stratégie',
    'Accompagnement méthodologique',
    'Mentorat & Coaching individuel',
    'Recherche de financements',
    'Développement commercial',
    'Réseau & Partenariats'
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#f06553] selection:text-white">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation retour */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f06553] transition-colors"
          >
            <ArrowLeft className="size-4" /> Retour au site iml digit.
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
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-[#f06553] text-xs font-bold uppercase tracking-wider">
                Dossier n° {referenceCode}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Candidature enregistrée avec succès !
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Félicitations pour votre démarche entrepreneuriale ! Votre projet a bien été transmis aux comités et équipes d'accompagnement <strong>iml digit</strong>.
              </p>
            </div>

            {/* Étapes suivantes */}
            <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-200/80 max-w-md mx-auto space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prochaines étapes :</h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Examen de votre dossier d'opportunité sous <strong>48 à 72 heures</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Prise de contact par email ou téléphone pour un premier entretien de cadrage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Attribution d'un coach référent et ouverture de votre espace de suivi iml digit.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                to="/" 
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-md"
              >
                Retour à l'accueil
              </Link>
              <Link 
                to="/connexion" 
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-sm transition-colors shadow-lg shadow-[#f06553]/25"
              >
                Espace Connexion
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
              FORMULAIRE COMPLET DE DÉPÔT DE CANDIDATURE ENTREPRENEUR
             ========================================================= */
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Header Sombre Style iml digit */}
            <div className="bg-[#14233c] text-white p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-8 translate-x-12 w-64 h-64 bg-[#f06553]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#38d9a9] backdrop-blur-sm">
                  <Rocket className="size-3.5 text-[#38d9a9]" />
                  Portail Entrepreneur & Porteurs de Projet
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                  Postulez à l'accompagnement <span className="text-[#f06553]">iml digit.</span>
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Que vous soyez au stade de l'idée, du prototype ou en plein lancement, présentez votre projet pour bénéficier d'un coaching sur-mesure et d'outils de pilotage professionnels.
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
              
              {/* SECTION 1 : VOS COORDONNÉES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Users className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">1. Vos coordonnées</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Prénom <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="firstName" 
                      required 
                      placeholder="Ex: Alexandre"
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
                      placeholder="Ex: Martin"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Adresse e-mail <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="Ex: monprojet@gmail.com"
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
                      placeholder="Ex: +33 6 12 34 56 78"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 : PRÉSENTATION DU PROJET */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Lightbulb className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">2. Votre projet d'entreprise</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nom du projet ou de l'entreprise <span className="text-[#f06553]">*</span>
                    </label>
                    <input 
                      name="title" 
                      required 
                      placeholder="Ex: SolarTech Solutions"
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
                      placeholder="Ex: Numérique, Santé, Transition écologique, Commerce..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                    />
                  </div>
                </div>

                {/* Stade d'avancement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Stade d'avancement actuel <span className="text-[#f06553]">*</span>
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

                {/* Description du projet */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description du projet & proposition de valeur <span className="text-[#f06553]">*</span>
                  </label>
                  <textarea 
                    name="description" 
                    required 
                    rows={4} 
                    placeholder="Expliquez en quelques lignes votre produit/service, vos clients cibles et le problème que vous résolvez..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all resize-none" 
                  />
                </div>
              </div>

              {/* SECTION 3 : VOS BESOINS EN ACCOMPAGNEMENT */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Target className="size-5 text-[#f06553]" />
                  <h2 className="text-base font-bold text-slate-900">3. Vos besoins prioritaires</h2>
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
                  En soumettant ce formulaire, vos informations sont traitées de manière strictement confidentielle conformément à nos engagements RGPD.
                </p>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}

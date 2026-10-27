import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Handshake, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2, 
  Sparkles, 
  Send,
  Loader2,
  FileText,
  UserCheck,
  Building2,
  Phone,
  Mail,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { api } from '../../lib/api';

export interface ExpertProfile {
  id: string;
  name: string;
  honorific?: string; // 'Dr.' | 'Pr.' | 'Dir.' | 'Me' | 'Ing.' | 'M.' | 'Mme'
  domain: string;
  domainKey?: 'FINANCE' | 'JURIDIQUE' | 'COMMERCIAL' | 'TECH' | 'AGRO' | 'FINANCEMENT' | 'AUTRE';
  title: string;
  organization: string; // Ex: USTM, BGFIBank, Université, Ministère...
  phone: string;
  email?: string;
  avatarInitials: string;
  color: string;
  isExternal?: boolean;
}

export const EXTERNAL_EXPERTS_CATALOG: ExpertProfile[] = [
  {
    id: 'exp-dr-agro',
    honorific: 'Dr.',
    name: 'Dr. Patrick Nguema',
    domain: 'Agronomie & Transformation Agro-industrielle',
    domainKey: 'AGRO',
    title: 'Enseignant-Chercheur & Spécialiste Filières Agricoles',
    organization: 'Université USTM • Faculté d’Agronomie',
    phone: '+241 77 12 34 56',
    email: 'p.nguema@ustm-recherche.ga',
    avatarInitials: 'PN',
    color: 'from-emerald-600 to-teal-700',
    isExternal: true,
  },
  {
    id: 'exp-dir-banque',
    honorific: 'Dir.',
    name: 'Directeur Guy Mba',
    domain: 'Financement Bancaire & Analyse Risque PME',
    domainKey: 'FINANCEMENT',
    title: 'Directeur des Engagements & Crédit Professionnel',
    organization: 'Direction Crédits Entreprises • Pôle Bancaire Libreville',
    phone: '+241 74 99 88 77',
    email: 'g.mba@bgfi-partenaires.ga',
    avatarInitials: 'GM',
    color: 'from-amber-500 to-orange-600',
    isExternal: true,
  },
  {
    id: 'exp-me-droit',
    honorific: 'Me',
    name: 'Me Cynthia Obiang',
    domain: 'Droit des Affaires & Formalités OHADA',
    domainKey: 'JURIDIQUE',
    title: 'Avocate au Barreau du Gabon & Conseil Juridique PME',
    organization: 'Cabinet Juris-Gabon • Barreau National',
    phone: '+241 66 98 76 54',
    email: 'cynthia.obiang@juris-gabon.com',
    avatarInitials: 'CO',
    color: 'from-blue-600 to-indigo-700',
    isExternal: true,
  },
  {
    id: 'exp-pr-eco',
    honorific: 'Pr.',
    name: 'Pr. Jean-Marc Ondo',
    domain: 'Finance, Modèles Économiques & Valorisation',
    domainKey: 'FINANCE',
    title: 'Professeur Titulaire d’Économie & Analyste Marchés',
    organization: 'Université Omar Bongo (UOB) • Centre d’Études Éco',
    phone: '+241 65 44 33 22',
    email: 'jm.ondo@uob-economie.ga',
    avatarInitials: 'JO',
    color: 'from-indigo-600 to-violet-700',
    isExternal: true,
  },
  {
    id: 'exp-dr-tech',
    honorific: 'Dr.',
    name: 'Dr. Awa Diallo',
    domain: 'Tech, Systèmes d’Information & IA',
    domainKey: 'TECH',
    title: 'Docteure en Informatique & Directrice Innovation Digitale',
    organization: 'Tech Hub Gabon • Laboratoire Numérique',
    phone: '+241 76 11 22 33',
    email: 'awa.diallo@cleantech-hub.org',
    avatarInitials: 'AD',
    color: 'from-purple-600 to-pink-600',
    isExternal: true,
  },
  {
    id: 'exp-dir-comm',
    honorific: 'Dir.',
    name: 'Directeur Thomas Rostand',
    domain: 'Stratégie Commerciale, Export & Distribution',
    domainKey: 'COMMERCIAL',
    title: 'Directeur Commercial Groupe & Consultant B2B',
    organization: 'EcoTech Business Advisory & Export CEMAC',
    phone: '+241 74 55 44 33',
    email: 'thomas.rostand@ecotech-advisory.com',
    avatarInitials: 'TR',
    color: 'from-cyan-600 to-blue-700',
    isExternal: true,
  },
];

export interface ConnectExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryCompany?: string;
  beneficiarySector?: string;
  suggestedNeeds?: string;
  onSuccess: (newMission: any) => void;
}

export default function ConnectExpertModal({
  isOpen,
  onClose,
  beneficiaryId,
  beneficiaryName,
  beneficiaryCompany,
  suggestedNeeds,
  onSuccess
}: ConnectExpertModalProps) {
  // Mode : 'CATALOG' (sélection parmi les personnalités référencées) ou 'CUSTOM' (saisie d'un nouvel expert externe)
  const [expertMode, setExpertMode] = useState<'CATALOG' | 'CUSTOM'>('CATALOG');

  // Sélection Catalogue
  const [selectedExpertId, setSelectedExpertId] = useState<string>(EXTERNAL_EXPERTS_CATALOG[0].id);

  // Saisie Nouvel Expert Externe (Dr, Pr, Directeur, etc.)
  const [customHonorific, setCustomHonorific] = useState<'Dr.' | 'Pr.' | 'Dir.' | 'Me' | 'Ing.' | 'Consultant'>('Dr.');
  const [customName, setCustomName] = useState<string>('');
  const [customOrganization, setCustomOrganization] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('Finance & Business Plan');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');

  // Détails de la Mission de Suivi
  const [missionTitle, setMissionTitle] = useState<string>('Audit critique du Business Plan et validation du prévisionnel');
  const [modality, setModality] = useState<'VISIO' | 'PRESENTIEL'>('PRESENTIEL');
  const [sessionDate, setSessionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [dateToBeDefined, setDateToBeDefined] = useState<boolean>(false);
  const [agentAnalysisNotes, setAgentAnalysisNotes] = useState<string>(
    suggestedNeeds ? `Priorités suite à l'analyse du dossier : ${suggestedNeeds}` : 'Mise en contact pour cadrage technique et validation des livrables.'
  );
  const [notifyWhatsApp, setNotifyWhatsApp] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || typeof document === 'undefined') return null;

  // Récupération de l'expert actif
  const catalogExpert = EXTERNAL_EXPERTS_CATALOG.find((e) => e.id === selectedExpertId) || EXTERNAL_EXPERTS_CATALOG[0];

  const currentExpert: ExpertProfile = expertMode === 'CATALOG' 
    ? catalogExpert 
    : {
        id: `custom-exp-${Date.now()}`,
        honorific: customHonorific,
        name: `${customHonorific} ${customName.trim() || 'Expert Invité'}`,
        domain: customDomain,
        domainKey: 'AUTRE',
        title: `Expert Externe (${customHonorific})`,
        organization: customOrganization.trim() || 'Intervenant Indépendant / Organisme Externe',
        phone: customPhone.trim() || '+241 77 00 00 00',
        email: customEmail.trim() || undefined,
        avatarInitials: customName.trim() ? customName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'EX',
        color: 'from-slate-700 to-indigo-800',
        isExternal: true,
      };

  const handleSelectCatalogExpert = (exp: ExpertProfile) => {
    setSelectedExpertId(exp.id);
    if (exp.domainKey === 'FINANCE') {
      setMissionTitle('Audit critique du Business Plan et validation du prévisionnel');
    } else if (exp.domainKey === 'JURIDIQUE') {
      setMissionTitle('Formalisation juridique, statuts OHADA et protection contractuelle');
    } else if (exp.domainKey === 'COMMERCIAL') {
      setMissionTitle('Stratégie Go-to-Market, fixation des prix et plan de prospection');
    } else if (exp.domainKey === 'TECH') {
      setMissionTitle('Cahier des charges technique, MVP et roadmap de digitalisation');
    } else if (exp.domainKey === 'AGRO') {
      setMissionTitle('Structuration de la chaîne d’approvisionnement et normes qualité');
    } else if (exp.domainKey === 'FINANCEMENT') {
      setMissionTitle('Préparation du dossier de crédit et pitch bancaire / investisseurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expertMode === 'CUSTOM' && !customName.trim()) {
      alert('Veuillez renseigner le nom de l’expert externe.');
      return;
    }

    setIsSubmitting(true);

    try {
      const locationText = `[EXPERT:${currentExpert.name}] [DOM:${currentExpert.domain}] [MISSION:${missionTitle}] [FORMAT:${modality === 'VISIO' ? 'Visioconférence IML Meet' : 'Espace PME Libreville'}] [ORG:${currentExpert.organization}]`;
      const appointmentDate = dateToBeDefined ? new Date(Date.now() + 86400000 * 3) : new Date(sessionDate);

      // Enregistrement via l'API
      await api('/appointments', {
        method: 'POST',
        body: {
          beneficiaryId,
          datetime: appointmentDate.toISOString(),
          duration: 60,
          location: locationText,
        }
      }).catch((err) => {
        console.warn('Fallback local appointment creation:', err);
      });

      const newMissionData = {
        id: `mission-${Date.now()}`,
        datetime: dateToBeDefined ? null : appointmentDate.toISOString(),
        expert: currentExpert,
        missionTitle,
        modality,
        location: modality === 'VISIO' ? 'Visioconférence IML Meet' : 'Espace PME Libreville (Salle Coaching)',
        notes: agentAnalysisNotes,
        status: 'CONFIRME',
        isExternal: true,
        createdAt: new Date().toISOString(),
      };

      // Notification WhatsApp formulée avec civilité et déférence envers l'expert externe
      if (notifyWhatsApp && currentExpert.phone) {
        const text = `Bonjour ${currentExpert.name},\nL'Incubateur IML Digit sollicite votre expertise pour accompagner *${beneficiaryName}* (${beneficiaryCompany || 'Projet IML'}) suite à l'analyse de son dossier :\n- *Thématique* : ${currentExpert.domain}\n- *Mission / Livrable* : ${missionTitle}\n- *Organisme d'origine* : ${currentExpert.organization}\n- *Modalité* : ${modality === 'VISIO' ? 'Visioconférence Meet' : 'Présentiel Espace PME'}\n\nMerci de nous confirmer votre disponibilité pour cet échange.`;
        const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(currentExpert.phone.replace(/[^0-9]/g, ''))}&text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }

      onSuccess(newMissionData);
      onClose();
    } catch (err: any) {
      console.error('Erreur mise en relation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#14233c] to-[#1e3458] text-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-[#38d9a9] to-emerald-400 p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Handshake className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Mettre en relation avec un Expert Externe</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Après analyse du dossier
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Bénéficiaire : <strong className="text-white">{beneficiaryName}</strong> {beneficiaryCompany ? `(${beneficiaryCompany})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          
          {/* Onglets de sélection du mode d'expert */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setExpertMode('CATALOG')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                expertMode === 'CATALOG'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="size-3.5 text-[#23c3b1]" />
              <span>Personnalités & Experts Référencés</span>
            </button>

            <button
              type="button"
              onClick={() => setExpertMode('CUSTOM')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                expertMode === 'CUSTOM'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="size-3.5 text-indigo-600" />
              <span>Saisir un Expert Externe (Docteur, Directeur, Professeur...)</span>
            </button>
          </div>

          {/* Mode 1: Catalogue des experts partenaires */}
          {expertMode === 'CATALOG' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>1. Choisissez l'intervenant adapté au besoin analysé :</span>
                </label>
                <span className="text-[10px] text-slate-400">Intervenants & universitaires partenaires</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {EXTERNAL_EXPERTS_CATALOG.map((exp) => {
                  const isSelected = exp.id === selectedExpertId;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => handleSelectCatalogExpert(exp)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        isSelected
                          ? 'border-[#23c3b1] bg-emerald-50/40 shadow-xs ring-1 ring-[#23c3b1]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`size-10 rounded-xl bg-gradient-to-tr ${exp.color} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                        {exp.avatarInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {exp.name}
                          </span>
                          {isSelected && <CheckCircle2 className="size-3.5 text-[#23c3b1] shrink-0" />}
                        </div>
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 leading-tight">
                          {exp.domain}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5" title={exp.organization}>
                          {exp.organization}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Saisie Libre d'un Expert Externe (Docteur, Directeur, Professeur...) */}
          {expertMode === 'CUSTOM' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
                <Briefcase className="size-4 text-indigo-600" />
                <span className="font-bold text-slate-800 text-xs">
                  Coordonnées de l'expert externe mobilisé
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">
                  Tiers externe non affilié à IML
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Titre / Qualité */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Titre / Qualité *
                  </label>
                  <select
                    value={customHonorific}
                    onChange={(e: any) => setCustomHonorific(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                  >
                    <option value="Dr.">Docteur (Dr.)</option>
                    <option value="Pr.">Professeur (Pr.)</option>
                    <option value="Dir.">Directeur (Dir.)</option>
                    <option value="Me">Maître (Me - Juriste / Avocat)</option>
                    <option value="Ing.">Ingénieur (Ing.)</option>
                    <option value="Consultant">Consultant Senior</option>
                  </select>
                </div>

                {/* Nom complet */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nom & Prénom de l'expert *
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required={expertMode === 'CUSTOM'}
                    placeholder="Ex: Patrick Nguema ou Marie-Claire Mba"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Organisme d'origine */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="size-3 text-slate-400" />
                    <span>Organisme / Entreprise / Institution d'origine *</span>
                  </label>
                  <input
                    type="text"
                    value={customOrganization}
                    onChange={(e) => setCustomOrganization(e.target.value)}
                    required={expertMode === 'CUSTOM'}
                    placeholder="Ex: USTM Masuku, BGFIBank, Ministère, Cabinet X..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>

                {/* Domaine d'expertise */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Domaine d'intervention *
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    required={expertMode === 'CUSTOM'}
                    placeholder="Ex: Agronomie, Droit OHADA, Finance, Numérique..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Téléphone WhatsApp */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="size-3 text-emerald-600" />
                    <span>Téléphone direct / WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+241 77 12 34 56"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="size-3 text-slate-400" />
                    <span>Adresse Email professionnelle</span>
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="expert@organisme.ga"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mission & Objectifs d'accompagnement */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                <FileText className="size-3.5 text-[#23c3b1]" />
                <span>2. Intitulé de la mission & Livrable attendu de l'expert :</span>
              </label>
              <input
                type="text"
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                required
                placeholder="Ex: Cadrage du Business Plan et structuration prévisionnelle"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#23c3b1] text-xs transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Notes d'analyse du dossier transmises à l'expert :
              </label>
              <textarea
                rows={2}
                value={agentAnalysisNotes}
                onChange={(e) => setAgentAnalysisNotes(e.target.value)}
                placeholder="Précisez les points clés issus de l'étude du dossier et des documents..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#23c3b1] text-xs resize-none transition"
              />
            </div>
          </div>

          {/* Date, Heure & Modalité */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar className="size-3.5 text-[#f06553]" />
                <span>3. Modalité & Programmation de la première session :</span>
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={dateToBeDefined}
                  onChange={(e) => setDateToBeDefined(e.target.checked)}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Date à convenir avec l'expert</span>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Format de la rencontre
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModality('PRESENTIEL')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      modality === 'PRESENTIEL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="size-3.5" />
                    <span>Présentiel (Espace PME)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModality('VISIO')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      modality === 'VISIO'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="size-3.5" />
                    <span>Visio Meet</span>
                  </button>
                </div>
              </div>

              {!dateToBeDefined ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Date & Heure proposées</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required={!dateToBeDefined}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#23c3b1]"
                  />
                </div>
              ) : (
                <div className="flex items-center text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  L'expert extérieur et le bénéficiaire conviendront directement du créneau selon leurs agendas.
                </div>
              )}
            </div>
          </div>

          {/* Option notification WhatsApp / E-mail */}
          <div className="flex items-center gap-2 pt-1 text-slate-600 text-xs">
            <input
              type="checkbox"
              id="notify-wa"
              checked={notifyWhatsApp}
              onChange={(e) => setNotifyWhatsApp(e.target.checked)}
              className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
            />
            <label htmlFor="notify-wa" className="cursor-pointer">
              Générer la notification d'introduction WhatsApp pour {currentExpert.name} ({currentExpert.phone || 'Contact direct'})
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Mise en relation en cours...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Valider la mise en relation avec l'expert</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}

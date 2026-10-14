import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Video, 
  Handshake, 
  Loader2, 
  ExternalLink,
  Copy,
  Mail,
  MapPin,
  Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import OfficialConvocationModal, { type ConvocationData } from './OfficialConvocationModal';

interface CreateAppointmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
  defaultDate?: string;
}

interface ParticipantItem {
  id: string;
  name: string;
  type: 'Bénéficiaire' | 'Coach' | 'Contact';
  email?: string;
}

export default function CreateAppointmentWizardModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBeneficiaryId,
  defaultDate
}: CreateAppointmentWizardModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bodyRef = useRef<HTMLDivElement>(null);

  // Étape (1 ou 2)
  const [step, setStep] = useState<1 | 2>(1);

  // Type de session : 'video' (Entretien vidéo) ou 'in_person' (Rendez-vous en présentiel)
  const [sessionType, setSessionType] = useState<'video' | 'in_person'>('video');

  // Étape 1 : Formulaire de session
  const [sessionName, setSessionName] = useState<string>('');
  
  // Date du jour par défaut au format YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(defaultDate || todayStr);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');

  // Visioconférence : lien généré automatiquement (modèle Jitsi Meet chiffré en 1 clic sans compte)
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    const slug = Math.random().toString(36).substring(2, 9);
    return `https://meet.jit.si/imldigit-entretien-${slug}`;
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Présentiel : Lieu précis
  const [inPersonPlace, setInPersonPlace] = useState<string>('Siège IML Digit - Espace PME, Bâtiment B2, Libreville, Gabon');

  // Notifications automatiques vers le candidat
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);
  const [sendSmsNotification, setSendSmsNotification] = useState<boolean>(true);

  // Convocation officielle
  const [createdConvocationData, setCreatedConvocationData] = useState<ConvocationData | null>(null);
  const [isConvocationOpen, setIsConvocationOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultDate) {
        setSessionDate(defaultDate);
      } else {
        setSessionDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, defaultDate]);

  // Champ Description (présent pour les DEUX modes)
  const [description, setDescription] = useState<string>('');

  // Localisation présentielle
  const [city, setCity] = useState<string>('Libreville');
  const [country, setCountry] = useState<string>('Gabon');

  // Étape 2 : Participants à la session (Nombre libre de participants)
  const [recipientType, setRecipientType] = useState<'beneficiaires' | 'coachs' | 'contact'>('beneficiaires');
  const [recipientSearch, setRecipientSearch] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<ParticipantItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Réinitialiser le défilement en haut à chaque changement d'étape ou ouverture
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [step, isOpen]);

  // Liste des bénéficiaires
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list-appointments'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Options pour la liste des coachs/agents
  const { data: optionsData } = useQuery({
    queryKey: ['beneficiary-options-appointments'],
    queryFn: () => api<{ agents: any[] }>('/beneficiaries/options'),
    enabled: isOpen
  });
  const coaches = optionsData?.agents || [];

  // Initialisation par défaut si un ID de bénéficiaire est passé
  useEffect(() => {
    if (defaultBeneficiaryId && beneficiaries.length > 0) {
      const found = beneficiaries.find((b: any) => b.id === defaultBeneficiaryId);
      if (found && !selectedRecipients.some(r => r.id === found.id)) {
        setSelectedRecipients([{
          id: found.id,
          name: `${found.firstName} ${found.lastName}`,
          type: 'Bénéficiaire',
          email: found.email
        }]);
      }
    }
  }, [defaultBeneficiaryId, beneficiaries]);

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    const query = recipientSearch.toLowerCase().trim();
    if (!query) return true;
    return fullName.includes(query) || (b.fileNumber && b.fileNumber.toLowerCase().includes(query)) || (b.email && b.email.toLowerCase().includes(query));
  });

  // Filtrage des coachs
  const filteredCoaches = coaches.filter((c: any) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const query = recipientSearch.toLowerCase().trim();
    if (!query) return true;
    return fullName.includes(query) || (c.email && c.email.toLowerCase().includes(query));
  });

  const handleAddRecipient = (item: ParticipantItem) => {
    if (!selectedRecipients.some(r => r.id === item.id)) {
      setSelectedRecipients(prev => [...prev, item]);
    }
    setRecipientSearch('');
    setIsSearchFocused(false);
  };

  const handleRemoveRecipient = (id: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id));
  };

  // Calcul de la durée en minutes entre startTime et endTime
  const calculateDuration = (): number => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      const diff = endMinutes - startMinutes;
      return diff > 0 ? diff : 60;
    } catch {
      return 60;
    }
  };

  // Mutation pour créer le rendez-vous
  const createMut = useMutation({
    mutationFn: async () => {
      if (selectedRecipients.length === 0) {
        throw new Error('Veuillez ajouter au moins un participant.');
      }

      // Associer au premier bénéficiaire sélectionné, ou de secours
      const primaryBeneficiary = selectedRecipients.find(r => r.type === 'Bénéficiaire');
      const beneficiaryId = primaryBeneficiary?.id || defaultBeneficiaryId || (beneficiaries[0]?.id);

      if (!beneficiaryId) {
        throw new Error('Aucun bénéficiaire disponible pour lier le rendez-vous.');
      }

      const durationMinutes = calculateDuration();
      const combinedDateTime = new Date(`${sessionDate}T${startTime}:00`).toISOString();

      let locationString = '';
      if (sessionType === 'video') {
        locationString = `Visioconférence [${videoUrl}]${description ? ` - ${description}` : ''}`;
      } else {
        const place = inPersonPlace ? `${inPersonPlace}${city ? `, ${city}` : ''}${country ? `, ${country}` : ''}` : `Siège IML Digit, ${city}, ${country}`;
        locationString = `${place}${description ? ` - ${description}` : ''}`;
      }

      const res = await api<any>('/appointments', {
        method: 'POST',
        body: {
          beneficiaryId,
          datetime: combinedDateTime,
          duration: durationMinutes,
          location: locationString.slice(0, 255)
        }
      });

      return {
        res,
        primaryBeneficiary,
        combinedDateTime,
        durationMinutes,
        locationString
      };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onSuccess?.();

      const apptId = data?.res?.id || data?.res?.appointment?.id || Math.random().toString(36).substring(2, 8);
      const ben = data?.primaryBeneficiary;

      setCreatedConvocationData({
        appointmentId: apptId,
        recipientName: ben?.name || 'Candidat / Bénéficiaire',
        recipientEmail: ben?.email,
        projectName: ben?.name ? `Dossier ${ben.name}` : undefined,
        datetime: data?.combinedDateTime,
        durationMinutes: data?.durationMinutes || 60,
        sessionType,
        locationOrUrl: sessionType === 'video' ? videoUrl : (inPersonPlace || `Siège IML Digit, ${city}`),
        coachName: user ? `${user.firstName} ${user.lastName}` : 'Agent IML Digit',
        notes: description
      });

      setIsConvocationOpen(true);
    }
  });

  const handleClose = () => {
    setStep(1);
    setSessionType('video');
    setSessionName('');
    setSessionDate(defaultDate || todayStr);
    setStartTime('09:00');
    setEndTime('10:00');
    setDescription('');
    setRecipientType('beneficiaires');
    setRecipientSearch('');
    setSelectedRecipients([]);
    setIsSearchFocused(false);
    onClose();
  };

  if (!isOpen) return null;

  const canProceedStep1 = sessionName.trim().length > 0 && !!sessionDate && !!startTime;
  const canProceedStep2 = selectedRecipients.length > 0;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* =======================================================================
            EN-TÊTE : Grand titre centré et parfaitement visible + Croix en haut à droite
           ======================================================================= */}
        <div className="relative pt-6 pb-4 px-8 text-center bg-white border-b border-slate-100 rounded-t-2xl shrink-0">
          <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
            Créer un rendez-vous
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-6 top-6 size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* =======================================================================
            CORPS DU FORMULAIRE : Scroll interne dédié sous le titre
           ======================================================================= */}
        <div ref={bodyRef} className="px-8 py-3 max-h-[60vh] overflow-y-auto space-y-4">
          
          {/* =====================================================================
              ÉTAPE 1 : Configuration de la session (Vidéo ou Présentiel)
             ===================================================================== */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* 1. Quel type de session ? * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Quel type de session ? <span className="text-[#f06553]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Carte : Entretien vidéo */}
                  <div
                    onClick={() => setSessionType('video')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[92px] ${
                      sessionType === 'video'
                        ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <Video className={`size-6 mb-1.5 stroke-[1.75] ${sessionType === 'video' ? 'text-white' : 'text-[#23c3b1]'}`} />
                    <span className="text-sm font-semibold">
                      Entretien vidéo
                    </span>
                  </div>

                  {/* Carte : Rendez-vous en présentiel */}
                  <div
                    onClick={() => setSessionType('in_person')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[92px] ${
                      sessionType === 'in_person'
                        ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <Handshake className={`size-6 mb-1.5 stroke-[1.75] ${sessionType === 'in_person' ? 'text-white' : 'text-[#23c3b1]'}`} />
                    <span className="text-sm font-semibold">
                      Rendez-vous en présentiel
                    </span>
                  </div>

                </div>
              </div>

              {/* 2. Nom de la session * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nom de la session <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Nom de la session"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs"
                />
              </div>

              {/* 3. Date * | Heure de début * | Heure de fin * */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Heure de début <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Heure de fin <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                  />
                </div>
              </div>

              {/* Champs spécifiques à la VISIOCONFÉRENCE : Lien sécurisé en 1 clic */}
              {sessionType === 'video' && (
                <div className="space-y-2 p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/70 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-800">
                      Lien direct de visioconférence <span className="text-[#f06553]">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="size-3" /> Salle sécurisée prête (sans inscription)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://meet.jit.si/imldigit-..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] text-slate-800 font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(videoUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Copier le lien"
                    >
                      {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      <span>{copiedLink ? 'Copié' : 'Copier'}</span>
                    </button>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-[#f06553] hover:bg-[#e05341] text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Tester la visio dans un nouvel onglet"
                    >
                      <span>Tester</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    💡 Ce lien d'accès direct sera automatiquement inséré dans la convocation envoyée au candidat. Vous pouvez aussi coller votre propre lien Google Meet ou Zoom.
                  </p>
                </div>
              )}

              {/* Champs spécifiques au PRÉSENTIEL : Lieu physique */}
              {sessionType === 'in_person' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-[#23c3b1]" />
                      <span>Lieu physique de l'entretien <span className="text-[#f06553]">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={inPersonPlace}
                      onChange={(e) => setInPersonPlace(e.target.value)}
                      placeholder="Ex: Siège IML Digit - Espace PME, Bâtiment B2, Libreville"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:border-[#23c3b1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Pays</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:border-[#23c3b1]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Champ Description présent pour les DEUX modes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Ordre du jour
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ordre du jour, consignes ou précisions sur l'entretien..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs resize-none"
                />
              </div>

              {/* Envoi automatique de la convocation au candidat */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-[#f06553]" />
                  <span>Convocations & alertes automatiques vers le candidat</span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailNotification}
                      onChange={(e) => setSendEmailNotification(e.target.checked)}
                      className="accent-[#f06553] size-3.5 cursor-pointer"
                    />
                    <span>Envoyer la convocation officielle par Email au candidat avec les instructions d'accès</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendSmsNotification}
                      onChange={(e) => setSendSmsNotification(e.target.checked)}
                      className="accent-[#f06553] size-3.5 cursor-pointer"
                    />
                    <span>Envoyer un rappel par SMS 48h avant l'entretien</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              ÉTAPE 2 : Participants à la session (Conforme exactement à la capture)
             ===================================================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Titre de section : Participants + Séparateur horizontal */}
              <div>
                <h3 className="text-base sm:text-lg font-normal text-slate-800">
                  Participants
                </h3>
                <div className="w-full border-b border-slate-200 mt-2 mb-4" />
              </div>

              {/* Libellé : Veuillez ajouter des participants à la session * : */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2.5">
                  Veuillez ajouter des participants à la session <span className="text-[#f06553]">*</span> :
                </label>

                {/* 3 Radios : Un ou des bénéficiaires | Un ou des coachs | Un contact */}
                <div className="space-y-2 pl-0.5">
                  
                  {/* Radio 1 : Un ou des bénéficiaires */}
                  <label 
                    onClick={() => {
                      setRecipientType('beneficiaires');
                      setRecipientSearch('');
                    }}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                  >
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      recipientType === 'beneficiaires' 
                        ? 'border-[#23c3b1] bg-[#23c3b1]' 
                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                      {recipientType === 'beneficiaires' && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm ${
                      recipientType === 'beneficiaires' 
                        ? 'text-[#23c3b1] font-medium' 
                        : 'text-slate-700 font-normal group-hover:text-slate-900'
                    }`}>
                      Un ou des bénéficiaires
                    </span>
                  </label>

                  {/* Radio 2 : Un ou des coachs */}
                  <label 
                    onClick={() => {
                      setRecipientType('coachs');
                      setRecipientSearch('');
                    }}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                  >
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      recipientType === 'coachs' 
                        ? 'border-[#23c3b1] bg-[#23c3b1]' 
                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                      {recipientType === 'coachs' && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm ${
                      recipientType === 'coachs' 
                        ? 'text-[#23c3b1] font-medium' 
                        : 'text-slate-700 font-normal group-hover:text-slate-900'
                    }`}>
                      Un ou des coachs
                    </span>
                  </label>

                  {/* Radio 3 : Un contact */}
                  <label 
                    onClick={() => {
                      setRecipientType('contact');
                      setRecipientSearch('');
                    }}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                  >
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      recipientType === 'contact' 
                        ? 'border-[#23c3b1] bg-[#23c3b1]' 
                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                      {recipientType === 'contact' && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm ${
                      recipientType === 'contact' 
                        ? 'text-[#23c3b1] font-medium' 
                        : 'text-slate-700 font-normal group-hover:text-slate-900'
                    }`}>
                      Un contact
                    </span>
                  </label>

                </div>
              </div>

              {/* Champ de recherche avec autocomplétion / ajout de contact */}
              <div className="relative pt-0.5">
                <div className="relative">
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recipientSearch.trim()) {
                        e.preventDefault();
                        if (recipientType === 'contact') {
                          handleAddRecipient({
                            id: `contact-${Date.now()}`,
                            name: recipientSearch.trim(),
                            type: 'Contact'
                          });
                        }
                      }
                    }}
                    placeholder="Rechercher"
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs pr-10"
                  />
                  
                  {recipientType === 'contact' && recipientSearch.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddRecipient({
                          id: `contact-${Date.now()}`,
                          name: recipientSearch.trim(),
                          type: 'Contact'
                        });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-[#23c3b1] text-white text-xs font-medium hover:bg-[#1eb0a0] transition-colors cursor-pointer"
                    >
                      Ajouter
                    </button>
                  )}
                </div>

                {/* Dropdown de recherche pour les bénéficiaires */}
                {isSearchFocused && recipientType === 'beneficiaires' && recipientSearch.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-44 overflow-y-auto">
                    {filteredBeneficiaries.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">Aucun bénéficiaire trouvé</div>
                    ) : (
                      filteredBeneficiaries.map((b: any) => {
                        const isAlreadySelected = selectedRecipients.some(r => r.id === b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              if (!isAlreadySelected) {
                                handleAddRecipient({
                                  id: b.id,
                                  name: `${b.firstName} ${b.lastName}`,
                                  type: 'Bénéficiaire',
                                  email: b.email
                                });
                              }
                            }}
                            className={`px-3.5 py-2 text-xs flex justify-between items-center border-b border-slate-50 last:border-0 ${
                              isAlreadySelected ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{b.firstName} {b.lastName}</span>
                              {b.fileNumber && <span className="text-[11px] text-slate-400 ml-2">({b.fileNumber})</span>}
                            </div>
                            {isAlreadySelected ? (
                              <span className="text-[11px] text-slate-400">Déjà ajouté</span>
                            ) : (
                              <span className="text-[11px] text-[#23c3b1] font-medium">+ Ajouter</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Dropdown de recherche pour les coachs */}
                {isSearchFocused && recipientType === 'coachs' && recipientSearch.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-44 overflow-y-auto">
                    {filteredCoaches.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">Aucun coach trouvé</div>
                    ) : (
                      filteredCoaches.map((c: any) => {
                        const isAlreadySelected = selectedRecipients.some(r => r.id === c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (!isAlreadySelected) {
                                handleAddRecipient({
                                  id: c.id,
                                  name: `${c.firstName} ${c.lastName}`,
                                  type: 'Coach',
                                  email: c.email
                                });
                              }
                            }}
                            className={`px-3.5 py-2 text-xs flex justify-between items-center border-b border-slate-50 last:border-0 ${
                              isAlreadySelected ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{c.firstName} {c.lastName}</span>
                              {c.email && <span className="text-[11px] text-slate-400 ml-2">({c.email})</span>}
                            </div>
                            {isAlreadySelected ? (
                              <span className="text-[11px] text-slate-400">Déjà ajouté</span>
                            ) : (
                              <span className="text-[11px] text-[#23c3b1] font-medium">+ Ajouter</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Section Invités : */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  Invités :
                </label>
                <div className="border border-slate-200 rounded-md p-3.5 min-h-[85px] bg-white flex flex-col justify-center">
                  {selectedRecipients.length === 0 ? (
                    <div className="text-center text-xs sm:text-sm text-slate-400 select-none py-2.5">
                      Aucune donnée
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 py-1">
                      {selectedRecipients.map((r) => (
                        <div
                          key={r.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#23c3b1]/15 text-[#0d9488]">
                            {r.type}
                          </span>
                          <span className="font-medium">{r.name}</span>
                          {r.email && <span className="text-slate-400 text-[11px]">({r.email})</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(r.id)}
                            className="size-4.5 rounded text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition-colors ml-1 cursor-pointer"
                            title="Retirer"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* =======================================================================
            PIED DE PAGE : Compteur (1/2 ou 2/2) + Boutons Précédent / Enregistrer
           ======================================================================= */}
        <div className="px-8 py-3.5 border-t border-slate-100 bg-white rounded-b-2xl flex items-center justify-between shrink-0">
          <div className="text-sm font-normal text-slate-400 select-none">
            {step}/2
          </div>

          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={createMut.isPending}
                className="px-5 py-2 rounded-md bg-[#2b3544] hover:bg-[#1f2733] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Précédent
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-6 py-2 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={() => createMut.mutate()}
                disabled={!canProceedStep2 || createMut.isPending}
                className={`px-5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  !canProceedStep2
                    ? 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'
                    : 'bg-[#f06553] hover:bg-[#e05341] text-white cursor-pointer shadow-sm'
                }`}
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* MODALE DE VISUALISATION & IMPRESSION DE LA CONVOCATION OFFICIELLE */}
      <OfficialConvocationModal
        isOpen={isConvocationOpen}
        onClose={() => {
          setIsConvocationOpen(false);
          handleClose();
        }}
        data={createdConvocationData}
      />
    </div>,
    document.body
  );
}

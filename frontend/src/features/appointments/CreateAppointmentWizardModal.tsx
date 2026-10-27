import { useState, useEffect, useRef, useMemo } from 'react';
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
  Check,
  Send,
  UserCheck,
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

interface CreateAppointmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
  defaultApplicationId?: string;
  defaultDate?: string;
  defaultCandidate?: { 
    applicationId?: string;
    name: string; 
    email?: string; 
    phone?: string; 
    mode?: 'video' | 'in_person' 
  };
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
  defaultApplicationId,
  defaultDate,
  defaultCandidate
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
  const [inPersonPlace, setInPersonPlace] = useState<string>('Siège IML Digit - Espace PME, Quartier B2, Libreville, Gabon');

  // Notifications automatiques vers le candidat
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);
  const [sendSmsNotification, setSendSmsNotification] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      if (defaultDate) {
        setSessionDate(defaultDate);
      } else {
        setSessionDate(new Date().toISOString().split('T')[0]);
      }
      if (defaultCandidate) {
        if (defaultCandidate.mode) {
          setSessionType(defaultCandidate.mode);
        }
        setSessionName(`Entretien d'évaluation - ${defaultCandidate.name}`);
        setDescription(`Entretien d'évaluation pour ${defaultCandidate.name}`);
        setSelectedRecipients([{
          id: defaultBeneficiaryId || 'cand-direct',
          name: defaultCandidate.name,
          type: 'Bénéficiaire',
          email: defaultCandidate.email
        }]);
      }
    }
  }, [isOpen, defaultDate, defaultCandidate, defaultBeneficiaryId]);

  // Champ Description (présent pour les DEUX modes)
  const [description, setDescription] = useState<string>('');

  // Localisation présentielle
  const [city, setCity] = useState<string>('Libreville');
  const [country, setCountry] = useState<string>('Gabon');

  // Étape 2 : Participants à la session (Coach référent + Bénéficiaires)
  const [recipientSearch, setRecipientSearch] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<ParticipantItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');

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
  const allStaff = optionsData?.agents || [];
  const coachesList = useMemo(() => {
    return allStaff.filter((u: any) => u.role?.code === 'COACH' || u.role === 'COACH');
  }, [allStaff]);
  const staffOthers = useMemo(() => {
    return allStaff.filter((u: any) => u.role?.code !== 'COACH' && u.role !== 'COACH');
  }, [allStaff]);

  // Initialisation du coach sélectionné par défaut
  useEffect(() => {
    if (user?.role === 'COACH') {
      setSelectedCoachId(user.id);
    } else if (!selectedCoachId) {
      if (coachesList.length > 0) {
        setSelectedCoachId(coachesList[0].id);
      } else if (allStaff.length > 0) {
        setSelectedCoachId(allStaff[0].id);
      } else if (user?.id) {
        setSelectedCoachId(user.id);
      }
    }
  }, [user, coachesList, allStaff, selectedCoachId]);

  // Initialisation par défaut si un ID de bénéficiaire est passé
  useEffect(() => {
    if (defaultBeneficiaryId && beneficiaries.length > 0) {
      const found = beneficiaries.find((b: any) => b.id === defaultBeneficiaryId);
      if (found) {
        if (!selectedRecipients.some(r => r.id === found.id)) {
          setSelectedRecipients([{
            id: found.id,
            name: `${found.firstName} ${found.lastName}`,
            type: 'Bénéficiaire',
            email: found.email
          }]);
        }
        // Pré-sélectionner le coach assigné si existant
        const assignedCoachId = found.assignments?.[0]?.userId || found.assignments?.[0]?.user?.id;
        if (assignedCoachId) {
          setSelectedCoachId(assignedCoachId);
        }
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
        throw new Error('Veuillez ajouter au moins un bénéficiaire.');
      }
      if (!selectedCoachId && !user?.id) {
        throw new Error('Veuillez sélectionner un coach pour animer la session.');
      }

      const isUUID = (str?: string) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

      const beneficiaryIds = selectedRecipients
        .filter(r => isUUID(r.id))
        .map(r => r.id);

      const primaryBeneficiary = selectedRecipients.find(r => r.type === 'Bénéficiaire') || selectedRecipients[0];
      let beneficiaryId = isUUID(primaryBeneficiary?.id) 
        ? primaryBeneficiary?.id 
        : (isUUID(defaultBeneficiaryId) ? defaultBeneficiaryId : undefined);

      if (!beneficiaryId && defaultCandidate?.email) {
        const found = beneficiaries.find((b: any) => b.email?.toLowerCase() === defaultCandidate.email?.toLowerCase());
        if (found) beneficiaryId = found.id;
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

      const coachIdToUse = selectedCoachId || user?.id;

      const res = await api<any>('/appointments', {
        method: 'POST',
        body: {
          coachId: coachIdToUse,
          beneficiaryId,
          beneficiaryIds: beneficiaryIds.length > 0 ? beneficiaryIds : (beneficiaryId ? [beneficiaryId] : undefined),
          applicationId: defaultCandidate?.applicationId || defaultApplicationId,
          candidateName: defaultCandidate?.name || primaryBeneficiary?.name,
          candidateEmail: defaultCandidate?.email || primaryBeneficiary?.email,
          candidatePhone: defaultCandidate?.phone,
          datetime: combinedDateTime,
          duration: durationMinutes,
          location: locationString.slice(0, 255),
          notes: description
        }
      });

      return {
        res,
        primaryBeneficiary,
        combinedDateTime,
        durationMinutes,
        locationString,
        coachIdToUse
      };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
      onSuccess?.();

      const apptId = data?.res?.id || data?.res?.appointment?.id || Math.random().toString(36).substring(2, 8);
      const ben = data?.primaryBeneficiary;
      const coachObj: any = allStaff.find((c: any) => c.id === data?.coachIdToUse) || user;
      const coachDisplayName = coachObj ? `${coachObj.firstName || ''} ${coachObj.lastName || ''}`.trim() : 'Coach IML Digit';

      const email = ben?.email?.trim()?.toLowerCase();
      const isEmailValid = Boolean(email && email.includes('@') && !email.endsWith('.local'));

      // Émettre l'accusé de réception pour la notification instantanée de l'agent
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('iml:appointment-scheduled', {
          detail: {
            appointmentId: apptId,
            recipientName: ben?.name || 'Candidat / Bénéficiaire',
            recipientEmail: ben?.email,
            coachName: coachDisplayName,
            datetime: data?.combinedDateTime,
            durationMinutes: data?.durationMinutes || 60,
            sessionType,
            locationOrUrl: sessionType === 'video' ? videoUrl : (inPersonPlace || `Siège IML Digit, ${city}`),
            status: isEmailValid ? 'delivered' : 'failed',
            errorMessage: isEmailValid 
              ? undefined 
              : (email ? "Échec de l'envoi : l'adresse e-mail n'a pas pu être délivrée." : "Échec de l'envoi : aucune adresse e-mail valide renseignée pour ce bénéficiaire."),
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        }));
      }

      // Fermer proprement la modale de création
      handleClose();
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
    setRecipientSearch('');
    setSelectedRecipients([]);
    setIsSearchFocused(false);
    onClose();
  };

  if (!isOpen) return null;

  const canProceedStep1 = sessionName.trim().length > 0 && !!sessionDate && !!startTime;
  const canProceedStep2 = !!selectedCoachId && selectedRecipients.length > 0;

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
                      placeholder="Ex: Siège IML Digit - Espace PME, Quartier B2, Libreville"
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
              ÉTAPE 2 : Participants à la session (Coach référent & Bénéficiaires convoqués)
             ===================================================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Titre de section : Participants + Séparateur horizontal */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Participants à la session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Associez le coach référent qui animera la séance et les bénéficiaires qui y participeront.
                </p>
                <div className="w-full border-b border-slate-200 mt-2.5 mb-3.5" />
              </div>

              {/* 1. SECTION COACH : Reçoit dans son planning sur la plateforme */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <UserCheck className="size-4 text-[#23c3b1]" />
                    <span>Coach référent pour la session <span className="text-[#f06553]">*</span> :</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <Check className="size-3" />
                    Reçoit la séance dans son planning plateforme
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs cursor-pointer font-medium"
                  >
                    <option value="" disabled>Sélectionner le coach référent...</option>
                    {coachesList.length > 0 && (
                      <optgroup label="Coachs d'accompagnement">
                        {coachesList.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} (Coach) {c.email ? `- ${c.email}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {staffOthers.length > 0 && (
                      <optgroup label="Agents de planification / Conseillers">
                        {staffOthers.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.firstName} {a.lastName} ({a.role?.label || 'Agent'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <span className="size-1.5 rounded-full bg-[#23c3b1] shrink-0" />
                  Le coach verra automatiquement cette séance programmée dans son planning et aura accès au suivi du bénéficiaire.
                </p>
              </div>

              {/* 2. SECTION BÉNÉFICIAIRE(S) : Reçoivent la convocation par e-mail */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Users className="size-4 text-[#f06553]" />
                    <span>Le ou les bénéficiaire(s) concerné(s) <span className="text-[#f06553]">*</span> :</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200/80">
                    <Mail className="size-3" />
                    Reçoit la convocation par e-mail
                  </span>
                </div>

                {/* Champ de recherche de bénéficiaires */}
                <div className="relative">
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Rechercher un entrepreneur à ajouter (nom, e-mail, dossier)..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs"
                  />

                  {/* Dropdown d'autocomplétion des bénéficiaires */}
                  {isSearchFocused && recipientSearch.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filteredBeneficiaries.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Aucun bénéficiaire correspondant à cette recherche
                        </div>
                      ) : (
                        filteredBeneficiaries.map((b: any) => {
                          const isAlreadySelected = selectedRecipients.some(r => r.id === b.id);
                          const projectName = b.projects?.[0]?.name;
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
                              className={`p-3 text-xs flex justify-between items-center transition-colors ${
                                isAlreadySelected 
                                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed' 
                                  : 'hover:bg-teal-50/60 cursor-pointer text-slate-800'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {b.firstName} {b.lastName}
                                  {b.fileNumber && <span className="text-[11px] text-slate-400 ml-2 font-normal">({b.fileNumber})</span>}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {b.email || 'Aucun e-mail'} {projectName ? `• Projet : ${projectName}` : ''}
                                </div>
                              </div>
                              {isAlreadySelected ? (
                                <span className="text-[11px] text-slate-400 font-medium">Déjà ajouté</span>
                              ) : (
                                <span className="text-xs text-[#23c3b1] font-semibold flex items-center gap-1">
                                  + Ajouter
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Liste des bénéficiaires convoqués */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Bénéficiaires convoqués ({selectedRecipients.length}) :
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-white min-h-[75px]">
                    {selectedRecipients.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-3">
                        Aucun bénéficiaire sélectionné. Veuillez rechercher et ajouter au moins un participant.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipients.map((r) => (
                          <div
                            key={r.id}
                            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-teal-50/80 border border-teal-200/90 text-xs text-slate-800 shadow-2xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">{r.name}</span>
                              {r.email && (
                                <span className="text-teal-700 text-[11px] flex items-center gap-1 font-mono">
                                  <Mail className="size-3 inline" />
                                  {r.email}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(r.id)}
                              className="size-5 rounded-full text-slate-400 hover:text-white hover:bg-rose-500 flex items-center justify-center transition-colors cursor-pointer ml-1"
                              title="Retirer ce bénéficiaire"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <span className="size-1.5 rounded-full bg-[#f06553] shrink-0" />
                  Dès que vous validerez, un e-mail officiel de convocation avec tous les détails ({sessionType === 'video' ? 'lien visioconférence' : 'adresse et salle en présentiel'}) sera immédiatement expédié au bénéficiaire.
                </p>
              </div>

            </div>
          )}

        </div>

        {createMut.isError && (
          <div className="mx-8 mb-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <span>{(createMut.error as Error)?.message || "Impossible d'enregistrer le rendez-vous. Veuillez vérifier les informations."}</span>
            <button 
              type="button" 
              onClick={() => createMut.reset()}
              className="text-rose-500 hover:text-rose-700 text-xs underline ml-2 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

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
                Suivant : Participants
              </button>
            ) : (
              <button
                type="button"
                onClick={() => createMut.mutate()}
                disabled={!canProceedStep2 || createMut.isPending}
                className={`px-5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                  !canProceedStep2
                    ? 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'
                    : 'bg-[#f06553] hover:bg-[#e05341] text-white cursor-pointer shadow-sm active:scale-95'
                }`}
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Envoi et planification...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Planifier & Envoyer les convocations</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

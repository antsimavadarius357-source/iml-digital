import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Clock, 
  Search, 
  Calendar, 
  AlertCircle, 
  ChevronDown, 
  Loader2,
  Mic
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface RecordServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
  defaultBeneficiaryName?: string;
}

export default function RecordServiceModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBeneficiaryId,
  defaultBeneficiaryName
}: RecordServiceModalProps) {
  const queryClient = useQueryClient();

  // Date et heure actuelles par défaut
  const now = new Date();
  const defaultDateStr = now.toISOString().split('T')[0];
  const defaultTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);

  // États du formulaire
  const [beneficiarySearch, setBeneficiarySearch] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<{ id: string; name: string } | null>(null);
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);

  const [linkedPathway, setLinkedPathway] = useState<string>('Pas de parcours lié');
  const [title, setTitle] = useState<string>('');
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(defaultDateStr);
  const [startTime, setStartTime] = useState<string>(defaultTimeStr);
  const [description, setDescription] = useState<string>('');
  const [deductCounter, setDeductCounter] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'add_another'>('confirm');

  // Reconnaissance vocale optionnelle pour la description
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const baseDescRef = useRef<string>('');

  // Récupération des bénéficiaires
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list-record-service'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Récupération des parcours existants pour le bénéficiaire sélectionné
  const { data: pathwaysRes } = useQuery({
    queryKey: ['pathways-for-service', selectedBeneficiary?.id],
    queryFn: () => api<{ items: any[] }>('/pathways'),
    enabled: isOpen && !!selectedBeneficiary?.id
  });
  const beneficiaryPathways = (pathwaysRes?.items || []).filter(
    (p: any) => p.beneficiaryId === selectedBeneficiary?.id
  );

  // Initialisation par défaut
  useEffect(() => {
    if (defaultBeneficiaryId && defaultBeneficiaryName) {
      setSelectedBeneficiary({ id: defaultBeneficiaryId, name: defaultBeneficiaryName });
      setBeneficiarySearch(defaultBeneficiaryName);
    }
  }, [defaultBeneficiaryId, defaultBeneficiaryName]);

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullName.includes(beneficiarySearch.toLowerCase()) || 
           (b.fileNumber && b.fileNumber.toLowerCase().includes(beneficiarySearch.toLowerCase()));
  });

  // Gestion du micro (Web Speech API)
  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    baseDescRef.current = description;
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const full = (finalTranscript + interimTranscript).trim();
        const base = baseDescRef.current ? baseDescRef.current.trim() + ' ' : '';
        setDescription(base + full);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Mutation d'enregistrement de la prestation
  const recordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBeneficiary) {
        throw new Error('Veuillez sélectionner un bénéficiaire.');
      }

      const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
      if (totalMinutes <= 0) {
        throw new Error('La durée de la prestation doit être supérieure à 0 minute.');
      }

      const combinedDate = new Date(`${startDate}T${startTime || '10:00'}:00`);

      // 1. Créer le rendez-vous lié à la prestation
      const appt = await api<{ appointment: { id: string } }>('/appointments', {
        method: 'POST',
        body: {
          beneficiaryId: selectedBeneficiary.id,
          datetime: combinedDate.toISOString(),
          duration: Math.max(15, totalMinutes),
          location: title.trim() || 'Prestation d\'accompagnement',
          status: 'REALISE'
        }
      });

      const appointmentId = appt?.appointment?.id;
      if (appointmentId) {
        // 2. Créer le compte-rendu / pointage de prestation
        const durationHoursFloat = totalMinutes / 60;
        await api(`/appointments/${appointmentId}/session`, {
          method: 'POST',
          body: {
            durationHours: durationHoursFloat,
            summary: description.trim() || title.trim() || 'Enregistrement de prestation',
            nextActions: linkedPathway !== 'Pas de parcours lié' ? `Parcours: ${linkedPathway}` : undefined
          }
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();

      if (actionType === 'confirm') {
        handleClose();
      } else {
        // Mode "Ajouter une autre prestation" : on réinitialise les champs spécifiques
        setTitle('');
        setDescription('');
        setHours(0);
        setMinutes(0);
        setFormError(null);
      }
    },
    onError: (err: any) => {
      setFormError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    }
  });

  const handleClose = () => {
    stopListening();
    setBeneficiarySearch('');
    setSelectedBeneficiary(null);
    setLinkedPathway('Pas de parcours lié');
    setTitle('');
    setHours(0);
    setMinutes(0);
    setStartDate(defaultDateStr);
    setStartTime(defaultTimeStr);
    setDescription('');
    setDeductCounter(false);
    setFormError(null);
    setIsBeneficiaryDropdownOpen(false);
    onClose();
  };

  const handleSubmit = (type: 'confirm' | 'add_another') => {
    setFormError(null);
    setActionType(type);

    if (!selectedBeneficiary) {
      setFormError('Veuillez sélectionner un bénéficiaire.');
      return;
    }

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (totalMinutes <= 0) {
      setFormError('Veuillez renseigner une durée pour la prestation.');
      return;
    }

    recordMutation.mutate();
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg my-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =======================================================================
            EN-TÊTE : Horloge centrale + Titre + Croix
           ======================================================================= */}
        <div className="relative pt-6 pb-2 px-6 sm:px-8 text-center bg-white rounded-t-2xl shrink-0">
          
          {/* Croix de fermeture en haut à droite */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>

          {/* Cercle avec icône horloge */}
          <div className="size-11 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-2xs mx-auto mb-2.5">
            <Clock className="size-5 stroke-[1.75]" />
          </div>

          {/* Titre exact : Enregistrement d'une prestation */}
          <h2 className="text-lg sm:text-[21px] font-normal text-slate-800 tracking-tight">
            Enregistrement d'une prestation
          </h2>
        </div>

        {/* =======================================================================
            CORPS DU FORMULAIRE : Scrollable et fidèle à la capture
           ======================================================================= */}
        <div className="px-6 sm:px-8 py-4 max-h-[62vh] overflow-y-auto space-y-4">
          
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
              {formError}
            </div>
          )}

          {/* 1. Sélectionner un bénéficiaire * */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sélectionner un bénéficiaire <span className="text-[#f06553]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedBeneficiary ? selectedBeneficiary.name : beneficiarySearch}
                onChange={(e) => {
                  setSelectedBeneficiary(null);
                  setBeneficiarySearch(e.target.value);
                  setIsBeneficiaryDropdownOpen(true);
                }}
                onFocus={() => setIsBeneficiaryDropdownOpen(true)}
                placeholder="Rechercher"
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs"
              />
              <Search className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

              {isBeneficiaryDropdownOpen && !selectedBeneficiary && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl z-30 max-h-48 overflow-y-auto">
                  {filteredBeneficiaries.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Aucun bénéficiaire trouvé
                    </div>
                  ) : (
                    filteredBeneficiaries.map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBeneficiary({
                            id: b.id,
                            name: `${b.firstName} ${b.lastName}`
                          });
                          setBeneficiarySearch(`${b.firstName} ${b.lastName}`);
                          setIsBeneficiaryDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                      >
                        <span className="font-medium text-slate-800">{b.firstName} {b.lastName}</span>
                        <span className="text-[11px] text-slate-400">{b.email}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Souhaitez-vous lier un parcours à votre prestation ? */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Souhaitez-vous lier un parcours à votre prestation ?
            </label>
            <div className="relative">
              <select
                value={linkedPathway}
                onChange={(e) => setLinkedPathway(e.target.value)}
                className="w-full appearance-none px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs pr-8"
              >
                <option value="Pas de parcours lié">Pas de parcours lié</option>
                {beneficiaryPathways.map((p: any) => (
                  <option key={p.id} value={p.template?.name || p.id}>
                    {p.template?.name || 'Parcours d\'incubation'}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Titre de la prestation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre de la prestation
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la prestation"
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs"
            />
          </div>

          {/* 4. Durée de la prestation * */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Durée de la prestation <span className="text-[#f06553]">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2.5 py-1.5 rounded-md border border-slate-200 text-center text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                />
                <span className="text-xs text-slate-600 font-normal">heure(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2.5 py-1.5 rounded-md border border-slate-200 text-center text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                />
                <span className="text-xs text-slate-600 font-normal">minute(s)</span>
              </div>
            </div>
          </div>

          {/* 5. Date du début de la prestation * */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date du début de la prestation <span className="text-[#f06553]">*</span>
            </label>
            <div className="flex items-center rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-[#23c3b1] focus-within:ring-1 focus-within:ring-[#23c3b1]">
              {/* Date */}
              <div className="flex-1 flex items-center px-3 py-1.5 gap-2 border-r border-slate-200">
                <Calendar className="size-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-transparent focus:outline-none"
                />
              </div>
              {/* Heure */}
              <div className="w-32 flex items-center px-3 py-1.5 gap-2">
                <Clock className="size-4 text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. Bandeau d'alerte décompte */}
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-rose-50/70 border border-rose-100/90 text-rose-800 text-xs">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11.5px] leading-relaxed">
              Le décompte est indisponible car vous n'avez actuellement aucun compteur actif pour ce bénéficiaire
            </p>
          </div>

          {/* 7. Checkbox décompte */}
          <div>
            <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deductCounter}
                onChange={(e) => setDeductCounter(e.target.checked)}
                className="rounded border-slate-300 text-[#23c3b1] focus:ring-[#23c3b1] size-4 cursor-pointer"
              />
              <span>Ce temps sera décompté/ajouté du compteur du bénéficiaire</span>
            </label>
          </div>

          {/* 8. Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isListening ? "Arrêter la dictée" : "Dicter au micro"}
              >
                <Mic className={`size-3 ${isListening ? 'text-[#f06553] animate-bounce' : 'text-slate-500'}`} />
                <span>{isListening ? 'Arrêter' : 'Dicter'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la prestation..."
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs resize-none"
            />
          </div>

        </div>

        {/* =======================================================================
            PIED DE MODALE : Deux boutons corail comme sur la capture
           ======================================================================= */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-white rounded-b-2xl flex items-center justify-center gap-3 shrink-0">
          
          {/* Bouton 1 : Confirmer */}
          <button
            type="button"
            onClick={() => handleSubmit('confirm')}
            disabled={recordMutation.isPending}
            className="px-6 py-2 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {recordMutation.isPending && actionType === 'confirm' ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Confirmation...
              </>
            ) : (
              'Confirmer'
            )}
          </button>

          {/* Bouton 2 : Ajouter une autre prestation */}
          <button
            type="button"
            onClick={() => handleSubmit('add_another')}
            disabled={recordMutation.isPending}
            className="px-5 py-2 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {recordMutation.isPending && actionType === 'add_another' ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Ajouter une autre prestation'
            )}
          </button>

        </div>

      </div>
    </div>,
    document.body
  );
}

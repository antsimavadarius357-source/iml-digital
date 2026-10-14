import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Keyboard, 
  ChevronDown, 
  Loader2,
  Mic
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

// Options de visibilité de la note
const VISIBILITY_OPTIONS = [
  'Moi uniquement',
  'La personne concernée et moi',
  'Les coachs de la personne concernée et moi',
  'Les gestionnaires et les coachs de la personne concernée',
  'Tout le monde',
];

interface CreateNoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
  defaultBeneficiaryName?: string;
}

export default function CreateNoteDrawer({
  isOpen,
  onClose,
  onSuccess,
  defaultBeneficiaryId,
  defaultBeneficiaryName
}: CreateNoteDrawerProps) {
  const queryClient = useQueryClient();

  // État du formulaire
  const [beneficiarySearch, setBeneficiarySearch] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<{ id: string; name: string } | null>(null);
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);

  const [appointmentId, setAppointmentId] = useState<string>('');
  const [visibility, setVisibility] = useState<string>('Moi uniquement');
  const [isVisibilityOpen, setIsVisibilityOpen] = useState<boolean>(false);
  const visibilityRef = useRef<HTMLDivElement>(null);
  const [writingMode, setWritingMode] = useState<'keyboard' | 'voice'>('keyboard');
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Fermeture du dropdown visibilité au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setIsVisibilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reconnaissance vocale (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseContentRef = useRef<string>('');

  // Récupération des bénéficiaires existants
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list-notes'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Récupération des rendez-vous du bénéficiaire sélectionné (ou tous)
  const { data: apptRes } = useQuery({
    queryKey: ['appointments-for-note', selectedBeneficiary?.id],
    queryFn: () => api<{ items: any[] }>(`/appointments${selectedBeneficiary ? `?beneficiaryId=${selectedBeneficiary.id}` : ''}`),
    enabled: isOpen
  });
  const appointments = apptRes?.items || [];

  // Initialisation par défaut si fournie
  useEffect(() => {
    if (defaultBeneficiaryId && defaultBeneficiaryName) {
      setSelectedBeneficiary({ id: defaultBeneficiaryId, name: defaultBeneficiaryName });
      setBeneficiarySearch(defaultBeneficiaryName);
    }
  }, [defaultBeneficiaryId, defaultBeneficiaryName]);

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullName.includes(beneficiarySearch.toLowerCase()) || (b.fileNumber && b.fileNumber.toLowerCase().includes(beneficiarySearch.toLowerCase()));
  });

  // Gestion de la reconnaissance vocale (Web Speech API)
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    setSpeechError(null);
    setWritingMode('voice');
    baseContentRef.current = content;

    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError("La reconnaissance vocale intégrée n'est pas disponible sur ce navigateur. Vous pouvez saisir directement au clavier.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

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

        const fullSpokenText = (finalTranscript + interimTranscript).trim();
        const base = baseContentRef.current ? baseContentRef.current.trim() + ' ' : '';
        setContent(base + fullSpokenText);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("L'accès au microphone a été refusé. Veuillez autoriser le micro dans les paramètres de votre navigateur.");
        } else if (event.error === 'no-speech') {
          // silence
        } else {
          setSpeechError(`Information micro : ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: any) {
      console.error('Erreur démarrage microphone:', err);
      setSpeechError(err.message || 'Impossible de démarrer le micro');
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
  }, [isOpen]);

  // Soumission
  const createNoteMut = useMutation({
    mutationFn: async () => {
      // 1. Si un rendez-vous est sélectionné, on associe le compte-rendu
      if (appointmentId && content) {
        await api(`/appointments/${appointmentId}/session`, {
          method: 'POST',
          body: {
            durationHours: 1.0,
            summary: `${title ? `[${title}] ` : ''}${content}`,
            nextActions: `Visibilité: ${visibility}`
          }
        });
      } else if (selectedBeneficiary && content) {
        // 2. Si pas de rendez-vous sélectionné, créer une note d'accompagnement
        const newAppt = await api<any>('/appointments', {
          method: 'POST',
          body: {
            beneficiaryId: selectedBeneficiary.id,
            datetime: new Date().toISOString(),
            duration: 30,
            location: 'Note de suivi',
            status: 'TERMINE'
          }
        });
        if (newAppt?.id) {
          await api(`/appointments/${newAppt.id}/session`, {
            method: 'POST',
            body: {
              durationHours: 0.5,
              summary: `${title ? `[${title}] ` : ''}${content}`,
              nextActions: `Visibilité: ${visibility}`
            }
          });
        }
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      onSuccess?.();
      handleClose();
    }
  });

  const handleClose = () => {
    stopListening();
    setBeneficiarySearch('');
    setSelectedBeneficiary(null);
    setAppointmentId('');
    setVisibility('Moi uniquement');
    setWritingMode('keyboard');
    setTitle('');
    setContent('');
    setSpeechError(null);
    setIsBeneficiaryDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Arrière-plan transparent semi-sombre avec flou léger permettant de voir le tableau de bord derrière */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[85]">
        {/* Le tiroir (Drawer) compact animé de droite à gauche */}
        <div className="relative w-screen max-w-[380px] sm:max-w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-x-0 animate-in slide-in-from-right">
          
          {/* Bouton de fermeture rouge/corail flottant sur le bord gauche du tiroir (exactement comme sur votre capture) */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute -left-9 sm:-left-10 top-6 z-30 size-9 sm:size-10 rounded-l-md bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="size-5 stroke-[2.5]" />
          </button>

          {/* En-tête du volet : Titre Créer une note clair et bien visible */}
          <div className="px-6 pt-6 pb-3 bg-white shrink-0">
            <h2 className="text-xl sm:text-[22px] font-normal text-slate-800 tracking-tight">
              Créer une note
            </h2>
          </div>

          {/* Corps du formulaire scrollable et compact */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            
            {/* 1. Bénéficiaire */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bénéficiaire
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

            {/* 2. Rendez-vous concerné */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rendez-vous concerné
              </label>
              <div className="relative">
                <select
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  className="w-full appearance-none px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs pr-8"
                >
                  <option value="">Sélectionner un rendez-vous (optionnel)</option>
                  {appointments.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.datetime).toLocaleDateString('fr-FR')} à {new Date(a.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {a.beneficiary ? `${a.beneficiary.firstName} ${a.beneficiary.lastName}` : 'Rendez-vous'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Lisible par... */}
            <div className="relative" ref={visibilityRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lisible par...
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs cursor-pointer text-left"
                >
                  <span className="truncate">{visibility}</span>
                  <ChevronDown className={`size-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isVisibilityOpen ? 'rotate-180' : ''}`} />
                </button>

                {isVisibilityOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Flèche pointant vers le haut au centre */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border-t border-l border-slate-200/90 rotate-45" />

                    <div className="relative z-10 py-1 bg-white rounded-md overflow-hidden">
                      {VISIBILITY_OPTIONS.map((opt, idx) => (
                        <div
                          key={opt}
                          onClick={() => {
                            setVisibility(opt);
                            setIsVisibilityOpen(false);
                          }}
                          className={`px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors ${
                            idx < VISIBILITY_OPTIONS.length - 1 ? 'border-b border-slate-100' : ''
                          } ${visibility === opt ? 'font-medium text-slate-900 bg-slate-50/70' : 'font-normal'}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Rédiger une note... * (Deux cartes : avec le clavier / Note vocale) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rédiger une note... <span className="text-[#f06553]">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Carte 1 : avec le clavier */}
                <div
                  onClick={() => {
                    setWritingMode('keyboard');
                    stopListening();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[110px] ${
                    writingMode === 'keyboard' && !isListening
                      ? 'bg-slate-50 border-[#23c3b1] ring-2 ring-[#23c3b1]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="size-9 rounded-lg bg-slate-100 flex items-center justify-center mb-1.5 text-slate-500 group-hover:text-[#23c3b1] transition-colors">
                    <Keyboard className="size-5 stroke-[1.75]" />
                  </div>
                  <span className="text-xs text-slate-800 font-semibold">
                    avec le clavier
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Saisie manuelle
                  </span>
                </div>

                {/* Carte 2 : Note vocale avec microphone */}
                <div
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center relative min-h-[110px] ${
                    isListening
                      ? 'bg-rose-50/80 border-[#f06553] ring-2 ring-[#f06553]/30 shadow-sm'
                      : writingMode === 'voice'
                        ? 'bg-emerald-50/50 border-[#23c3b1] ring-2 ring-[#23c3b1]/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Icône Micro vivante */}
                  <div className={`size-9 rounded-lg flex items-center justify-center mb-1.5 transition-all ${
                    isListening
                      ? 'bg-[#f06553] text-white shadow-md animate-pulse'
                      : 'bg-[#23c3b1]/15 text-[#23c3b1]'
                  }`}>
                    <Mic className="size-5 stroke-[2]" />
                  </div>

                  <span className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                    Note vocale
                    {isListening && (
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
                      </span>
                    )}
                  </span>

                  <p className="text-[10px] leading-snug mt-0.5">
                    {isListening ? (
                      <span className="text-[#f06553] font-medium animate-pulse">En écoute... Cliquez pour arrêter</span>
                    ) : (
                      <span className="text-slate-500">Cliquez pour dicter à la voix</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Titre de la note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre de la note
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la note"
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs"
              />
            </div>

            {/* 6. Description de la note (Saisie au clavier ou Dictée vocale) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Description de la note <span className="text-[#f06553]">*</span>
                </label>

                {/* Bouton micro direct au-dessus du champ description */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title={isListening ? "Arrêter la dictée" : "Démarrer la dictée vocale"}
                >
                  <Mic className={`size-3.5 ${isListening ? 'text-[#f06553] animate-bounce' : 'text-slate-500'}`} />
                  <span>{isListening ? 'Arrêter la dictée' : 'Note vocale'}</span>
                </button>
              </div>

              {/* Champ textarea connecté à la voix et au clavier */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    baseContentRef.current = e.target.value;
                  }}
                  placeholder="Écrivez avec le clavier ou parlez au micro pour dicter directement dans cette description..."
                  className={`w-full px-3 py-2 rounded-md border text-xs text-slate-800 focus:outline-none placeholder-slate-400 shadow-2xs resize-none transition-colors ${
                    isListening 
                      ? 'border-[#f06553] ring-1 ring-[#f06553]/40 bg-rose-50/20' 
                      : 'border-slate-200 bg-white focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]'
                  }`}
                />
              </div>

              {/* Barre animée pendant l'écoute du micro */}
              {isListening && (
                <div className="mt-2 p-2.5 bg-rose-50/90 border border-rose-200 rounded-lg flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-[#f06553] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-4 bg-[#f06553] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-2 bg-[#f06553] rounded-full animate-bounce"></span>
                      <span className="w-1 h-4 bg-[#f06553] rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    </div>
                    <span className="text-[11px] font-medium text-rose-800">
                      Dictée en cours... Parlez maintenant, le texte s'écrit en direct.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                  >
                    Terminer
                  </button>
                </div>
              )}

              {/* Erreur de micro si refusé ou indisponible */}
              {speechError && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800">
                  {speechError}
                </div>
              )}
            </div>

          </div>

          {/* Pied de page avec bouton Valider / Enregistrer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => createNoteMut.mutate()}
              disabled={createNoteMut.isPending || (!title.trim() && !content.trim())}
              className="px-4 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {createNoteMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer la note'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

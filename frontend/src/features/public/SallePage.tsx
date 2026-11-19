import { useEffect, useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import {
  ROOM_CAPACITY, EVENT_TYPES,
  fetchAvailability, overlapsBusy, submitBooking, toIso, type BusySlot,
} from '../rooms/roomBooking';
import ImlLogo from '../../components/common/ImlLogo';

// Formules principales de planification (Conforme exacte à la capture)
const BOOKING_FORMULAS = [
  {
    id: 'DEMI_JOURNEE',
    title: 'Location Salle — Demi-Journée (4h)',
    durationLabel: '4 heures',
    dotColor: 'bg-[#FF5B37]',
    hoverBorder: 'hover:border-[#FF5B37]',
    hoverText: 'group-hover:text-[#FF5B37]',
    desc: 'Idéal pour masterclasses, ateliers pratiques, conférences courtes ou formations ciblées (09h00–13h00 ou 14h00–18h00).',
    slots: [
      { start: '09:00', end: '13:00', label: '09:00 – 13:00' },
      { start: '14:00', end: '18:00', label: '14:00 – 18:00' },
      { start: '10:00', end: '14:00', label: '10:00 – 14:00' },
    ]
  },
  {
    id: 'JOURNEE',
    title: 'Location Salle — Journée Complète (8h)',
    durationLabel: '8 heures',
    dotColor: 'bg-amber-400',
    hoverBorder: 'hover:border-amber-400',
    hoverText: 'group-hover:text-amber-600',
    desc: 'Séminaires d’entreprise, bootcamps intensifs et journées d’études tout équipées (08h30–16h30 ou 09h00–17h00).',
    slots: [
      { start: '08:30', end: '16:30', label: '08:30 – 16:30' },
      { start: '09:00', end: '17:00', label: '09:00 – 17:00' },
      { start: '10:00', end: '18:00', label: '10:00 – 18:00' },
    ]
  },
  {
    id: 'HORAIRE',
    title: 'Session courte — Réunion & Visio (2h)',
    durationLabel: '2 heures',
    dotColor: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-400',
    hoverText: 'group-hover:text-emerald-600',
    desc: 'Réunions d’équipe, entretiens, visioconférences et revues de projet ponctuelles.',
    slots: [
      { start: '09:00', end: '11:00', label: '09:00 – 11:00' },
      { start: '11:00', end: '13:00', label: '11:00 – 13:00' },
      { start: '14:00', end: '16:00', label: '14:00 – 16:00' },
      { start: '16:00', end: '18:00', label: '16:00 – 18:00' },
    ]
  }
];

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];
const DAY_NAMES = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

export default function SallePage() {
  // Navigation dans le tunnel Calendly : 
  // 1 = Accueil planification (exacte capture utilisateur)
  // 2 = Date & Heure
  // 3 = Indiquez vos informations
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Formule choisie
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('DEMI_JOURNEE');
  const selectedFormula = useMemo(
    () => BOOKING_FORMULAS.find(f => f.id === selectedFormulaId) || BOOKING_FORMULAS[0],
    [selectedFormulaId]
  );

  // Calendrier
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  // Formulaire coordonnees
  const [organizerName, setOrganizerName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('MASTERCLASS');
  const [attendees, setAttendees] = useState('12');
  const [notes, setNotes] = useState('');

  // Disponibilités API
  const [busy, setBusy] = useState<BusySlot[]>([]);
  const [loadingAv, setLoadingAv] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  // Chargement des disponibilités quand une date est cliquée
  useEffect(() => {
    if (!selectedDateStr) { setBusy([]); return; }
    let cancelled = false;
    setLoadingAv(true);
    fetchAvailability(selectedDateStr)
      .then((r) => { if (!cancelled) setBusy(r.busy); })
      .catch(() => { if (!cancelled) setBusy([]); })
      .finally(() => { if (!cancelled) setLoadingAv(false); });
    return () => { cancelled = true; };
  }, [selectedDateStr]);

  // Génération des jours du mois affiché
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lundi = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: '', isPast: true });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < today;
      const isSunday = dateObj.getDay() === 0;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      days.push({
        dayNumber: d,
        dateStr,
        isPast: isPast || isSunday,
        isSunday,
      });
    }
    return days;
  }, [currentMonthDate]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  };

  // Date sélectionnée formatée lisible (ex: "mercredi 4 novembre 2026")
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDateStr]);

  // Validation et soumission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedSlot) {
      setError('Veuillez sélectionner une date et un horaire.');
      return;
    }
    if (!organizerName.trim() || !email.trim() || !phone.trim()) {
      setError('Veuillez renseigner votre nom, email et numéro de téléphone.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await submitBooking({
        organizerName: organizerName.trim(),
        organization: organization.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        eventType: eventType,
        attendees: Number(attendees) || 12,
        startAt: toIso(selectedDateStr, selectedSlot.start),
        endAt: toIso(selectedDateStr, selectedSlot.end),
        notes: `[Formule: ${selectedFormula.title}] ${notes.trim()}`,
        source: 'FORMULAIRE',
      });
      setReference(res.booking.reference);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_last_submission', Date.now().toString());
        } catch {}
      }
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Impossible d\'enregistrer la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setReference(null);
    setStep(1);
    setSelectedDateStr('');
    setSelectedSlot(null);
    setError(null);
  };

  return (
    <div className="py-12 sm:py-20 bg-[#FAF9F5] min-h-screen flex items-center justify-center">
      <title>Planification — Salle IML Digit Libreville</title>
      <meta name="description" content="Planifiez votre réservation pour la salle de formation IML Digit à Libreville." />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">

        {/* ===================================================================
            ÉCRAN DE CONFIRMATION SUCCÈS
           =================================================================== */}
        {reference ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/90 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
              <CheckCircle2 className="size-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Réservation enregistrée !
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Votre demande a bien été ajoutée au calendrier IML Digit.
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Référence dossier</span>
                <span className="text-base font-mono font-black text-[#FF5B37]">{reference}</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1.5">
                <div><strong>Prestation :</strong> {selectedFormula.title}</div>
                <div><strong>Date & Heure :</strong> {formattedSelectedDate} ({selectedSlot?.start} – {selectedSlot?.end})</div>
                <div><strong>Lieu :</strong> Immeuble Espace PME, Quartier Awendjé, Libreville</div>
                <div><strong>Organisateur :</strong> {organizerName} {organization ? `(${organization})` : ''}</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Notre équipe vérifie et vous confirme définitivement sous <strong>24h ouvrées</strong> par e-mail et WhatsApp avec l'envoi de votre facture officielle.
            </p>

            <button 
              type="button" 
              onClick={resetAll}
              className="px-6 py-3 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Faire une autre réservation
            </button>
          </div>
        ) : (

          /* ===================================================================
              CONTAINER PRINCIPAL
             =================================================================== */
          <div>

            {/* ===============================================================
                ÉTAPE 1 : PAGE DE PLANIFICATION (COPIE EXACTE DE VOTRE CAPTURE)
               =============================================================== */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-8 sm:p-14 border border-stone-200/90 shadow-sm space-y-12 animate-in fade-in duration-200">
                
                {/* En-tête centré avec Logo IML Digit & message d'accueil */}
                <div className="text-center max-w-xl mx-auto space-y-4">
                  <div className="flex justify-center mb-2">
                    <ImlLogo variant="icon" size="xl" />
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-1">
                    <p>Bienvenue sur notre page de planification.</p>
                    <p>Veuillez suivre les instructions pour ajouter un événement à notre calendrier.</p>
                  </div>
                </div>

                {/* Séparation et options côte à côte (Style exact de votre capture) */}
                <div className="pt-8 border-t border-stone-100">
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 md:divide-x md:divide-stone-100">
                    
                    {/* Option 1 : Demi-Journée (Pastille Bleue) */}
                    <div
                      onClick={() => {
                        setSelectedFormulaId('DEMI_JOURNEE');
                        setStep(2);
                      }}
                      className="group cursor-pointer space-y-3 md:pr-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-5 rounded-full bg-[#FF5B37] shrink-0 shadow-xs" />
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#FF5B37] transition-colors">
                          Location Salle — Demi-Journée (4h)
                        </h2>
                        <ChevronRight className="size-4 text-slate-400 ml-auto group-hover:text-[#FF5B37] group-hover:translate-x-1 transition-all" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-8">
                        Idéal pour vos masterclasses, ateliers pratiques, conférences courtes ou formations ciblées (09h00–13h00 ou 14h00–18h00).
                      </p>
                    </div>

                    {/* Option 2 : Journée Complète (Pastille Jaune) */}
                    <div
                      onClick={() => {
                        setSelectedFormulaId('JOURNEE');
                        setStep(2);
                      }}
                      className="group cursor-pointer space-y-3 md:pl-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          Location Salle — Journée Complète (8h)
                        </h2>
                        <ChevronRight className="size-4 text-slate-400 ml-auto group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-8">
                        Séminaires d’entreprise, bootcamps intensifs, conventions et journées d’études tout équipées (08h30–16h30 ou 09h00–17h00).
                      </p>
                    </div>

                  </div>
                </div>

                {/* Option 3 supplémentaire subtile (Session courte / réunion) */}
                <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-slate-400">
                    Besoin d'une courte session de travail ou d'une réunion ponctuelle ?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormulaId('HORAIRE');
                      setStep(2);
                    }}
                    className="font-bold text-[#FF5B37] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Réunion courte (2h)</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>

                {/* Footer discret de la carte (Paramètres des cookies, etc.) */}
                <div className="pt-8 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="hover:text-slate-600 transition-colors">Paramètres des cookies</span>
                    <span>•</span>
                    <span className="hover:text-slate-600 transition-colors">Politique de confidentialité</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <MapPin className="size-3 text-[#FF5B37]" />
                    <span>Immeuble Espace PME, Quartier Awendjé, Libreville</span>
                  </div>
                </div>

              </div>
            )}

            {/* ===============================================================
                ÉTAPE 2 : CALENDRIER & HEURE (STYLE CALENDLY - CAPTURE 3)
               =============================================================== */}
            {step === 2 && (
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden grid lg:grid-cols-12 animate-in fade-in duration-200">
                
                {/* Colonne Gauche : Récapitulatif de l'événement */}
                <div className="lg:col-span-4 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-stone-100 bg-white space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="size-9 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      title="Retour aux choix de prestation"
                    >
                      <ArrowLeft className="size-4" />
                    </button>

                    <div className="flex justify-center py-1">
                      <ImlLogo variant="icon" size="lg" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900 leading-snug">
                        {selectedFormula.title}
                      </h2>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-slate-400 shrink-0" />
                        <span>{selectedFormula.durationLabel}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-slate-400 shrink-0" />
                        <span>Libreville Awendjé</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-slate-400 shrink-0" />
                        <span>Capacité : max {ROOM_CAPACITY} personnes</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed pt-2">
                      {selectedFormula.desc}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span>Paramètres des cookies</span>
                    <span>Politique</span>
                  </div>
                </div>

                {/* Colonne Droite : Sélection date et heure */}
                <div className="lg:col-span-8 p-6 sm:p-8 space-y-6">
                  
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Sélectionnez la date et l'heure
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-12 gap-6 items-start">
                    
                    {/* Calendrier mensuel */}
                    <div className="md:col-span-7 space-y-4">
                      
                      {/* Contrôle mois */}
                      <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-bold text-slate-900 capitalize">
                          {MONTH_NAMES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="size-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="size-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Jours semaine */}
                      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase py-1">
                        {DAY_NAMES.map(d => <span key={d}>{d}</span>)}
                      </div>

                      {/* Grille Jours */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarDays.map((item, idx) => {
                          if (!item.dayNumber) {
                            return <div key={`empty-${idx}`} className="h-10" />;
                          }

                          const isSelected = selectedDateStr === item.dateStr;

                          return (
                            <button
                              key={item.dateStr}
                              type="button"
                              disabled={item.isPast}
                              onClick={() => {
                                setSelectedDateStr(item.dateStr);
                                setSelectedSlot(null);
                              }}
                              className={`h-10 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                                item.isPast
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-[#FF5B37] text-white shadow-sm ring-2 ring-[#FF5B37]/30'
                                    : 'text-slate-800 hover:bg-orange-50 hover:text-[#FF5B37]'
                              }`}
                            >
                              {item.dayNumber}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-slate-400 pt-2">
                        Fuseau horaire : <strong>Heure d'Afrique de l'Ouest (UTC+1, Libreville)</strong>
                      </div>
                    </div>

                    {/* Créneaux horaires disponibles */}
                    <div className="md:col-span-5 space-y-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-stone-100 md:pl-6">
                      
                      {selectedDateStr ? (
                        <>
                          <div className="text-xs font-bold text-slate-800 capitalize border-b border-stone-100 pb-2">
                            {formattedSelectedDate}
                          </div>

                          {loadingAv ? (
                            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                              <Loader2 className="size-5 animate-spin text-[#FF5B37]" />
                              <span>Vérification...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedFormula.slots.map((slot) => {
                                const isOccupied = overlapsBusy(busy, selectedDateStr, slot.start, slot.end);
                                const isChosen = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

                                return (
                                  <button
                                    key={slot.start + slot.end}
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                      isOccupied
                                        ? 'border-stone-100 bg-stone-50 text-slate-300 cursor-not-allowed line-through'
                                        : isChosen
                                          ? 'border-[#FF5B37] bg-[#FF5B37] text-white shadow-xs'
                                          : 'border-orange-300/80 text-slate-800 hover:border-[#FF5B37] hover:bg-orange-50/50'
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {selectedSlot && (
                            <div className="pt-2 animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="w-full py-3 rounded-xl bg-[#FF5B37] hover:bg-[#e94d29] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <span>Suivant</span>
                                <ChevronRight className="size-4" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-12 text-center space-y-2 text-slate-400">
                          <CalendarIcon className="size-8 mx-auto text-slate-300" />
                          <p className="text-xs">
                            Sélectionnez un jour sur le calendrier.
                          </p>
                        </div>
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ===============================================================
                ÉTAPE 3 : INDIQUEZ VOS INFORMATIONS (STYLE CALENDLY - CAPTURE 4)
               =============================================================== */}
            {step === 3 && (
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden grid lg:grid-cols-12 animate-in fade-in duration-200">
                
                {/* Volet de gauche : Récapitulatif du créneau */}
                <div className="lg:col-span-4 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-stone-100 bg-white space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="size-9 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      title="Modifier date et heure"
                    >
                      <ArrowLeft className="size-4" />
                    </button>

                    <div className="flex justify-center py-1">
                      <ImlLogo variant="icon" size="lg" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900 leading-snug">
                        {selectedFormula.title}
                      </h2>
                    </div>

                    <div className="space-y-3 text-xs text-slate-700 pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <Clock className="size-4 text-slate-400 shrink-0" />
                        <span>{selectedFormula.durationLabel}</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CalendarIcon className="size-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-bold text-slate-900 capitalize">
                            {selectedSlot?.start} – {selectedSlot?.end}, {formattedSelectedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <MapPin className="size-4 text-slate-400 shrink-0" />
                        <span>Libreville Awendjé</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed pt-2">
                      {selectedFormula.desc}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span>Paramètres des cookies</span>
                    <span>Politique</span>
                  </div>
                </div>

                {/* Volet de droite : Formulaire "Indiquez vos informations" */}
                <div className="lg:col-span-8 p-6 sm:p-9 space-y-6">
                  
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      Indiquez vos informations
                    </h3>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-4">
                    
                    <div>
                      <label htmlFor="r-name" className="block text-xs font-bold text-slate-700 mb-1">
                        Nom *
                      </label>
                      <input
                        id="r-name"
                        type="text"
                        required
                        minLength={2}
                        value={organizerName}
                        onChange={(e) => setOrganizerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="r-email" className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail *
                      </label>
                      <input
                        id="r-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="r-phone" className="block text-xs font-bold text-slate-700 mb-1">
                        Numéro de téléphone *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-slate-500 font-medium">🇬🇦 +241</span>
                        <input
                          id="r-phone"
                          type="tel"
                          required
                          minLength={6}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07 ..."
                          className="w-full pl-18 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="r-org" className="block text-xs font-bold text-slate-700 mb-1">
                          Nom de l'entreprise ou structure <span className="text-slate-400 font-normal">(facultatif)</span>
                        </label>
                        <input
                          id="r-org"
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="r-type" className="block text-xs font-bold text-slate-700 mb-1">
                          Type d'événement *
                        </label>
                        <select
                          id="r-type"
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white cursor-pointer"
                        >
                          {EVENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="r-att" className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre de participants prévus (max {ROOM_CAPACITY}) *
                      </label>
                      <input
                        id="r-att"
                        type="number"
                        required
                        min={1}
                        max={ROOM_CAPACITY}
                        value={attendees}
                        onChange={(e) => setAttendees(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="r-notes" className="block text-xs font-bold text-slate-700 mb-1">
                        Présentez votre projet / Besoins particuliers <span className="text-slate-400 font-normal">(facultatif)</span>
                      </label>
                      <textarea
                        id="r-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Disposition en U, vidéoprojecteur, pauses café..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-orange-100 bg-white resize-none"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      En poursuivant, vous confirmez votre demande de réservation. Une facture officielle et les modalités d'accès vous seront adressées sous 24h.
                    </p>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Validation en cours...</span>
                        </>
                      ) : (
                        <span>Confirmer l'événement</span>
                      )}
                    </button>

                  </form>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

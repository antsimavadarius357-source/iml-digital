import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  Globe,
  Printer,
  Presentation,
  CalendarClock,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { api } from '../../lib/api';

export interface RoomBookingItem {
  id: string;
  reference: string;
  organizerName: string;
  organization?: string | null;
  email: string;
  phone: string;
  eventType: string;
  attendees: number;
  startAt: string;
  endAt: string;
  notes?: string | null;
  source: 'FORMULAIRE' | 'ASSISTANT';
  status: 'EN_ATTENTE' | 'CONFIRMEE' | 'REFUSEE';
  createdAt?: string;
  decidedAt?: string | null;
  decisionNote?: string | null;
}

interface RoomBookingDetailModalProps {
  booking: RoomBookingItem | null;
  onClose: () => void;
  onDecide: (id: string, status: 'CONFIRMEE' | 'REFUSEE') => Promise<void> | void;
  onReschedule?: (updated: RoomBookingItem) => void;
  onDelete?: (id: string) => void;
}

export default function RoomBookingDetailModal({
  booking,
  onClose,
  onDecide,
  onReschedule,
  onDelete,
}: RoomBookingDetailModalProps) {
  const [currentBooking, setCurrentBooking] = useState<RoomBookingItem | null>(booking);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mode Édition / Décalage de créneau
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(() => {
    if (!booking) return '';
    const d = new Date(booking.startAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [editStartTime, setEditStartTime] = useState(() => {
    if (!booking) return '09:00';
    const d = new Date(booking.startAt);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [editEndTime, setEditEndTime] = useState(() => {
    if (!booking) return '13:00';
    const d = new Date(booking.endAt);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [editAttendees, setEditAttendees] = useState<number>(() => booking?.attendees || 10);
  const [editReason, setEditReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!currentBooking) return null;

  const start = new Date(currentBooking.startAt);
  const end = new Date(currentBooking.endAt);

  const fullDateStr = start.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTimeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const durationHours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);

  // Message WhatsApp adapté selon le statut
  const cleanPhone = currentBooking.phone.replace(/\D/g, '');
  const isConfirmed = currentBooking.status === 'CONFIRMEE';
  const isPending = currentBooking.status === 'EN_ATTENTE';

  const defaultWhatsappMessage = isConfirmed
    ? `Bonjour ${currentBooking.organizerName}, nous vous confirmons que votre réservation de salle IML Digit (Réf: ${currentBooking.reference}) pour votre ${currentBooking.eventType.toLowerCase()} du ${fullDateStr} de ${startTimeStr} à ${endTimeStr} est validée et verrouillée. Lieu : Hub IML Digit, Awendjé, Libreville. À très bientôt !`
    : `Bonjour ${currentBooking.organizerName}, suite à votre demande de réservation de salle IML Digit (Réf: ${currentBooking.reference}) pour le ${fullDateStr} (${startTimeStr} - ${endTimeStr}), votre dossier est bien pris en charge par notre conciergerie. Restons en contact pour la confirmation définitive.`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWhatsappMessage)}`;

  const handleCopyRef = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentBooking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAction = async (status: 'CONFIRMEE' | 'REFUSEE') => {
    setIsSubmitting(true);
    try {
      await onDecide(currentBooking.id, status);
      setCurrentBooking({ ...currentBooking, status });
      setSaveSuccessMsg(status === 'CONFIRMEE' ? 'Demande confirmée ! La salle est verrouillée et un email de confirmation a été expédié au client.' : 'Demande refusée.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editDate || !editStartTime || !editEndTime) {
      setEditError('Veuillez renseigner la date, l\'heure de début et l\'heure de fin.');
      return;
    }

    const newStartAt = new Date(`${editDate}T${editStartTime}:00`);
    const newEndAt = new Date(`${editDate}T${editEndTime}:00`);

    if (newEndAt <= newStartAt) {
      setEditError('L\'heure de fin doit être postérieure à l\'heure de début.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api<{ booking: RoomBookingItem }>(`/rooms/bookings/${currentBooking.id}/reschedule`, {
        method: 'PATCH',
        body: {
          startAt: newStartAt.toISOString(),
          endAt: newEndAt.toISOString(),
          attendees: editAttendees,
          rescheduleReason: editReason || undefined,
        },
      });

      setCurrentBooking(res.booking);
      setIsEditing(false);
      setSaveSuccessMsg('Créneau reprogrammé avec succès ! Un e-mail d\'information a été automatiquement expédié au demandeur.');
      if (onReschedule) {
        onReschedule(res.booking);
      }
    } catch (err: any) {
      setEditError(err.message || 'Impossible de décaler la réservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du modal compact */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="size-8.5 rounded-xl bg-[#FF5B37] text-white flex items-center justify-center shadow-xs">
              <Building2 className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="room-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Détail de la réservation
                </h2>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copier la référence"
                >
                  <span>{currentBooking.reference}</span>
                  {copied ? <Check className="size-2.5 text-emerald-400" /> : <Copy className="size-2.5 opacity-60" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Salle de formation & masterclass IML Digit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              title="Imprimer cette fiche de réservation"
              className="size-7.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fermer"
              className="size-7.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Bannière de feedback si action réussie */}
        {saveSuccessMsg && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Corps défilable compact */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 text-slate-800 bg-[#FAF9F5]">
          {/* Statut & Notification client */}
          <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Statut :</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                    isPending
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : isConfirmed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isPending && <Clock className="size-3 text-amber-600 animate-spin" />}
                  {isConfirmed && <CheckCircle2 className="size-3 text-emerald-600" />}
                  <span>
                    {isPending ? 'En attente de validation' : isConfirmed ? 'Confirmée & Salle Verrouillée' : 'Demande Refusée'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Canal :</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 inline-flex items-center gap-1">
                  {currentBooking.source === 'ASSISTANT' ? (
                    <>
                      <Bot className="size-3 text-purple-600" />
                      <span>Assistant IA Virtuel</span>
                    </>
                  ) : (
                    <>
                      <Globe className="size-3 text-blue-600" />
                      <span>Formulaire Web Public</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Note d'information sur la notification automatique du client */}
            <div className="text-[11.5px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-start gap-2">
              <Mail className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Notification automatique du client :</strong> Dès que vous validez ou déplacez le créneau, un e-mail officiel est immédiatement expédié à <span className="font-mono font-semibold text-slate-900">{currentBooking.email}</span> avec le récapitulatif officiel, les horaires, les équipements et le lieu exact (Awendjé, Libreville).
              </div>
            </div>
          </div>

          {/* Section 1 : Informations de l'organisateur */}
          <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="size-3 text-[#FF5B37]" />
                <span>Organisateur & Coordonnées</span>
              </h3>
              {currentBooking.organization && (
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5B37] text-[10px] font-bold border border-orange-100">
                  {currentBooking.organization}
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Nom complet</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{currentBooking.organizerName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Structure / Entreprise</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                  {currentBooking.organization || 'Particulier / Professionnel'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Téléphone & WhatsApp</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <a
                    href={`tel:${currentBooking.phone}`}
                    className="font-bold text-xs text-slate-900 hover:text-[#FF5B37] flex items-center gap-1"
                  >
                    <Phone className="size-3 text-slate-400" />
                    <span>{currentBooking.phone}</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                    title="Notifier sur WhatsApp"
                  >
                    <MessageSquare className="size-2.5 text-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Adresse e-mail</span>
                <a
                  href={`mailto:${currentBooking.email}?subject=${encodeURIComponent(`Confirmation réservation salle IML Digit - ${currentBooking.reference}`)}`}
                  className="font-bold text-xs text-slate-900 hover:text-[#FF5B37] flex items-center gap-1 mt-0.5 truncate"
                >
                  <Mail className="size-3 text-slate-400 shrink-0" />
                  <span className="truncate">{currentBooking.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section 2 : Planning & Créneau horaire (+ Mode Décaler / Modifier) */}
          {/* Section 2 : Planning & Créneau horaire (+ Mode Décaler / Modifier) */}
          <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="size-3 text-[#FF5B37]" />
                <span>Planning & Réservation du créneau</span>
              </h3>
              
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer hover:text-[#FF5B37]"
                  title="En cas d'imprévu, décaler la date ou modifier les horaires"
                >
                  <CalendarClock className="size-3 text-[#FF5B37]" />
                  <span>Décaler la date</span>
                </button>
              )}
            </div>

            {/* Formulaire interactif de report / modification */}
            {isEditing ? (
              <form onSubmit={handleSaveReschedule} className="p-3 rounded-lg bg-orange-50/50 border border-orange-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-orange-950">
                    <CalendarClock className="size-3.5 text-[#FF5B37]" />
                    <span>Reprogrammer ce créneau</span>
                  </div>
                  <span className="text-[10px] text-orange-700 font-medium">Contrôle de disponibilité</span>
                </div>

                {editError && (
                  <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0 text-red-600" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Nouvelle date
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#FF5B37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#FF5B37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#FF5B37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Participants
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={editAttendees}
                      onChange={(e) => setEditAttendees(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#FF5B37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Motif du report
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Demande client, réaménagement..."
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-[#FF5B37] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditError(null);
                    }}
                    className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1 rounded-md bg-[#FF5B37] hover:bg-[#e94d29] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CalendarClock className="size-3" />
                    <span>{isSubmitting ? 'Enregistrement...' : 'Valider le décalage'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                  <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Date</span>
                  <span className="text-xs font-bold text-slate-900 capitalize block mt-0.5">
                    {fullDateStr}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                  <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Créneau</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {startTimeStr} à {endTimeStr} ({durationHours}h)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                  <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Effectif</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {currentBooking.attendees} pers. (max 25)
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-0.5 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Type :</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#FF5B37] font-bold border border-orange-100 uppercase text-[10px] flex items-center gap-1">
                <Presentation className="size-2.5" />
                <span>{currentBooking.eventType}</span>
              </span>
            </div>
          </div>

          {/* Section 4 : Notes et besoins particuliers */}
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
              <MessageSquare className="size-3 text-[#FF5B37]" />
              <span>Consignes & Remarques</span>
            </h3>
            {currentBooking.notes ? (
              <p className="text-xs text-slate-800 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200 italic">
                « {currentBooking.notes} »
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Aucune note particulière renseignée par le demandeur.</p>
            )}
            {currentBooking.decisionNote && (
              <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                {currentBooking.decisionNote}
              </p>
            )}
          </div>
        </div>

        {/* Footer des actions */}
        <div className="px-4 py-2.5 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette réservation de salle ?")) {
                    onDelete(currentBooking.id);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Supprimer définitivement la réservation"
              >
                <Trash2 className="size-3.5 text-rose-600" />
                <span>Supprimer la réservation</span>
              </button>
            )}
            {currentBooking.createdAt && (
              <span className="text-[10px] text-slate-400">Demande du {new Date(currentBooking.createdAt).toLocaleDateString('fr-FR')}</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('REFUSEE')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAction('CONFIRMEE')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Confirmer la salle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

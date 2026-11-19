import { api } from '../../lib/api';

export const ROOM_CAPACITY = 20;
export const ROOM_OPEN_HOUR = 8;
export const ROOM_CLOSE_HOUR = 18;

export const EVENT_TYPES = [
  { value: 'MASTERCLASS', label: 'Masterclass' },
  { value: 'FORMATION', label: 'Formation' },
  { value: 'ATELIER', label: 'Atelier / Workshop' },
  { value: 'REUNION', label: 'Réunion / Séminaire' },
  { value: 'AUTRE', label: 'Autre événement' },
] as const;

export const EQUIPMENTS = [
  'Écran de projection / vidéoprojecteur',
  'Visioconférence HD',
  'Wifi fibre haut débit',
  'Climatisation',
  'Paperboard & tableau',
  `Jusqu'à ${ROOM_CAPACITY} participants`,
];

export interface BusySlot { startAt: string; endAt: string }

export interface BookingPayload {
  organizerName: string;
  organization?: string;
  email: string;
  phone: string;
  eventType: string;
  attendees: number;
  startAt: string;
  endAt: string;
  notes?: string;
  source: 'FORMULAIRE' | 'ASSISTANT';
}

export interface BookingResult { booking: { id: string; reference: string } }

/** Heure locale de Libreville (UTC+1) -> ISO. */
export const toIso = (date: string, time: string) => `${date}T${time}:00+01:00`;

export const fetchAvailability = (date: string) =>
  api<{ date: string; busy: BusySlot[] }>(`/rooms/public/availability?date=${date}`);

export const submitBooking = (payload: BookingPayload) =>
  api<BookingResult>('/rooms/public/bookings', { method: 'POST', body: payload });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Libreville' });

export const todayStr = () => new Date().toISOString().slice(0, 10);

/** Vrai si [start,end] chevauche un créneau occupé. */
export function overlapsBusy(busy: BusySlot[], date: string, start: string, end: string): boolean {
  const s = new Date(toIso(date, start)).getTime();
  const e = new Date(toIso(date, end)).getTime();
  return busy.some((b) => new Date(b.startAt).getTime() < e && new Date(b.endAt).getTime() > s);
}

// ============ Grille Tarifaire Officielle (Location Payante) ============
export const ROOM_PRICING = [
  {
    title: 'Tarif Horaire',
    price: '25 000 FCFA',
    period: '/ heure',
    condition: 'Minimum 2 heures',
    desc: 'Réunions d\'équipe, entretiens de recrutement, séances de travail ponctuelles',
    badge: null,
  },
  {
    title: 'Forfait Demi-Journée',
    price: '75 000 FCFA',
    period: '/ 4 heures',
    condition: '08h00 - 12h00 ou 14h00 - 18h00',
    desc: 'Idéal pour masterclasses, ateliers pratiques, workshops et formations courtes',
    badge: 'Formule Populaire',
  },
  {
    title: 'Forfait Journée Complète',
    price: '130 000 FCFA',
    period: '/ journée (8 heures)',
    condition: '08h00 - 17h00 ou 09h00 - 18h00',
    desc: 'Séminaires d\'entreprise, conventions, sessions de formation intensive',
    badge: 'Économique',
  },
] as const;

export function estimatePrice(start: string, end: string): { amount: string; detail: string } {
  if (!start || !end || end <= start) return { amount: 'À calculer', detail: 'Sélectionnez vos horaires' };
  const sH = parseInt(start.split(':')[0], 10);
  const sM = parseInt(start.split(':')[1] || '0', 10);
  const eH = parseInt(end.split(':')[0], 10);
  const eM = parseInt(end.split(':')[1] || '0', 10);

  const durationHours = (eH * 60 + eM - (sH * 60 + sM)) / 60;
  if (durationHours <= 0) return { amount: 'Invalide', detail: 'Heure de fin antérieure' };

  if (durationHours <= 2) {
    return {
      amount: '50 000 FCFA',
      detail: 'Tarif horaire (minimum légal de 2h facturées)',
    };
  }
  if (durationHours <= 3) {
    return {
      amount: '75 000 FCFA',
      detail: '3 heures facturées (25 000 FCFA / h)',
    };
  }
  if (durationHours <= 4) {
    return {
      amount: '75 000 FCFA',
      detail: 'Forfait Demi-Journée (4 heures incluses)',
    };
  }
  if (durationHours <= 6) {
    return {
      amount: '110 000 FCFA',
      detail: 'Forfait 6 heures',
    };
  }
  if (durationHours <= 8) {
    return {
      amount: '130 000 FCFA',
      detail: 'Forfait Journée Complète (8 heures incluses)',
    };
  }
  const extraHours = Math.ceil(durationHours - 8);
  const total = 130000 + extraHours * 20000;
  return {
    amount: `${total.toLocaleString('fr-FR')} FCFA`,
    detail: `Journée complète (130 000 FCFA) + ${extraHours}h sup.`,
  };
}

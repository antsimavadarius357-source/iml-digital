import { z } from 'zod';

export const ROOM_EVENT_TYPES = ['MASTERCLASS', 'FORMATION', 'ATELIER', 'REUNION', 'AUTRE'] as const;
export const ROOM_CAPACITY = 20;
/** Horaires d'ouverture de la salle (heure locale de Libreville, UTC+1). */
export const ROOM_OPEN_HOUR = 8;
export const ROOM_CLOSE_HOUR = 18;

export const createRoomBookingSchema = z
  .object({
    organizerName: z.string().trim().min(2).max(120),
    organization: z.string().trim().max(160).optional().or(z.literal('')),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(6).max(30),
    eventType: z.enum(ROOM_EVENT_TYPES),
    attendees: z.coerce.number().int().min(1).max(ROOM_CAPACITY),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
    source: z.enum(['FORMULAIRE', 'ASSISTANT']).default('FORMULAIRE'),
  })
  .refine((v) => v.endAt > v.startAt, { message: 'L\'heure de fin doit suivre l\'heure de début', path: ['endAt'] })
  .refine((v) => v.endAt.getTime() - v.startAt.getTime() <= 12 * 3600_000, {
    message: 'La durée maximale est de 12 heures',
    path: ['endAt'],
  })
  .refine((v) => v.startAt.getTime() > Date.now(), { message: 'La date doit être dans le futur', path: ['startAt'] });

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
});

export const listRoomBookingsSchema = z.object({
  status: z.enum(['EN_ATTENTE', 'CONFIRMEE', 'REFUSEE', 'ANNULEE']).optional(),
});

export const decideRoomBookingSchema = z.object({
  status: z.enum(['CONFIRMEE', 'REFUSEE', 'ANNULEE']),
  decisionNote: z.string().trim().max(500).optional(),
});

export const updateRoomBookingSchema = z
  .object({
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    attendees: z.coerce.number().int().min(1).max(ROOM_CAPACITY).optional(),
    eventType: z.enum(ROOM_EVENT_TYPES).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    rescheduleReason: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => {
      if (v.startAt && v.endAt) {
        return v.endAt > v.startAt;
      }
      return true;
    },
    { message: "L'heure de fin doit suivre l'heure de début", path: ['endAt'] }
  );

export const idParam = z.string().uuid();

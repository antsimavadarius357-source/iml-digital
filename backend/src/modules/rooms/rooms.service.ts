import { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import type { AuthContext } from '../../middleware/auth';
import type { createRoomBookingSchema, decideRoomBookingSchema, listRoomBookingsSchema, updateRoomBookingSchema } from './rooms.schemas';
import { sendRoomBookingNotificationEmail, sendRoomBookingAdminAlertEmail } from '../email/email.service';

const VISIO_HINT = /visio|meet|zoom|teams|http/i;
const db = prisma as any;

export interface BusySlot {
  startAt: Date;
  endAt: Date;
  kind: 'LOCATION' | 'SEANCE';
}

/** Créneaux où la salle physique est indisponible (locations confirmées + séances en présentiel). */
export async function getBusySlots(from: Date, to: Date, excludeId?: string): Promise<BusySlot[]> {
  const [bookings, appointments] = await Promise.all([
    db.roomBooking.findMany({
      where: {
        status: 'CONFIRMEE',
        startAt: { lt: to },
        endAt: { gt: from },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
    prisma.appointment.findMany({
      where: {
        status: 'PLANIFIE',
        datetime: { gte: new Date(from.getTime() - 12 * 3600_000), lt: to },
      },
      select: { datetime: true, duration: true, location: true },
    }),
  ]);

  const slots: BusySlot[] = bookings.map((b: any) => ({ startAt: b.startAt, endAt: b.endAt, kind: 'LOCATION' as const }));
  for (const a of appointments) {
    if (a.location && VISIO_HINT.test(a.location)) continue; // visioconférence : la salle reste libre
    const endAt = new Date(a.datetime.getTime() + a.duration * 60_000);
    if (endAt > from && a.datetime < to) slots.push({ startAt: a.datetime, endAt, kind: 'SEANCE' });
  }
  return slots.sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
}

/** Disponibilité publique d'une journée : ne divulgue aucune donnée personnelle. */
export async function getDayAvailability(date: string) {
  // Journée locale Libreville (UTC+1) -> bornes UTC
  const from = new Date(`${date}T00:00:00+01:00`);
  if (Number.isNaN(from.getTime())) throw new AppError(400, 'Date invalide', 'DATE_INVALIDE');
  const to = new Date(from.getTime() + 24 * 3600_000);
  const busy = await getBusySlots(from, to);
  return { date, busy: busy.map((b) => ({ startAt: b.startAt, endAt: b.endAt })) };
}

function makeReference(): string {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SAL-${y}-${rand}`;
}

export async function createRoomBooking(input: z.infer<typeof createRoomBookingSchema>) {
  const busy = await getBusySlots(input.startAt, input.endAt);
  if (busy.length > 0) {
    throw new AppError(409, 'Ce créneau n\'est plus disponible. Merci d\'en choisir un autre.', 'CRENEAU_INDISPONIBLE');
  }
  const booking = await db.roomBooking.create({
    data: {
      reference: makeReference(),
      organizerName: input.organizerName,
      organization: input.organization || null,
      email: input.email.toLowerCase(),
      phone: input.phone,
      eventType: input.eventType,
      attendees: input.attendees,
      startAt: input.startAt,
      endAt: input.endAt,
      notes: input.notes || null,
      source: input.source,
    },
    select: {
      id: true,
      reference: true,
      startAt: true,
      endAt: true,
      status: true,
      organizerName: true,
      organization: true,
      email: true,
      phone: true,
      eventType: true,
      attendees: true,
      notes: true,
      source: true,
    },
  });

  // 1. Traçabilité complète pour la Direction (AuditLog)
  await prisma.auditLog.create({
    data: {
      action: 'room_booking.created',
      entityType: 'RoomBooking',
      entityId: booking.id,
      metadata: {
        reference: booking.reference,
        organizerName: booking.organizerName,
        organization: booking.organization,
        phone: booking.phone,
        email: booking.email,
        eventType: booking.eventType,
        attendees: booking.attendees,
        startAt: booking.startAt,
        endAt: booking.endAt,
        source: booking.source,
      },
    },
  }).catch((e: any) => console.error('Erreur auditLog room_booking:', e));

  // 2. Notification e-mail immédiate à la Direction
  sendRoomBookingAdminAlertEmail({
    booking,
  }).catch((e: any) => console.error('Erreur alerte direction room_booking:', e));

  return booking;
}

export async function listRoomBookings(query: z.infer<typeof listRoomBookingsSchema>) {
  return db.roomBooking.findMany({
    where: query.status ? { status: query.status } : {},
    orderBy: [{ status: 'asc' }, { startAt: 'asc' }],
  });
}

export async function decideRoomBooking(id: string, input: z.infer<typeof decideRoomBookingSchema>, auth: AuthContext) {
  const booking = await db.roomBooking.findUnique({ where: { id } });
  if (!booking) throw new AppError(404, 'Demande introuvable', 'INTROUVABLE');

  if (input.status === 'CONFIRMEE') {
    const busy = await getBusySlots(booking.startAt, booking.endAt, booking.id);
    if (busy.length > 0) {
      throw new AppError(409, 'Conflit : la salle est déjà occupée sur ce créneau.', 'CRENEAU_INDISPONIBLE');
    }
  }

  const data: Prisma.RoomBookingUpdateInput = {
    status: input.status,
    decisionNote: input.decisionNote || null,
    decidedById: auth.userId,
    decidedAt: new Date(),
  };
  const updated = await db.roomBooking.update({ where: { id }, data });

  // Envoi automatique d'email officiel au demandeur
  if (input.status === 'CONFIRMEE' || input.status === 'REFUSEE') {
    sendRoomBookingNotificationEmail({
      recipientEmail: booking.email,
      recipientName: booking.organizerName,
      organization: booking.organization,
      reference: booking.reference,
      action: input.status === 'CONFIRMEE' ? 'CONFIRMED' : 'REJECTED',
      startAt: booking.startAt,
      endAt: booking.endAt,
      eventType: booking.eventType,
      attendees: booking.attendees,
      notes: booking.notes,
      reason: input.decisionNote || undefined,
    }).catch((err) => console.error('[EMAIL NOTIF SALLE ÉCHEC]', err));
  }

  return updated;
}

/**
 * Modifie ou décale une réservation de salle (dates, horaires, effectif, notes).
 * Vérifie l'absence de conflit et prévient le demandeur en cas de report.
 */
export async function updateRoomBooking(id: string, input: z.infer<typeof updateRoomBookingSchema>, auth: AuthContext) {
  const booking = await db.roomBooking.findUnique({ where: { id } });
  if (!booking) throw new AppError(404, 'Demande introuvable', 'INTROUVABLE');

  const newStartAt = input.startAt ?? booking.startAt;
  const newEndAt = input.endAt ?? booking.endAt;

  if (newEndAt <= newStartAt) {
    throw new AppError(400, 'L\'heure de fin doit suivre l\'heure de début.', 'HORAIRES_INVALIDES');
  }

  const isScheduleChanged =
    newStartAt.getTime() !== new Date(booking.startAt).getTime() ||
    newEndAt.getTime() !== new Date(booking.endAt).getTime();

  // Si le créneau change et que la réservation est confirmée, vérifier les conflits
  if (isScheduleChanged && booking.status === 'CONFIRMEE') {
    const busy = await getBusySlots(newStartAt, newEndAt, booking.id);
    if (busy.length > 0) {
      throw new AppError(409, 'Conflit : la salle est déjà occupée sur ce nouveau créneau.', 'CRENEAU_INDISPONIBLE');
    }
  }

  const data: Prisma.RoomBookingUpdateInput = {
    startAt: newStartAt,
    endAt: newEndAt,
    attendees: input.attendees ?? booking.attendees,
    eventType: input.eventType ?? booking.eventType,
    notes: input.notes !== undefined ? input.notes : booking.notes,
    decisionNote: input.rescheduleReason ? `[Décalé]: ${input.rescheduleReason}` : booking.decisionNote,
  };

  const updated = await db.roomBooking.update({ where: { id }, data });

  // Si la date/heure a changé, notifier le demandeur du report
  if (isScheduleChanged) {
    sendRoomBookingNotificationEmail({
      recipientEmail: updated.email,
      recipientName: updated.organizerName,
      organization: updated.organization,
      reference: updated.reference,
      action: 'RESCHEDULED',
      startAt: updated.startAt,
      endAt: updated.endAt,
      eventType: updated.eventType,
      attendees: updated.attendees,
      notes: updated.notes,
      reason: input.rescheduleReason || undefined,
    }).catch((err) => console.error('[EMAIL REPORT SALLE ÉCHEC]', err));
  }

  return updated;
}

export async function deleteRoomBooking(id: string, auth: AuthContext, ip?: string) {
  const booking = await db.roomBooking.findUnique({ where: { id } });
  if (!booking) throw new AppError(404, 'Réservation de salle introuvable.', 'NON_TROUVE');

  await db.auditLog.deleteMany({ where: { entityType: 'RoomBooking', entityId: id } }).catch(() => {});
  await db.roomBooking.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'room_booking.deleted',
      entityType: 'RoomBooking',
      entityId: id,
      metadata: { reference: booking.reference, organizerName: booking.organizerName, eventType: booking.eventType },
      ipAddress: ip,
    },
  }).catch(() => {});

  return { success: true };
}

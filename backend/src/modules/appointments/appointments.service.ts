import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createAppointmentSchema, updateAppointmentSchema, createSessionSchema, listAppointmentsSchema } from './appointments.schemas';
import { AppError } from '../../middleware/error';

function scopeWhere(auth: AuthContext): Prisma.AppointmentWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage');
  if (global) return {};
  // Si ce n'est pas global, on ne voit que SES propres RDV
  return { userId: auth.userId };
}

export async function listAppointments(query: z.infer<typeof listAppointmentsSchema>, auth: AuthContext) {
  const where: Prisma.AppointmentWhereInput = {
    AND: [
      scopeWhere(auth),
      query.beneficiaryId ? { beneficiaryId: query.beneficiaryId } : {},
      query.startDate ? { datetime: { gte: query.startDate } } : {},
      query.endDate ? { datetime: { lte: query.endDate } } : {},
    ]
  };

  const items = await prisma.appointment.findMany({
    where,
    orderBy: { datetime: 'asc' },
    include: {
      beneficiary: { select: { id: true, firstName: true, lastName: true } },
      session: true,
    }
  });

  return items;
}

export async function createAppointment(data: z.infer<typeof createAppointmentSchema>, auth: AuthContext) {
  // L'agent crée un RDV pour lui-même, on pourrait aussi permettre de planifier pour un autre
  return prisma.appointment.create({
    data: {
      ...data,
      userId: auth.userId,
    }
  });
}

export async function updateAppointment(id: string, data: z.infer<typeof updateAppointmentSchema>, auth: AuthContext) {
  const rdv = await prisma.appointment.findFirst({ where: { id, ...scopeWhere(auth) } });
  if (!rdv) throw new AppError(404, 'NON_TROUVE', 'RDV introuvable ou accès refusé');

  return prisma.appointment.update({
    where: { id },
    data,
  });
}

export async function submitSession(appointmentId: string, data: z.infer<typeof createSessionSchema>, auth: AuthContext) {
  const rdv = await prisma.appointment.findFirst({ where: { id: appointmentId, ...scopeWhere(auth) }, include: { session: true } });
  if (!rdv) throw new AppError(404, 'NON_TROUVE', 'RDV introuvable ou accès refusé');
  if (rdv.session) throw new AppError(400, 'SESSION_EXISTE', 'Un compte rendu existe déjà pour ce RDV');

  // Met à jour le RDV en REALISE et crée la session
  return prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'REALISE' }
    });

    return tx.serviceSession.create({
      data: {
        appointmentId,
        ...data
      }
    });
  });
}

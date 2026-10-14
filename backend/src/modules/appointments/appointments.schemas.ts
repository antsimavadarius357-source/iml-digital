import { z } from 'zod';

export const APPOINTMENT_STATUSES = ['PLANIFIE', 'REALISE', 'ANNULE', 'ABSENT'] as const;

export const createAppointmentSchema = z.object({
  beneficiaryId: z.string().uuid(),
  datetime: z.coerce.date(),
  duration: z.coerce.number().int().min(15).max(480), // in minutes
  location: z.string().trim().max(255).optional(),
});

export const updateAppointmentSchema = z.object({
  datetime: z.coerce.date().optional(),
  duration: z.coerce.number().int().min(15).max(480).optional(),
  location: z.string().trim().max(255).optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

export const createSessionSchema = z.object({
  durationHours: z.coerce.number().min(0.25).max(12),
  summary: z.string().trim().min(5),
  nextActions: z.string().trim().optional(),
});

export const listAppointmentsSchema = z.object({
  beneficiaryId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const idParam = z.string().uuid();

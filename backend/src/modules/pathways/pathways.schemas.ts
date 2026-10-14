import { z } from 'zod';

export const PATHWAY_STATUSES = ['EN_ATTENTE', 'ACTIF', 'EN_PAUSE', 'TERMINE', 'ABANDONNE'] as const;
export const STEP_STATUSES = ['A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE'] as const;

export const createPathwaySchema = z.object({
  beneficiaryId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const updatePathwaySchema = z.object({
  status: z.enum(PATHWAY_STATUSES).optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
});

export const updateStepSchema = z.object({
  status: z.enum(STEP_STATUSES).optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const idParam = z.string().uuid();

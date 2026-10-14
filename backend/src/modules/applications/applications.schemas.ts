import { z } from 'zod';

export const APPLICATION_STATUSES = ['BROUILLON', 'SOUMISE', 'EN_COURS_EXAMEN', 'ACCEPTEE', 'REFUSEE'] as const;

export const createApplicationSchema = z.object({
  applicantData: z.record(z.any()),
  projectData: z.record(z.any()),
});

export const updateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  evaluationNotes: z.string().trim().max(5000).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
});

export const listApplicationsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.string().uuid();

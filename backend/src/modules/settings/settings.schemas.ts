import { z } from 'zod';

export const createSectorSchema = z.object({
  name: z.string().min(2),
});

export const createProgramSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

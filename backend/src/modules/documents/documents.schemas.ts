import { z } from 'zod';

export const documentUploadSchema = z.object({
  title: z.string().min(2),
  category: z.string(),
  ownerId: z.string().uuid(),
  ownerType: z.enum(['BENEFICIARY', 'PROJECT']),
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']).optional()
});

export const documentStatusSchema = z.object({
  status: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE']),
});

export const idParam = z.string().uuid();

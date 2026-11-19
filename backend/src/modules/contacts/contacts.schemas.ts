import { z } from 'zod';

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères').max(120),
  email: z.string().trim().email('Adresse email invalide').max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().min(2, 'L\'objet de la demande est requis').max(200),
  message: z.string().trim().min(5, 'Le message doit comporter au moins 5 caractères').max(5000),
});

export const listContactMessagesSchema = z.object({
  status: z.enum(['NOUVEAU', 'EN_COURS', 'TRAITE', 'ARCHIVE']).optional(),
  search: z.string().trim().optional(),
});

export const updateContactMessageSchema = z.object({
  status: z.enum(['NOUVEAU', 'EN_COURS', 'TRAITE', 'ARCHIVE']).optional(),
  replyNote: z.string().trim().max(2000).optional(),
});

import argon2 from 'argon2';
import { z } from 'zod';
import { ROLE_CODES } from '../../config/permissions';

export const passwordSchema = z
  .string()
  .min(12, 'Au moins 12 caractères')
  .max(128)
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

export const hashPassword = (p: string): Promise<string> => argon2.hash(p, { type: argon2.argon2id });

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(254),
  firstName: z.string().trim().min(1, 'Prénom requis').max(100),
  lastName: z.string().trim().min(1, 'Nom requis').max(100),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(ROLE_CODES),
  temporaryPassword: passwordSchema,
});

export const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).nullable(),
    role: z.enum(ROLE_CODES),
    isActive: z.boolean(),
  })
  .partial();

export const resetPasswordSchema = z.object({ temporaryPassword: passwordSchema });

export const listUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

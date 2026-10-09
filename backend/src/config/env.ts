import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requis'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL requis'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET doit contenir au moins 32 caractères'),
  STORAGE_DIR: z.string().default('./storage'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // On n'affiche que les noms des variables invalides, jamais leurs valeurs.
  const details = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Configuration invalide :\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

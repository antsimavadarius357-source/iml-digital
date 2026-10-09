import 'dotenv/config';
import argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../src/database/prisma';

// Usage (PowerShell) :
//   $env:ADMIN_EMAIL="admin@exemple.ga"; $env:ADMIN_PASSWORD="<mot de passe fort>"; npm run create-admin
// Le mot de passe n'est jamais écrit sur disque ni affiché.
const input = z
  .object({
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD: z.string().min(12, 'Au moins 12 caractères'),
    ADMIN_FIRST_NAME: z.string().default('Administrateur'),
    ADMIN_LAST_NAME: z.string().default('IML'),
  })
  .parse(process.env);

async function main(): Promise<void> {
  const role = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (!role) throw new Error("Rôles absents : exécutez d'abord `npm run prisma:seed`.");

  const email = input.ADMIN_EMAIL.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new Error('Un utilisateur avec cet e-mail existe déjà.');
  }
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await argon2.hash(input.ADMIN_PASSWORD, { type: argon2.argon2id }),
      firstName: input.ADMIN_FIRST_NAME,
      lastName: input.ADMIN_LAST_NAME,
      roleId: role.id,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.auditLog.create({ data: { userId: user.id, action: 'user.admin_created' } });
  console.log(`Administrateur créé : ${email}`);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

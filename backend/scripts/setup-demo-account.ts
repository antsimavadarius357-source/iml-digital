import 'dotenv/config';
import argon2 from 'argon2';
import { prisma } from '../src/database/prisma';

async function main() {
  // Récupérer le rôle ADMIN ou AGENT
  let roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  let roleAgent = await prisma.role.findUnique({ where: { code: 'AGENT' } });

  if (!roleAdmin) {
    roleAdmin = await prisma.role.create({ data: { code: 'ADMIN', label: 'Administrateur technique' } });
  }
  if (!roleAgent) {
    roleAgent = await prisma.role.create({ data: { code: 'AGENT', label: "Agent d'accompagnement" } });
  }

  // Mot de passe sécurisé : ImlDigit2026!
  const passwordHash = await argon2.hash('ImlDigit2026!', { type: argon2.argon2id });

  // 1. Compte Agent
  const agentEmail = 'agent@imldigit.com';
  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      emailVerifiedAt: new Date(),
      roleId: roleAgent.id,
    },
    create: {
      email: agentEmail,
      passwordHash,
      firstName: 'Alexandre',
      lastName: 'Agent IML',
      isActive: true,
      mustChangePassword: false,
      emailVerifiedAt: new Date(),
      roleId: roleAgent.id,
    },
  });

  // 2. Compte Admin / Direction
  const adminEmail = 'admin@imldigit.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      emailVerifiedAt: new Date(),
      roleId: roleAdmin.id,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Directeur',
      lastName: 'IML Digit',
      isActive: true,
      mustChangePassword: false,
      emailVerifiedAt: new Date(),
      roleId: roleAdmin.id,
    },
  });

  console.log('Comptes de test configurés avec succès :');
  console.log(`- Agent : ${agent.email} / Mot de passe : ImlDigit2026!`);
  console.log(`- Admin : ${admin.email} / Mot de passe : ImlDigit2026!`);
}

main()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

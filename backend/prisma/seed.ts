import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seed de PRODUCTION : uniquement les rôles. Aucune donnée fictive, aucun compte par défaut.
// Le premier administrateur est créé par `npm run create-admin` (phase 3).
const ROLES = [
  { code: 'ADMIN', label: 'Administrateur technique' },
  { code: 'DIRECTION', label: "Direction de l'IML" },
  { code: 'AGENT', label: "Agent d'accompagnement" },
  { code: 'COACH', label: 'Coach, mentor ou expert' },
  { code: 'FORMATEUR', label: 'Formateur' },
  { code: 'BENEFICIAIRE', label: 'Bénéficiaire' },
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({ where: { code: role.code }, update: { label: role.label }, create: role });
  }
  console.log(`${ROLES.length} rôles synchronisés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

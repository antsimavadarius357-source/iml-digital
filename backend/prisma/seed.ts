import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seed de PRODUCTION : uniquement les rôles. Aucune donnée fictive, aucun compte par défaut.
// Le premier administrateur est créé par `npm run create-admin` (phase 3).
const ROLES = [
  { code: 'ADMIN', label: 'Administrateur technique' },
  { code: 'DIRECTION', label: "Direction de l'IML" },
  { code: 'AGENT', label: "Chargé de dossier IML" },
  { code: 'COACH', label: "Coach / Mentor" },
  { code: 'FORMATEUR', label: 'Formateur' },
  { code: 'BENEFICIAIRE', label: 'Bénéficiaire' },
];

// Référentiel de départ des secteurs d'activité ; l'administration pourra l'adapter.
const SECTORS = [
  'Agriculture et agroalimentaire', 'Numérique et technologies', 'Commerce et distribution', 'Services aux entreprises',
  'Énergie et environnement', 'Bois et forêt', 'Mines et industrie', 'Santé et bien-être', 'Éducation et formation',
  'Tourisme, hôtellerie et restauration', 'Transport et logistique', 'BTP et immobilier', 'Culture, médias et création',
  'Artisanat et mode', 'Finance et assurance', 'Autre',
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({ where: { code: role.code }, update: { label: role.label }, create: role });
  }
  for (const name of SECTORS) {
    await prisma.sector.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Modèles de parcours types
  const templates = [
    {
      name: "Idéation & Structuration",
      description: "Parcours initial pour structurer l'idée et valider l'opportunité.",
      steps: [
        { title: "Cadrage de l'idée & Objectifs", description: "Clarifier votre idée, identifier vos forces et fixer votre feuille de route.", orderIndex: 1 },
        { title: "Test du marché & Rencontre clients", description: "Aller sur le terrain pour vérifier l'intérêt des clients et leurs besoins réels.", orderIndex: 2 },
        { title: "Modèle de vente & Rentabilité", description: "Construire vos offres, fixer vos prix et organiser vos futures ventes.", orderIndex: 3 },
        { title: "Présentation finale & Lancement", description: "Présenter votre projet devant l'équipe d'accompagnement et démarrer l'activité.", orderIndex: 4 },
      ]
    },
    {
      name: "Accélération & Lancement",
      description: "Parcours pour les projets ayant déjà un MVP.",
      steps: [
        { title: "Stratégie Go-To-Market", description: "Plan d'action commercial", orderIndex: 1 },
        { title: "Structuration Juridique", description: "Création d'entreprise et pacte d'associés", orderIndex: 2 },
        { title: "Préparation Levée de fonds", description: "Business Plan financier", orderIndex: 3 },
      ]
    }
  ];

  for (const tpl of templates) {
    const existing = await prisma.pathwayTemplate.findUnique({ where: { name: tpl.name } });
    if (!existing) {
      await prisma.pathwayTemplate.create({
        data: {
          name: tpl.name,
          description: tpl.description,
          steps: {
            create: tpl.steps
          }
        }
      });
    }
  }

  // Comptes internes par défaut pour permettre la connexion immédiate en ligne
  const defaultUsers = [
    {
      email: 'directeur@imldigit.com',
      firstName: 'Alain',
      lastName: 'Directeur Général',
      roleCode: 'DIRECTION',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$FvpjRRQWpktsuoHmoQ5H6A$nVop9hKYIp9IdfYzlR42oIF2EYqHaqIcF3A9frskweo',
    },
    {
      email: 'agent@imldigit.com',
      firstName: 'Alexandre',
      lastName: 'MBA',
      roleCode: 'AGENT',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$BYSL8NjnxC3CZNEjShKdFg$lzBGCWxgXWjjRtQWQMUOGiJu2ZqEPYIePZMaNW6p3X0',
    },
    {
      email: 'coach@imldigit.com',
      firstName: 'Darius',
      lastName: 'NZÉ',
      roleCode: 'COACH',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$BYSL8NjnxC3CZNEjShKdFg$lzBGCWxgXWjjRtQWQMUOGiJu2ZqEPYIePZMaNW6p3X0',
    },
    {
      email: 'marcella.biyoghe@imldigit.com',
      firstName: 'Marcella',
      lastName: 'BIYOGHE',
      roleCode: 'COACH',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$QvIo82XqOSRulPmymnLLUQ$7KnIAxh7VAilWHqGSAvsOpuT7HCwGxizeOdV60aKPRY',
    },
    {
      email: 'patrick.obiang@imldigit.com',
      firstName: 'Patrick',
      lastName: 'OBIANG',
      roleCode: 'COACH',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$QvIo82XqOSRulPmymnLLUQ$7KnIAxh7VAilWHqGSAvsOpuT7HCwGxizeOdV60aKPRY',
    },
    {
      email: 'sarah.ondo@imldigit.com',
      firstName: 'Sarah',
      lastName: 'ONDO',
      roleCode: 'COACH',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$QvIo82XqOSRulPmymnLLUQ$7KnIAxh7VAilWHqGSAvsOpuT7HCwGxizeOdV60aKPRY',
    },
  ];

  for (const u of defaultUsers) {
    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });
    if (role) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          passwordHash: u.passwordHash,
          roleId: role.id,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });
    }
  }

  console.log(`${ROLES.length} rôles, ${SECTORS.length} secteurs, modèles de parcours et comptes par défaut synchronisés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

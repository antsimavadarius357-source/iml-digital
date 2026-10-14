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
        { title: "Diagnostic 360", description: "Évaluation initiale du profil et de l'idée", orderIndex: 1 },
        { title: "Validation du besoin", description: "Analyse du marché et des cibles", orderIndex: 2 },
        { title: "Business Model Canvas", description: "Modélisation économique", orderIndex: 3 },
        { title: "Comité d'évaluation", description: "Pitch de pré-validation", orderIndex: 4 },
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

  console.log(`${ROLES.length} rôles, ${SECTORS.length} secteurs, et modèles de parcours synchronisés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

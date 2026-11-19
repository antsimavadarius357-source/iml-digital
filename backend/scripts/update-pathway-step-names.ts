import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RENAMED_STEPS: Record<string, { newTitle: string; newDesc: string }> = {
  'Diagnostic 360': {
    newTitle: "Cadrage de l'idée & Objectifs",
    newDesc: "Clarifier votre idée, identifier vos forces et fixer votre feuille de route."
  },
  'Validation du besoin': {
    newTitle: "Test du marché & Rencontre clients",
    newDesc: "Aller sur le terrain pour vérifier l'intérêt des clients et leurs besoins réels."
  },
  'Business Model Canvas': {
    newTitle: "Modèle de vente & Rentabilité",
    newDesc: "Construire vos offres, fixer vos prix et organiser vos futures ventes."
  },
  "Comité d'évaluation": {
    newTitle: "Présentation finale & Lancement",
    newDesc: "Présenter votre projet devant l'équipe d'accompagnement et démarrer l'activité."
  }
};

async function run() {
  console.log('--- Mise à jour des étapes de parcours vers des intitulés accessibles ---');

  // 1. Mettre à jour les modèles de parcours (PathwayTemplateStep)
  for (const [oldTitle, { newTitle, newDesc }] of Object.entries(RENAMED_STEPS)) {
    const updatedTemplateSteps = await prisma.pathwayTemplateStep.updateMany({
      where: { title: oldTitle },
      data: {
        title: newTitle,
        description: newDesc
      }
    });
    console.log(`Modèle de parcours : "${oldTitle}" -> "${newTitle}" (${updatedTemplateSteps.count} modifiés)`);
  }

  // 2. Mettre à jour les étapes actives des bénéficiaires (PathwayStep)
  for (const [oldTitle, { newTitle, newDesc }] of Object.entries(RENAMED_STEPS)) {
    const updatedSteps = await prisma.pathwayStep.updateMany({
      where: { title: oldTitle },
      data: {
        title: newTitle,
        description: newDesc
      }
    });
    console.log(`Étapes bénéficiaires réelles : "${oldTitle}" -> "${newTitle}" (${updatedSteps.count} modifiés)`);
  }

  // Affichage de contrôle
  const allCurrentSteps = await prisma.pathwayStep.findMany({
    select: { id: true, title: true, description: true, orderIndex: true }
  });
  console.log('\n--- Étapes actuelles en base de données ---');
  console.log(JSON.stringify(allCurrentSteps, null, 2));

  const allTplSteps = await prisma.pathwayTemplateStep.findMany({
    select: { id: true, title: true, description: true, orderIndex: true }
  });
  console.log('\n--- Étapes de modèle (templates) en base ---');
  console.log(JSON.stringify(allTplSteps, null, 2));
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

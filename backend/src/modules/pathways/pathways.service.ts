import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createPathwaySchema, updatePathwaySchema, updateStepSchema } from './pathways.schemas';
import { AppError } from '../../middleware/error';

function scopeWhere(auth: AuthContext): Prisma.PathwayWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage');
  if (global) return {};
  // Si ce n'est pas global, on ne voit que les parcours de NOS dossiers
  return { beneficiary: { assignments: { some: { userId: auth.userId } } } };
}

export async function listPathways(auth: AuthContext) {
  return prisma.pathway.findMany({
    where: scopeWhere(auth),
    include: {
      beneficiary: { select: { id: true, firstName: true, lastName: true } },
      template: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getPathway(id: string, auth: AuthContext) {
  const pathway = await prisma.pathway.findFirst({
    where: { id, ...scopeWhere(auth) },
    include: {
      beneficiary: { select: { id: true, firstName: true, lastName: true } },
      template: true,
      steps: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
  if (!pathway) throw new AppError(404, 'NON_TROUVE', 'Parcours introuvable ou accès refusé');
  return pathway;
}

export async function getTemplates() {
  return prisma.pathwayTemplate.findMany({
    where: { isActive: true },
    include: { steps: { orderBy: { orderIndex: 'asc' } } }
  });
}

export async function createPathway(data: z.infer<typeof createPathwaySchema>, auth: AuthContext) {
  // Vérifier qu'on a le droit sur ce bénéficiaire
  const global = auth.permissions.includes('dashboard:global');
  const ben = await prisma.beneficiary.findFirst({
    where: {
      id: data.beneficiaryId,
      ...(global ? {} : { assignments: { some: { userId: auth.userId } } })
    }
  });
  if (!ben) throw new AppError(403, 'INTERDIT', 'Vous ne gérez pas ce bénéficiaire.');

  const tpl = await prisma.pathwayTemplate.findUnique({
    where: { id: data.templateId },
    include: { steps: true }
  });
  if (!tpl) throw new AppError(404, 'NON_TROUVE', 'Modèle introuvable');

  // Générer les étapes
  const steps = tpl.steps.map(s => ({
    title: s.title,
    description: s.description,
    orderIndex: s.orderIndex,
    isRequired: s.isRequired,
  }));

  return prisma.pathway.create({
    data: {
      beneficiaryId: data.beneficiaryId,
      templateId: data.templateId,
      steps: { create: steps }
    }
  });
}

export async function updatePathway(id: string, data: z.infer<typeof updatePathwaySchema>, auth: AuthContext) {
  await getPathway(id, auth); // Access check
  return prisma.pathway.update({ where: { id }, data });
}

export async function updateStep(stepId: string, data: z.infer<typeof updateStepSchema>, auth: AuthContext) {
  const step = await prisma.pathwayStep.findUnique({
    where: { id: stepId },
    include: { pathway: true }
  });
  if (!step) throw new AppError(404, 'NON_TROUVE', 'Étape introuvable');
  
  // Access check via Pathway
  await getPathway(step.pathwayId, auth);

  // Auto-set progress if needed based on steps completion... pour simplifier on ne le fait pas ici
  return prisma.pathwayStep.update({ where: { id: stepId }, data });
}

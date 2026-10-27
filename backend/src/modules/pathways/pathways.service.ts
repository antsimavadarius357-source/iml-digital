import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createPathwaySchema, updatePathwaySchema, updateStepSchema } from './pathways.schemas';
import { AppError } from '../../middleware/error';

function scopeWhere(auth: AuthContext): Prisma.PathwayWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage') || ['ADMIN', 'DIRECTION'].includes(auth.role);
  if (global) return {};
  if (auth.role === 'AGENT') {
    return {
      beneficiary: {
        OR: [
          { assignedAgentId: auth.userId },
          { assignedAgentId: null },
          { assignments: { some: { userId: auth.userId } } }
        ]
      }
    };
  }
  // Pour un coach, uniquement ses affectations
  return { beneficiary: { assignments: { some: { userId: auth.userId } } } };
}

export async function listPathways(auth: AuthContext) {
  const pathways = await prisma.pathway.findMany({
    where: scopeWhere(auth),
    include: {
      beneficiary: { select: { id: true, firstName: true, lastName: true } },
      template: { select: { id: true, name: true } },
      steps: {
        select: { id: true, status: true, orderIndex: true },
        orderBy: { orderIndex: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return pathways.map(p => {
    const total = p.steps.length;
    const completed = p.steps.filter(s => s.status === 'TERMINE').length;
    const computedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...p,
      progress: computedProgress,
      completedSteps: completed,
      totalSteps: total
    };
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

  const total = pathway.steps.length;
  const completed = pathway.steps.filter(s => s.status === 'TERMINE').length;
  const computedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    ...pathway,
    progress: computedProgress,
    completedSteps: completed,
    totalSteps: total
  };
}

export async function getTemplates() {
  return prisma.pathwayTemplate.findMany({
    where: { isActive: true },
    include: { steps: { orderBy: { orderIndex: 'asc' } } }
  });
}

export async function createPathway(data: z.infer<typeof createPathwaySchema>, auth: AuthContext) {
  // Récupérer le dossier bénéficiaire avec ses relations
  const ben = await prisma.beneficiary.findUnique({
    where: { id: data.beneficiaryId },
    include: { assignments: true, pathway: { include: { steps: true } } }
  });
  if (!ben) throw new AppError(404, 'NON_TROUVE', 'Bénéficiaire introuvable.');

  // Contrôle des droits d'accès
  const isGlobal = 
    ['ADMIN', 'DIRECTION'].includes(auth.role) ||
    auth.permissions.includes('dashboard:global') ||
    auth.permissions.includes('users:manage');

  const isAgentWithAccess = 
    auth.role === 'AGENT' && 
    (!ben.assignedAgentId || ben.assignedAgentId === auth.userId || ben.assignments.some(a => a.userId === auth.userId));

  const isAssignedCoach = ben.assignments.some(a => a.userId === auth.userId);

  if (!isGlobal && !isAgentWithAccess && !isAssignedCoach) {
    throw new AppError(403, 'INTERDIT', 'Vous ne gérez pas ce bénéficiaire.');
  }

  // Si le dossier n'a pas encore de référent et que l'utilisateur est un agent, l'affecter
  if (!ben.assignedAgentId && auth.role === 'AGENT') {
    await prisma.beneficiary.update({
      where: { id: ben.id },
      data: { assignedAgentId: auth.userId, status: 'ACTIF' }
    });
  } else {
    await prisma.beneficiary.update({
      where: { id: ben.id },
      data: { status: 'ACTIF' }
    });
  }

  const tpl = await prisma.pathwayTemplate.findUnique({
    where: { id: data.templateId },
    include: { steps: { orderBy: { orderIndex: 'asc' } } }
  });
  if (!tpl) throw new AppError(404, 'NON_TROUVE', 'Modèle de parcours introuvable');

  // Si le bénéficiaire a déjà un parcours, le supprimer pour le réinitialiser proprement
  if (ben.pathway) {
    await prisma.pathway.delete({ where: { id: ben.pathway.id } });
  }

  // Générer les étapes selon le modèle choisi
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
      status: 'ACTIF',
      steps: { create: steps }
    },
    include: {
      steps: true,
      template: true,
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

  const isCompleted = data.status === 'TERMINE';
  const updatedStep = await prisma.pathwayStep.update({ 
    where: { id: stepId }, 
    data: {
      ...data,
      completedAt: isCompleted ? new Date() : (data.status === 'A_FAIRE' ? null : undefined)
    } 
  });

  // Recalculer et synchroniser automatiquement la progression globale du parcours dans la base
  const allSteps = await prisma.pathwayStep.findMany({
    where: { pathwayId: step.pathwayId }
  });
  const total = allSteps.length;
  const completed = allSteps.filter(s => s.status === 'TERMINE').length;
  const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = completed === total && total > 0;

  await prisma.pathway.update({
    where: { id: step.pathwayId },
    data: {
      progress: newProgress,
      status: isAllDone ? 'TERMINE' : 'ACTIF'
    }
  });

  // Traçabilité & Journal d'Audit immuable
  await prisma.auditLog.create({
    data: {
      userId: auth.userId,
      action: isCompleted ? 'pathway.step_validated' : 'pathway.step_updated',
      entityType: 'PathwayStep',
      entityId: stepId,
      metadata: {
        stepTitle: step.title,
        orderIndex: step.orderIndex,
        newStatus: data.status,
        pathwayId: step.pathwayId,
        beneficiaryId: step.pathway.beneficiaryId
      }
    }
  });

  if (isAllDone) {
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'pathway.completed_100_percent',
        entityType: 'Pathway',
        entityId: step.pathwayId,
        metadata: {
          totalSteps: total,
          beneficiaryId: step.pathway.beneficiaryId
        }
      }
    });
  }

  // Mettre à jour l'horodatage d'activité sur le dossier du bénéficiaire
  await prisma.beneficiary.update({
    where: { id: step.pathway.beneficiaryId },
    data: { lastActivityAt: new Date() }
  }).catch(() => null);

  return updatedStep;
}

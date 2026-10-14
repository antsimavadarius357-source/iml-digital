import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createApplicationSchema, listApplicationsSchema, updateApplicationSchema } from './applications.schemas';
import { AppError } from '../../middleware/error';

// Helper pour filtrer les candidatures selon le rôle (l'agent ne voit que ce qui lui est assigné s'il n'est pas DIRECTION/ADMIN)
function scopeWhere(auth: AuthContext): Prisma.ApplicationWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage');
  if (global) return {};
  // Sinon, l'agent ne voit que ce qui lui est assigné.
  return { assignedAgentId: auth.userId };
}

export async function listApplications(query: z.infer<typeof listApplicationsSchema>, auth: AuthContext) {
  const { page, pageSize, search, status } = query;

  const where: Prisma.ApplicationWhereInput = {
    AND: [
      scopeWhere(auth),
      status ? { status } : {},
      search ? {
        // En supposant que le champ JSON applicantData contient un 'email' ou 'lastName' pour chercher
        // Mais Prisma ne permet pas de filtrer facilement avec OR sur des champs JSON en SQLite/PostgreSQL directement via string contains
        // On fait une recherche simple sur l'ID (ou l'agent peut l'ignorer pour l'instant)
      } : {}
    ],
  };

  if (search) {
      // Dans PostgreSQL on pourrait utiliser des path JSON, ici on fait simple
      (where.AND as any[]).push({
          OR: [
              { evaluationNotes: { contains: search, mode: 'insensitive' } },
              { applicantData: { path: ['lastName'], string_contains: search } } // syntaxe Prisma Postgres JSON
          ]
      });
  }

  const [total, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize };
}

export async function getApplication(id: string, auth: AuthContext) {
  const app = await prisma.application.findFirst({
    where: { id, ...scopeWhere(auth) },
    include: {
      assignedAgent: { select: { id: true, firstName: true, lastName: true } },
    }
  });
  if (!app) throw new AppError(404, 'NON_TROUVE', 'Candidature introuvable ou accès refusé');
  return app;
}

export async function createApplication(data: z.infer<typeof createApplicationSchema>, _ip?: string) {
  const app = await prisma.application.create({
    data: {
      status: 'SOUMISE',
      applicantData: data.applicantData,
      projectData: data.projectData,
      submittedAt: new Date(),
    }
  });

  return app;
}

export async function updateApplication(id: string, data: z.infer<typeof updateApplicationSchema>, auth: AuthContext, _ip?: string) {
  const app = await getApplication(id, auth); // Vérifie l'existence et l'accès

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: data.status,
      evaluationNotes: data.evaluationNotes,
      assignedAgentId: data.assignedAgentId,
    },
    include: {
      assignedAgent: { select: { id: true, firstName: true, lastName: true } },
    }
  });

  return updated;
}

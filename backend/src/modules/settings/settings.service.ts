import { prisma } from '../../database/prisma';
import type { z } from 'zod';
import type { createSectorSchema, createProgramSchema } from './settings.schemas';

export async function getSectors() {
  return prisma.sector.findMany({ orderBy: { name: 'asc' } });
}

export async function createSector(data: z.infer<typeof createSectorSchema>) {
  return prisma.sector.create({ data });
}

export async function getPrograms() {
  return prisma.program.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createProgram(data: z.infer<typeof createProgramSchema>) {
  return prisma.program.create({ data });
}

export async function purgeMockData() {
  // 1. Supprimer les sessions de service et rendez-vous
  await prisma.serviceSession.deleteMany({});
  await prisma.appointment.deleteMany({});

  // 2. Supprimer les notes de suivi
  await prisma.followUpNote.deleteMany({});

  // 3. Supprimer TOUS les documents de démonstration
  await prisma.document.deleteMany({});

  // 4. Supprimer les étapes de parcours et parcours
  await prisma.pathwayStep.deleteMany({});
  await prisma.pathway.deleteMany({});

  // 5. Supprimer les assignations et projets
  await prisma.assignment.deleteMany({});
  await prisma.project.deleteMany({});

  // 6. Supprimer les candidatures
  await prisma.application.deleteMany({});

  // 7. Supprimer les bénéficiaires
  const deletedBeneficiaries = await prisma.beneficiary.deleteMany({});

  // 8. Supprimer les faux logs d'audit de démonstration
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityId: { in: ['b-1', 'doc-1', 'CERT-IML-2026-084', 'step-4', 'cand-001', 'appt-1'] } },
        { action: { in: ['certificate.issued', 'document.validated', 'pathway.completed_100_percent', 'pathway.step_validated'] } }
      ]
    }
  }).catch(() => {});

  // 9. Trouver et supprimer les coachs
  const coachRole = await prisma.role.findUnique({ where: { code: 'COACH' } });
  let deletedCoachesCount = 0;
  if (coachRole) {
    const coaches = await prisma.user.findMany({
      where: { roleId: coachRole.id },
      select: { id: true }
    });
    const coachIds = coaches.map((c) => c.id);
    if (coachIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: coachIds } } });
      await prisma.auditLog.deleteMany({ where: { userId: { in: coachIds } } });
      const delUsers = await prisma.user.deleteMany({ where: { id: { in: coachIds } } });
      deletedCoachesCount = delUsers.count;
    }
  }

  return {
    beneficiariesCount: deletedBeneficiaries.count,
    coachesCount: deletedCoachesCount,
    message: 'Base de données réinitialisée : tous les bénéficiaires et coachs de démo ont été supprimés.'
  };
}

import { Router } from 'express';
import { prisma } from '../../database/prisma';
import { requireAuth, requirePermission } from '../../middleware/auth';

export const dashboardRouter = Router();

/**
 * Indicateurs réellement calculables à ce stade. Les KPI liés aux bénéficiaires, parcours, séances, etc.
 * seront ajoutés avec leurs modules (phase 4) : aucune valeur fictive n'est renvoyée.
 */
dashboardRouter.get('/summary', requireAuth, requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const auth = req.auth!;
    const global = auth.permissions.includes('dashboard:global');
    const isAdmin = auth.permissions.includes('users:manage');

    const [activePrograms, activeUsers, activeBeneficiaries, pendingApplications] = await Promise.all([
      global ? prisma.program.count({ where: { isActive: true } }) : Promise.resolve(null),
      isAdmin ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(null),
      global ? prisma.beneficiary.count({ where: { status: 'ACTIF' } }) :
               prisma.beneficiary.count({ where: { status: 'ACTIF', assignments: { some: { userId: auth.userId } } } }),
      auth.permissions.includes('applications:review') ? 
        prisma.application.count({ where: { status: { in: ['SOUMISE', 'EN_COURS_EXAMEN'] }, ...(global ? {} : { assignedAgentId: auth.userId }) } }) : 
        Promise.resolve(null),
    ]);

    res.json({ activePrograms, activeUsers, activeBeneficiaries, pendingApplications });
  } catch (e) {
    next(e);
  }
});

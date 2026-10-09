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

    const [activePrograms, activeUsers] = await Promise.all([
      global ? prisma.program.count({ where: { isActive: true } }) : Promise.resolve(null),
      isAdmin ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(null),
    ]);

    res.json({ activePrograms, activeUsers });
  } catch (e) {
    next(e);
  }
});

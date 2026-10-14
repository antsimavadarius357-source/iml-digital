import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { getAuditLogs } from './audit.service';

export const auditRouter = Router();

auditRouter.use(requireAuth, requirePermission('audit:read'));

auditRouter.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ items: await getAuditLogs(req.auth!, limit) });
  } catch (e) {
    next(e);
  }
});

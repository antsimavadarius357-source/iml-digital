import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createSectorSchema, createProgramSchema } from './settings.schemas';
import { getSectors, createSector, getPrograms, createProgram } from './settings.service';

export const settingsRouter = Router();

// L'accès au module des paramètres nécessite le droit settings:manage
settingsRouter.use(requireAuth, requirePermission('settings:manage'));

settingsRouter.get('/sectors', async (req, res, next) => {
  try { res.json({ items: await getSectors() }); } catch (e) { next(e); }
});

settingsRouter.post('/sectors', async (req, res, next) => {
  try { res.status(201).json({ sector: await createSector(createSectorSchema.parse(req.body)) }); } catch (e) { next(e); }
});

settingsRouter.get('/programs', async (req, res, next) => {
  try { res.json({ items: await getPrograms() }); } catch (e) { next(e); }
});

settingsRouter.post('/programs', async (req, res, next) => {
  try { res.status(201).json({ program: await createProgram(createProgramSchema.parse(req.body)) }); } catch (e) { next(e); }
});

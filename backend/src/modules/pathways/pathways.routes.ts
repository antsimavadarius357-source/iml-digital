import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createPathwaySchema, idParam, updatePathwaySchema, updateStepSchema } from './pathways.schemas';
import { createPathway, getPathway, listPathways, updatePathway, updateStep, getTemplates } from './pathways.service';

export const pathwaysRouter = Router();

pathwaysRouter.use(requireAuth, requirePermission('pathways:manage'));

pathwaysRouter.get('/templates', async (req, res, next) => {
  try { res.json({ templates: await getTemplates() }); }
  catch (e) { next(e); }
});

pathwaysRouter.get('/', async (req, res, next) => {
  try { res.json({ items: await listPathways(req.auth!) }); }
  catch (e) { next(e); }
});

pathwaysRouter.post('/', async (req, res, next) => {
  try { res.status(201).json({ pathway: await createPathway(createPathwaySchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

pathwaysRouter.get('/:id', async (req, res, next) => {
  try { res.json({ pathway: await getPathway(idParam.parse(req.params.id), req.auth!) }); }
  catch (e) { next(e); }
});

pathwaysRouter.patch('/:id', async (req, res, next) => {
  try { res.json({ pathway: await updatePathway(idParam.parse(req.params.id), updatePathwaySchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

pathwaysRouter.patch('/steps/:id', async (req, res, next) => {
  try { res.json({ step: await updateStep(idParam.parse(req.params.id), updateStepSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

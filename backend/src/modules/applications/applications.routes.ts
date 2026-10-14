import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createApplicationSchema, idParam, listApplicationsSchema, updateApplicationSchema } from './applications.schemas';
import { createApplication, getApplication, listApplications, updateApplication } from './applications.service';

export const applicationsRouter = Router();

// Route publique pour soumettre une candidature (ex: depuis le portail public ou landing page)
applicationsRouter.post('/submit', async (req, res, next) => {
  try {
    const data = createApplicationSchema.parse(req.body);
    const app = await createApplication(data, req.ip);
    res.status(201).json({ application: app });
  } catch (e) { next(e); }
});

// Routes protégées pour la gestion interne (Direction / Agents)
applicationsRouter.use(requireAuth, requirePermission('applications:review'));

applicationsRouter.get('/', async (req, res, next) => {
  try { res.json(await listApplications(listApplicationsSchema.parse(req.query), req.auth!)); }
  catch (e) { next(e); }
});

applicationsRouter.get('/:id', async (req, res, next) => {
  try { res.json({ application: await getApplication(idParam.parse(req.params.id), req.auth!) }); }
  catch (e) { next(e); }
});

applicationsRouter.patch('/:id', async (req, res, next) => {
  try { res.json({ application: await updateApplication(idParam.parse(req.params.id), updateApplicationSchema.parse(req.body), req.auth!, req.ip) }); }
  catch (e) { next(e); }
});

import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import {
  createBeneficiarySchema, idParam, listBeneficiariesSchema, updateBeneficiarySchema, updateProjectSchema,
} from './beneficiaries.schemas';
import {
  createBeneficiary, exportCsv, getBeneficiary, getHistory, getOptions, listBeneficiaries, updateBeneficiary, updateProject,
} from './beneficiaries.service';

export const beneficiariesRouter = Router();
beneficiariesRouter.use(requireAuth, requirePermission('beneficiaries:read'));

const write = requirePermission('beneficiaries:write');

beforeRoutes();
function beforeRoutes() {
  beneficiariesRouter.get('/', async (req, res, next) => {
    try {
      res.json(await listBeneficiaries(listBeneficiariesSchema.parse(req.query), req.auth!));
    } catch (e) { next(e); }
  });

  beneficiariesRouter.get('/options', async (_req, res, next) => {
    try { res.json(await getOptions()); } catch (e) { next(e); }
  });

  beneficiariesRouter.get('/export.csv', requirePermission('beneficiaries:export'), async (req, res, next) => {
    try {
      const csv = await exportCsv(listBeneficiariesSchema.parse(req.query), req.auth!, req.ip);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="beneficiaires.csv"');
      res.send(csv);
    } catch (e) { next(e); }
  });

  beneficiariesRouter.post('/', write, async (req, res, next) => {
    try {
      res.status(201).json({ beneficiary: await createBeneficiary(createBeneficiarySchema.parse(req.body), req.auth!, req.ip) });
    } catch (e) { next(e); }
  });

  beneficiariesRouter.get('/:id', async (req, res, next) => {
    try { res.json({ beneficiary: await getBeneficiary(idParam.parse(req.params.id), req.auth!) }); } catch (e) { next(e); }
  });

  beneficiariesRouter.patch('/:id', write, async (req, res, next) => {
    try {
      const b = await updateBeneficiary(idParam.parse(req.params.id), updateBeneficiarySchema.parse(req.body), req.auth!, req.ip);
      res.json({ beneficiary: b });
    } catch (e) { next(e); }
  });

  beneficiariesRouter.patch('/:id/projects/:projectId', write, async (req, res, next) => {
    try {
      const b = await updateProject(
        idParam.parse(req.params.id), idParam.parse(req.params.projectId), updateProjectSchema.parse(req.body), req.auth!, req.ip,
      );
      res.json({ beneficiary: b });
    } catch (e) { next(e); }
  });

  beneficiariesRouter.get('/:id/history', async (req, res, next) => {
    try { res.json(await getHistory(idParam.parse(req.params.id), req.auth!)); } catch (e) { next(e); }
  });
}

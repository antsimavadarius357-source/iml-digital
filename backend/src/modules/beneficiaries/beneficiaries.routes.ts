import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import {
  createBeneficiarySchema, idParam, listBeneficiariesSchema, updateBeneficiarySchema, updateProjectSchema,
} from './beneficiaries.schemas';
import {
  createBeneficiary, exportCsv, getBeneficiary, getHistory, getOptions, listBeneficiaries, notifyCoach, updateBeneficiary, updateProject,
} from './beneficiaries.service';
import { createNote, createNoteSchema, deleteNote, listNotes, listRecentNotes } from './notes.service';

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

  // Comptes-rendus récents (flux de notification pour agent / direction)
  beneficiariesRouter.get('/recent-notes', async (req, res, next) => {
    try { res.json({ items: await listRecentNotes(req.auth!) }); } catch (e) { next(e); }
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
      if (req.auth?.role === 'COACH') {
        throw new AppError(403, 'Les coachs ne sont pas autorisés à créer des bénéficiaires', 'INTERDIT');
      }
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

  beneficiariesRouter.post('/:id/notify-coach', write, async (req, res, next) => {
    try {
      res.json(await notifyCoach(idParam.parse(req.params.id), req.body, req.auth!, req.ip));
    } catch (e) { next(e); }
  });

  // Comptes-rendus de suivi (coach / agent) : le périmètre d'accès au dossier suffit.
  beneficiariesRouter.get('/:id/notes', async (req, res, next) => {
    try { res.json({ items: await listNotes(idParam.parse(req.params.id), req.auth!) }); } catch (e) { next(e); }
  });

  beneficiariesRouter.post('/:id/notes', async (req, res, next) => {
    try {
      const note = await createNote(idParam.parse(req.params.id), createNoteSchema.parse(req.body), req.auth!);
      res.status(201).json({ note });
    } catch (e) { next(e); }
  });

  beneficiariesRouter.delete('/:id/notes/:noteId', async (req, res, next) => {
    try {
      await deleteNote(idParam.parse(req.params.id), idParam.parse(req.params.noteId), req.auth!);
      res.status(204).end();
    } catch (e) { next(e); }
  });
}

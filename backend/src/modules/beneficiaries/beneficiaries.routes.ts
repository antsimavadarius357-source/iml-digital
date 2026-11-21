import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import {
  createBeneficiarySchema, idParam, listBeneficiariesSchema, updateBeneficiarySchema, updateProjectSchema,
} from './beneficiaries.schemas';
import {
  createBeneficiary, deleteBeneficiary, exportCsv, getBeneficiary, getHistory, getOptions, listBeneficiaries, notifyCoach, updateBeneficiary, updateProject,
} from './beneficiaries.service';
import { createNote, createNoteSchema, deleteNote, listNotes, listRecentNotes } from './notes.service';
import { prisma } from '../../database/prisma';
import { sendStepValidationAlertEmail } from '../email/email.service';

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

  // Comptes-rendus récents (flux de notification et journal pour agent / direction)
  beneficiariesRouter.get('/recent-notes', async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
      res.json({ items: await listRecentNotes(req.auth!, limit) });
    } catch (e) { next(e); }
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

  beneficiariesRouter.delete('/:id', write, async (req, res, next) => {
    try {
      await deleteBeneficiary(idParam.parse(req.params.id), req.auth!);
      res.status(204).end();
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

  // Alerte / notification lorsqu'une étape du circuit d'accompagnement est validée par le coach
  beneficiariesRouter.post('/:id/circuit-step-alert', async (req, res, next) => {
    try {
      const id = idParam.parse(req.params.id);
      const { stepNumber, stepName, statusText, comment } = req.body;
      const b = await prisma.beneficiary.findUnique({
        where: { id },
        include: {
          assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true } },
          projects: { take: 1, select: { name: true } },
        },
      });

      if (!b) throw new AppError(404, 'Bénéficiaire introuvable');

      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
        select: { firstName: true, lastName: true, role: true },
      });

      const coachFullName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : 'Coach Référent';

      const beneficiaryFullName = `${b.firstName} ${b.lastName}`;
      const companyName = b.projects?.[0]?.name;

      // 1. Créer une note de jalon système pour alimenter la cloche de notification de l'agent en temps réel
      const topic = `[Circuit Étape ${stepNumber}] ${stepName} : ${statusText}`;
      const noteContent = comment 
        ? `${coachFullName} a validé l'étape ${stepNumber} (${stepName}).\nCommentaire : ${comment}`
        : `${coachFullName} a validé l'étape ${stepNumber} (${stepName}) pour le dossier ${companyName || beneficiaryFullName}.`;

      await prisma.followUpNote.create({
        data: {
          beneficiaryId: b.id,
          authorId: req.auth!.userId,
          topic,
          content: noteContent,
          nextSteps: stepNumber === 3 ? "Dossier prêt pour la finalisation de l'Étape 4 (Bilan & Sortie) par l'agent" : null,
          priority: 'HAUTE',
          sessionDate: new Date(),
        },
      });

      // 2. Envoyer un e-mail d'alerte immédiat à l'agent assigné (ou agent de coordination)
      const agentEmail = b.assignedAgent?.email || process.env.ADMIN_EMAIL || 'agent@imldigit.com';
      const agentName = b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : 'Agent de planification IML';

      sendStepValidationAlertEmail({
        agentEmail,
        agentName,
        coachName: coachFullName,
        beneficiaryName: beneficiaryFullName,
        companyName,
        stepNumber: Number(stepNumber),
        stepName: String(stepName),
        statusText: String(statusText),
        comment,
        beneficiaryId: b.id,
      }).catch((e) => console.error('[ALERTE ÉTAPE] Erreur envoi mail agent:', e));

      res.json({ success: true, message: `Alerte Étape ${stepNumber} transmise à ${agentName}` });
    } catch (e) {
      next(e);
    }
  });
}

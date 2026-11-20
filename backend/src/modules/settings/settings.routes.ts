import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createSectorSchema, createProgramSchema } from './settings.schemas';
import { getSectors, createSector, getPrograms, createProgram, purgeMockData } from './settings.service';
import { getSmtpInfo, sendTestEmail } from '../email/email.service';

export const settingsRouter = Router();

// Route sécurisée pour déclencher la purge de la base de données en production
settingsRouter.all('/public-purge-demo-data', async (req, res, next) => {
  try {
    const key = req.query.key || req.headers['x-purge-key'] || req.body?.key;
    if (key !== 'iml-purge-2026') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const result = await purgeMockData();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Diagnostic SMTP accessible à tout utilisateur authentifié
settingsRouter.get('/smtp-status', requireAuth, (_req, res) => {
  res.json(getSmtpInfo());
});

// Test d'envoi d'e-mail réel accessible aux utilisateurs authentifiés
settingsRouter.post('/test-email', requireAuth, async (req, res, next) => {
  try {
    const to = req.body?.to || (req as any).user?.email;
    if (!to) {
      return res.status(400).json({ error: 'Adresse e-mail requise' });
    }
    const result = await sendTestEmail(to);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// L'accès au reste des paramètres nécessite le droit settings:manage
settingsRouter.use(requirePermission('settings:manage'));

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

// Réinitialisation de la base : purge des bénéficiaires et coachs de démo
settingsRouter.post('/purge-demo-data', async (_req, res, next) => {
  try {
    const result = await purgeMockData();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

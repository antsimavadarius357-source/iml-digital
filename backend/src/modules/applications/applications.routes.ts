import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createApplicationSchema, idParam, listApplicationsSchema, updateApplicationSchema } from './applications.schemas';
import { createApplication, getApplication, listApplications, updateApplication, trackApplicationPublic } from './applications.service';

export const applicationsRouter = Router();

// Types de fichiers autorisés pour les pièces jointes de candidature
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const attachmentUpload = multer({
  dest: path.join(__dirname, '../../../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 Mo, 1 fichier par requête
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('FORMAT_NON_AUTORISE'));
  },
});

// Route publique : téléversement d'une pièce jointe avant soumission de la candidature
applicationsRouter.post('/public/attachments', (req, res) => {
  attachmentUpload.single('file')(req, res, (err: any) => {
    if (err) {
      const message = err?.code === 'LIMIT_FILE_SIZE'
        ? 'Le fichier dépasse la taille maximale autorisée (10 Mo).'
        : 'Format non autorisé. Formats acceptés : PDF, images, Word, Excel, PowerPoint.';
      return res.status(400).json({ error: { code: 'FICHIER_INVALIDE', message } });
    }
    if (!req.file) {
      return res.status(400).json({ error: { code: 'FICHIER_MANQUANT', message: 'Aucun fichier reçu.' } });
    }
    res.status(201).json({
      attachment: {
        fileId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  });
});

// Route publique pour soumettre une candidature (ex: depuis le portail public ou landing page)
applicationsRouter.post('/submit', async (req, res, next) => {
  try {
    const data = createApplicationSchema.parse(req.body);
    const app = await createApplication(data, req.ip);
    res.status(201).json({ application: app });
  } catch (e) { next(e); }
});

// Route publique pour le suivi d'un dossier candidat par numéro ou email
applicationsRouter.get('/public/track', async (req, res, next) => {
  try {
    const q = String(req.query.q || req.query.query || req.query.code || '');
    const tracked = await trackApplicationPublic(q);
    res.json({ application: tracked });
  } catch (e) { next(e); }
});

// Route pour consulter / télécharger une pièce jointe de dossier candidat
applicationsRouter.get('/attachments/:fileId', async (req, res, next) => {
  try {
    const fileId = path.basename(req.params.fileId);
    const filePath = path.resolve(__dirname, '../../../../uploads', fileId);
    const filename = String(req.query.filename || fileId);
    const isInline = req.query.inline === 'true';
    res.sendFile(filePath, {
      headers: {
        'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`
      }
    }, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: { code: 'FICHIER_INTROUVABLE', message: 'Fichier introuvable sur le serveur.' } });
      }
    });
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

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth';
import { documentUploadSchema, documentStatusSchema, idParam } from './documents.schemas';
import {
  uploadDocument, listDocuments, updateDocumentStatus, getDocumentForDownload, deleteDocument, UPLOAD_DIR,
} from './documents.service';

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 Mo
});

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

/** GET /documents?ownerId=... (dossier précis) ou GET /documents (tous les dossiers accessibles) */
documentsRouter.get('/', async (req, res, next) => {
  try {
    const ownerId = req.query.ownerId ? idParam.parse(String(req.query.ownerId)) : undefined;
    res.json({ items: await listDocuments(req.auth!, ownerId) });
  } catch (e) { next(e); }
});

documentsRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'FICHIER_MANQUANT', message: 'Fichier manquant' } });
    const data = documentUploadSchema.parse(req.body);
    // Le fichier est stocké sur le disque local (uploads/) ; à remplacer par un stockage objet en production.
    const doc = await uploadDocument(data, req.file, req.auth!);
    res.status(201).json({ document: doc });
  } catch (e) { next(e); }
});

documentsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = documentStatusSchema.parse(req.body);
    res.json({ document: await updateDocumentStatus(id, data, req.auth!) });
  } catch (e) { next(e); }
});

documentsRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteDocument(idParam.parse(req.params.id), req.auth!);
    res.status(204).end();
  } catch (e) { next(e); }
});

/** GET /documents/:id/download?inline=1 pour un aperçu dans le navigateur */
documentsRouter.get('/:id/download', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const doc = await getDocumentForDownload(id, req.auth!);
    const ext = doc.fileName ? path.extname(doc.fileName) : '';
    const downloadName = encodeURIComponent(doc.title.endsWith(ext) ? doc.title : `${doc.title}${ext}`);
    const disposition = req.query.inline ? 'inline' : 'attachment';
    if (doc.mimeType) res.type(doc.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${downloadName}`);
    res.sendFile(path.join(UPLOAD_DIR, path.basename(doc.filePath)), (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: { code: 'FICHIER_ABSENT', message: 'Fichier introuvable sur le serveur' } });
    });
  } catch (e) { next(e); }
});

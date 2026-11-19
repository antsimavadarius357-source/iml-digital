import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../../middleware/auth';
import { documentUploadSchema, documentStatusSchema, idParam } from './documents.schemas';
import {
  uploadDocument, listDocuments, updateDocumentStatus, getDocumentForDownload, deleteDocument, UPLOAD_DIR,
} from './documents.service';

/** Cache in-memory pour les conversions DOCX → HTML (clé: docId_mtime) */
const docxPreviewCache = new Map<string, string>();

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

/** GET /documents/:id/preview - Retourne un aperçu HTML (Word) ou URL directe (PDF/Images) */
documentsRouter.get('/:id/preview', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const doc = await getDocumentForDownload(id, req.auth!);
    const absPath = path.join(UPLOAD_DIR, path.basename(doc.filePath));
    const ext = (doc.fileName ? path.extname(doc.fileName) : path.extname(doc.title)).toLowerCase();

    if (ext === '.docx' || ext === '.doc') {
      try {
        // Clé de cache = docId + date de modification du fichier (invalide si le fichier est remplacé)
        let mtime = 0;
        try { mtime = fs.statSync(absPath).mtimeMs; } catch { /* fichier absent → mtime 0 */ }
        const cacheKey = `${id}_${mtime}`;

        let html: string;
        if (docxPreviewCache.has(cacheKey)) {
          // Résultat déjà en cache → réponse instantanée
          html = docxPreviewCache.get(cacheKey)!;
        } else {
          const mammoth = require('mammoth');
          const result = await mammoth.convertToHtml({ path: absPath });
          html = result.value || '<p class="text-slate-500 italic">Document Word vide ou sans contenu textuel exploitable.</p>';
          // Limiter la taille du cache (max 50 entrées)
          if (docxPreviewCache.size >= 50) {
            const firstKey = docxPreviewCache.keys().next().value;
            if (firstKey) docxPreviewCache.delete(firstKey);
          }
          docxPreviewCache.set(cacheKey, html);
        }

        return res.json({
          previewType: 'html',
          title: doc.title,
          category: doc.category,
          html,
          downloadUrl: `/api/v1/documents/${id}/download`
        });
      } catch (err: any) {
        return res.json({
          previewType: 'unsupported',
          title: doc.title,
          category: doc.category,
          message: 'Impossible de convertir le document Word pour l\'aperçu.',
          downloadUrl: `/api/v1/documents/${id}/download`
        });
      }
    }

    if (ext === '.pdf') {
      return res.json({
        previewType: 'pdf',
        title: doc.title,
        category: doc.category,
        url: `/api/v1/documents/${id}/download?inline=1`,
        downloadUrl: `/api/v1/documents/${id}/download`
      });
    }

    if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
      return res.json({
        previewType: 'image',
        title: doc.title,
        category: doc.category,
        url: `/api/v1/documents/${id}/download?inline=1`,
        downloadUrl: `/api/v1/documents/${id}/download`
      });
    }

    if (['.txt', '.md', '.csv'].includes(ext)) {
      const fs = require('fs');
      const content = fs.readFileSync(absPath, 'utf-8');
      return res.json({
        previewType: 'text',
        title: doc.title,
        category: doc.category,
        content,
        downloadUrl: `/api/v1/documents/${id}/download`
      });
    }

    return res.json({
      previewType: 'unsupported',
      title: doc.title,
      category: doc.category,
      message: `Ce type de fichier (${ext}) ne peut pas être prévisualisé directement dans le navigateur.`,
      downloadUrl: `/api/v1/documents/${id}/download`
    });
  } catch (e) { next(e); }
});

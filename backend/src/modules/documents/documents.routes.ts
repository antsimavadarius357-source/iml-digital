import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth';
import { documentUploadSchema, documentStatusSchema, idParam } from './documents.schemas';
import { uploadDocument, listDocuments, updateDocumentStatus, getDocument } from './documents.service';

const upload = multer({
  dest: path.join(__dirname, '../../../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.get('/', async (req, res, next) => {
  try {
    const { ownerType, ownerId } = req.query;
    if (!ownerType || !ownerId) return res.status(400).json({ message: 'ownerType et ownerId requis' });
    res.json({ items: await listDocuments(String(ownerType), String(ownerId), req.auth!) });
  } catch (e) { next(e); }
});

documentsRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier manquant' });
    const data = documentUploadSchema.parse(req.body);
    // Dans un vrai projet, on stockerait req.file.path sur un S3 ou GCP Cloud Storage
    // Ici, le fichier reste sur le disque local dans uploads/
    const doc = await uploadDocument(data, req.file.filename, req.auth!);
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

documentsRouter.get('/:id/download', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const doc = await getDocument(id);
    if (!doc) return res.status(404).json({ message: 'Document introuvable' });
    
    res.sendFile(path.resolve(__dirname, '../../../../uploads', doc.filePath), { headers: { 'Content-Disposition': `attachment; filename="${doc.title}"` } });
  } catch (e) { next(e); }
});

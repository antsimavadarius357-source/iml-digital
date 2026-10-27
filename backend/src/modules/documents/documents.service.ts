import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { documentUploadSchema, documentStatusSchema } from './documents.schemas';
import { AppError } from '../../middleware/error';
import { scopeWhere, fileNumber } from '../beneficiaries/beneficiaries.service';

export const UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads');

type UploadedFile = { filename: string; originalname: string; mimetype: string; size: number };

/** Vérifie que l'utilisateur a accès au dossier (même périmètre que la fiche bénéficiaire). */
async function assertBeneficiaryAccess(beneficiaryId: string, auth: AuthContext) {
  const b = await prisma.beneficiary.findFirst({ where: { id: beneficiaryId, ...scopeWhere(auth) }, select: { id: true } });
  if (!b) throw new AppError(404, 'Dossier introuvable ou accès refusé', 'INTROUVABLE');
}

async function assertDocumentAccess(id: string, auth: AuthContext) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AppError(404, 'Document introuvable', 'INTROUVABLE');
  if (doc.ownerType === 'BENEFICIARY') await assertBeneficiaryAccess(doc.ownerId, auth);
  return doc;
}

/**
 * Liste les documents :
 *  - d'un dossier précis si ownerId est fourni,
 *  - sinon, de tous les dossiers accessibles à l'utilisateur (page « Documents »).
 */
export async function listDocuments(auth: AuthContext, ownerId?: string) {
  let ownerIds: string[];
  if (ownerId) {
    await assertBeneficiaryAccess(ownerId, auth);
    ownerIds = [ownerId];
  } else {
    const accessible = await prisma.beneficiary.findMany({ where: scopeWhere(auth), select: { id: true } });
    ownerIds = accessible.map((b) => b.id);
  }
  if (ownerIds.length === 0) return [];

  const docs = await prisma.document.findMany({
    where: { ownerType: 'BENEFICIARY', ownerId: { in: ownerIds } },
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Enrichissement avec l'identité du bénéficiaire
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { id: { in: [...new Set(docs.map((d) => d.ownerId))] } },
    select: {
      id: true, fileSeq: true, createdAt: true, firstName: true, lastName: true, phone: true, email: true,
      projects: { select: { name: true }, take: 1, orderBy: { createdAt: 'asc' } },
    },
  });
  const byId = new Map(beneficiaries.map((b) => [b.id, b]));

  return docs.map((d) => {
    const b = byId.get(d.ownerId);
    return {
      ...d,
      beneficiary: b
        ? {
            id: b.id,
            fileNumber: fileNumber(b),
            firstName: b.firstName,
            lastName: b.lastName,
            phone: b.phone,
            email: b.email,
            companyName: b.projects[0]?.name ?? null,
          }
        : null,
    };
  });
}

export async function uploadDocument(data: z.infer<typeof documentUploadSchema>, file: UploadedFile, auth: AuthContext) {
  if (data.ownerType === 'BENEFICIARY') await assertBeneficiaryAccess(data.ownerId, auth);
  const doc = await prisma.document.create({
    data: {
      ...data,
      filePath: file.filename,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: auth.userId,
    },
  });
  if (data.ownerType === 'BENEFICIARY') {
    await prisma.beneficiary.update({ where: { id: data.ownerId }, data: { lastActivityAt: new Date() } });
  }
  return doc;
}

export async function updateDocumentStatus(id: string, data: z.infer<typeof documentStatusSchema>, auth: AuthContext) {
  await assertDocumentAccess(id, auth);
  return prisma.document.update({ where: { id }, data: { status: data.status } });
}

export async function getDocumentForDownload(id: string, auth: AuthContext) {
  return assertDocumentAccess(id, auth);
}

export async function deleteDocument(id: string, auth: AuthContext) {
  const doc = await assertDocumentAccess(id, auth);
  const canManage = ['ADMIN', 'DIRECTION', 'AGENT'].includes(auth.role) || doc.uploadedById === auth.userId;
  if (!canManage) throw new AppError(403, 'Seul l’auteur du dépôt ou un agent peut supprimer ce document', 'INTERDIT');
  await prisma.document.delete({ where: { id } });
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(doc.filePath))).catch(() => undefined);
}

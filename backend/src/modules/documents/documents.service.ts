import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { documentUploadSchema, documentStatusSchema } from './documents.schemas';
import { AppError } from '../../middleware/error';

export async function listDocuments(ownerType: string, ownerId: string, auth: AuthContext) {
  // Simplification: si l'utilisateur est concerné ou agent, on liste.
  return prisma.document.findMany({
    where: { ownerType, ownerId },
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function uploadDocument(data: z.infer<typeof documentUploadSchema>, filePath: string, auth: AuthContext) {
  return prisma.document.create({
    data: {
      ...data,
      filePath,
      uploadedById: auth.userId,
    }
  });
}

export async function updateDocumentStatus(id: string, data: z.infer<typeof documentStatusSchema>, auth: AuthContext) {
  return prisma.document.update({
    where: { id },
    data: { status: data.status }
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({ where: { id } });
}

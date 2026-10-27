import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import type { AuthContext } from '../../middleware/auth';
import { scopeWhere } from './beneficiaries.service';

export const createNoteSchema = z.object({
  topic: z.string().trim().min(2, 'Thème requis').max(120),
  content: z.string().trim().min(3, 'Le compte-rendu est vide').max(10000),
  nextSteps: z.string().trim().max(5000).optional().nullable(),
  priority: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  sessionDate: z.coerce.date().optional(),
});

const noteSelect = {
  id: true, sessionDate: true, topic: true, content: true, nextSteps: true, priority: true, createdAt: true,
  author: { select: { id: true, firstName: true, lastName: true, role: { select: { code: true, label: true } } } },
} as const;

async function assertAccess(beneficiaryId: string, auth: AuthContext) {
  const b = await prisma.beneficiary.findFirst({ where: { id: beneficiaryId, ...scopeWhere(auth) }, select: { id: true } });
  if (!b) throw new AppError(404, 'Dossier introuvable ou accès refusé', 'INTROUVABLE');
}

export async function listNotes(beneficiaryId: string, auth: AuthContext) {
  await assertAccess(beneficiaryId, auth);
  return prisma.followUpNote.findMany({
    where: { beneficiaryId },
    select: noteSelect,
    orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createNote(beneficiaryId: string, data: z.infer<typeof createNoteSchema>, auth: AuthContext) {
  await assertAccess(beneficiaryId, auth);
  const [note] = await prisma.$transaction([
    prisma.followUpNote.create({
      data: {
        beneficiaryId,
        authorId: auth.userId,
        topic: data.topic,
        content: data.content,
        nextSteps: data.nextSteps || null,
        priority: data.priority,
        ...(data.sessionDate ? { sessionDate: data.sessionDate } : {}),
      },
      select: noteSelect,
    }),
    prisma.beneficiary.update({ where: { id: beneficiaryId }, data: { lastActivityAt: new Date() } }),
  ]);
  return note;
}

export async function deleteNote(beneficiaryId: string, noteId: string, auth: AuthContext) {
  await assertAccess(beneficiaryId, auth);
  const note = await prisma.followUpNote.findFirst({ where: { id: noteId, beneficiaryId } });
  if (!note) throw new AppError(404, 'Note introuvable', 'INTROUVABLE');
  if (note.authorId !== auth.userId && !['ADMIN', 'DIRECTION'].includes(auth.role)) {
    throw new AppError(403, 'Seul l’auteur peut supprimer ce compte-rendu', 'INTERDIT');
  }
  await prisma.followUpNote.delete({ where: { id: noteId } });
}

export async function listRecentNotes(auth: AuthContext) {
  const isAgentOrManagement = ['ADMIN', 'DIRECTION', 'AGENT'].includes(auth.role);
  return prisma.followUpNote.findMany({
    where: isAgentOrManagement 
      ? { beneficiary: { archivedAt: null } }
      : { beneficiary: scopeWhere(auth) },
    select: {
      ...noteSelect,
      beneficiary: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          projects: {
            take: 1,
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });
}

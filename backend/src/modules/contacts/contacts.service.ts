import type { z } from 'zod';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import type { AuthContext } from '../../middleware/auth';
import type {
  createContactMessageSchema,
  listContactMessagesSchema,
  updateContactMessageSchema,
} from './contacts.schemas';

const db = prisma as any;

export async function createContactMessage(data: z.infer<typeof createContactMessageSchema>) {
  const contact = await db.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      status: 'NOUVEAU',
    },
  });

  // Log d'audit pour traçabilité
  try {
    await prisma.auditLog.create({
      data: {
        action: 'contact.received',
        entityType: 'ContactMessage',
        entityId: contact.id,
        metadata: {
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
        },
      },
    });
  } catch {
    // Non bloquant si l'audit échoue
  }

  return contact;
}

export async function listContactMessages(query: z.infer<typeof listContactMessagesSchema>) {
  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { subject: { contains: query.search, mode: 'insensitive' } },
      { message: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total, unreadCount] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.contactMessage.count({ where }),
    db.contactMessage.count({ where: { status: 'NOUVEAU' } }),
  ]);

  return { items, total, unreadCount };
}

export async function getContactMessageById(id: string) {
  const contact = await db.contactMessage.findUnique({ where: { id } });
  if (!contact) {
    throw new AppError(404, 'Message introuvable', 'CONTACT_NOT_FOUND');
  }
  return contact;
}

export async function updateContactMessage(
  id: string,
  data: z.infer<typeof updateContactMessageSchema>,
  auth: AuthContext
) {
  const existing = await getContactMessageById(id);

  const updated = await db.contactMessage.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.replyNote !== undefined ? { replyNote: data.replyNote } : {}),
      ...(data.status === 'TRAITE' && !existing.repliedAt ? { repliedAt: new Date(), repliedById: auth.userId } : {}),
    },
  });

  return updated;
}

export async function deleteContactMessage(id: string) {
  await getContactMessageById(id);
  await db.contactMessage.delete({ where: { id } });
  return { success: true };
}

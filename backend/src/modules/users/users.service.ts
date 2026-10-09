import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import { hashPassword } from './users.schemas';
import type { z } from 'zod';
import type { createUserSchema, listUsersSchema, updateUserSchema } from './users.schemas';

const select = {
  id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true,
  lastLoginAt: true, createdAt: true, role: { select: { code: true, label: true } },
} satisfies Prisma.UserSelect;

async function roleId(code: string): Promise<string> {
  const role = await prisma.role.findUnique({ where: { code } });
  if (!role) throw new AppError(400, 'Rôle inconnu', 'ROLE_INCONNU');
  return role.id;
}

export async function listUsers(q: z.infer<typeof listUsersSchema>) {
  const where: Prisma.UserWhereInput = q.search
    ? {
        OR: [
          { email: { contains: q.search, mode: 'insensitive' } },
          { firstName: { contains: q.search, mode: 'insensitive' } },
          { lastName: { contains: q.search, mode: 'insensitive' } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where, select, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page: q.page, pageSize: q.pageSize };
}

export const listRoles = () => prisma.role.findMany({ select: { code: true, label: true }, orderBy: { label: 'asc' } });

export async function createUser(input: z.infer<typeof createUserSchema>, actorId: string, ip?: string) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw new AppError(409, 'Un utilisateur avec cet e-mail existe déjà', 'EMAIL_EXISTANT');
  }
  const user = await prisma.user.create({
    data: {
      email: input.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone,
      roleId: await roleId(input.role),
      passwordHash: await hashPassword(input.temporaryPassword),
      mustChangePassword: true,
    },
    select,
  });
  await prisma.auditLog.create({
    data: { userId: actorId, action: 'user.create', entityType: 'User', entityId: user.id, metadata: { role: input.role }, ipAddress: ip },
  });
  return user;
}

export async function updateUser(id: string, input: z.infer<typeof updateUserSchema>, actorId: string, ip?: string) {
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) throw new AppError(404, 'Utilisateur introuvable', 'INTROUVABLE');

  const losesAdmin = target.role.code === 'ADMIN' && (input.isActive === false || (input.role && input.role !== 'ADMIN'));
  if (id === actorId && (input.isActive === false || (input.role && input.role !== target.role.code))) {
    throw new AppError(400, 'Vous ne pouvez pas modifier votre propre rôle ou désactiver votre compte', 'AUTO_MODIFICATION');
  }
  if (losesAdmin && target.isActive) {
    const otherAdmins = await prisma.user.count({ where: { isActive: true, role: { code: 'ADMIN' }, id: { not: id } } });
    if (otherAdmins === 0) throw new AppError(400, 'Il doit rester au moins un administrateur actif', 'DERNIER_ADMIN');
  }

  const { role, ...rest } = input;
  const data: Prisma.UserUpdateInput = { ...rest };
  if (role) data.role = { connect: { id: await roleId(role) } };

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({ where: { id }, data, select }),
    prisma.auditLog.create({
      data: {
        userId: actorId, action: role && role !== target.role.code ? 'user.role_change' : 'user.update',
        entityType: 'User', entityId: id, metadata: { fields: Object.keys(input) }, ipAddress: ip,
      },
    }),
  ];
  // Désactivation ou changement de rôle : révocation immédiate des sessions (accès révoqué).
  if (input.isActive === false || (role && role !== target.role.code)) {
    ops.push(prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }));
  }
  const [updated] = await prisma.$transaction(ops);
  return updated;
}

export async function resetPassword(id: string, temporaryPassword: string, actorId: string, ip?: string) {
  if (!(await prisma.user.findUnique({ where: { id } }))) throw new AppError(404, 'Utilisateur introuvable', 'INTROUVABLE');
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: actorId, action: 'user.password_reset', entityType: 'User', entityId: id, ipAddress: ip } }),
  ]);
}

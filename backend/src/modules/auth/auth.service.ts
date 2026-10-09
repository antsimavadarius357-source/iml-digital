import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import { hashToken } from '../../middleware/auth';
import { permissionsFor } from '../../config/permissions';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
export const SESSION_DAYS = 7;

// Hash factice : on vérifie toujours un mot de passe, même si l'e-mail n'existe pas (anti-énumération).
const dummyHash = argon2.hash('mot-de-passe-factice', { type: argon2.argon2id });

interface Meta {
  ip?: string;
  userAgent?: string;
}

export function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { code: string; label: string };
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.code,
    roleLabel: user.role.label,
    permissions: permissionsFor(user.role.code),
  };
}

export async function login(email: string, password: string, meta: Meta) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } });
  const invalid = new AppError(401, 'Identifiants incorrects', 'IDENTIFIANTS');

  if (!user) {
    await argon2.verify(await dummyHash, password).catch(() => false);
    await prisma.auditLog.create({ data: { action: 'auth.login_failed', ipAddress: meta.ip } });
    throw invalid;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'Compte temporairement verrouillé. Réessayez plus tard.', 'VERROUILLE');
  }

  const ok = user.isActive && (await argon2.verify(user.passwordHash, password).catch(() => false));
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: lock ? 'auth.locked' : 'auth.login_failed', ipAddress: meta.ip },
    });
    throw invalid;
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.$transaction([
    prisma.session.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt, ipAddress: meta.ip, userAgent: meta.userAgent?.slice(0, 255) },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    }),
    prisma.auditLog.create({ data: { userId: user.id, action: 'auth.login', ipAddress: meta.ip } }),
  ]);

  return { token, expiresAt, user: toPublicUser(user) };
}

export async function logout(sessionId: string, userId: string, ip?: string): Promise<void> {
  await prisma.$transaction([
    prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId, action: 'auth.logout', ipAddress: ip } }),
  ]);
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { role: true } });
  return toPublicUser(user);
}

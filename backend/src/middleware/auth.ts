import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { prisma } from '../database/prisma';
import { permissionsFor, type Permission } from '../config/permissions';
import { AppError } from './error';

export const SESSION_COOKIE = 'iml_session';

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export interface AuthContext {
  userId: string;
  sessionId: string;
  role: string;
  permissions: readonly Permission[];
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) throw new AppError(401, 'Authentification requise', 'NON_AUTHENTIFIE');

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { include: { role: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) {
      throw new AppError(401, 'Session invalide ou expirée', 'NON_AUTHENTIFIE');
    }
    const role = session.user.role.code;
    req.auth = { userId: session.userId, sessionId: session.id, role, permissions: permissionsFor(role) };
    next();
  } catch (e) {
    next(e);
  }
}

export const requirePermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new AppError(401, 'Authentification requise', 'NON_AUTHENTIFIE'));
    if (!req.auth.permissions.includes(permission)) {
      return next(new AppError(403, 'Accès refusé', 'INTERDIT'));
    }
    next();
  };

/**
 * Protection CSRF : les requêtes qui modifient des données doivent porter un en-tête personnalisé.
 * Un site tiers ne peut pas l'envoyer (CORS restreint à FRONTEND_URL + cookie SameSite=Lax).
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.header('x-requested-with') !== 'iml-digital') {
    return next(new AppError(403, 'Requête refusée', 'CSRF'));
  }
  next();
}

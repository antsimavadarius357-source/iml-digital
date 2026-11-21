import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { createUser, deleteUser, listRoles, listUsers, resetPassword, updateUser } from './users.service';
import { createUserSchema, listUsersSchema, resetPasswordSchema, updateUserSchema } from './users.schemas';

export const usersRouter = Router();
usersRouter.use(requireAuth, (req, res, next) => {
  if (req.auth?.permissions.includes('users:manage') || ['ADMIN', 'DIRECTION', 'AGENT'].includes(req.auth?.role || '')) {
    return next();
  }
  return res.status(403).json({ error: { code: 'INTERDIT', message: 'Accès réservé aux gestionnaires' } });
});

const idParam = z.string().uuid();

usersRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listUsers(listUsersSchema.parse(req.query)));
  } catch (e) {
    next(e);
  }
});

usersRouter.get('/roles', async (_req, res, next) => {
  try {
    res.json({ items: await listRoles() });
  } catch (e) {
    next(e);
  }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json({ user: await createUser(createUserSchema.parse(req.body), req.auth!.userId, req.ip) });
  } catch (e) {
    next(e);
  }
});

usersRouter.patch('/:id', async (req, res, next) => {
  try {
    const user = await updateUser(idParam.parse(req.params.id), updateUserSchema.parse(req.body), req.auth!.userId, req.ip);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

usersRouter.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { temporaryPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(idParam.parse(req.params.id), temporaryPassword, req.auth!.userId, req.ip);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

usersRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteUser(idParam.parse(req.params.id), req.auth!.userId, req.ip);
    res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (e) {
    next(e);
  }
});

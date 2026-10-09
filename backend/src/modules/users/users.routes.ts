import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createUser, listRoles, listUsers, resetPassword, updateUser } from './users.service';
import { createUserSchema, listUsersSchema, resetPasswordSchema, updateUserSchema } from './users.schemas';

export const usersRouter = Router();
usersRouter.use(requireAuth, requirePermission('users:manage'));

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

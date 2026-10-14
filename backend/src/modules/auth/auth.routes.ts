import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env, isProduction } from '../../config/env';
import { requireAuthAllowPending, SESSION_COOKIE } from '../../middleware/auth';
import { changePassword, getUser, login, logout, SESSION_DAYS } from './auth.service';
import { passwordSchema } from '../users/users.schemas';
import { generateAndSendOtp, verifyOtp } from './otp.service';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'TROP_DE_TENTATIVES', message: 'Trop de tentatives, réessayez plus tard' } },
});

const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide').max(254),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password, { ip: req.ip, userAgent: req.header('user-agent') });
    res.cookie(SESSION_COOKIE, result.token, { ...cookieOptions, maxAge: SESSION_DAYS * 86_400_000 });
    res.json({ user: result.user });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', requireAuthAllowPending, async (req, res, next) => {
  try {
    await logout(req.auth!.sessionId, req.auth!.userId, req.ip);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

authRouter.get('/me', requireAuthAllowPending, async (req, res, next) => {
  try {
    res.json({ user: await getUser(req.auth!.userId) });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/change-password', requireAuthAllowPending, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema })
      .parse(req.body);
    await changePassword(req.auth!.userId, req.auth!.sessionId, currentPassword, newPassword, req.ip);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

const sendOtpSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  code: z.string().trim().length(6, 'Le code doit contenir 6 chiffres'),
});

authRouter.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);
    const result = await generateAndSendOtp(email);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, code } = verifyOtpSchema.parse(req.body);
    const result = verifyOtp(email, code);
    if (!result.valid) {
      return res.status(400).json({ error: { message: result.error || 'Code invalide' } });
    }
    res.json({ success: true, verified: true });
  } catch (e) {
    next(e);
  }
});


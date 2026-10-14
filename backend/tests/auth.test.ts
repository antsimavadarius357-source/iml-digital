import argon2 from 'argon2';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test';
process.env.DIRECT_URL = 'postgresql://test';
process.env.SESSION_SECRET = 'x'.repeat(40);

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn(), count: vi.fn() },
  session: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
  program: { count: vi.fn() },
  beneficiary: { count: vi.fn() },
  application: { count: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));
vi.mock('../src/database/prisma', () => ({ prisma: db }));

const H = { 'x-requested-with': 'iml-digital' };
const role = (code: string) => ({ code, label: code });
let passwordHash: string;

beforeAll(async () => {
  passwordHash = await argon2.hash('Motdepasse-Solide-1', { type: argon2.argon2id });
}, 30_000);

async function app() {
  const { createApp } = await import('../src/app');
  return createApp();
}

function sessionFor(roleCode: string) {
  db.session.findUnique.mockResolvedValue({
    id: 's1', userId: 'u1', revokedAt: null, expiresAt: new Date(Date.now() + 60_000),
    user: { isActive: true, role: role(roleCode) },
  });
}

describe('Authentification', () => {
  it('refuse une route protégée sans session (401)', async () => {
    const res = await request(await app()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('refuse une requête modifiante sans en-tête CSRF (403)', async () => {
    const res = await request(await app()).post('/api/v1/auth/login').send({ email: 'a@b.ga', password: 'x' });
    expect(res.status).toBe(403);
  });

  it('valide les entrées de connexion (400)', async () => {
    const res = await request(await app()).post('/api/v1/auth/login').set(H).send({ email: 'pas-un-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('connecte un utilisateur valide avec cookie HttpOnly, sans exposer le hash', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'agent@iml.ga', firstName: 'A', lastName: 'B', passwordHash,
      isActive: true, failedLoginAttempts: 0, lockedUntil: null, role: role('AGENT'),
    });
    db.$transaction.mockResolvedValue([]);
    const res = await request(await app()).post('/api/v1/auth/login').set(H)
      .send({ email: 'Agent@iml.ga', password: 'Motdepasse-Solide-1' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('AGENT');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('iml_session=');
    expect(cookie).toContain('HttpOnly');
  });

  it('rejette un mauvais mot de passe (401) et compte l\'échec', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'agent@iml.ga', firstName: 'A', lastName: 'B', passwordHash,
      isActive: true, failedLoginAttempts: 0, lockedUntil: null, role: role('AGENT'),
    });
    db.user.update.mockClear();
    const res = await request(await app()).post('/api/v1/auth/login').set(H)
      .send({ email: 'agent@iml.ga', password: 'mauvais' });
    expect(res.status).toBe(401);
    expect(db.user.update).toHaveBeenCalled();
  });

  it('refuse un compte verrouillé (429)', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1', passwordHash, isActive: true, failedLoginAttempts: 0,
      lockedUntil: new Date(Date.now() + 60_000), role: role('AGENT'),
    });
    const res = await request(await app()).post('/api/v1/auth/login').set(H)
      .send({ email: 'agent@iml.ga', password: 'Motdepasse-Solide-1' });
    expect(res.status).toBe(429);
  });
});

describe('Autorisations', () => {
  it('le tableau de bord ne révèle pas les indicateurs globaux à un bénéficiaire', async () => {
    sessionFor('BENEFICIAIRE');
    db.beneficiary.count.mockResolvedValue(0);
    db.application.count.mockResolvedValue(0);
    const res = await request(await app()).get('/api/v1/dashboard/summary').set('Cookie', 'iml_session=abc');
    expect(res.status).toBe(200);
    expect(res.body.activePrograms).toBeNull();
    expect(res.body.activeUsers).toBeNull();
  });

  it('la direction obtient les indicateurs globaux', async () => {
    sessionFor('DIRECTION');
    db.program.count.mockResolvedValue(3);
    db.beneficiary.count.mockResolvedValue(10);
    db.application.count.mockResolvedValue(2);
    const res = await request(await app()).get('/api/v1/dashboard/summary').set('Cookie', 'iml_session=abc');
    expect(res.status).toBe(200);
    expect(res.body.activePrograms).toBe(3);
    expect(res.body.activeUsers).toBeNull();
    expect(res.body.activeBeneficiaries).toBe(10);
  });

  it('requirePermission renvoie 403 pour un rôle sans la permission', async () => {
    const { requireAuth, requirePermission } = await import('../src/middleware/auth');
    const { errorHandler } = await import('../src/middleware/error');
    const a = express();
    a.use(cookieParser());
    a.get('/admin', requireAuth, requirePermission('users:manage'), (_q, r) => r.json({ ok: true }));
    a.use(errorHandler);

    sessionFor('AGENT');
    expect((await request(a).get('/admin').set('Cookie', 'iml_session=abc')).status).toBe(403);
    sessionFor('ADMIN');
    expect((await request(a).get('/admin').set('Cookie', 'iml_session=abc')).status).toBe(200);
  });

  it('refuse une session expirée ou révoquée', async () => {
    db.session.findUnique.mockResolvedValue({
      id: 's1', userId: 'u1', revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, role: role('ADMIN') },
    });
    const res = await request(await app()).get('/api/v1/auth/me').set('Cookie', 'iml_session=abc');
    expect(res.status).toBe(401);
  });
});

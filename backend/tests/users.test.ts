import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test';
process.env.DIRECT_URL = 'postgresql://test';
process.env.SESSION_SECRET = 'x'.repeat(40);

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUniqueOrThrow: vi.fn() },
  role: { findUnique: vi.fn(), findMany: vi.fn() },
  session: { findUnique: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
}));
vi.mock('../src/database/prisma', () => ({ prisma: db }));

const H = { 'x-requested-with': 'iml-digital', Cookie: 'iml_session=abc' };
const UID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';

function login(roleCode: string, mustChange = false) {
  db.session.findUnique.mockResolvedValue({
    id: 's1', userId: ADMIN_ID, revokedAt: null, expiresAt: new Date(Date.now() + 60_000),
    user: { isActive: true, mustChangePassword: mustChange, role: { code: roleCode } },
  });
}
async function app() {
  return (await import('../src/app')).createApp();
}

beforeEach(() => {
  vi.clearAllMocks();
  db.role.findUnique.mockResolvedValue({ id: 'r1', code: 'AGENT' });
  db.user.update.mockResolvedValue({ id: UID });
  db.session.updateMany.mockResolvedValue({ count: 1 });
});

describe('Gestion des utilisateurs', () => {
  it('interdit la liste des utilisateurs à un agent (403)', async () => {
    login('AGENT');
    expect((await request(await app()).get('/api/v1/users').set(H)).status).toBe(403);
  });

  it('bloque les routes métier tant que le mot de passe temporaire n\'est pas changé', async () => {
    login('ADMIN', true);
    const res = await request(await app()).get('/api/v1/users').set(H);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CHANGEMENT_MOT_DE_PASSE_REQUIS');
  });

  it('valide la création (mot de passe faible refusé)', async () => {
    login('ADMIN');
    const res = await request(await app()).post('/api/v1/users').set(H)
      .send({ email: 'a@iml.ga', firstName: 'A', lastName: 'B', role: 'AGENT', temporaryPassword: 'faible' });
    expect(res.status).toBe(400);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('crée un utilisateur avec mot de passe haché, changement exigé et audit', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: UID, email: 'a@iml.ga' });
    const res = await request(await app()).post('/api/v1/users').set(H)
      .send({ email: 'A@iml.ga', firstName: 'A', lastName: 'B', role: 'AGENT', temporaryPassword: 'Temporaire-1234' });
    expect(res.status).toBe(201);
    const data = db.user.create.mock.calls[0]![0].data;
    expect(data.email).toBe('a@iml.ga');
    expect(data.passwordHash).toMatch(/^\$argon2id\$/);
    expect(data.mustChangePassword).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it('refuse un e-mail déjà utilisé (409)', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue({ id: UID });
    const res = await request(await app()).post('/api/v1/users').set(H)
      .send({ email: 'a@iml.ga', firstName: 'A', lastName: 'B', role: 'AGENT', temporaryPassword: 'Temporaire-1234' });
    expect(res.status).toBe(409);
  });

  it('empêche un administrateur de se désactiver lui-même', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue({ id: ADMIN_ID, isActive: true, role: { code: 'ADMIN' } });
    const res = await request(await app()).patch(`/api/v1/users/${ADMIN_ID}`).set(H).send({ isActive: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AUTO_MODIFICATION');
  });

  it('empêche de désactiver le dernier administrateur actif', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue({ id: UID, isActive: true, role: { code: 'ADMIN' } });
    db.user.count.mockResolvedValue(0);
    const res = await request(await app()).patch(`/api/v1/users/${UID}`).set(H).send({ isActive: false });
    expect(res.body.error.code).toBe('DERNIER_ADMIN');
  });

  it('désactive un utilisateur et révoque ses sessions', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue({ id: UID, isActive: true, role: { code: 'AGENT' } });
    const res = await request(await app()).patch(`/api/v1/users/${UID}`).set(H).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(db.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: UID, revokedAt: null } }),
    );
  });

  it('rejette un identifiant non UUID (400)', async () => {
    login('ADMIN');
    expect((await request(await app()).patch('/api/v1/users/abc').set(H).send({ isActive: true })).status).toBe(400);
  });

  it('réinitialise un mot de passe, révoque les sessions et audite', async () => {
    login('ADMIN');
    db.user.findUnique.mockResolvedValue({ id: UID });
    const res = await request(await app()).post(`/api/v1/users/${UID}/reset-password`).set(H)
      .send({ temporaryPassword: 'Nouveau-Temp-1234' });
    expect(res.status).toBe(204);
    expect(db.session.updateMany).toHaveBeenCalled();
    expect(db.auditLog.create).toHaveBeenCalled();
  });
});

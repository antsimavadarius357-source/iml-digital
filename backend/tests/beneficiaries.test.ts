import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test';
process.env.DIRECT_URL = 'postgresql://test';
process.env.SESSION_SECRET = 'x'.repeat(40);

const db = vi.hoisted(() => ({
  beneficiary: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn() },
  program: { findUnique: vi.fn(), findMany: vi.fn() },
  sector: { findUnique: vi.fn(), findMany: vi.fn() },
  user: { findFirst: vi.fn(), findMany: vi.fn() },
  project: { update: vi.fn() },
  session: { findUnique: vi.fn() },
  auditLog: { create: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
}));
vi.mock('../src/database/prisma', () => ({ prisma: db }));

const H = { 'x-requested-with': 'iml-digital', Cookie: 'iml_session=abc' };
const ME = '22222222-2222-4222-8222-222222222222';
const ID = '33333333-3333-4333-8333-333333333333';

const validBody = {
  firstName: 'Awa', lastName: 'Mba', email: 'Awa@Exemple.ga', type: 'STARTUP',
  project: { name: 'AgriTech', stage: 'IDEE' },
};

function as(role: string) {
  db.session.findUnique.mockResolvedValue({
    id: 's1', userId: ME, revokedAt: null, expiresAt: new Date(Date.now() + 60_000),
    user: { isActive: true, mustChangePassword: false, role: { code: role } },
  });
}
const app = async () => (await import('../src/app')).createApp();
const whereOf = (call: number) => JSON.stringify(db.beneficiary.findMany.mock.calls[call]![0].where);

beforeEach(() => {
  vi.clearAllMocks();
  db.beneficiary.findMany.mockResolvedValue([]);
  db.beneficiary.count.mockResolvedValue(0);
  db.auditLog.create.mockResolvedValue({});
});

describe('Bénéficiaires : périmètre et droits', () => {
  it('refuse l\'accès à un administrateur technique et à un bénéficiaire (403)', async () => {
    as('ADMIN');
    expect((await request(await app()).get('/api/v1/beneficiaries').set(H)).status).toBe(403);
    as('BENEFICIAIRE');
    expect((await request(await app()).get('/api/v1/beneficiaries').set(H)).status).toBe(403);
  });

  it('un agent ne liste que ses dossiers (filtre appliqué côté serveur)', async () => {
    as('AGENT');
    await request(await app()).get('/api/v1/beneficiaries').set(H);
    expect(whereOf(0)).toContain(ME);
  });

  it('la direction voit tous les dossiers (pas de filtre d\'agent)', async () => {
    as('DIRECTION');
    await request(await app()).get('/api/v1/beneficiaries').set(H);
    expect(whereOf(0)).not.toContain(ME);
  });

  it('un coach est limité à ses affectations', async () => {
    as('COACH');
    await request(await app()).get('/api/v1/beneficiaries').set(H);
    expect(whereOf(0)).toContain('assignments');
  });

  it('un dossier hors périmètre renvoie 404 (existence non révélée)', async () => {
    as('AGENT');
    db.beneficiary.findFirst.mockResolvedValue(null);
    expect((await request(await app()).get(`/api/v1/beneficiaries/${ID}`).set(H)).status).toBe(404);
  });

  it('la direction et les coachs ne peuvent pas créer ni modifier (403)', async () => {
    for (const role of ['DIRECTION', 'COACH']) {
      as(role);
      expect((await request(await app()).post('/api/v1/beneficiaries').set(H).send(validBody)).status).toBe(403);
      expect((await request(await app()).patch(`/api/v1/beneficiaries/${ID}`).set(H).send({ priority: 'HAUTE' })).status).toBe(403);
    }
  });

  it('le coach ne peut pas exporter (403)', async () => {
    as('COACH');
    expect((await request(await app()).get('/api/v1/beneficiaries/export.csv').set(H)).status).toBe(403);
  });
});

describe('Bénéficiaires : création et validation', () => {
  it('rejette les données invalides (400)', async () => {
    as('AGENT');
    const res = await request(await app()).post('/api/v1/beneficiaries').set(H).send({ ...validBody, email: 'pas-un-email', project: { name: '' } });
    expect(res.status).toBe(400);
    expect(db.beneficiary.create).not.toHaveBeenCalled();
  });

  it('exige les infos d\'entreprise pour le type ENTREPRISE', async () => {
    as('AGENT');
    const res = await request(await app()).post('/api/v1/beneficiaries').set(H).send({ ...validBody, type: 'ENTREPRISE' });
    expect(res.status).toBe(400);
    const champs = res.body.error.details.map((d: { champ: string }) => d.champ);
    expect(champs).toContain('project.legalStatus');
  });

  it('refuse un doublon d\'e-mail (409)', async () => {
    as('AGENT');
    db.beneficiary.findUnique.mockResolvedValue({ id: ID });
    expect((await request(await app()).post('/api/v1/beneficiaries').set(H).send(validBody)).status).toBe(409);
  });

  it('crée le dossier, s\'affecte l\'agent créateur et journalise', async () => {
    as('AGENT');
    db.beneficiary.findUnique.mockResolvedValue(null);
    db.user.findFirst.mockResolvedValue({ id: ME });
    db.beneficiary.create.mockResolvedValue({ id: ID, fileSeq: 7, createdAt: new Date('2026-03-01T00:00:00Z') });
    const res = await request(await app()).post('/api/v1/beneficiaries').set(H).send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.beneficiary.fileNumber).toBe('IML-2026-0007');
    const data = db.beneficiary.create.mock.calls[0]![0].data;
    expect(data.assignedAgentId).toBe(ME);
    expect(data.email).toBe('awa@exemple.ga');
    expect(db.auditLog.create).toHaveBeenCalled();
  });
});

describe('Bénéficiaires : export', () => {
  it('neutralise les formules CSV et journalise l\'export', async () => {
    as('DIRECTION');
    db.beneficiary.findMany.mockResolvedValue([{
      fileSeq: 1, createdAt: new Date('2026-01-01'), lastActivityAt: new Date('2026-01-02'), lastName: '=CMD()', firstName: 'A',
      type: 'STARTUP', status: 'ACTIF', priority: 'NORMALE', assignedAgent: null, program: null, projects: [],
    }]);
    const res = await request(await app()).get('/api/v1/beneficiaries/export.csv').set(H);
    expect(res.status).toBe(200);
    expect(res.text).toContain(`"'=CMD()"`);
    expect(db.auditLog.create.mock.calls[0]![0].data.action).toBe('beneficiary.export');
  });
});

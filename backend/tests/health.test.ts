import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/database/prisma', () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
}));

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test';
process.env.DIRECT_URL = 'postgresql://test';
process.env.SESSION_SECRET = 'x'.repeat(40);

describe('API socle', () => {
  it('GET /api/v1/health répond ok', async () => {
    const { createApp } = await import('../src/app');
    const res = await request(createApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('retourne 404 JSON pour une route inconnue', async () => {
    const { createApp } = await import('../src/app');
    const res = await request(createApp()).get('/api/v1/inconnu');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INTROUVABLE');
  });
});

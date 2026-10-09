// Test de bout en bout contre la VRAIE API et la VRAIE base (API sur :4000, base migrée, admin créé).
// Usage : node tests/e2e-api.mjs
const base = process.env.API_URL ?? 'http://localhost:4000/api/v1';
let failures = 0;

class Client {
  cookie = '';
  async call(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'iml-digital', ...(this.cookie && { Cookie: this.cookie }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(';');
      this.cookie = pair.endsWith('=') ? '' : pair;
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* 204 */ }
    return { status: res.status, json, setCookie: set.join('|') };
  }
}

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'ECHEC'} ${label} (obtenu ${actual}, attendu ${expected})`);
}

const admin = new Client();
const agent = new Client();
const stamp = Date.now();
const agentEmail = `agent.${stamp}@iml.local`;

check('health', (await admin.call('GET', '/health')).status, 200);
check('login mauvais mot de passe', (await admin.call('POST', '/auth/login', { email: 'admin@iml.local', password: 'faux' })).status, 401);
const login = await admin.call('POST', '/auth/login', { email: 'admin@iml.local', password: 'DevLocal-Admin-2026' });
check('login admin', login.status, 200);
check('cookie HttpOnly', login.setCookie.includes('HttpOnly'), true);
check('hash jamais renvoye', JSON.stringify(login.json).includes('passwordHash'), false);
check('dashboard admin', (await admin.call('GET', '/dashboard/summary')).status, 200);
check('liste utilisateurs', (await admin.call('GET', '/users')).status, 200);
check('creation agent', (await admin.call('POST', '/users', { email: agentEmail, firstName: 'Test', lastName: 'Agent', role: 'AGENT', temporaryPassword: 'Temporaire-2026x' })).status, 201);
check('doublon refuse', (await admin.call('POST', '/users', { email: agentEmail, firstName: 'T', lastName: 'A', role: 'AGENT', temporaryPassword: 'Temporaire-2026x' })).status, 409);
check('mot de passe faible refuse', (await admin.call('POST', '/users', { email: `x${stamp}@iml.local`, firstName: 'T', lastName: 'A', role: 'AGENT', temporaryPassword: 'faible' })).status, 400);

check('login agent (temporaire)', (await agent.call('POST', '/auth/login', { email: agentEmail, password: 'Temporaire-2026x' })).status, 200);
check('agent bloque avant changement', (await agent.call('GET', '/dashboard/summary')).status, 403);
check('ancien mot de passe faux refuse', (await agent.call('POST', '/auth/change-password', { currentPassword: 'mauvais', newPassword: 'Definitif-2026xyz' })).status, 400);
check('changement mot de passe', (await agent.call('POST', '/auth/change-password', { currentPassword: 'Temporaire-2026x', newPassword: 'Definitif-2026xyz' })).status, 204);
const dash = await agent.call('GET', '/dashboard/summary');
check('agent dashboard apres changement', dash.status, 200);
check('agent: pas d\'indicateur global', dash.json.activeUsers, null);
check('agent interdit sur /users', (await agent.call('GET', '/users')).status, 403);

const id = (await admin.call('GET', `/users?search=${encodeURIComponent(agentEmail)}`)).json.items[0].id;
check('desactivation agent', (await admin.call('PATCH', `/users/${id}`, { isActive: false })).status, 200);
check('session agent revoquee', (await agent.call('GET', '/auth/me')).status, 401);
check('agent desactive ne peut plus se connecter', (await new Client().call('POST', '/auth/login', { email: agentEmail, password: 'Definitif-2026xyz' })).status, 401);

const me = (await admin.call('GET', '/auth/me')).json.user;
check('admin ne peut pas se desactiver', (await admin.call('PATCH', `/users/${me.id}`, { isActive: false })).status, 400);

// Verrouillage apres 5 echecs
const victim = new Client();
for (let i = 0; i < 5; i++) await victim.call('POST', '/auth/login', { email: 'agent.' + stamp + '@iml.local', password: 'x' });
await admin.call('PATCH', `/users/${id}`, { isActive: true });
check('compte reactive', (await admin.call('GET', '/users')).status, 200);
const lockUser = `lock.${stamp}@iml.local`;
await admin.call('POST', '/users', { email: lockUser, firstName: 'L', lastName: 'K', role: 'COACH', temporaryPassword: 'Temporaire-2026x' });
for (let i = 0; i < 5; i++) await victim.call('POST', '/auth/login', { email: lockUser, password: 'mauvais' });
check('compte verrouille apres 5 echecs', (await victim.call('POST', '/auth/login', { email: lockUser, password: 'Temporaire-2026x' })).status, 429);

check('logout', (await admin.call('POST', '/auth/logout')).status, 204);
check('apres logout', (await admin.call('GET', '/auth/me')).status, 401);

console.log(failures === 0 ? '\nTOUS LES SCENARIOS REUSSIS' : `\n${failures} ECHEC(S)`);
process.exit(failures === 0 ? 0 : 1);

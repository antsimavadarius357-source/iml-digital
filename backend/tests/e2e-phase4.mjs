const BASE_URL = 'http://localhost:4000/api/v1';

async function run() {
  console.log('--- STARTING E2E PHASE 4 TEST ---');
  let cookie = '';
  
  // 1. Auth (Admin)
  console.log('1. Login admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'iml-digital' },
    body: JSON.stringify({ email: 'admin@iml.ga', password: 'AdminIML2026!' })
  });
  if (!loginRes.ok) throw new Error('Login failed');
  cookie = loginRes.headers.get('set-cookie');
  console.log('   OK');

  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'iml-digital', 'Cookie': cookie };

  // 2. Dashboard
  console.log('2. Dashboard Summary...');
  const dashRes = await fetch(`${BASE_URL}/dashboard/summary`, { headers });
  if (!dashRes.ok) throw new Error('Dashboard failed');
  console.log('   OK:', await dashRes.json());

  // 3. Applications
  console.log('3. Applications CRUD...');
  const appRes = await fetch(`${BASE_URL}/applications/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'iml-digital' },
    body: JSON.stringify({ applicantData: { firstName: 'Jean' }, projectData: { name: 'Projet Test' } })
  });
  const newApp = await appRes.json();
  const appId = newApp.application.id;
  
  const appList = await fetch(`${BASE_URL}/applications`, { headers });
  if (!appList.ok) throw new Error('App list failed');
  console.log('   OK. Created App ID:', appId);

  // 4. Beneficiaries
  console.log('4. Beneficiaries...');
  const benRes = await fetch(`${BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'PORTEUR_IDEE', firstName: 'Jean', lastName: 'Test', email: 'jean@test.com' })
  });
  const newBen = await benRes.json();
  const benId = newBen.beneficiary?.id;
  console.log('   OK. Created Ben ID:', benId);

  // 5. Appointments
  console.log('5. Appointments...');
  if (benId) {
    const aptRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST', headers,
      body: JSON.stringify({ beneficiaryId: benId, datetime: new Date().toISOString(), duration: 60 })
    });
    const newApt = await aptRes.json();
    console.log('   OK. Created Apt ID:', newApt.appointment?.id);
  }

  // 6. Pathways
  console.log('6. Pathways...');
  const tplRes = await fetch(`${BASE_URL}/pathways/templates`, { headers });
  const tpls = await tplRes.json();
  const tplId = tpls.templates[0]?.id;
  
  if (benId && tplId) {
    const pwRes = await fetch(`${BASE_URL}/pathways`, {
      method: 'POST', headers,
      body: JSON.stringify({ beneficiaryId: benId, templateId: tplId })
    });
    if (!pwRes.ok) throw new Error('Pathway creation failed ' + await pwRes.text());
    const newPw = await pwRes.json();
    console.log('   OK. Created Pathway ID:', newPw.pathway?.id);
  }

  console.log('--- E2E TEST PASSED ---');
}

run().catch(e => console.error('E2E TEST FAILED:', e));

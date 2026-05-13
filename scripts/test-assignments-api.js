const assert = require('assert');

const BASE_URL = (process.env.ASSIGNMENTS_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL || 'john@doe.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'johndoe123';

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };
  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

async function json(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function login() {
  const res = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  assert.strictEqual(res.status, 200, 'login should succeed for assignment API test');
  const cookie = res.headers.get('set-cookie');
  assert(cookie, 'login should return a session cookie');
  return cookie;
}

async function firstSoftwareId() {
  const res = await request('/api/software');
  assert.strictEqual(res.status, 200, 'GET /api/software should return 200');
  const software = await json(res);
  assert(Array.isArray(software), 'GET /api/software should return an array');
  assert(software.length > 0, 'seed data should contain software records');
  assert(software[0].id, 'seed software should include id');
  return software[0].id;
}

async function main() {
  const softwareId = await firstSoftwareId();

  const listRes = await request('/api/assignments');
  assert.strictEqual(listRes.status, 200, 'GET /api/assignments should return 200');
  const list = await json(listRes);
  assert(Array.isArray(list), 'GET /api/assignments should return an array');

  const unauthCreateRes = await request('/api/assignments', {
    method: 'POST',
    body: JSON.stringify({ softwareId, userId: `user-${Date.now()}` })
  });
  assert.strictEqual(unauthCreateRes.status, 401, 'unauthenticated assignment create should return 401');

  const cookie = await login();

  const invalidJsonRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: '{not-json'
  });
  assert.strictEqual(invalidJsonRes.status, 400, 'invalid JSON body should return 400');

  const nonObjectBodyRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(null)
  });
  assert.strictEqual(nonObjectBodyRes.status, 400, 'non-object JSON body should return 400');

  const missingSoftwareRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ userId: `user-${Date.now()}` })
  });
  assert.strictEqual(missingSoftwareRes.status, 400, 'missing softwareId should return 400');

  const missingUserRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ softwareId })
  });
  assert.strictEqual(missingUserRes.status, 400, 'missing userId should return 400');

  const invalidAssignedAtRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ softwareId, userId: `user-${Date.now()}`, assignedAt: 'not-a-date' })
  });
  assert.strictEqual(invalidAssignedAtRes.status, 400, 'invalid assignedAt should return 400');

  const invalidStatusRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ softwareId, userId: `user-${Date.now()}`, status: 'BOGUS' })
  });
  assert.strictEqual(invalidStatusRes.status, 400, 'invalid status should return 400');

  const missingSoftwareFkRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ softwareId: `missing-${Date.now()}`, userId: `user-${Date.now()}` })
  });
  assert.strictEqual(missingSoftwareFkRes.status, 400, 'missing software foreign key should return 400');

  const missingId = `missing-${Date.now()}`;
  const missingUpdateRes = await request(`/api/assignments/${missingId}`, {
    method: 'PUT',
    headers: { Cookie: cookie },
    body: JSON.stringify({ softwareId, userId: `user-${Date.now()}`, status: 'ACTIVE' })
  });
  assert.strictEqual(missingUpdateRes.status, 404, 'authenticated update for missing assignment should return 404');

  const missingDeleteRes = await request(`/api/assignments/${missingId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.strictEqual(missingDeleteRes.status, 404, 'authenticated delete for missing assignment should return 404');

  const userId = `TEST-USER-${Date.now()}`;
  let createdId = null;

  try {
    const createRes = await request('/api/assignments', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        softwareId,
        userId,
        assignedBy: 'Regression Test',
        assignedAt: '2026-05-01',
        status: 'ACTIVE',
        notes: 'Created by regression test'
      })
    });
    assert.strictEqual(createRes.status, 201, 'valid assignment create should return 201');
    const created = await json(createRes);
    createdId = created.id;
    assert(createdId, 'created assignment should include id');
    assert.strictEqual(created.softwareId, softwareId, 'created assignment softwareId should match');
    assert.strictEqual(created.userId, userId, 'created assignment userId should match');
    assert(created.software, 'created assignment should include related software');

    const getRes = await request(`/api/assignments/${createdId}`);
    assert.strictEqual(getRes.status, 200, 'GET /api/assignments/:id should return created assignment');
    const fetched = await json(getRes);
    assert.strictEqual(fetched.id, createdId, 'fetched assignment id should match');
    assert(fetched.software, 'fetched assignment should include related software');

    const unauthUpdateRes = await request(`/api/assignments/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ softwareId, userId, status: 'INACTIVE' })
    });
    assert.strictEqual(unauthUpdateRes.status, 401, 'unauthenticated assignment update should return 401');

    const updateRes = await request(`/api/assignments/${createdId}`, {
      method: 'PUT',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        softwareId,
        userId,
        assignedBy: 'Regression Test Updated',
        assignedAt: '2026-05-02',
        status: 'REVOKED',
        notes: 'Updated by regression test'
      })
    });
    assert.strictEqual(updateRes.status, 200, 'valid assignment update should return 200');
    const updated = await json(updateRes);
    assert.strictEqual(updated.status, 'REVOKED', 'updated status should persist');
    assert.strictEqual(updated.notes, 'Updated by regression test', 'updated notes should persist');

    const unauthDeleteRes = await request(`/api/assignments/${createdId}`, { method: 'DELETE' });
    assert.strictEqual(unauthDeleteRes.status, 401, 'unauthenticated assignment delete should return 401');

    const deleteRes = await request(`/api/assignments/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });
    assert.strictEqual(deleteRes.status, 200, 'assignment delete should return 200');
    createdId = null;

    const afterDeleteRes = await request(`/api/assignments/${created.id}`);
    assert.strictEqual(afterDeleteRes.status, 404, 'deleted assignment should return 404');
  } finally {
    if (createdId) {
      await request(`/api/assignments/${createdId}`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
    }
  }

  console.log(`Assignments API checks passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const assert = require('assert');

const BASE_URL = (process.env.CONTRACTS_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.SAM_TEST_EMAIL || 'john@doe.com';
const PASSWORD = process.env.SAM_TEST_PASSWORD || 'johndoe123';
const REQUIRE_AUTH = process.env.SAM_REQUIRE_AUTH === 'true';

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
}

async function login() {
  const res = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  assert.strictEqual(res.status, 200, 'login should succeed');
  const cookie = res.headers.get('set-cookie');
  assert(cookie, 'login should return a session cookie');
  return cookie.split(';')[0];
}

async function json(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function main() {
  const cookie = await login();

  const vendorsRes = await request('/api/vendors');
  assert.strictEqual(vendorsRes.status, 200, 'vendors list should be readable');
  const vendors = await json(vendorsRes);
  assert(Array.isArray(vendors) && vendors.length > 0, 'test needs at least one seeded vendor');
  const vendorId = vendors[0].id;

  const listRes = await request('/api/contracts');
  assert.strictEqual(listRes.status, 200, 'GET /api/contracts should exist');
  const contracts = await json(listRes);
  assert(Array.isArray(contracts), 'GET /api/contracts should return an array');
  assert(contracts.every(contract => contract.vendor), 'contracts should include vendor details');

  const unauthCreateRes = await request('/api/contracts', {
    method: 'POST',
    body: JSON.stringify({
      vendorId,
      contractNumber: `TEST-UNAUTH-${Date.now()}`,
      title: 'Unauthenticated Contract',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      contractValue: 1000
    })
  });
  if (REQUIRE_AUTH) {
    assert.strictEqual(unauthCreateRes.status, 401, 'unauthenticated contract create should return 401 when SAM_REQUIRE_AUTH=true');
  } else {
    assert.strictEqual(unauthCreateRes.status, 201, 'unauthenticated contract create should be allowed when SAM_REQUIRE_AUTH is not true');
    const unauthCreated = await json(unauthCreateRes);
    if (unauthCreated && unauthCreated.id) {
      await request(`/api/contracts/${unauthCreated.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
    }
  }

  const invalidJsonRes = await request('/api/contracts', {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: '{not-json'
  });
  assert.strictEqual(invalidJsonRes.status, 400, 'invalid JSON body should return 400');

  const nonObjectBodyRes = await request('/api/contracts', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(null)
  });
  assert.strictEqual(nonObjectBodyRes.status, 400, 'non-object JSON body should return 400');

  const invalidValueRes = await request('/api/contracts', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      vendorId,
      contractNumber: `TEST-BAD-${Date.now()}`,
      title: 'Invalid Contract',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      contractValue: 'not-a-number'
    })
  });
  assert.strictEqual(invalidValueRes.status, 400, 'invalid contract value should return 400');

  const invalidRangeRes = await request('/api/contracts', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      vendorId,
      contractNumber: `TEST-RANGE-${Date.now()}`,
      title: 'Invalid Date Range Contract',
      startDate: '2026-12-31',
      endDate: '2026-01-01',
      contractValue: 1000
    })
  });
  assert.strictEqual(invalidRangeRes.status, 400, 'end date before start date should return 400');

  const invalidStatusRes = await request('/api/contracts', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      vendorId,
      contractNumber: `TEST-STATUS-${Date.now()}`,
      title: 'Invalid Status Contract',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      contractValue: 1000,
      status: 'BOGUS'
    })
  });
  assert.strictEqual(invalidStatusRes.status, 400, 'invalid contract status should return 400');

  const contractNumber = `TEST-CONTRACT-${Date.now()}`;
  let createdId = null;

  try {
    const createRes = await request('/api/contracts', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        vendorId,
        contractNumber,
        title: 'Test Contract API',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        renewalDate: '2026-10-31',
        contractValue: 12000,
        paymentTerms: 'Net 30',
        renewalTerms: 'Annual',
        status: 'ACTIVE',
        notes: 'Created by regression test'
      })
    });
    assert.strictEqual(createRes.status, 201, 'valid contract create should return 201');
    const created = await json(createRes);
    createdId = created.id;
    assert(createdId, 'created contract should include id');
    assert.strictEqual(created.contractNumber, contractNumber, 'created contract number should match');
    assert(created.vendor, 'created contract should include vendor details');

    const getRes = await request(`/api/contracts/${createdId}`);
    assert.strictEqual(getRes.status, 200, 'GET /api/contracts/:id should return created contract');
    const fetched = await json(getRes);
    assert.strictEqual(fetched.id, createdId, 'fetched contract id should match');

    const unauthUpdateRes = await request(`/api/contracts/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({
        vendorId,
        contractNumber,
        title: 'Unauthenticated Update',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        contractValue: 15000,
        status: 'ACTIVE'
      })
    });
    assert.strictEqual(
      unauthUpdateRes.status,
      REQUIRE_AUTH ? 401 : 200,
      REQUIRE_AUTH ? 'unauthenticated contract update should return 401 when SAM_REQUIRE_AUTH=true' : 'unauthenticated contract update should be allowed when SAM_REQUIRE_AUTH is not true'
    );

    const updateRes = await request(`/api/contracts/${createdId}`, {
      method: 'PUT',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        vendorId,
        contractNumber,
        title: 'Updated Test Contract API',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        contractValue: 15000,
        status: 'ACTIVE'
      })
    });
    assert.strictEqual(updateRes.status, 200, 'valid contract update should return 200');
    const updated = await json(updateRes);
    assert.strictEqual(updated.title, 'Updated Test Contract API', 'updated title should persist');
    assert.strictEqual(updated.contractValue, 15000, 'updated value should persist');

    if (REQUIRE_AUTH) {
      const unauthDeleteRes = await request(`/api/contracts/${createdId}`, { method: 'DELETE' });
      assert.strictEqual(unauthDeleteRes.status, 401, 'unauthenticated contract delete should return 401 when SAM_REQUIRE_AUTH=true');
    }

    const deleteRes = await request(`/api/contracts/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });
    assert.strictEqual(deleteRes.status, 200, 'contract delete should return 200');
    createdId = null;

    const afterDeleteRes = await request(`/api/contracts/${created.id}`);
    assert.strictEqual(afterDeleteRes.status, 404, 'deleted contract should return 404');
  } finally {
    if (createdId) {
      await request(`/api/contracts/${createdId}`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
    }
  }

  console.log(`Contracts API checks passed against ${BASE_URL}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

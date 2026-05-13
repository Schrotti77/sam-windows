const assert = require('assert');

const BASE_URL = (process.env.BUDGETS_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
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
  assert.strictEqual(res.status, 200, 'login should succeed for budget API test');
  const cookie = res.headers.get('set-cookie');
  assert(cookie, 'login should return a session cookie');
  return cookie;
}

async function main() {
  const listRes = await request('/api/budgets');
  assert.strictEqual(listRes.status, 200, 'GET /api/budgets should return 200');
  const list = await json(listRes);
  assert(Array.isArray(list), 'GET /api/budgets should return an array');

  const cookie = await login();

  const unauthCreateRes = await request('/api/budgets', {
    method: 'POST',
    body: JSON.stringify({
      name: `Unauth Budget ${Date.now()}`,
      budgetAmount: 1000,
      fiscalYear: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
  });
  assert.strictEqual(unauthCreateRes.status, 401, 'unauthenticated budget create should return 401');

  const invalidJsonRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: '{not-json'
  });
  assert.strictEqual(invalidJsonRes.status, 400, 'invalid JSON body should return 400');

  const nonObjectBodyRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(null)
  });
  assert.strictEqual(nonObjectBodyRes.status, 400, 'non-object JSON body should return 400');

  const invalidAmountRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      name: `Invalid Budget ${Date.now()}`,
      budgetAmount: 'not-a-number',
      fiscalYear: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
  });
  assert.strictEqual(invalidAmountRes.status, 400, 'invalid budget amount should return 400');

  const invalidSpentRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      name: `Invalid Spent Budget ${Date.now()}`,
      budgetAmount: 1000,
      spentAmount: 1200,
      fiscalYear: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
  });
  assert.strictEqual(invalidSpentRes.status, 400, 'spent amount above budget should return 400');

  const invalidDatesRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      name: `Invalid Date Budget ${Date.now()}`,
      budgetAmount: 1000,
      fiscalYear: 2026,
      startDate: '2026-12-31',
      endDate: '2026-01-01'
    })
  });
  assert.strictEqual(invalidDatesRes.status, 400, 'end date before start date should return 400');

  const mismatchedFiscalYearRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      name: `Mismatched Fiscal Year Budget ${Date.now()}`,
      budgetAmount: 1000,
      fiscalYear: 2027,
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
  });
  assert.strictEqual(mismatchedFiscalYearRes.status, 400, 'fiscal year should match budget date range');

  const name = `TEST-BUDGET-${Date.now()}`;
  let createdId = null;

  try {
    const createRes = await request('/api/budgets', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        name,
        department: 'IT',
        category: 'Software',
        budgetAmount: 10000,
        spentAmount: 2500,
        fiscalYear: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        notes: 'Created by regression test'
      })
    });
    assert.strictEqual(createRes.status, 201, 'valid budget create should return 201');
    const created = await json(createRes);
    createdId = created.id;
    assert(createdId, 'created budget should include id');
    assert.strictEqual(created.name, name, 'created budget name should match');
    assert.strictEqual(created.remainingAmount, 7500, 'remaining amount should be derived from budget - spent');

    const getRes = await request(`/api/budgets/${createdId}`);
    assert.strictEqual(getRes.status, 200, 'GET /api/budgets/:id should return created budget');
    const fetched = await json(getRes);
    assert.strictEqual(fetched.id, createdId, 'fetched budget id should match');

    const unauthUpdateRes = await request(`/api/budgets/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        budgetAmount: 12000,
        spentAmount: 3000,
        fiscalYear: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      })
    });
    assert.strictEqual(unauthUpdateRes.status, 401, 'unauthenticated budget update should return 401');

    const updateRes = await request(`/api/budgets/${createdId}`, {
      method: 'PUT',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        name,
        department: 'Finance',
        category: 'Software',
        budgetAmount: 12000,
        spentAmount: 3000,
        fiscalYear: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        notes: 'Updated by regression test'
      })
    });
    assert.strictEqual(updateRes.status, 200, 'valid budget update should return 200');
    const updated = await json(updateRes);
    assert.strictEqual(updated.department, 'Finance', 'updated department should persist');
    assert.strictEqual(updated.remainingAmount, 9000, 'updated remaining amount should be derived');

    const unauthDeleteRes = await request(`/api/budgets/${createdId}`, { method: 'DELETE' });
    assert.strictEqual(unauthDeleteRes.status, 401, 'unauthenticated budget delete should return 401');

    const deleteRes = await request(`/api/budgets/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });
    assert.strictEqual(deleteRes.status, 200, 'budget delete should return 200');
    createdId = null;

    const afterDeleteRes = await request(`/api/budgets/${created.id}`);
    assert.strictEqual(afterDeleteRes.status, 404, 'deleted budget should return 404');
  } finally {
    if (createdId) {
      await request(`/api/budgets/${createdId}`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
    }
  }

  console.log(`Budgets API checks passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

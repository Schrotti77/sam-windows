const assert = require('assert');

const BASE_URL = (process.env.IMPORT_EXPORT_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
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
  assert.strictEqual(res.status, 200, 'login should succeed for import/export test');
  const cookie = res.headers.get('set-cookie');
  assert(cookie, 'login should return a session cookie');
  return cookie;
}

async function main() {
  const cookie = await login();

  const exportRes = await request('/api/export', { headers: { Cookie: cookie } });
  assert.strictEqual(exportRes.status, 200, 'authenticated export should return 200');
  const exported = await json(exportRes);

  const expectedKeys = ['vendors', 'software', 'licenses', 'costs', 'alerts', 'contracts', 'budgets', 'assignments', 'users'];
  for (const key of expectedKeys) {
    assert(Array.isArray(exported.data[key]), `export data.${key} should be an array`);
    assert.strictEqual(typeof exported.counts[key], 'number', `export counts.${key} should be a number`);
  }

  const emptyImport = {
    version: exported.version || '3.1',
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(expectedKeys.map((key) => [key, []]))
  };

  const importRes = await request('/api/import', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(emptyImport)
  });
  assert.strictEqual(importRes.status, 200, 'empty full-shape import should return 200');
  const imported = await json(importRes);
  assert.strictEqual(imported.success, true, 'import should report success');
  for (const key of ['contracts', 'budgets', 'assignments']) {
    assert(imported.results[key], `import results should include ${key}`);
    assert.strictEqual(imported.results[key].imported, 0, `empty import should import zero ${key}`);
  }

  const vendorsRes = await request('/api/vendors');
  assert.strictEqual(vendorsRes.status, 200, 'vendors list should load for contract import test');
  const vendors = await json(vendorsRes);
  assert(Array.isArray(vendors) && vendors[0]?.id, 'vendor seed data should exist for contract import test');

  const invalidContractImport = {
    version: exported.version || '3.1',
    exportedAt: new Date().toISOString(),
    data: {
      ...Object.fromEntries(expectedKeys.map((key) => [key, []])),
      contracts: [{
        id: `import-missing-date-${Date.now()}`,
        vendorId: vendors[0].id,
        contractNumber: `IMPORT-MISSING-DATE-${Date.now()}`,
        title: 'Import Missing Date Contract',
        endDate: '2026-12-31',
        contractValue: 1000
      }]
    }
  };

  const invalidContractImportRes = await request('/api/import', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(invalidContractImport)
  });
  assert.strictEqual(invalidContractImportRes.status, 200, 'partial invalid contract import should return a structured result');
  const invalidContractImportResult = await json(invalidContractImportRes);
  assert.strictEqual(invalidContractImportResult.results.contracts.imported, 0, 'contract missing startDate should not import');
  assert.strictEqual(invalidContractImportResult.results.contracts.skipped, 1, 'contract missing startDate should be skipped');
  assert.strictEqual(invalidContractImportResult.results.contracts.errors, 0, 'contract missing startDate should not fall through to a Prisma error');
  assert(invalidContractImportResult.results.contracts.errorMessages.some((message) => message.includes('startDate is required')), 'contract skip should include a useful reason');

  const softwareRes = await request('/api/software');
  assert.strictEqual(softwareRes.status, 200, 'software list should load for assignment import test');
  const software = await json(softwareRes);
  assert(Array.isArray(software) && software[0]?.id, 'software seed data should exist for assignment import test');

  const createdAssignmentRes = await request('/api/assignments', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({
      softwareId: software[0].id,
      userId: `IMPORT-EXPORT-USER-${Date.now()}`,
      assignedBy: 'Import Export Test',
      status: 'ACTIVE'
    })
  });
  assert.strictEqual(createdAssignmentRes.status, 201, 'assignment setup should create a record');
  const createdAssignment = await json(createdAssignmentRes);

  try {
    const beforeBudgets = await json(await request('/api/budgets'));
    const beforeAssignments = await json(await request('/api/assignments'));
    const beforeBudgetCount = beforeBudgets.length;
    const beforeAssignmentCount = beforeAssignments.length;

    const fullExportRes = await request('/api/export', { headers: { Cookie: cookie } });
    assert.strictEqual(fullExportRes.status, 200, 'full export should return 200');
    const fullExport = await json(fullExportRes);
    assert(fullExport.data.budgets.length > 0, 'full export should include non-empty budgets from seed data');
    assert(fullExport.data.assignments.some((assignment) => assignment.id === createdAssignment.id), 'full export should include created assignment');

    for (let i = 0; i < 2; i++) {
      const repeatImportRes = await request('/api/import', {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify(fullExport)
      });
      assert.strictEqual(repeatImportRes.status, 200, `full import pass ${i + 1} should return 200`);
      const repeatImport = await json(repeatImportRes);
      assert(repeatImport.results.budgets.imported >= 1, 'full import should process budgets');
      assert(repeatImport.results.assignments.imported >= 1, 'full import should process assignments');
    }

    const afterBudgets = await json(await request('/api/budgets'));
    const afterAssignments = await json(await request('/api/assignments'));
    assert.strictEqual(afterBudgets.length, beforeBudgetCount, 'repeated import should not duplicate budgets');
    assert.strictEqual(afterAssignments.length, beforeAssignmentCount, 'repeated import should not duplicate assignments');
  } finally {
    await request(`/api/assignments/${createdAssignment.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie }
    });
  }

  console.log(`Import/export coverage checks passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

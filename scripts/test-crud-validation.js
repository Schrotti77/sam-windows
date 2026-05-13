const assert = require('assert');

const BASE_URL = (process.env.CRUD_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL || 'john@doe.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'johndoe123';

function cookieFrom(response) {
  const value = response.headers.get('set-cookie') || '';
  return value.split(',').find((part) => part.includes('auth-token=')) || value;
}

async function loginCookie() {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await response.text();
  assert.strictEqual(response.status, 200, `login failed: ${response.status} ${body.slice(0, 300)}`);
  const cookie = cookieFrom(response);
  assert(cookie.includes('auth-token='), 'missing auth-token cookie');
  return cookie;
}

async function requestJson(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`${path} returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
  }
  return { response, body, text };
}

async function authed(cookie, path, init = {}) {
  return requestJson(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      cookie,
      ...(init.headers || {}),
    },
  });
}

async function expectValidation(cookie, name, path, payload) {
  const { response, body } = await authed(cookie, path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assert.strictEqual(response.status, 400, `${name}: expected 400, got ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
  assert(body && typeof body.error === 'string', `${name}: expected JSON error message`);
  console.log(`OK - ${name}`);
}

async function createFixture(cookie) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const vendorResult = await authed(cookie, '/api/vendors', {
    method: 'POST',
    body: JSON.stringify({ name: `CRUD Test Vendor ${suffix}` }),
  });
  assert.strictEqual(vendorResult.response.status, 201, `create vendor failed: ${vendorResult.response.status} ${JSON.stringify(vendorResult.body)}`);

  const softwareResult = await authed(cookie, '/api/software', {
    method: 'POST',
    body: JSON.stringify({
      name: `CRUD Test Software ${suffix}`,
      category: 'SAAS',
      vendorId: vendorResult.body.id,
    }),
  });
  assert.strictEqual(softwareResult.response.status, 201, `create software failed: ${softwareResult.response.status} ${JSON.stringify(softwareResult.body)}`);

  return { vendor: vendorResult.body, software: softwareResult.body };
}

async function cleanup(cookie, fixture, licenseId) {
  if (licenseId) {
    await authed(cookie, `/api/licenses/${licenseId}`, { method: 'DELETE' }).catch(() => {});
  }
  if (fixture?.software?.id) {
    await authed(cookie, `/api/software/${fixture.software.id}`, { method: 'DELETE' }).catch(() => {});
  }
  if (fixture?.vendor?.id) {
    await authed(cookie, `/api/vendors/${fixture.vendor.id}`, { method: 'DELETE' }).catch(() => {});
  }
}

async function testValidationFailures(cookie) {
  const fixture = await createFixture(cookie);
  try {
    await expectValidation(cookie, 'invalid cost amount is rejected', '/api/costs', {
      softwareId: fixture.software.id,
      costType: 'LICENSE',
      amount: 'not-a-number',
      billingPeriod: 'MONTHLY',
      costDate: new Date().toISOString(),
    });

    await expectValidation(cookie, 'negative cost amount is rejected', '/api/costs', {
      softwareId: fixture.software.id,
      costType: 'LICENSE',
      amount: -1,
      billingPeriod: 'MONTHLY',
      costDate: new Date().toISOString(),
    });

    await expectValidation(cookie, 'invalid cost date is rejected', '/api/costs', {
      softwareId: fixture.software.id,
      costType: 'LICENSE',
      amount: 10,
      billingPeriod: 'MONTHLY',
      costDate: 'not-a-date',
    });

    await expectValidation(cookie, 'invalid license quantity is rejected', '/api/licenses', {
      softwareId: fixture.software.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 'not-a-number',
    });

    await expectValidation(cookie, 'negative license cost is rejected', '/api/licenses', {
      softwareId: fixture.software.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 5,
      costPerLicense: -3,
    });

    await expectValidation(cookie, 'invalid software date is rejected', '/api/software', {
      name: `Bad Date ${Date.now()}`,
      category: 'SAAS',
      vendorId: fixture.vendor.id,
      releaseDate: 'not-a-date',
    });

    await expectValidation(cookie, 'invalid software acquisition cost is rejected', '/api/software', {
      name: `Bad Cost ${Date.now()}`,
      category: 'SAAS',
      vendorId: fixture.vendor.id,
      acquisitionCost: 'not-a-number',
    });
  } finally {
    await cleanup(cookie, fixture);
  }
}

async function testSoftwareDeleteWithDependencies(cookie) {
  const fixture = await createFixture(cookie);
  let licenseId;
  try {
    const licenseResult = await authed(cookie, '/api/licenses', {
      method: 'POST',
      body: JSON.stringify({
        softwareId: fixture.software.id,
        licenseType: 'SUBSCRIPTION',
        totalLicenses: 5,
        usedLicenses: 1,
      }),
    });
    assert.strictEqual(licenseResult.response.status, 201, `create license failed: ${licenseResult.response.status} ${JSON.stringify(licenseResult.body)}`);
    licenseId = licenseResult.body.id;

    const deleteResult = await authed(cookie, `/api/software/${fixture.software.id}`, { method: 'DELETE' });
    assert.strictEqual(deleteResult.response.status, 400, `software with dependencies should return 400, got ${deleteResult.response.status}: ${JSON.stringify(deleteResult.body)}`);
    assert.strictEqual(deleteResult.body.canDelete, false, 'delete response should include canDelete=false');
    assert(deleteResult.body.counts && deleteResult.body.counts.licenses === 1, 'delete response should include license dependency count');

    const softwareResult = await requestJson(`/api/software/${fixture.software.id}`);
    assert.strictEqual(softwareResult.response.status, 200, 'blocked delete should keep software record');
    console.log('OK - software delete with dependencies is blocked cleanly');
  } finally {
    await cleanup(cookie, fixture, licenseId);
  }
}

async function main() {
  const cookie = await loginCookie();
  await testValidationFailures(cookie);
  await testSoftwareDeleteWithDependencies(cookie);
  console.log(`CRUD validation tests passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

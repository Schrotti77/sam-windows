const assert = require('assert');

const BASE_URL = (process.env.API_AUTH_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL || 'john@doe.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'johndoe123';

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error && error.message ? error.message : error);
    process.exitCode = 1;
  }
}

function cookieFrom(response) {
  const value = response.headers.get('set-cookie') || '';
  return value.split(',').find((part) => part.includes('auth-token=')) || value;
}

async function expectStatus(name, path, init, expectedStatus) {
  await check(name, async () => {
    const res = await fetch(`${BASE_URL}${path}`, init);
    const body = await res.text();
    assert.strictEqual(res.status, expectedStatus, `expected ${expectedStatus}, got ${res.status}: ${body.slice(0, 300)}`);
  });
}

async function loginCookie() {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`login failed: ${res.status} ${await res.text()}`);
  }
  const cookie = cookieFrom(res);
  assert.ok(cookie.includes('auth-token='), 'missing auth-token cookie');
  return cookie;
}

async function main() {
  await expectStatus('unauthenticated GET /api/export is rejected', '/api/export', undefined, 401);
  await expectStatus('unauthenticated POST /api/import is rejected before parsing body', '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: '3.0', data: {} }),
  }, 401);
  await expectStatus('unauthenticated POST /api/vendors is rejected before validation', '/api/vendors', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  }, 401);

  await check('authenticated GET /api/export succeeds', async () => {
    const cookie = await loginCookie();
    const res = await fetch(`${BASE_URL}/api/export`, { headers: { cookie } });
    const body = await res.text();
    assert.strictEqual(res.status, 200, `expected 200, got ${res.status}: ${body.slice(0, 300)}`);
    const json = JSON.parse(body);
    assert.ok(json.data && Array.isArray(json.data.vendors), 'missing exported vendors array');
    assert.ok(json.counts && typeof json.counts.vendors === 'number', 'missing export counts');
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
  console.log(`API auth tests passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

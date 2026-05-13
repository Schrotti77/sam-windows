const assert = require('assert');

const BASE_URL = (process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
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

async function main() {
  let cookie = '';

  await check('GET /login', async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`);
  });

  await check('POST /api/login', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!res.ok) {
      throw new Error(`login failed: ${res.status} ${await res.text()}`);
    }
    cookie = cookieFrom(res);
    assert.ok(cookie.includes('auth-token='), 'missing auth-token cookie');
  });

  await check('GET /api/me', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, { headers: { cookie } });
    if (!res.ok) {
      throw new Error(`/api/me failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    assert.ok(json.email || json.user?.email, 'missing email in /api/me response');
  });

  await check('GET /api/dashboard/stats', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`);
    if (!res.ok) {
      throw new Error(`/api/dashboard/stats failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    for (const key of ['totalSoftware', 'totalLicenses', 'totalVendors', 'totalCosts', 'complianceRate', 'alertCount']) {
      assert.ok(Object.prototype.hasOwnProperty.call(json, key), `missing stats field ${key}`);
    }
    assert.ok(json.totalSoftware >= 3, `expected at least 3 software records, got ${json.totalSoftware}`);
    assert.ok(json.totalLicenses >= 3, `expected at least 3 licenses, got ${json.totalLicenses}`);
    assert.ok(json.totalVendors >= 3, `expected at least 3 vendors, got ${json.totalVendors}`);
    assert.ok(json.totalCosts > 0, `expected current monthly costs > 0, got ${json.totalCosts}`);
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
  console.log(`Smoke tests passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

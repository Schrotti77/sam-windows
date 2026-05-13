const assert = require('assert');

const BASE_URL = (process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

async function main() {
  const listRes = await fetch(`${BASE_URL}/api/vendors`);
  const listText = await listRes.text();
  assert.strictEqual(listRes.status, 200, `GET /api/vendors expected 200, got ${listRes.status}: ${listText.slice(0, 500)}`);

  const vendors = JSON.parse(listText);
  assert.ok(Array.isArray(vendors) && vendors.length > 0, 'Need at least one vendor to test update');

  const vendor = vendors[0];
  const payload = {
    name: vendor.name,
    contactEmail: vendor.contactEmail || '',
    contactPhone: vendor.contactPhone || '',
    website: vendor.website || '',
    address: vendor.address || '',
    supportEmail: vendor.supportEmail || '',
    supportPhone: vendor.supportPhone || '',
    accountManager: vendor.accountManager || '',
    notes: vendor.notes || '',
    isActive: vendor.isActive !== false,
  };

  const updateRes = await fetch(`${BASE_URL}/api/vendors/${vendor.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const updateText = await updateRes.text();
  assert.strictEqual(updateRes.status, 200, `PUT /api/vendors/${vendor.id} expected 200, got ${updateRes.status}: ${updateText.slice(0, 1000)}`);

  const updated = JSON.parse(updateText);
  assert.strictEqual(updated.id, vendor.id, 'Updated vendor id mismatch');
  assert.strictEqual(updated.name, vendor.name, 'Updated vendor name mismatch');
  console.log(`Vendor update test passed against ${BASE_URL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

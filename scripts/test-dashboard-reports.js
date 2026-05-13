const assert = require('assert');

const BASE_URL = (process.env.REPORTS_BASE_URL || process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const PROJECT_ROOT = require('path').resolve(__dirname, '..');

async function requestJson(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch (error) {
    throw new Error(`${path} returned non-JSON (${response.status}): ${bodyText.slice(0, 200)}`);
  }

  assert.strictEqual(response.status, 200, `${path} should return 200: ${bodyText.slice(0, 200)}`);
  return body;
}

function assertCostPayload(payload, label) {
  assert(payload && typeof payload === 'object' && !Array.isArray(payload), `${label} should return an object`);
  assert(Array.isArray(payload.chartData), `${label}.chartData should be an array`);
  assert.strictEqual(typeof payload.months, 'number', `${label}.months should be numeric`);
  assert(payload.months > 0, `${label}.months should be positive`);

  for (const row of payload.chartData) {
    assert.strictEqual(typeof row.month, 'string', `${label} row month should be a string`);
    for (const key of ['license', 'maintenance', 'support']) {
      assert.strictEqual(typeof row[key], 'number', `${label} row ${key} should be numeric`);
    }
  }
}

function assertConsumersHandleWrappedPayloads() {
  const fs = require('fs');
  const path = require('path');
  const files = {
    costChart: fs.readFileSync(path.join(PROJECT_ROOT, 'components/dashboard/cost-overview-chart.tsx'), 'utf8'),
    complianceChart: fs.readFileSync(path.join(PROJECT_ROOT, 'components/dashboard/license-compliance-chart.tsx'), 'utf8'),
    costsPage: fs.readFileSync(path.join(PROJECT_ROOT, 'app/(dashboard)/costs/page-client.tsx'), 'utf8'),
    reportsPage: fs.readFileSync(path.join(PROJECT_ROOT, 'app/(dashboard)/reports/page-client.tsx'), 'utf8')
  };

  assert(
    files.costChart.includes('Array.isArray(result) ? result : result.chartData || []'),
    'dashboard cost chart should unwrap { chartData } payloads'
  );
  assert(
    files.complianceChart.includes('Array.isArray(result) ? result : result.complianceStats || []'),
    'dashboard compliance chart should unwrap { complianceStats } payloads'
  );
  assert(
    files.costsPage.includes('Array.isArray(data) ? data : data.chartData || []'),
    'costs page should unwrap { chartData } payloads'
  );
  assert(
    files.reportsPage.includes('Array.isArray(costs) ? costs : costs.chartData || []'),
    'reports page should unwrap { chartData } payloads'
  );
  assert(
    files.reportsPage.includes('Array.isArray(compliance) ? compliance : compliance.complianceStats || []'),
    'reports page should unwrap { complianceStats } payloads'
  );
  assert(
    files.reportsPage.includes('`/api/dashboard/costs?months=${months}`'),
    'reports page should pass the selected month range to the cost chart API'
  );
  assert(
    files.reportsPage.includes('activeUsers: sw.activeUsers ?? sw._count?.assignments ?? 0'),
    'reports page should derive activeUsers from software assignment counts'
  );
  assert(
    files.costsPage.includes('filteredCosts.length > 0 ? totalCosts / filteredCosts.length : 0'),
    'costs page should not divide by zero when filters return no rows'
  );
}

async function main() {
  const costsDefault = await requestJson('/api/dashboard/costs');
  assertCostPayload(costsDefault, 'default costs');
  assert.strictEqual(costsDefault.months, 6, 'default costs range should be 6 months');

  const costsThree = await requestJson('/api/dashboard/costs?months=3');
  assertCostPayload(costsThree, '3 month costs');
  assert.strictEqual(costsThree.months, 3, '3 month costs range should echo months=3');

  const costsTwentyFour = await requestJson('/api/dashboard/costs?months=24');
  assertCostPayload(costsTwentyFour, '24 month costs');
  assert.strictEqual(costsTwentyFour.months, 24, '24 month costs range should echo months=24');

  assert(
    costsTwentyFour.chartData.length >= costsThree.chartData.length,
    'larger cost range should not produce fewer month buckets than shorter range'
  );

  const compliance = await requestJson('/api/dashboard/compliance');
  assert(compliance && typeof compliance === 'object' && !Array.isArray(compliance), 'compliance should return an object');
  assert(Array.isArray(compliance.complianceStats), 'compliance.complianceStats should be an array');
  for (const row of compliance.complianceStats) {
    assert.strictEqual(typeof row.name, 'string', 'compliance row name should be a string');
    assert.strictEqual(typeof row.value, 'number', 'compliance row value should be numeric');
  }

  assertConsumersHandleWrappedPayloads();

  console.log('Dashboard reports API checks passed');
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});

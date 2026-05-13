const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-seed-test-'));
  process.env.DATABASE_URL = `file:${path.join(tempDir, 'seed-test.db')}`;
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  env: process.env,
});

const { PrismaClient } = require('@prisma/client');

function runSeed() {
  execFileSync(process.execPath, ['scripts/seed.js'], {
    stdio: 'inherit',
    env: process.env,
  });
}

async function counts(prisma) {
  return {
    users: await prisma.user.count(),
    vendors: await prisma.vendor.count(),
    software: await prisma.software.count(),
    licenses: await prisma.license.count(),
    costs: await prisma.softwareCost.count(),
    contracts: await prisma.contract.count(),
    budgets: await prisma.budget.count(),
    alerts: await prisma.complianceAlert.count(),
  };
}

function firstOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function main() {
  runSeed();
  runSeed();

  const prisma = new PrismaClient();
  try {
    const c = await counts(prisma);
    assert.deepStrictEqual(c, {
      users: 1,
      vendors: 3,
      software: 3,
      licenses: 3,
      costs: 3,
      contracts: 2,
      budgets: 1,
      alerts: 3,
    });

    const currentMonthCosts = await prisma.softwareCost.aggregate({
      _sum: { amount: true },
      where: {
        billingPeriod: 'MONTHLY',
        costDate: { gte: firstOfCurrentMonth() },
      },
    });
    assert.ok((currentMonthCosts._sum.amount || 0) > 0, 'seeded dashboard monthly costs should be current');

    const expiredLicenses = await prisma.license.count({
      where: { expirationDate: { lt: new Date() } },
    });
    assert.strictEqual(expiredLicenses, 0, 'seeded license expirations should be future-dated');
  } finally {
    await prisma.$disconnect();
  }

  console.log('Seed idempotency checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

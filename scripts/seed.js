const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(base) {
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function startOfYear(base) {
  return new Date(base.getFullYear(), 0, 1);
}

function endOfYear(base) {
  return new Date(base.getFullYear(), 11, 31);
}

async function upsertByFindFirst(model, where, data) {
  const existing = await model.findFirst({ where });
  if (existing) {
    return model.update({
      where: { id: existing.id },
      data,
    });
  }
  return model.create({ data });
}

async function main() {
  console.log('Seeding database...');

  const now = new Date();
  const fiscalYear = now.getFullYear();
  const currentMonth = startOfMonth(now);
  const hashedPassword = await bcrypt.hash('johndoe123', 12);

  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'IT_ADMIN',
    },
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'IT_ADMIN',
    },
  });
  console.log('Upserted admin user: john@doe.com');

  const microsoft = await prisma.vendor.upsert({
    where: { name: 'Microsoft Corporation' },
    update: {
      contactEmail: 'enterprise@microsoft.com',
      contactPhone: '+1-425-882-8080',
      website: 'https://microsoft.com',
      accountManager: 'Sarah Johnson',
      supportEmail: 'support@microsoft.com',
      address: 'One Microsoft Way, Redmond, WA 98052, USA',
      isActive: true,
    },
    create: {
      name: 'Microsoft Corporation',
      contactEmail: 'enterprise@microsoft.com',
      contactPhone: '+1-425-882-8080',
      website: 'https://microsoft.com',
      accountManager: 'Sarah Johnson',
      supportEmail: 'support@microsoft.com',
      address: 'One Microsoft Way, Redmond, WA 98052, USA',
      isActive: true,
    },
  });

  const adobe = await prisma.vendor.upsert({
    where: { name: 'Adobe Inc.' },
    update: {
      contactEmail: 'enterprise@adobe.com',
      contactPhone: '+1-408-536-6000',
      website: 'https://adobe.com',
      accountManager: 'Michael Chen',
      supportEmail: 'support@adobe.com',
      address: '345 Park Avenue, San Jose, CA 95110, USA',
      isActive: true,
    },
    create: {
      name: 'Adobe Inc.',
      contactEmail: 'enterprise@adobe.com',
      contactPhone: '+1-408-536-6000',
      website: 'https://adobe.com',
      accountManager: 'Michael Chen',
      supportEmail: 'support@adobe.com',
      address: '345 Park Avenue, San Jose, CA 95110, USA',
      isActive: true,
    },
  });

  const atlassian = await prisma.vendor.upsert({
    where: { name: 'Atlassian Corporation' },
    update: {
      contactEmail: 'enterprise@atlassian.com',
      contactPhone: '+1-415-701-1111',
      website: 'https://atlassian.com',
      accountManager: 'Emma Rodriguez',
      supportEmail: 'support@atlassian.com',
      address: '350 Bush Street, San Francisco, CA 94104, USA',
      isActive: true,
    },
    create: {
      name: 'Atlassian Corporation',
      contactEmail: 'enterprise@atlassian.com',
      contactPhone: '+1-415-701-1111',
      website: 'https://atlassian.com',
      accountManager: 'Emma Rodriguez',
      supportEmail: 'support@atlassian.com',
      address: '350 Bush Street, San Francisco, CA 94104, USA',
      isActive: true,
    },
  });
  console.log('Upserted vendors');

  const office365 = await upsertByFindFirst(
    prisma.software,
    { name: 'Microsoft Office 365', version: 'E5' },
    {
      name: 'Microsoft Office 365',
      version: 'E5',
      category: 'SAAS',
      description: 'Office productivity suite with cloud services',
      vendorId: microsoft.id,
      isActive: true,
    }
  );

  const adobeCC = await upsertByFindFirst(
    prisma.software,
    { name: 'Adobe Creative Cloud', version: '2024' },
    {
      name: 'Adobe Creative Cloud',
      version: '2024',
      category: 'DESKTOP',
      description: 'Creative software suite for design and multimedia',
      vendorId: adobe.id,
      isActive: true,
    }
  );

  const jira = await upsertByFindFirst(
    prisma.software,
    { name: 'Atlassian Jira', version: 'Cloud' },
    {
      name: 'Atlassian Jira',
      version: 'Cloud',
      category: 'SAAS',
      description: 'Project management and issue tracking',
      vendorId: atlassian.id,
      isActive: true,
    }
  );
  console.log('Upserted software');

  await upsertByFindFirst(
    prisma.license,
    { softwareId: office365.id, licenseType: 'SUBSCRIPTION' },
    {
      softwareId: office365.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 100,
      usedLicenses: 85,
      availableLicenses: 15,
      costPerLicense: 22.00,
      purchaseDate: addDays(now, -90),
      expirationDate: addDays(now, 365),
      renewalDate: addDays(now, 335),
      isAutoRenewal: true,
      complianceStatus: 'COMPLIANT',
    }
  );

  await upsertByFindFirst(
    prisma.license,
    { softwareId: adobeCC.id, licenseType: 'SUBSCRIPTION' },
    {
      softwareId: adobeCC.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 10,
      usedLicenses: 12,
      availableLicenses: -2,
      costPerLicense: 52.99,
      purchaseDate: addDays(now, -60),
      expirationDate: addDays(now, 290),
      renewalDate: addDays(now, 260),
      isAutoRenewal: false,
      complianceStatus: 'NON_COMPLIANT',
    }
  );

  await upsertByFindFirst(
    prisma.license,
    { softwareId: jira.id, licenseType: 'SUBSCRIPTION' },
    {
      softwareId: jira.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 50,
      usedLicenses: 35,
      availableLicenses: 15,
      costPerLicense: 7.50,
      purchaseDate: addDays(now, -45),
      expirationDate: addDays(now, 180),
      renewalDate: addDays(now, 150),
      isAutoRenewal: true,
      complianceStatus: 'COMPLIANT',
    }
  );
  console.log('Upserted licenses');

  const costs = [
    {
      softwareId: office365.id,
      costType: 'LICENSE',
      amount: 2200.00,
      currency: 'EUR',
      billingPeriod: 'MONTHLY',
      costDate: currentMonth,
      description: 'Monthly Office 365 E5 licenses',
      category: 'Productivity',
      department: 'IT',
    },
    {
      softwareId: adobeCC.id,
      costType: 'LICENSE',
      amount: 529.90,
      currency: 'EUR',
      billingPeriod: 'MONTHLY',
      costDate: currentMonth,
      description: 'Monthly Adobe Creative Cloud licenses',
      category: 'Creative',
      department: 'Marketing',
    },
    {
      softwareId: jira.id,
      costType: 'LICENSE',
      amount: 375.00,
      currency: 'EUR',
      billingPeriod: 'MONTHLY',
      costDate: currentMonth,
      description: 'Monthly Jira Cloud licenses',
      category: 'Project Management',
      department: 'Development',
    },
  ];

  for (const cost of costs) {
    await upsertByFindFirst(
      prisma.softwareCost,
      { softwareId: cost.softwareId, description: cost.description },
      cost
    );
  }
  console.log('Upserted costs');

  await prisma.complianceAlert.deleteMany({
    where: {
      title: {
        in: [
          'Microsoft Office 365 License Expiring',
          'Adobe Creative Suite License Overuse',
        ],
      },
    },
  });

  const alerts = [
    {
      title: 'Microsoft Office 365 License Renewal',
      description: `Office 365 licenses renew on ${addDays(now, 335).toISOString().slice(0, 10)}.`,
      alertType: 'LICENSE_EXPIRY',
      severity: 'HIGH',
      relatedEntity: office365.id,
      entityType: 'SOFTWARE',
      softwareId: office365.id,
      isResolved: false,
    },
    {
      title: 'Adobe Creative Cloud License Overuse',
      description: '12 of 10 Adobe Creative Cloud licenses are in use. Additional licenses required.',
      alertType: 'OVER_USAGE',
      severity: 'CRITICAL',
      relatedEntity: adobeCC.id,
      entityType: 'SOFTWARE',
      softwareId: adobeCC.id,
      isResolved: false,
    },
    {
      title: 'Atlassian Jira Contract Renewal',
      description: `Jira contract renewal preparation starts on ${addDays(now, 150).toISOString().slice(0, 10)}.`,
      alertType: 'CONTRACT_RENEWAL',
      severity: 'MEDIUM',
      relatedEntity: jira.id,
      entityType: 'SOFTWARE',
      softwareId: jira.id,
      isResolved: false,
    },
  ];

  for (const alert of alerts) {
    await upsertByFindFirst(prisma.complianceAlert, { title: alert.title }, alert);
  }
  console.log('Upserted alerts');

  await prisma.contract.upsert({
    where: { contractNumber: 'MSF-2024-001' },
    update: {
      vendorId: microsoft.id,
      title: 'Microsoft Enterprise Agreement',
      startDate: addDays(now, -90),
      endDate: addDays(now, 730),
      renewalDate: addDays(now, 670),
      contractValue: 50000.00,
      paymentTerms: 'Net 30',
      renewalTerms: 'Automatic renewal unless terminated 90 days prior',
      status: 'ACTIVE',
    },
    create: {
      vendorId: microsoft.id,
      contractNumber: 'MSF-2024-001',
      title: 'Microsoft Enterprise Agreement',
      startDate: addDays(now, -90),
      endDate: addDays(now, 730),
      renewalDate: addDays(now, 670),
      contractValue: 50000.00,
      paymentTerms: 'Net 30',
      renewalTerms: 'Automatic renewal unless terminated 90 days prior',
      status: 'ACTIVE',
    },
  });

  await prisma.contract.upsert({
    where: { contractNumber: 'ADB-2024-002' },
    update: {
      vendorId: adobe.id,
      title: 'Adobe Creative Cloud Enterprise Agreement',
      startDate: addDays(now, -60),
      endDate: addDays(now, 365),
      renewalDate: addDays(now, 320),
      contractValue: 15000.00,
      paymentTerms: 'Monthly billing',
      renewalTerms: 'Manual renewal required',
      status: 'ACTIVE',
    },
    create: {
      vendorId: adobe.id,
      contractNumber: 'ADB-2024-002',
      title: 'Adobe Creative Cloud Enterprise Agreement',
      startDate: addDays(now, -60),
      endDate: addDays(now, 365),
      renewalDate: addDays(now, 320),
      contractValue: 15000.00,
      paymentTerms: 'Monthly billing',
      renewalTerms: 'Manual renewal required',
      status: 'ACTIVE',
    },
  });
  console.log('Upserted contracts');

  await upsertByFindFirst(
    prisma.budget,
    { department: 'IT', category: 'Licenses' },
    {
      name: `Software Licenses ${fiscalYear}`,
      department: 'IT',
      category: 'Licenses',
      budgetAmount: 100000.00,
      spentAmount: 67500.00,
      remainingAmount: 32500.00,
      fiscalYear,
      startDate: startOfYear(now),
      endDate: endOfYear(now),
      notes: 'Annual budget for all software licenses',
    }
  );
  console.log('Upserted budgets');

  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error('Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

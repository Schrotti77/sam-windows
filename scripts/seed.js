const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('johndoe123', 12);

  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'IT_ADMIN'
    }
  });
  console.log('Created admin user: john@doe.com');

  const microsoft = await prisma.vendor.upsert({
    where: { name: 'Microsoft Corporation' },
    update: {},
    create: {
      name: 'Microsoft Corporation',
      contactEmail: 'enterprise@microsoft.com',
      contactPhone: '+1-425-882-8080',
      website: 'https://microsoft.com',
      accountManager: 'Sarah Johnson',
      supportEmail: 'support@microsoft.com',
      address: 'One Microsoft Way, Redmond, WA 98052, USA',
      isActive: true
    }
  });

  const adobe = await prisma.vendor.upsert({
    where: { name: 'Adobe Inc.' },
    update: {},
    create: {
      name: 'Adobe Inc.',
      contactEmail: 'enterprise@adobe.com',
      contactPhone: '+1-408-536-6000',
      website: 'https://adobe.com',
      accountManager: 'Michael Chen',
      supportEmail: 'support@adobe.com',
      address: '345 Park Avenue, San Jose, CA 95110, USA',
      isActive: true
    }
  });

  const atlassian = await prisma.vendor.upsert({
    where: { name: 'Atlassian Corporation' },
    update: {},
    create: {
      name: 'Atlassian Corporation',
      contactEmail: 'enterprise@atlassian.com',
      contactPhone: '+1-415-701-1111',
      website: 'https://atlassian.com',
      accountManager: 'Emma Rodriguez',
      supportEmail: 'support@atlassian.com',
      address: '350 Bush Street, San Francisco, CA 94104, USA',
      isActive: true
    }
  });
  console.log('Created vendors');

  const office365 = await prisma.software.create({
    data: {
      name: 'Microsoft Office 365',
      version: 'E5',
      category: 'SAAS',
      description: 'Office productivity suite with cloud services',
      vendorId: microsoft.id,
      isActive: true
    }
  });

  const adobeCC = await prisma.software.create({
    data: {
      name: 'Adobe Creative Cloud',
      version: '2024',
      category: 'DESKTOP',
      description: 'Creative software suite for design and multimedia',
      vendorId: adobe.id,
      isActive: true
    }
  });

  const jira = await prisma.software.create({
    data: {
      name: 'Atlassian Jira',
      version: 'Cloud',
      category: 'SAAS',
      description: 'Project management and issue tracking',
      vendorId: atlassian.id,
      isActive: true
    }
  });
  console.log('Created software');

  await prisma.license.create({
    data: {
      softwareId: office365.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 100,
      usedLicenses: 85,
      availableLicenses: 15,
      costPerLicense: 22.00,
      purchaseDate: new Date('2024-01-01'),
      expirationDate: new Date('2025-01-15'),
      renewalDate: new Date('2024-12-15'),
      isAutoRenewal: true,
      complianceStatus: 'COMPLIANT'
    }
  });

  await prisma.license.create({
    data: {
      softwareId: adobeCC.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 10,
      usedLicenses: 12,
      availableLicenses: -2,
      costPerLicense: 52.99,
      purchaseDate: new Date('2024-03-01'),
      expirationDate: new Date('2025-03-01'),
      renewalDate: new Date('2025-02-15'),
      isAutoRenewal: false,
      complianceStatus: 'NON_COMPLIANT'
    }
  });

  await prisma.license.create({
    data: {
      softwareId: jira.id,
      licenseType: 'SUBSCRIPTION',
      totalLicenses: 50,
      usedLicenses: 35,
      availableLicenses: 15,
      costPerLicense: 7.50,
      purchaseDate: new Date('2024-02-01'),
      expirationDate: new Date('2025-02-01'),
      renewalDate: new Date('2025-01-01'),
      isAutoRenewal: true,
      complianceStatus: 'COMPLIANT'
    }
  });
  console.log('Created licenses');

  await prisma.softwareCost.createMany({
    data: [
      {
        softwareId: office365.id,
        costType: 'LICENSE',
        amount: 2200.00,
        currency: 'EUR',
        billingPeriod: 'MONTHLY',
        costDate: new Date('2024-12-01'),
        description: 'Monthly Office 365 E5 licenses',
        category: 'Productivity',
        department: 'IT'
      },
      {
        softwareId: adobeCC.id,
        costType: 'LICENSE',
        amount: 529.90,
        currency: 'EUR',
        billingPeriod: 'MONTHLY',
        costDate: new Date('2024-12-01'),
        description: 'Monthly Adobe Creative Cloud licenses',
        category: 'Creative',
        department: 'Marketing'
      },
      {
        softwareId: jira.id,
        costType: 'LICENSE',
        amount: 375.00,
        currency: 'EUR',
        billingPeriod: 'MONTHLY',
        costDate: new Date('2024-12-01'),
        description: 'Monthly Jira Cloud licenses',
        category: 'Project Management',
        department: 'Development'
      }
    ]
  });
  console.log('Created costs');

  await prisma.complianceAlert.createMany({
    data: [
      {
        title: 'Microsoft Office 365 License Expiring',
        description: 'Office 365 licenses expire on January 15, 2025 and need to be renewed.',
        alertType: 'LICENSE_EXPIRY',
        severity: 'HIGH',
        relatedEntity: office365.id,
        entityType: 'SOFTWARE',
        softwareId: office365.id,
        isResolved: false
      },
      {
        title: 'Adobe Creative Suite License Overuse',
        description: '12 of 10 Adobe Creative Cloud licenses are in use. Additional licenses required.',
        alertType: 'OVER_USAGE',
        severity: 'CRITICAL',
        relatedEntity: adobeCC.id,
        entityType: 'SOFTWARE',
        softwareId: adobeCC.id,
        isResolved: false
      },
      {
        title: 'Atlassian Jira Contract Renewal',
        description: 'Jira contract expires in 30 days. Renewal negotiations should begin.',
        alertType: 'CONTRACT_RENEWAL',
        severity: 'MEDIUM',
        relatedEntity: jira.id,
        entityType: 'SOFTWARE',
        softwareId: jira.id,
        isResolved: false
      }
    ]
  });
  console.log('Created alerts');

  await prisma.contract.createMany({
    data: [
      {
        vendorId: microsoft.id,
        contractNumber: 'MSF-2024-001',
        title: 'Microsoft Enterprise Agreement',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        renewalDate: new Date('2025-10-01'),
        contractValue: 50000.00,
        paymentTerms: 'Net 30',
        renewalTerms: 'Automatic renewal unless terminated 90 days prior',
        status: 'ACTIVE'
      },
      {
        vendorId: adobe.id,
        contractNumber: 'ADB-2024-002',
        title: 'Adobe Creative Cloud Enterprise Agreement',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
        renewalDate: new Date('2024-12-01'),
        contractValue: 15000.00,
        paymentTerms: 'Monthly billing',
        renewalTerms: 'Manual renewal required',
        status: 'ACTIVE'
      }
    ]
  });
  console.log('Created contracts');

  await prisma.budget.create({
    data: {
      name: 'Software Licenses 2024',
      department: 'IT',
      category: 'Licenses',
      budgetAmount: 100000.00,
      spentAmount: 67500.00,
      remainingAmount: 32500.00,
      fiscalYear: 2024,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      notes: 'Annual budget for all software licenses'
    }
  });
  console.log('Created budgets');

  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error('Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

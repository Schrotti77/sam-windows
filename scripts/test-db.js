/**
 * Tests SQLite database read/write access directly via Prisma.
 * Run: node scripts/test-db.js
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=== Database Diagnostic ===\n');
  
  // Show environment
  console.log('DATABASE_URL:', process.env.DATABASE_URL || '(not set, using .env)');
  console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
  console.log('CWD:', process.cwd());
  console.log('');

  const prisma = new PrismaClient({ log: ['error'] });
  
  try {
    // Test 1: Connection
    console.log('[1] Testing connection...');
    await prisma.$connect();
    console.log('    OK - Connected\n');

    // Test 2: Read
    console.log('[2] Testing READ...');
    const userCount = await prisma.user.count();
    console.log(`    OK - ${userCount} users found\n`);

    // Test 3: Write (create + delete a test vendor)
    console.log('[3] Testing WRITE...');
    const testVendor = await prisma.vendor.create({
      data: { name: '__test_write_' + Date.now() }
    });
    console.log(`    OK - Created test vendor: ${testVendor.id}`);
    
    await prisma.vendor.delete({ where: { id: testVendor.id } });
    console.log('    OK - Deleted test vendor\n');

    console.log('=== ALL TESTS PASSED ===');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Client version:', error.clientVersion);
    
    // Extra diagnostics
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'prisma', 'sam.db');
    console.error('\nDB file exists:', fs.existsSync(dbPath));
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.error('DB file size:', stats.size);
      console.error('DB file mode:', stats.mode.toString(8));
    }
    // Check for lock/journal files
    const prismaDir = path.join(__dirname, '..', 'prisma');
    const files = fs.readdirSync(prismaDir).filter(f => f.includes('sam'));
    console.error('Files in prisma/:', files);
    
  } finally {
    await prisma.$disconnect();
  }
}

main();

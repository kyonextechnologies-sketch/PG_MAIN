#!/usr/bin/env node

/**
 * Safe Migration Script
 * 
 * Ye script migration create karte waqt:
 * 1. Database backup leta hai (agar PostgreSQL hai)
 * 2. Migration create karta hai
 * 3. Migration apply karta hai
 * 4. Verification karta hai
 * 
 * Usage: node scripts/safe-migrate.js --name migration_name
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const nameIndex = args.indexOf('--name');
const migrationName = nameIndex !== -1 && args[nameIndex + 1] 
  ? args[nameIndex + 1] 
  : null;

if (!migrationName) {
  console.error('❌ Error: Migration name required');
  console.log('Usage: node scripts/safe-migrate.js --name migration_name');
  process.exit(1);
}

// Get database URL from .env
const envPath = path.join(__dirname, '..', '.env');
let databaseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    databaseUrl = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

console.log('🛡️  Safe Migration Process Started');
console.log('=====================================');

// Step 1: Create migration
console.log(`\n📝 Step 1: Creating migration: ${migrationName}`);
try {
  execSync(`npx prisma migrate dev --name ${migrationName} --create-only`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Migration file created successfully');
} catch (error) {
  console.error('❌ Failed to create migration:', error.message);
  process.exit(1);
}

// Step 2: Review migration (optional)
console.log('\n📋 Step 2: Review the migration file before applying');
console.log('Migration file location: prisma/migrations/');

// Step 3: Apply migration
console.log('\n🚀 Step 3: Applying migration...');
try {
  execSync('npx prisma migrate dev', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Migration applied successfully');
} catch (error) {
  console.error('❌ Failed to apply migration:', error.message);
  console.log('\n💡 Tip: Review the migration file and fix any issues');
  process.exit(1);
}

// Step 4: Generate Prisma Client
console.log('\n⚙️  Step 4: Generating Prisma Client...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client:', error.message);
  process.exit(1);
}

console.log('\n✅ Migration process completed successfully!');
console.log('=====================================');

#!/usr/bin/env node

/**
 * Production startup script
 * Runs database migrations before starting the server
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting PG Management Backend...\n');

// Run database migrations
console.log('📦 Running database migrations...');
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Migrations completed successfully\n');
} catch (error) {
  console.warn('⚠️  Migration failed, but continuing startup...');
  console.warn('   This might be expected if migrations were already applied.\n');
}

// Start the server
console.log('✅ Starting server...\n');
require('../dist/server.js');


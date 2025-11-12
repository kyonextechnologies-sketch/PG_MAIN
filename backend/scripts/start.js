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
  // First, try to resolve any failed migrations
  try {
    console.log('🔧 Checking for failed migrations...');
    execSync('npx prisma migrate resolve --rolled-back 20251108041440_add_phone_verification', {
      stdio: 'pipe', // Use pipe to suppress output if migration doesn't exist
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
    });
    console.log('✅ Resolved failed phone verification migration\n');
  } catch (resolveError) {
    // Ignore if migration doesn't exist or already resolved
    // This is expected if the migration was never created or already resolved
  }

  // First try migrate deploy (for production)
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env },
  });
  console.log('✅ Migrations completed successfully\n');
} catch (error) {
  const errorMessage = error.message || error.toString();
  
  // Check if it's a failed migration error
  if (errorMessage.includes('failed migrations') || errorMessage.includes('P3009')) {
    console.warn('⚠️  Failed migrations detected, attempting to resolve...');
    try {
      // Try to resolve the failed migration
      execSync('npx prisma migrate resolve --rolled-back 20251108041440_add_phone_verification', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env },
      });
      console.log('✅ Failed migration resolved, retrying migrate deploy...');
      
      // Retry migrate deploy
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env },
      });
      console.log('✅ Migrations completed successfully\n');
    } catch (resolveError) {
      console.warn('⚠️  Could not resolve failed migration, using db push as fallback...');
      console.warn(`   Error: ${resolveError.message || resolveError.toString()}\n`);
      
      try {
        // Fallback: Use db push if migrate deploy fails
        // This syncs schema without migration history
        // Accept data loss for production deployments where schema changes are intentional
        console.log('📦 Attempting db push to sync schema...');
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
          env: { ...process.env },
        });
        console.log('✅ Database schema synced successfully\n');
      } catch (pushError) {
        console.error('❌ Database migration/sync failed');
        console.error('   The database may need manual migration setup\n');
        console.error('   Continuing startup - please check database connection\n');
        // Continue anyway - maybe database is already set up
      }
    }
  } else {
    console.warn('⚠️  migrate deploy failed, trying db push as fallback...');
    console.warn(`   Error: ${errorMessage}\n`);
    
    try {
      // Fallback: Use db push if migrate deploy fails (for fresh databases)
      // This syncs schema without migration history
      // Accept data loss for production deployments where schema changes are intentional
      console.log('📦 Attempting db push to sync schema...');
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env },
      });
      console.log('✅ Database schema synced successfully\n');
    } catch (pushError) {
      console.error('❌ Database migration/sync failed');
      console.error('   The database may need manual migration setup\n');
      console.error('   Continuing startup - please check database connection\n');
      // Continue anyway - maybe database is already set up
    }
  }
}

// Start the server
console.log('✅ Starting server...\n');
require('../dist/server.js');


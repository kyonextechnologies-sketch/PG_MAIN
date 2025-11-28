/**
 * Monthly Invoice Generator
 * 
 * Generates invoices for all active tenants on the 28th of each month.
 * Can be run manually for testing or scheduled via cron.
 * 
 * Usage:
 *   npm run generate-invoices              # Generate for current month
 *   npm run generate-invoices -- --test    # Test mode (dry run)
 *   npm run generate-invoices -- --month=2024-01  # Generate for specific month
 */

import prisma from '../src/config/database';
import { generateInvoicesForOwner } from '../src/services/billing.service';

interface GenerateOptions {
  test?: boolean;
  month?: string;
  ownerId?: string;
}

async function generateMonthlyInvoices(options: GenerateOptions = {}) {
  const { test = false, month, ownerId } = options;

  // Determine target month
  let targetMonth: string;
  if (month) {
    targetMonth = month;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    targetMonth = `${year}-${monthNum}`;
  }

  console.log(`\n📅 Generating invoices for month: ${targetMonth}`);
  if (test) {
    console.log('🧪 TEST MODE: No invoices will be created');
  }
  console.log('─'.repeat(50));

  try {
    // Get all owners (or specific owner if ownerId provided)
    const whereClause = ownerId ? { id: ownerId, role: 'OWNER' as const } : { role: 'OWNER' as const };
    
    const owners = await prisma.user.findMany({
      where: {
        ...whereClause,
        isActive: true,
        autoGenerateInvoices: true, // Only owners with auto-generate enabled
      },
      select: {
        id: true,
        name: true,
        email: true,
        autoGenerateInvoices: true,
      },
    });

    if (owners.length === 0) {
      console.log('ℹ️  No owners found with auto-generate invoices enabled');
      return;
    }

    console.log(`\n👥 Found ${owners.length} owner(s) with auto-generate enabled\n`);

    let totalGenerated = 0;
    let totalErrors = 0;

    for (const owner of owners) {
      try {
        console.log(`\n🏢 Processing owner: ${owner.name} (${owner.id})`);
        
        if (test) {
          // In test mode, just count what would be generated
          const tenants = await prisma.tenantProfile.findMany({
            where: {
              ownerId: owner.id,
              status: 'ACTIVE',
            },
            select: { id: true, name: true },
          });

          const existingInvoices = await prisma.invoice.findMany({
            where: {
              ownerId: owner.id,
              month: targetMonth,
            },
            select: { id: true, tenantId: true },
          });

          const existingTenantIds = new Set(existingInvoices.map(inv => inv.tenantId));
          const tenantsNeedingInvoices = tenants.filter(t => !existingTenantIds.has(t.id));

          console.log(`   📊 Would generate ${tenantsNeedingInvoices.length} invoice(s) for ${tenants.length} active tenant(s)`);
          totalGenerated += tenantsNeedingInvoices.length;
        } else {
          // Actually generate invoices
          const count = await generateInvoicesForOwner(owner.id, targetMonth);
          console.log(`   ✅ Generated ${count} invoice(s)`);
          totalGenerated += count;
        }
      } catch (error) {
        console.error(`   ❌ Error processing owner ${owner.name}:`, error);
        totalErrors++;
      }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Total invoices ${test ? 'that would be ' : ''}generated: ${totalGenerated}`);
    if (totalErrors > 0) {
      console.log(`   ❌ Errors: ${totalErrors}`);
    }
    console.log(`\n✅ Invoice generation ${test ? 'test ' : ''}completed!\n`);
  } catch (error) {
    console.error('❌ Fatal error during invoice generation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: GenerateOptions = {};

args.forEach((arg) => {
  if (arg === '--test') {
    options.test = true;
  } else if (arg.startsWith('--month=')) {
    options.month = arg.split('=')[1];
  } else if (arg.startsWith('--owner=')) {
    options.ownerId = arg.split('=')[1];
  }
});

// Run the generator
generateMonthlyInvoices(options)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });


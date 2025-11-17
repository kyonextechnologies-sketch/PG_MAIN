/**
 * Simple script to create admin user with existing schema
 * Run: npx ts-node scripts/create-admin-simple.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...\n');

    const hashedPassword = await bcrypt.hash('Anshaj@2307', 10);

    // Try to find existing user first
    const existing = await prisma.user.findUnique({
      where: { email: 'anshaj.admin@pgms.com' },
    });

    if (existing) {
      // Update existing user to ADMIN role
      const updated = await prisma.user.update({
        where: { email: 'anshaj.admin@pgms.com' },
        data: {
          role: 'ADMIN' as any, // Force cast to bypass type check
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log('✅ Existing user updated to ADMIN role!\n');
      console.log('📧 Email:', updated.email);
      console.log('🔑 Password: Anshaj@2307');
      console.log('👤 Role:', updated.role);
    } else {
      // Create new admin user (with only existing fields)
      const admin = await prisma.user.create({
        data: {
          email: 'anshaj.admin@pgms.com',
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN' as any, // Force cast to bypass type check
          isActive: true,
        },
      });
      console.log('✅ Admin user created successfully!\n');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password: Anshaj@2307');
      console.log('👤 Role:', admin.role);
    }

    console.log('\n🚀 You can now login at: http://localhost:3000/login');
    console.log('🔐 Then access admin portal at: http://localhost:3000/admin\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. If role ADMIN not allowed, try registering normally first');
    console.log('2. Then run this SQL in your database:');
    console.log(`   UPDATE "User" SET role = 'ADMIN' WHERE email = 'anshaj.admin@pgms.com';`);
    console.log('3. Or use Prisma Studio: npx prisma studio');
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


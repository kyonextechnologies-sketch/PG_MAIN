/**
 * Script to create admin user manually
 * Run: npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...\n');

    const hashedPassword = await bcrypt.hash('Anshaj@2307', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'anshaj.admin@pgms.com' },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'anshaj.admin@pgms.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Anshaj@2307');
    console.log('👤 Role:', admin.role);
    console.log('\n🚀 You can now login at: http://localhost:3000/login');
    console.log('🔐 Then access admin portal at: http://localhost:3000/admin\n');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


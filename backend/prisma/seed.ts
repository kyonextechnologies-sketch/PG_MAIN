import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean database
  await prisma.maintenanceTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.electricityBill.deleteMany();
  await prisma.electricitySettings.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.tenantProfile.deleteMany();
  await prisma.property.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@pgmanagement.com',
      password: hashedPassword,
      name: 'John Owner',
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log('✅ Owner created');

  // Create Electricity Settings
  await prisma.electricitySettings.create({
    data: {
      ownerId: owner.id,
      ratePerUnit: 6.5,
      dueDate: 5,
      isEnabled: true,
      lateFeePercentage: 2.0,
      minimumUnits: 0,
      maximumUnits: 1000,
      billingCycle: 'MONTHLY',
    },
  });

  console.log('✅ Electricity settings created');

  // Create Properties
  const property1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: 'Green Valley PG',
      address: '123 Main Street, Block A',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      totalRooms: 5,
      totalBeds: 15,
      amenities: ['WiFi', 'AC', 'Laundry', 'Parking', 'Security'],
      active: true,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: 'Sunrise Heights PG',
      address: '456 Park Road, Sector 2',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560002',
      totalRooms: 3,
      totalBeds: 9,
      amenities: ['WiFi', 'Laundry', 'Security', 'Kitchen'],
      active: true,
    },
  });

  console.log('✅ Properties created');

  // Create Rooms for Property 1
  const room1 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: 'Room A1',
      roomNumber: 'A1',
      floor: 1,
      capacity: 3,
      occupied: 2,
      rentPerBed: 5000,
    },
  });

  const room2 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: 'Room A2',
      roomNumber: 'A2',
      floor: 1,
      capacity: 3,
      occupied: 1,
      rentPerBed: 5500,
    },
  });

  await prisma.room.create({
    data: {
      propertyId: property2.id,
      name: 'Room B1',
      roomNumber: 'B1',
      floor: 1,
      capacity: 3,
      occupied: 0,
      rentPerBed: 6000,
    },
  });

  console.log('✅ Rooms created');

  // Create Beds
  const bed1 = await prisma.bed.create({
    data: {
      roomId: room1.id,
      name: 'Bed 1',
      bedNumber: '1',
      occupied: true,
    },
  });

  const bed2 = await prisma.bed.create({
    data: {
      roomId: room1.id,
      name: 'Bed 2',
      bedNumber: '2',
      occupied: true,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room1.id,
      name: 'Bed 3',
      bedNumber: '3',
      occupied: false,
    },
  });

  const bed4 = await prisma.bed.create({
    data: {
      roomId: room2.id,
      name: 'Bed 1',
      bedNumber: '1',
      occupied: true,
    },
  });

  console.log('✅ Beds created');

  // Create Tenants
  const tenant1User = await prisma.user.create({
    data: {
      email: 'tenant1@example.com',
      password: hashedPassword,
      name: 'Alice Tenant',
      role: 'TENANT',
      isActive: true,
    },
  });

  const tenant1 = await prisma.tenantProfile.create({
    data: {
      userId: tenant1User.id,
      ownerId: owner.id,
      name: 'Alice Tenant',
      email: 'tenant1@example.com',
      phone: '9876543210',
      kycId: 'AADHAR123456',
      propertyId: property1.id,
      roomId: room1.id,
      bedId: bed1.id,
      status: 'ACTIVE',
      moveInDate: new Date('2024-01-01'),
      securityDeposit: 10000,
      monthlyRent: 5000,
    },
  });

  await prisma.bed.update({
    where: { id: bed1.id },
    data: { tenantId: tenant1.id },
  });

  const tenant2User = await prisma.user.create({
    data: {
      email: 'tenant2@example.com',
      password: hashedPassword,
      name: 'Bob Tenant',
      role: 'TENANT',
      isActive: true,
    },
  });

  const tenant2 = await prisma.tenantProfile.create({
    data: {
      userId: tenant2User.id,
      ownerId: owner.id,
      name: 'Bob Tenant',
      email: 'tenant2@example.com',
      phone: '9876543211',
      kycId: 'AADHAR654321',
      propertyId: property1.id,
      roomId: room1.id,
      bedId: bed2.id,
      status: 'ACTIVE',
      moveInDate: new Date('2024-01-15'),
      securityDeposit: 10000,
      monthlyRent: 5000,
    },
  });

  await prisma.bed.update({
    where: { id: bed2.id },
    data: { tenantId: tenant2.id },
  });

  const tenant3User = await prisma.user.create({
    data: {
      email: 'tenant3@example.com',
      password: hashedPassword,
      name: 'Charlie Tenant',
      role: 'TENANT',
      isActive: true,
    },
  });

  const tenant3 = await prisma.tenantProfile.create({
    data: {
      userId: tenant3User.id,
      ownerId: owner.id,
      name: 'Charlie Tenant',
      email: 'tenant3@example.com',
      phone: '9876543212',
      kycId: 'AADHAR789012',
      propertyId: property1.id,
      roomId: room2.id,
      bedId: bed4.id,
      status: 'ACTIVE',
      moveInDate: new Date('2024-02-01'),
      securityDeposit: 11000,
      monthlyRent: 5500,
    },
  });

  await prisma.bed.update({
    where: { id: bed4.id },
    data: { tenantId: tenant3.id },
  });

  console.log('✅ Tenants created');

  // Create Electricity Bills
  await prisma.electricityBill.createMany({
    data: [
      {
        ownerId: owner.id,
        tenantId: tenant1.id,
        month: '2024-01',
        previousReading: 1000,
        currentReading: 1150,
        units: 150,
        ratePerUnit: 6.5,
        amount: 975,
        status: 'APPROVED',
        approvedAt: new Date('2024-01-25'),
      },
      {
        ownerId: owner.id,
        tenantId: tenant2.id,
        month: '2024-01',
        previousReading: 500,
        currentReading: 620,
        units: 120,
        ratePerUnit: 6.5,
        amount: 780,
        status: 'APPROVED',
        approvedAt: new Date('2024-01-25'),
      },
      {
        ownerId: owner.id,
        tenantId: tenant1.id,
        month: '2024-02',
        previousReading: 1150,
        currentReading: 1280,
        units: 130,
        ratePerUnit: 6.5,
        amount: 845,
        status: 'PENDING',
      },
    ],
  });

  console.log('✅ Electricity bills created');

  // Create Invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      ownerId: owner.id,
      tenantId: tenant1.id,
      month: '2024-01',
      baseRent: 5000,
      electricityCharges: 975,
      otherCharges: 0,
      lateFees: 0,
      amount: 5975,
      dueDate: new Date('2024-02-05'),
      status: 'PAID',
      paidAt: new Date('2024-02-03'),
      receiptNo: 'RCP-202401-12345',
    },
  });

  await prisma.invoice.create({
    data: {
      ownerId: owner.id,
      tenantId: tenant2.id,
      month: '2024-01',
      baseRent: 5000,
      electricityCharges: 780,
      otherCharges: 0,
      lateFees: 0,
      amount: 5780,
      dueDate: new Date('2024-02-05'),
      status: 'DUE',
    },
  });

  await prisma.invoice.create({
    data: {
      ownerId: owner.id,
      tenantId: tenant3.id,
      month: '2024-02',
      baseRent: 5500,
      electricityCharges: 0,
      otherCharges: 0,
      lateFees: 0,
      amount: 5500,
      dueDate: new Date('2024-03-05'),
      status: 'DUE',
    },
  });

  console.log('✅ Invoices created');

  // Create Payments
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      tenantId: tenant1.id,
      amount: 5975,
      method: 'UPI',
      status: 'SUCCESS',
      transactionId: 'TXN123456789',
      upiTransactionId: '402993715517',
    },
  });

  console.log('✅ Payments created');

  // Create Maintenance Tickets
  await prisma.maintenanceTicket.createMany({
    data: [
      {
        ownerId: owner.id,
        tenantId: tenant1.id,
        propertyId: property1.id,
        title: 'AC not cooling properly',
        description: 'The AC in room A1 is not cooling as expected. Please check.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'AC',
      },
      {
        ownerId: owner.id,
        tenantId: tenant2.id,
        propertyId: property1.id,
        title: 'Leaking tap in bathroom',
        description: 'The tap in the bathroom is leaking continuously.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'PLUMBING',
      },
      {
        ownerId: owner.id,
        tenantId: tenant3.id,
        propertyId: property1.id,
        title: 'WiFi connection issues',
        description: 'WiFi keeps disconnecting frequently in room A2.',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        category: 'WIFI',
        resolvedAt: new Date('2024-02-10'),
      },
    ],
  });

  console.log('✅ Maintenance tickets created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Owner: owner@pgmanagement.com / password123');
  console.log('Tenant 1: tenant1@example.com / password123');
  console.log('Tenant 2: tenant2@example.com / password123');
  console.log('Tenant 3: tenant3@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


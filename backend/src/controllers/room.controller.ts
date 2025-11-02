import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export const createRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { propertyId, name, roomNumber, floor, capacity, rentPerBed, sharingType } = req.body;

  // Verify property ownership
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: req.user.id },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Check for duplicate room number
  const existingRoom = await prisma.room.findFirst({
    where: { propertyId, roomNumber },
  });

  if (existingRoom) {
    throw new AppError('Room number already exists in this property', 400);
  }

  // Validate sharingType
  const validSharingTypes = ['single', 'double', 'triple'];
  if (sharingType && !validSharingTypes.includes(sharingType)) {
    throw new AppError('Invalid sharing type. Must be single, double, or triple', 400);
  }

  const room = await prisma.room.create({
    data: {
      propertyId,
      name,
      roomNumber,
      floor,
      capacity,
      rentPerBed,
      sharingType: sharingType || "double",
    },
  });

  // ✅ CREATE BEDS FOR THIS ROOM
  console.log('🛏️ Creating', capacity, 'beds for room:', roomNumber);
  const beds = [];
  for (let i = 0; i < capacity; i++) {
    const bedNumber = String(i + 1); // 1, 2, 3, etc
    const bedName = String.fromCharCode(65 + i); // A, B, C, D, etc
    const bed = await prisma.bed.create({
      data: {
        roomId: room.id,
        name: `Bed ${bedName}`,
        bedNumber: bedNumber,
        occupied: false,
      },
    });
    beds.push(bed);
    console.log('✅ Created bed:', bed.name);
  }

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: {
      ...room,
      beds,  // ✅ Return beds in response
    },
  });
});

export const getRoomsByProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { propertyId } = req.params;

  // Verify property ownership
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: req.user.id },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  console.log('🔍 [getRoomsByProperty] Fetching rooms for property:', propertyId);

  const rooms = await prisma.room.findMany({
    where: { propertyId },
    include: {
      beds: true,
      _count: {
        select: { tenants: true },
      },
    },
    orderBy: { roomNumber: 'asc' },
  });

  console.log('📦 [getRoomsByProperty] Found rooms:', rooms.length);
  rooms.forEach((room, idx) => {
    console.log(`  Room ${idx + 1}: ID=${room.id}, Beds=${room.beds?.length || 0}`, {
      roomNumber: room.roomNumber,
      bedsCount: room.beds?.length,
      bedIds: room.beds?.map(b => b.id)
    });
  });

  res.json({
    success: true,
    message: 'Rooms fetched successfully',
    data: rooms,
  });
});

// ✅ NEW ENDPOINT: Fix missing beds for existing rooms
export const fixMissingBeds = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  console.log('🔧 [fixMissingBeds] Checking for rooms without beds...');

  const roomsWithoutBeds = await prisma.room.findMany({
    include: { beds: true },
  });

  let fixedCount = 0;
  const fixedRooms = [];

  for (const room of roomsWithoutBeds) {
    if (room.beds.length === 0) {
      console.log(`⚠️ [fixMissingBeds] Room ${room.roomNumber} has no beds, creating ${room.capacity} beds...`);
      
      const beds = [];
      for (let i = 0; i < room.capacity; i++) {
        const bedNumber = String(i + 1);
        const bedName = String.fromCharCode(65 + i);
        const bed = await prisma.bed.create({
          data: {
            roomId: room.id,
            name: `Bed ${bedName}`,
            bedNumber: bedNumber,
            occupied: false,
          },
        });
        beds.push(bed);
      }
      
      fixedRooms.push({
        roomId: room.id,
        roomNumber: room.roomNumber,
        bedsCreated: beds.length,
      });
      fixedCount++;
      console.log(`✅ [fixMissingBeds] Fixed room ${room.roomNumber} with ${beds.length} beds`);
    }
  }

  res.json({
    success: true,
    message: `Fixed ${fixedCount} rooms by creating missing beds`,
    data: {
      fixedCount,
      fixedRooms,
      totalRoomsChecked: roomsWithoutBeds.length,
    },
  });
});

// ✅ NEW ENDPOINT: Diagnostic - Check database state
export const diagnosticBeds = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🔍 [diagnosticBeds] Running diagnostic...');

  // Count total beds
  const totalBeds = await prisma.bed.count();
  
  // Count total rooms
  const totalRooms = await prisma.room.count();
  
  // Get all rooms with their beds count
  const roomsWithBeds = await prisma.room.findMany({
    include: {
      _count: {
        select: { beds: true }
      },
      beds: {
        select: { id: true, name: true, occupied: true }
      }
    }
  });
  
  // Get all user's rooms with beds
  let userRoomsWithBeds: any[] = [];
  if (req.user) {
    userRoomsWithBeds = await prisma.room.findMany({
      where: {
        property: { ownerId: req.user.id }
      },
      include: {
        property: { select: { name: true } },
        beds: {
          select: { id: true, name: true, bedNumber: true, occupied: true }
        }
      }
    });
  }

  console.log('📊 [diagnosticBeds] Diagnostic Results:', {
    totalBeds,
    totalRooms,
    roomsWithBeds: roomsWithBeds.map(r => ({
      id: r.id,
      roomNumber: r.roomNumber,
      capacity: r.capacity,
      bedsCount: r._count.beds,
      beds: r.beds
    }))
  });

  res.json({
    success: true,
    message: 'Diagnostic data',
    data: {
      totalBeds,
      totalRooms,
      roomsWithBeds: roomsWithBeds.map(r => ({
        id: r.id,
        roomNumber: r.roomNumber,
        capacity: r.capacity,
        bedsCount: r._count.beds,
        beds: r.beds
      })),
      userRoomsWithBeds: userRoomsWithBeds.map(r => ({
        id: r.id,
        roomNumber: r.roomNumber,
        propertyName: r.property.name,
        capacity: r.capacity,
        bedsCount: r.beds.length,
        beds: r.beds
      }))
    }
  });
});

export const getRoomById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params as any;

  const room = await prisma.room.findFirst({
    where: { id },
    include: {
      property: true,
      beds: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!room || room.property.ownerId !== req.user.id) {
    throw new AppError('Room not found', 404);
  }

  res.json({
    success: true,
    message: 'Room fetched successfully',
    data: room,
  });
});

export const updateRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params as any;
  const { roomNumber, floor, capacity, rentPerBed, sharingType } = req.body;

  const room = await prisma.room.findFirst({
    where: { id },
    include: { property: true },
  });

  if (!room || room.property.ownerId !== req.user.id) {
    throw new AppError('Room not found', 404);
  }

  // ✅ Build update data with only valid fields
  const updateData: any = {};

  if (roomNumber !== undefined) {
    if (typeof roomNumber !== 'string' || roomNumber.trim().length === 0) {
      throw new AppError('Room number must be a non-empty string', 400);
    }
    updateData.roomNumber = roomNumber;
  }

  if (floor !== undefined) {
    const floorNum = Number(floor);
    if (isNaN(floorNum) || floorNum < 0) {
      throw new AppError('Floor must be a non-negative number', 400);
    }
    updateData.floor = floorNum;
  }

  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (isNaN(cap) || cap < 1) {
      throw new AppError('Capacity must be a positive number', 400);
    }
    updateData.capacity = cap;
  }

  if (rentPerBed !== undefined) {
    const rent = Number(rentPerBed);
    if (isNaN(rent) || rent < 0) {
      throw new AppError('Rent per bed must be a non-negative number', 400);
    }
    updateData.rentPerBed = new Prisma.Decimal(rent);
  }

  if (sharingType !== undefined) {
    if (typeof sharingType !== 'string' || !['single', 'double', 'triple'].includes(sharingType)) {
      throw new AppError('Sharing type must be one of: single, double, triple', 400);
    }
    updateData.sharingType = sharingType;
  }

  // ✅ Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    res.json({
      success: true,
      message: 'No changes to update',
      data: room,
    });
    return;
  }

  const updatedRoom = await prisma.room.update({
    where: { id },
    data: updateData,
    include: {
      property: { select: { id: true, name: true } },
      beds: { select: { id: true, bedNumber: true, occupied: true } },
    },
  });

  res.json({
    success: true,
    message: 'Room updated successfully',
    data: updatedRoom,
  });
});

export const deleteRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params as any;

  const room = await prisma.room.findFirst({
    where: { id },
    include: { property: true },
  });

  if (!room || room.property.ownerId !== req.user.id) {
    throw new AppError('Room not found', 404);
  }

  if (room.occupied > 0) {
    throw new AppError('Cannot delete room with occupied beds', 400);
  }

  await prisma.room.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Room deleted successfully',
  });
});

// Bed Management
export const createBed = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { roomId, name, bedNumber } = req.body as any;

  const room = await prisma.room.findFirst({
    where: { id: roomId },
    include: { property: true, beds: true },
  });

  if (!room || room.property.ownerId !== req.user.id) {
    throw new AppError('Room not found', 404);
  }

  // Check if bed limit reached
  if (room.beds.length >= room.capacity) {
    throw new AppError('Room capacity reached', 400);
  }

  // Check for duplicate bed number
  const existingBed = await prisma.bed.findFirst({
    where: { roomId, bedNumber },
  });

  if (existingBed) {
    throw new AppError('Bed number already exists in this room', 400);
  }

  const bed = await prisma.bed.create({
    data: { roomId, name, bedNumber },
  });

  res.status(201).json({
    success: true,
    message: 'Bed created successfully',
    data: bed,
  });
});

export const getBedsByRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { roomId } = req.params as any;

  const room = await prisma.room.findFirst({
    where: { id: roomId },
    include: { property: true },
  });

  if (!room || room.property.ownerId !== req.user.id) {
    throw new AppError('Room not found', 404);
  }

  const beds = await prisma.bed.findMany({
    where: { roomId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: { bedNumber: 'asc' },
  });

  res.json({
    success: true,
    message: 'Beds fetched successfully',
    data: beds,
  });
});

export const updateBed = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params as any;
  const updateData = req.body;

  const bed = await prisma.bed.findFirst({
    where: { id },
    include: { room: { include: { property: true } } },
  });

  if (!bed || bed.room.property.ownerId !== req.user.id) {
    throw new AppError('Bed not found', 404);
  }

  const updatedBed = await prisma.bed.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'Bed updated successfully',
    data: updatedBed,
  });
});

export const deleteBed = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params as any;

  const bed = await prisma.bed.findFirst({
    where: { id },
    include: { room: { include: { property: true } } },
  });

  if (!bed || bed.room.property.ownerId !== req.user.id) {
    throw new AppError('Bed not found', 404);
  }

  if (bed.occupied) {
    throw new AppError('Cannot delete occupied bed', 400);
  }

  await prisma.bed.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Bed deleted successfully',
  });
});


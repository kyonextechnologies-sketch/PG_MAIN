import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generatePaginatedResponse } from '../utils/helpers';

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Property created successfully
 */
export const createProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { name, address, city, state, pincode, totalRooms, totalBeds, amenities } = req.body;

  const property = await prisma.property.create({
    data: {
      ownerId: req.user.id,
      name,
      address,
      city,
      state,
      pincode,
      totalRooms,
      totalBeds,
      amenities: amenities || [],
    },
  });

  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: property,
  });
});

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Properties fetched successfully
 */
export const getAllProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const city = req.query.city as string;
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    ownerId: req.user.id,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  if (active !== undefined) {
    where.active = active;
  }

  // Get properties with pagination
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            rooms: true,
            tenants: true,
          },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  const response = generatePaginatedResponse(properties, total, { page, limit });
  res.json(response);
});

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property fetched successfully
 */
export const getPropertyById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: req.user.id,
    },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      _count: {
        select: {
          tenants: true,
        },
      },
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  res.json({
    success: true,
    message: 'Property fetched successfully',
    data: property,
  });
});

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Property updated successfully
 */
export const updateProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;
  const { name, address, city, state, pincode, totalRooms, totalBeds, amenities, active } = req.body;

  // Check if property exists and belongs to user
  const existingProperty = await prisma.property.findFirst({
    where: {
      id,
      ownerId: req.user.id,
    },
  });

  if (!existingProperty) {
    throw new AppError('Property not found', 404);
  }

  // ✅ Build update data with only valid fields
  const updateData: any = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('Property name must be a non-empty string', 400);
    }
    updateData.name = name;
  }

  if (address !== undefined) {
    updateData.address = address;
  }

  if (city !== undefined) {
    updateData.city = city;
  }

  if (state !== undefined) {
    updateData.state = state;
  }

  if (pincode !== undefined) {
    updateData.pincode = pincode;
  }

  if (totalRooms !== undefined) {
    const rooms = Number(totalRooms);
    if (isNaN(rooms) || rooms < 1) {
      throw new AppError('Total rooms must be a positive number', 400);
    }
    updateData.totalRooms = rooms;
  }

  if (totalBeds !== undefined) {
    const beds = Number(totalBeds);
    if (isNaN(beds) || beds < 1) {
      throw new AppError('Total beds must be a positive number', 400);
    }
    updateData.totalBeds = beds;
  }

  if (amenities !== undefined) {
    if (!Array.isArray(amenities)) {
      throw new AppError('Amenities must be an array', 400);
    }
    updateData.amenities = amenities;
  }

  if (active !== undefined) {
    if (typeof active !== 'boolean') {
      throw new AppError('Active must be a boolean', 400);
    }
    updateData.active = active;
  }

  // ✅ Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    res.json({
      success: true,
      message: 'No changes to update',
      data: existingProperty,
    });
    return;
  }

  const property = await prisma.property.update({
    where: { id },
    data: updateData,
    include: {
      rooms: { include: { beds: true } },
    },
  });

  res.json({
    success: true,
    message: 'Property updated successfully',
    data: property,
  });
});

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 */
export const deleteProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if property exists and belongs to user
  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: req.user.id,
    },
    include: {
      _count: {
        select: {
          tenants: true,
        },
      },
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Check if property has active tenants
  if (property._count.tenants > 0) {
    throw new AppError('Cannot delete property with active tenants', 400);
  }

  await prisma.property.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Property deleted successfully',
  });
});

/**
 * @swagger
 * /properties/{id}/stats:
 *   get:
 *     summary: Get property statistics
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property statistics fetched successfully
 */
export const getPropertyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: req.user.id,
    },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      tenants: {
        where: {
          status: 'ACTIVE',
        },
      },
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const totalBeds = property.rooms.reduce((sum: number, room: any) => sum + room.capacity, 0);
  const occupiedBeds = property.rooms.reduce((sum: number, room: any) => sum + room.occupied, 0);
  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  const stats = {
    totalRooms: property.totalRooms,
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    activeTenants: property.tenants.length,
  };

  res.json({
    success: true,
    message: 'Property statistics fetched successfully',
    data: stats,
  });
});


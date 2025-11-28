import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import { AppError } from './errorHandler';
import prisma from '../config/database';
import { sessionCache } from '../lib/cache/redisClient';

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let userId: string | null = null;

    // Method 1: Check Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || '3nshd7rhdn839jshydbchs74jsnheyn6'
        ) as JwtPayload;
        userId = decoded.id;
      } catch (tokenError) {
        // Token verification failed, continue to check other methods
        console.log('Bearer token verification failed');
      }
    }

    // Method 2: Check X-User-ID header (for NextAuth integration)
    // This is sent by the frontend when using NextAuth
    if (!userId) {
      const userIdHeader = req.headers['x-user-id'] as string;
      if (userIdHeader) {
        userId = userIdHeader;
      }
    }

    if (!userId) {
      throw new AppError('No valid authentication found', 401);
    }

    // Check cache first for session data
    const cachedSession = await sessionCache.get(userId);
    let user;

    if (cachedSession) {
      // Use cached data
      user = {
        id: cachedSession.userId,
        email: cachedSession.email,
        role: cachedSession.role as 'OWNER' | 'TENANT' | 'ADMIN',
        isActive: true, // Assume active if cached
      };
    } else {
      // Check database
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!dbUser || !dbUser.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      user = dbUser;

      // Cache session data (24 hour TTL)
      await sessionCache.set(userId, {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      }, 86400);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let userId: string | null = null;

    // Method 1: Check Bearer token
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as JwtPayload;
        userId = decoded.id;
      } catch (tokenError) {
        console.log('Bearer token verification failed');
      }
    }

    // Method 2: Check X-User-ID header
    if (!userId) {
      const userIdHeader = req.headers['x-user-id'] as string;
      if (userIdHeader) {
        userId = userIdHeader;
      }
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

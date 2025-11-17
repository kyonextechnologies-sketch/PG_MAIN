import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  verifyStoredRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
} from '../utils/auth';
import { sendEmail } from '../utils/email';
import { validateVerificationToken } from '../services/otp.service';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [OWNER, TENANT]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name, role, phone, phoneVerificationToken } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // For OWNER role, validate phone verification if phone is provided
  let phoneValidated = false;
  if (role === 'OWNER' && phone) {
    if (!phoneVerificationToken) {
      throw new AppError('Phone verification is required. Please verify your phone number with OTP first.', 400);
    }

    // Validate the phoneVerificationToken against database
    try {
      const validation = await validateVerificationToken(phone, phoneVerificationToken);
      phoneValidated = validation.valid;
      console.log('✅ Phone verification token validated for:', phone);
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      throw error; // Re-throw the validation error
    }
  }

  // Log registration attempt
  console.log('📝 Registration request:', { 
    email: normalizedEmail, 
    role, 
    phone: phone ? phone.substring(0, 6) + '****' : 'not provided',
    phoneVerified: phoneValidated
  });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // If phone provided, check if it's already registered
  if (phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingPhone) {
      throw new AppError('This phone number is already registered', 400);
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  console.log('Registering user:', { email: normalizedEmail, role, phone: phone ? '***' : null });

  // Create user
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
      phone: phone || null,
      phoneVerified: phoneValidated, // Use validated status from token check
      phoneVerifiedAt: phoneValidated ? new Date() : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      phoneVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  // If owner, create verification record
  if (role === 'OWNER') {
    await prisma.ownerVerification.create({
      data: {
        ownerId: user.id,
        verificationStatus: 'PENDING',
      },
    });
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, passwordLength: password?.length });

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    console.log('User not found with email:', email);
    throw new AppError('Invalid email or password', 401);
  }

  console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  console.log('Password valid:', isPasswordValid);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
export const refreshAccessToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if token exists in database
  const isValid = await verifyStoredRefreshToken(refreshToken);

  if (!isValid) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Generate new access token
  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };

  const accessToken = generateAccessToken(payload);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
    },
  });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  // Delete refresh token
  await deleteRefreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 */
export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Delete all refresh tokens for user
  await deleteAllUserRefreshTokens(req.user.id);

  res.json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile fetched successfully',
    data: user,
  });
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { currentPassword, newPassword } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Security: Don't reveal if email exists
    return res.json({
      success: true,
      message: 'If email exists, password reset link has been sent',
    });
  }

  // Generate reset token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const hashedToken = require('crypto').createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  // Save reset token to database
  await prisma.passwordReset.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt,
    },
  });

  // Create reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.name,
        resetUrl: resetLink,
      },
    });

    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new AppError('Failed to send reset email', 500);
  }

  return res.json({
    success: true,
    message: 'If email exists, password reset link has been sent',
  });
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  // Hash the token to match database
  const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');

  // Find reset token
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new AppError('Invalid reset token', 400);
  }

  // Check if token has expired
  if (new Date() > resetRecord.expiresAt) {
    // Delete expired token
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });
    throw new AppError('Reset token has expired', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { password: hashedPassword },
  });

  // Delete used reset token
  await prisma.passwordReset.delete({
    where: { id: resetRecord.id },
  });

  // Delete all refresh tokens for this user (force re-login on all devices)
  await prisma.refreshToken.deleteMany({
    where: { userId: resetRecord.userId },
  });

  res.json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  });
});


import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { sendOTP, verifyOTP, resendOTP, getOTPStats } from '../services/otp.service';
import { logOTPEvent } from '../middleware/auditLog';

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication, OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               purpose:
 *                 type: string
 *                 enum: [owner_signup, owner_action, phone_verify]
 *                 default: owner_signup
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     retryAfterSec:
 *                       type: number
 *       400:
 *         description: Invalid phone number
 *       429:
 *         description: Rate limit exceeded
 */
export const sendOTPHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new AppError('Phone number is required', 400);
  }

  const result = await sendOTP(phoneNumber);

  // Log OTP event
  await logOTPEvent(phoneNumber, 'OTP_SENT', req, {});

  res.json({
    success: true,
    message: result.message,
    data: {
      retryAfterSec: result.retryAfterSec,
    },
  });
});

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication, OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [owner_signup, owner_action, phone_verify]
 *                 default: owner_signup
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid or expired OTP
 */
export const verifyOTPHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, otp, purpose = 'owner_signup' } = req.body;

  if (!phoneNumber || !otp) {
    throw new AppError('Phone number and OTP are required', 400);
  }

  try {
    const result = await verifyOTP(phoneNumber, otp, purpose);

    // Log successful verification
    await logOTPEvent(phoneNumber, 'OTP_VERIFIED', req, { purpose });

    res.json({
      success: true,
      message: result.message,
      data: {
        verified: result.verified,
        token: result.token,
      },
    });
  } catch (error) {
    // Log failed verification
    await logOTPEvent(phoneNumber, 'OTP_FAILED', req, { 
      purpose,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Authentication, OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               purpose:
 *                 type: string
 *                 enum: [owner_signup, owner_action, phone_verify]
 *                 default: owner_signup
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Rate limit exceeded or too soon to resend
 */
export const resendOTPHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new AppError('Phone number is required', 400);
  }

  const result = await resendOTP(phoneNumber);

  // Log resend event
  await logOTPEvent(phoneNumber, 'OTP_SENT', req, { resend: true });

  res.json({
    success: true,
    message: result.message,
    data: {
      retryAfterSec: result.retryAfterSec,
    },
  });
});

/**
 * @swagger
 * /auth/otp-stats:
 *   get:
 *     summary: Get OTP statistics (admin only)
 *     tags: [Authentication, OTP, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP statistics
 */
export const getOTPStatsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Verify admin role
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }

  const stats = await getOTPStats();

  res.json({
    success: true,
    data: stats,
  });
});


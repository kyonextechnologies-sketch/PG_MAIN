import crypto from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import twilio from 'twilio';

// Initialize Twilio client safely
let twilioClient: ReturnType<typeof twilio> | null = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.warn('⚠️ TWILIO_ACCOUNT_SID must start with "AC". SMS OTP will be disabled.');
      console.warn('💡 Twilio Console → Account Info → Account SID (not API Key)');
    } else {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio initialized for OTP service');
    }
  } else {
    console.warn('⚠️ Twilio not configured - OTP will be logged to console only');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio for OTP:', error);
  console.warn('⚠️ SMS OTP disabled - will use console logging');
  twilioClient = null;
}

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 5,
  MAX_RESENDS_PER_HOUR: 3,
  RATE_LIMIT_WINDOW_MINUTES: 60,
  LOCKOUT_MINUTES: 60,
};

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using HMAC-SHA256
 */
function hashOTP(otp: string): string {
  const secret = process.env.OTP_SECRET || 'default-secret-change-in-production';
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
}

/**
 * Verify OTP hash
 */
function verifyOTPHash(otp: string, hash: string): boolean {
  const computedHash = hashOTP(otp);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

/**
 * Check rate limiting for OTP requests
 */
async function checkRateLimit(phone: string): Promise<void> {
  const hourAgo = new Date(Date.now() - OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  
  const recentOTPs = await prisma.oTP.count({
    where: {
      phone,
      createdAt: {
        gte: hourAgo,
      },
    },
  });

  if (recentOTPs >= OTP_CONFIG.MAX_RESENDS_PER_HOUR) {
    throw new AppError(
      `Too many OTP requests. Please try again after ${OTP_CONFIG.LOCKOUT_MINUTES} minutes.`,
      429
    );
  }
}

/**
 * Send OTP via SMS using Twilio
 */
async function sendSMS(phone: string, otp: string): Promise<void> {
  if (!twilioClient) {
    console.warn('⚠️ SMS not sent (Twilio not configured)');
    console.log('\n' + '='.repeat(60));
    console.log('📱 DEV MODE - OTP for', phone + ':', otp);
    console.log('💡 Copy this OTP and use it in the frontend');
    console.log('='.repeat(60) + '\n');
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `Your StayTrack verification code is: ${otp}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log('✅ SMS OTP sent successfully to:', phone);
  } catch (error: any) {
    // If SMS fails (wrong config, same number, etc), fallback to console logging
    console.error('❌ Twilio SMS failed:', error.message);
    console.warn('⚠️ Falling back to console OTP (development mode)');
    console.log('\n' + '='.repeat(60));
    console.log('📱 DEV MODE - OTP for', phone + ':', otp);
    console.log('💡 Copy this OTP and use it in the frontend');
    console.log('='.repeat(60) + '\n');
    // Don't throw error - OTP is saved in DB, just show in console
  }
}

/**
 * Clean up expired OTPs
 */
async function cleanupExpiredOTPs(): Promise<void> {
  await prisma.oTP.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<{
  success: boolean;
  retryAfterSec: number;
  message: string;
}> {
  // Normalize phone number (basic validation)
  const normalizedPhone = phone.replace(/\s+/g, '').trim();
  
  if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  // Check rate limiting
  await checkRateLimit(normalizedPhone);

  // Clean up expired OTPs
  await cleanupExpiredOTPs();

  // Delete any existing OTPs for this phone
  await prisma.oTP.deleteMany({
    where: {
      phone: normalizedPhone,
    },
  });

  // Generate new OTP
  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

  // Store OTP in database
  await prisma.oTP.create({
    data: {
      phone: normalizedPhone,
      otpHash,
      expiresAt,
      attempts: 0,
    },
  });

  // Send SMS
  await sendSMS(normalizedPhone, otp);

  return {
    success: true,
    retryAfterSec: 60, // Users can resend after 60 seconds
    message: `OTP sent successfully to ${normalizedPhone}`,
  };
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  phone: string,
  otp: string,
  purpose: string = 'owner_signup'
): Promise<{
  success: boolean;
  verified: boolean;
  token?: string;
  message: string;
}> {
  // Normalize phone number
  const normalizedPhone = phone.replace(/\s+/g, '').trim();

  if (!otp || otp.length !== OTP_CONFIG.LENGTH) {
    throw new AppError('Invalid OTP format', 400);
  }

  // Find OTP record
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone: normalizedPhone,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    throw new AppError('OTP not found or expired', 400);
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiresAt) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  // Check max attempts
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', 400);
  }

  // Verify OTP
  const isValid = verifyOTPHash(otp, otpRecord.otpHash);

  if (!isValid) {
    // Increment attempts
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - (otpRecord.attempts + 1);
    throw new AppError(
      `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
      400
    );
  }

  // OTP is valid - Update record with verification token instead of deleting
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // Token valid for 10 minutes

  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: {
      verified: true,
      verificationToken,
      tokenExpiresAt: tokenExpiry,
    },
  });

  console.log('✅ OTP verified for', normalizedPhone, '- Token generated and stored');

  return {
    success: true,
    verified: true,
    token: verificationToken,
    message: 'Phone number verified successfully',
  };
}

/**
 * Validate phone verification token
 */
export async function validateVerificationToken(
  phone: string,
  token: string
): Promise<{ valid: boolean; phone: string }> {
  const normalizedPhone = phone.replace(/\s+/g, '').trim();

  // Find OTP record with matching phone and token
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone: normalizedPhone,
      verificationToken: token,
      verified: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    console.log('❌ Invalid verification token for phone:', normalizedPhone);
    throw new AppError('Invalid or expired verification token. Please verify your phone again.', 400);
  }

  // Check if token has expired
  if (otpRecord.tokenExpiresAt && new Date() > otpRecord.tokenExpiresAt) {
    console.log('❌ Verification token expired for:', normalizedPhone);
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new AppError('Verification token has expired. Please verify your phone again.', 400);
  }

  console.log('✅ Verification token validated for:', normalizedPhone);

  // Delete the OTP record after successful validation (one-time use)
  await prisma.oTP.delete({ where: { id: otpRecord.id } });

  return {
    valid: true,
    phone: normalizedPhone,
  };
}

/**
 * Resend OTP
 */
export async function resendOTP(phone: string): Promise<{
  success: boolean;
  retryAfterSec: number;
  message: string;
}> {
  // Check if user has an active OTP
  const normalizedPhone = phone.replace(/\s+/g, '').trim();
  
  const existingOTP = await prisma.oTP.findFirst({
    where: {
      phone: normalizedPhone,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existingOTP) {
    // Check if enough time has passed (60 seconds)
    const timeSinceCreation = Date.now() - existingOTP.createdAt.getTime();
    if (timeSinceCreation < 60000) {
      const waitSeconds = Math.ceil((60000 - timeSinceCreation) / 1000);
      throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP`, 429);
    }
  }

  // Send new OTP
  return await sendOTP(normalizedPhone);
}

/**
 * Get OTP statistics for monitoring
 */
export async function getOTPStats(): Promise<{
  totalActive: number;
  totalExpired: number;
  recentSent: number;
}> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [totalActive, totalExpired, recentSent] = await Promise.all([
    prisma.oTP.count({
      where: {
        expiresAt: {
          gte: now,
        },
      },
    }),
    prisma.oTP.count({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    }),
    prisma.oTP.count({
      where: {
        createdAt: {
          gte: hourAgo,
        },
      },
    }),
  ]);

  return {
    totalActive,
    totalExpired,
    recentSent,
  };
}


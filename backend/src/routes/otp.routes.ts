import { Router } from 'express';
import { sendOTPHandler, verifyOTPHandler, resendOTPHandler, getOTPStatsHandler } from '../controllers/otp.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// OTP routes - ENABLED
router.post('/send-otp', sendOTPHandler);
router.post('/verify-otp', verifyOTPHandler);
router.post('/resend-otp', resendOTPHandler);
router.get('/stats', authenticate, getOTPStatsHandler);

export default router;

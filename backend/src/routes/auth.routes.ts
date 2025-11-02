import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
} from '../validators/auth.validator';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validate(registerValidator), register);
router.post('/login', authRateLimiter, validate(loginValidator), login);
router.post('/refresh', validate(refreshTokenValidator), refreshAccessToken);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getProfile);
router.post('/change-password', authenticate, validate(changePasswordValidator), changePassword);

export default router;


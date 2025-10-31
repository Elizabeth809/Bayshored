import express from 'express';
import {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  resendOtp // Add this if not already there
} from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp); // Add this line
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', isAuthenticated, getMe);
router.put('/profile', isAuthenticated, updateProfile);
router.put('/change-password', isAuthenticated, changePassword);

export default router;
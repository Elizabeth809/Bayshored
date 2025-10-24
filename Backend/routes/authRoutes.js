import express from 'express';
import {
  registerUser,
  verifyOTP,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe, // Import the new controller
} from '../controllers/userController.js';

// Import the 'protect' middleware
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// Protected routes
// This route is now protected. A user must be logged in.
router.get('/me', protect, getMe);

export default router;
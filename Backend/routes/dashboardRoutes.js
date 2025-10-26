import express from 'express';
import { getCouponStats, getDashboardStats } from '../controllers/dashboardController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and admin only
router.use(isAuthenticated, isAdmin);

router.get('/', getDashboardStats);
router.get('/coupon-stats', getCouponStats);

export default router;
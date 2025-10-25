import express from 'express';
import {
  applyCoupon,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/apply-coupon', isAuthenticated, applyCoupon);
router.post('/', isAuthenticated, createOrder);
router.get('/my-orders', isAuthenticated, getMyOrders);
router.get('/:id', isAuthenticated, getOrderById);

// Admin routes
router.get('/', isAuthenticated, isAdmin, getAllOrders);
router.put('/:id/status', isAuthenticated, isAdmin, updateOrderStatus);

export default router;
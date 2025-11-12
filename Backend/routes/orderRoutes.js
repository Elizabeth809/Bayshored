import express from 'express';
import {
  applyCoupon,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
  addShippingUpdate,
  getOrderInvoiceAdmin,
  deleteAbandonedOrder
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

// Admin order routes
router.get('/admin/all', isAuthenticated, isAdmin, getAllOrdersAdmin);
router.get('/admin/:id', isAuthenticated, isAdmin, getOrderDetailsAdmin);
router.put('/admin/:id/status', isAuthenticated, isAdmin, updateOrderStatusAdmin);
router.post('/admin/:id/shipping-update', isAuthenticated, isAdmin, addShippingUpdate);
router.get('/admin/:id/invoice', isAuthenticated, isAdmin, getOrderInvoiceAdmin);

router.delete('/admin/:id', isAuthenticated, isAdmin, deleteAbandonedOrder);

export default router;
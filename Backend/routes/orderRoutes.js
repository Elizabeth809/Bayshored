import express from 'express';
import {
  applyCoupon,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
  addShippingUpdate,
  deleteAbandonedOrder,
  getShippingOptions,
  validateShippingAddress,
  getShippingLabel,
  findFedExLocations,
  trackOrder,
  createShipment,
  cancelShipment,
  getOrderInvoiceAdmin,
  getTrackingStatus
} from '../controllers/orderController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================
router.post('/fedex-locations', findFedExLocations);

// ===========================================
// USER ROUTES (Authenticated)
// ===========================================
router.post('/apply-coupon', isAuthenticated, applyCoupon);
router.post('/validate-address', isAuthenticated, validateShippingAddress);
router.post('/shipping-options', isAuthenticated, getShippingOptions);
router.post('/', isAuthenticated, createOrder);
router.get('/my-orders', isAuthenticated, getMyOrders);
router.get('/:orderId/shipping-label', isAuthenticated, getShippingLabel);
router.get('/:id', isAuthenticated, getOrderById);

router.get('/track/:orderId', isAuthenticated, trackOrder);
router.get('/:orderId/tracking-status', isAuthenticated, getTrackingStatus);

// ===========================================
// ADMIN ROUTES
// ===========================================
router.get('/admin/all', isAuthenticated, isAdmin, getAllOrdersAdmin);
router.get('/admin/:id', isAuthenticated, isAdmin, getOrderDetailsAdmin);
router.put('/admin/:id/status', isAuthenticated, isAdmin, updateOrderStatusAdmin);
router.post('/admin/:id/shipping-update', isAuthenticated, isAdmin, addShippingUpdate);
router.post('/admin/:id/create-shipment', isAuthenticated, isAdmin, createShipment);
router.post('/admin/:id/cancel-shipment', isAuthenticated, isAdmin, cancelShipment);
router.get('/admin/:id/invoice', isAuthenticated, isAdmin, getOrderInvoiceAdmin);
router.delete('/admin/:id', isAuthenticated, isAdmin, deleteAbandonedOrder);

export default router;
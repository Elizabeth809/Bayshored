import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus
} from '../controllers/paymentController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);

router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);
router.post('/payment-failed', handlePaymentFailure);
router.get('/status/:orderId', getPaymentStatus);

export default router;
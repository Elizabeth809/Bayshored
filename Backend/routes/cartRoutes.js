import express from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
import express from 'express';
import {
  getPriceInquiries,
  getPriceInquiry,
  updatePriceInquiry,
  deletePriceInquiry,
  respondToInquiry
} from '../controllers/priceInquiryController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and admin only
router.get('/', isAuthenticated, isAdmin, getPriceInquiries);
router.get('/:id', isAuthenticated, isAdmin, getPriceInquiry);
router.put('/:id', isAuthenticated, isAdmin, updatePriceInquiry);
router.delete('/:id', isAuthenticated, isAdmin, deletePriceInquiry);
router.post('/:id/respond', isAuthenticated, isAdmin, respondToInquiry);

export default router;
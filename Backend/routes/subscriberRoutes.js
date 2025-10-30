import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  getSubscriberStats,
  deleteSubscriber
} from '../controllers/subscriberController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/', isAuthenticated, isAdmin, getSubscribers);
router.get('/stats', isAuthenticated, isAdmin, getSubscriberStats);
router.delete('/:id', isAuthenticated, isAdmin, deleteSubscriber);

export default router;
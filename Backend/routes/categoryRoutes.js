import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected admin routes
router.post('/', isAuthenticated, isAdmin, createCategory);
router.put('/:id', isAuthenticated, isAdmin, updateCategory);
router.delete('/:id', isAuthenticated, isAdmin, deleteCategory);

export default router;
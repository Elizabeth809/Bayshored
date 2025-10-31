import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsOnSale,
  getProductsByTag
} from '../controllers/productController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../utils/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/on-sale', getProductsOnSale);
router.get('/tags/:tag', getProductsByTag);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Protected admin routes
router.post('/', isAuthenticated, isAdmin, uploadMultiple, createProduct);
router.put('/:id', isAuthenticated, isAdmin, uploadMultiple, updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

export default router;
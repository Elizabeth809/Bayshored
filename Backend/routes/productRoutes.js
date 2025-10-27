import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts
} from '../controllers/productController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { productUpload } from '../utils/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Protected admin routes
router.post('/', isAuthenticated, isAdmin, productUpload.single('image'), createProduct);
router.put('/:id', isAuthenticated, isAdmin, productUpload.single('image'), updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

export default router;
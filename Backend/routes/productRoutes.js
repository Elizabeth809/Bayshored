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
  getProductsByTag,
  submitPriceInquiry,
  getPriceInquiries,
  updatePriceInquiry
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

// Price inquiry routes
router.post('/:id/price-inquiry', submitPriceInquiry);

// Protected admin routes
router.post('/', isAuthenticated, isAdmin, uploadMultiple, createProduct);
router.put('/:id', isAuthenticated, isAdmin, uploadMultiple, updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

// Admin price inquiry routes
router.get('/price-inquiries/all', isAuthenticated, isAdmin, getPriceInquiries);
router.put('/price-inquiries/:id', isAuthenticated, isAdmin, updatePriceInquiry);

export default router;
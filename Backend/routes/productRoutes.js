// routes/productRoutes.js
import express from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getProductsOnSale,
  getProductsByTag,
  getProductShippingInfo,
  getBulkShippingInfo,
  updateProductStock,
  getLowStockProducts,
  getOutOfStockProducts,
  submitPriceInquiry,
  getPriceInquiries,
  updatePriceInquiry
} from '../controllers/productController.js';

import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../utils/multer.js';

const router = express.Router();

// ============================================
// STATIC ROUTES (Must be before :id routes)
// ============================================

// Product listing
router.get('/', getAllProducts);

// Special collections
router.get('/featured', getFeaturedProducts);
router.get('/on-sale', getProductsOnSale);
router.get('/tags/:tag', getProductsByTag);

// Admin inventory routes
router.get('/admin/low-stock', isAuthenticated, isAdmin, getLowStockProducts);
router.get('/admin/out-of-stock', isAuthenticated, isAdmin, getOutOfStockProducts);

// Admin price inquiries
router.get('/price-inquiries/all', isAuthenticated, isAdmin, getPriceInquiries);
router.put('/price-inquiries/:id', isAuthenticated, isAdmin, updatePriceInquiry);

// Bulk shipping info (for cart - FedEx)
router.post('/bulk-shipping-info', getBulkShippingInfo);

// Product by slug
router.get('/slug/:slug', getProductBySlug);

// ============================================
// DYNAMIC :id ROUTES
// ============================================

// Get product by ID
router.get('/:id', getProductById);

// Get shipping info (for FedEx rate calculation)
router.get('/:id/shipping-info', getProductShippingInfo);

// Submit price inquiry
router.post('/:id/price-inquiry', submitPriceInquiry);

// Update stock (admin)
router.put('/:id/stock', isAuthenticated, isAdmin, updateProductStock);

// CRUD operations
router.post('/', isAuthenticated, isAdmin, uploadMultiple, createProduct);
router.put('/:id', isAuthenticated, isAdmin, uploadMultiple, updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

export default router;
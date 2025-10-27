import express from 'express';
import {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor
} from '../controllers/authorController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllAuthors);
router.get('/:id', getAuthorById);

// Protected admin routes
router.post('/', isAuthenticated, isAdmin, upload.single('profileImage'), createAuthor);
router.put('/:id', isAuthenticated, isAdmin, upload.single('profileImage'), updateAuthor);
router.delete('/:id', isAuthenticated, isAdmin, deleteAuthor);

export default router;
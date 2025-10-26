import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser
} from '../controllers/authController.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file are admin-protected
router.use(isAuthenticated, isAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUserByAdmin);
router.delete('/:id', deleteUser);

export default router;
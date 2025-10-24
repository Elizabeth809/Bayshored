import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/products', productRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MERN Art Backend Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      authors: '/api/v1/authors',
      products: '/api/v1/products'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Multer file size error
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  // Multer file type error
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
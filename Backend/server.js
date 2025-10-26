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
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'MERN Art Backend Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      authors: '/api/v1/authors',
      products: '/api/v1/products',
      cart: '/api/v1/cart',
      wishlist: '/api/v1/wishlist',
      coupons: '/api/v1/coupons',
      orders: '/api/v1/orders',
      user: '/api/v1/user',
      dashboard: 'api/v1/dashboard'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }

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

// Connect to DB, then start the server
const startServer = async () => {
  try {
    await connectDB(); // Wait for MongoDB connection
    console.log('✅ MongoDB connected successfully');

    // Only start server after DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Mount routes AFTER connection
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/categories', categoryRoutes);
    app.use('/api/v1/authors', authorRoutes);
    app.use('/api/v1/products', productRoutes);
    app.use('/api/v1/cart', cartRoutes);
    app.use('/api/v1/wishlist', wishlistRoutes);
    app.use('/api/v1/coupons', couponRoutes);
    app.use('/api/v1/orders', orderRoutes);
    app.use('/api/v1/user', userRoutes);
    app.use('/api/v1/dashboard', dashboardRoutes);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1); // Exit if DB fails
  }
};
startServer();

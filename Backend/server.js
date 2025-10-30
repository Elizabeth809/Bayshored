import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import usersRoutes from './routes/adminUsersRoutes.js';
import dashboardRoutes from "./routes/dashboardRoutes.js";
import subscriberRoutes from './routes/subscriberRoutes.js';

import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : [process.env.FRONTEND_URL, process.env.ADMIN_URL];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(helmet());

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "MERN Art Backend Server is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      categories: "/api/v1/categories",
      authors: "/api/v1/authors",
      products: "/api/v1/products",
      cart: "/api/v1/cart",
      wishlist: "/api/v1/wishlist",
      coupons: "/api/v1/coupons",
      orders: "/api/v1/orders",
      user: "/api/v1/user",
      dashboard: "api/v1/dashboard",
      subscribe:"/api/v1/subscribers",
    },
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === "production";

  let errorMessage = "Internal server error";
  let errorDetails = {};

  if (!isProduction) {
    errorMessage = error.message;
    errorDetails = {
      stack: error.stack,
      ...error,
    };
  }

  // Specific error handling
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: errorMessage,
    ...(!isProduction && { error: errorDetails }),
  });
});

// Connect to DB, then start the server
const startServer = async () => {
  try {
    await connectDB(); // Wait for MongoDB connection
    console.log("✅ MongoDB connected successfully");

    // Only start server after DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌎 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Mount routes AFTER connection
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/categories", categoryRoutes);
    app.use("/api/v1/authors", authorRoutes);
    app.use("/api/v1/products", productRoutes);
    app.use("/api/v1/cart", cartRoutes);
    app.use("/api/v1/wishlist", wishlistRoutes);
    app.use("/api/v1/coupons", couponRoutes);
    app.use("/api/v1/orders", orderRoutes);
    app.use("/api/v1/user", userRoutes);
    //admin user routes
    app.use("/api/v1/users", usersRoutes);
    app.use("/api/v1/dashboard", dashboardRoutes);
    app.use('/api/v1/subscribers', subscriberRoutes);
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit if DB fails
  }
};
startServer();

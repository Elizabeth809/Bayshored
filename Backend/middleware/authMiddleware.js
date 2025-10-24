import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

/**
 * @desc    Protect routes - checks for valid token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read the JWT from the 'token' cookie
  token = req.cookies.token;

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (id is in the payload)
      // Attach the user to the request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * @desc    Authorize roles - checks if user role is allowed
 * @param   {...string} roles - List of roles allowed
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

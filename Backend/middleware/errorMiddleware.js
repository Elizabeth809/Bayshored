/**
 * @desc    Not Found (404) Error Handler
 * @desc    Handles requests for routes that don't exist
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the next error-handling middleware
};

/**
 * @desc    Global Error Handler
 * @desc    Catches all errors passed from other routes/middleware
 */
const errorHandler = (err, req, res, next) => {
  // Sometimes an error might come in with a 200 status code,
  // set it to 500 (Internal Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose Bad ObjectId Error
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value entered: ${Object.keys(
      err.keyValue
    )} should be unique.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Get all validation error messages
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT Token Expiration Error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token expired';
  }

  // JWT Malformed Token Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, token failed';
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Provide stack trace only in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };

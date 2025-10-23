import jwt from 'jsonwebtoken';

/**
 * Generates a JWT, sets it in an HTTP-Only cookie, and sends the response.
 * @param {object} user - The user object from the database.
 * @param {number} statusCode - The HTTP status code for the response.
 * @param {object} res - The Express response object.
 */
const sendToken = (user, statusCode, res) => {
  // 1. Create token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  // 2. Cookie options
  const options = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10) * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true, // Makes it inaccessible to client-side JS
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict', // Helps prevent CSRF
  };

  // 3. Send response
  // Remove password from the user object before sending
  const userResponse = { ...user.toObject() };
  delete userResponse.password;
  delete userResponse.otp;
  delete userResponse.otpExpires;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: userResponse,
  });
};

export default sendToken;
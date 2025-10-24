import User from '../models/userModel.js';
import sendToken from '../utils/sendToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone, email, password } = req.body;

  // 1. Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw new Error('User already exists');
  }

  // 2. Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Set OTP expiration to 10 minutes
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // 3. Create new user
  user = await User.create({
    firstName,
    lastName,
    phone,
    email,
    password, // Password will be hashed by the 'pre-save' hook in userModel
    otp,
    otpExpires,
  });

  // 4. Send OTP email
  const message = `Your Art Gallery verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Art Gallery - Email Verification',
      message,
    });

    res.status(201).json({
      success: true,
      message: `OTP sent to ${user.email}. Please verify your account.`,
      // Note: We don't send the token until OTP is verified
    });
  } catch (error) {
    console.error('Email sending error:', error);
    // If email fails, we shouldn't keep the user in this state
    await User.deleteOne({ _id: user._id });
    res.status(500);
    throw new Error('Error sending verification email. Please try again.');
  }
});

/**
 * @desc    Verify OTP and log in user
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }

  // 1. Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('Invalid credentials or user does not exist');
  }

  // 2. Check if OTP is correct and not expired
  if (user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // 3. Clear OTP fields
  user.otp = undefined;
  user.otpExpires = undefined;
  // (We could add a 'isVerified' field here if needed)
  await user.save();

  // 4. Send JWT token
  sendToken(user, 200, res);
});

/**
 * @desc    Auth user & get token (Login)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide an email and password');
  }

  // 2. Check for user
  // We .select('+password') because it's hidden by default in the model
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // 3. Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // 4. Check if user is verified (if we implemented that)
  // For now, we assume if they can log in, they are good.
  // An alternative check: if user.otp is still set, they haven't verified.
  if (user.otp) {
    res.status(401);
    throw new Error('Please verify your email with the OTP first');
  }

  // 5. Send JWT token
  sendToken(user, 200, res);
});

/**
 * @desc    Log user out
 * @route   GET /api/v1/auth/logout
 * @access  Public (but needs cookie to clear)
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Set to expire in 10s
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgotpassword
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email');
  }

  // 1. Get reset token
  const resetToken = user.getResetPasswordToken();

  // 2. Save the token and expiry to the user in the DB
  await user.save({ validateBeforeSave: false }); // Skip validation, we just need to save the token

  // 3. Create reset URL
  // Note: This URL should point to your *frontend* password reset page
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please go to this link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    });

    res.status(200).json({
      success: true,
      data: 'Password reset email sent',
    });
  } catch (err) {
    console.error(err);
    // Clear the token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/resetpassword/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  // 1. Get hashed token from URL
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2. Find user by token and check if token is expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  // 3. Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save(); // This will trigger the pre-save hook to hash the password

  // 4. Log the user in
  sendToken(user, 200, res);
});

/**
 * @desc    Get user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res, next) => {
  // req.user is attached by the 'protect' middleware
  const user = req.user;

  if (user) {
    res.status(200).json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
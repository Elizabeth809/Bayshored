import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import bcrypt from 'bcryptjs';
import otpGenerator from 'otp-generator';
import { generateToken } from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/sendEmail.js'; // your nodemailer email utils

// Register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({ name, email, phoneNumber, password });

    // Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, alphabets: true, upperCase: true, specialChars: false });
    await OTP.create({ email: user.email, otp });
    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: 'User registered. OTP sent to email.', data: { email: user.email } });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.otp.trim().toUpperCase() !== otp.trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Email verified', data: { token, user } });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified) {
      // Generate OTP again
      const otp = otpGenerator.generate(6, { digits: true, alphabets: true, upperCase: true, specialChars: false });
      await OTP.create({ email: user.email, otp });
      await sendOTPEmail(user.email, otp);

      return res.status(401).json({ success: false, message: 'Email not verified. New OTP sent.', requiresVerification: true });
    }

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful', data: { token, user } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = otpGenerator.generate(6, { digits: true, alphabets: true, upperCase: true, specialChars: false });
    await OTP.create({ email: user.email, otp });
    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: 'OTP sent to email', data: { email: user.email } });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password required' });
    }

    // Get latest OTP
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.otp.trim().toUpperCase() !== otp.trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Assign password directly; Mongoose pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user; // comes from isAuthenticated middleware
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isVerified: user.isVerified,
          addresses: user.addresses
        }
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: error.message
    });
  }
};


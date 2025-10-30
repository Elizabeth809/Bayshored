import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { generateToken } from "../utils/generateToken.js";
import { sendOTPEmail } from "../utils/sendEmail.js"; // your nodemailer email utils

// UPDATED registerUser function
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

    // --- Start: Your email sending update ---
    const emailResult = await sendOTPEmail(user.email, otp);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Handle failed email sending
      return res.status(500).json({
        success: false,
        message: 'Registration successful but failed to send OTP email. Please contact support.'
      });
    }
    // --- End: Your email sending update ---

    res.json({ success: true, message: 'User registered. OTP sent to email.', data: { email: user.email } });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// UNCHANGED verifyOtp function
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the most recent OTP for this email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    // Check if OTP is valid
    if (!otpRecord || otpRecord.otp.trim().toUpperCase() !== otp.trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate token and send response
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Email verified', data: { token, user } });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// NEW resendOtp function (using your second snippet)
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, { digits: true, alphabets: true, upperCase: true, specialChars: false });
    
    // Update existing OTP record or create a new one
    await OTP.findOneAndUpdate({ email }, { otp, createdAt: Date.now() }, { upsert: true, new: true });

    // --- Start: Your second update snippet ---
    const emailResult = await sendOTPEmail(user.email, otp);

    if (!emailResult.success) {
      console.error('Failed to send new OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'New OTP could not be sent. Please try again later.'
      });
    }
    // --- End: Your second update snippet ---

    res.json({ success: true, message: 'New OTP sent successfully.' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    if (!user.isVerified) {
      // Generate OTP again
      const otp = otpGenerator.generate(6, {
        digits: true,
        alphabets: true,
        upperCase: true,
        specialChars: false,
      });
      await OTP.create({ email: user.email, otp });
      await sendOTPEmail(user.email, otp);

      return res
        .status(401)
        .json({
          success: false,
          message: "Email not verified. New OTP sent.",
          requiresVerification: true,
        });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "Login successful",
      data: { token, user },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: true,
      upperCase: true,
      specialChars: false,
    });
    await OTP.create({ email: user.email, otp });
    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
      data: { email: user.email },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email, OTP and new password required",
        });
    }

    // Get latest OTP
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (
      !otpRecord ||
      otpRecord.otp.trim().toUpperCase() !== otp.trim().toUpperCase()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Assign password directly; Mongoose pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during password reset",
        error: error.message,
      });
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
          addresses: user.addresses,
        },
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
      error: error.message,
    });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (role && role !== "all") {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password") // Exclude password from the result
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// @desc    Get single user by ID (Admin)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update user by ID (Admin)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, phoneNumber, role, isVerified } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if email is being changed and if it already exists for another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }
    }

    // Check for phone number conflicts
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already in use" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role;
    user.isVerified = isVerified === undefined ? user.isVerified : isVerified;

    const updatedUser = await user.save();

    // Exclude password from the response
    const userObject = updatedUser.toObject();
    delete userObject.password;

    res.json({
      success: true,
      message: "User updated successfully",
      data: userObject,
    });
  } catch (error) {
    console.error("Update user by admin error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete user by ID (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // TODO: Add logic here to handle user's associated data (e.g., orders)
    // For now, we'll just delete the user.
    // A safer approach might be to "deactivate" the user instead.

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

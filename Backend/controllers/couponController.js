import Coupon from '../models/couponModel.js';

// @desc    Create a new coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || null
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating coupon',
      error: error.message
    });
  }
};

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupons',
      error: error.message
    });
  }
};

// @desc    Get single coupon by ID
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error('Get coupon error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon',
      error: error.message
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      isActive
    } = req.body;

    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if new code already exists (if code is being changed)
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }

    coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code: code ? code.toUpperCase() : coupon.code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expiryDate: expiryDate ? new Date(expiryDate) : coupon.expiryDate,
        usageLimit,
        isActive
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating coupon',
      error: error.message
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting coupon',
      error: error.message
    });
  }
};
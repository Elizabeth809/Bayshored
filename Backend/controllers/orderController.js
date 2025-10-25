import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Coupon from '../models/couponModel.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose'

import { createInvoice } from '../utils/createInvoice.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Apply coupon to order
// @route   POST /api/v1/orders/apply-coupon
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    // Find active coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Check minimum order amount
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      
      // Apply max discount limit if set
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discountAmount,
        finalAmount: subtotal - discountAmount
      }
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying coupon',
      error: error.message
    });
  }
};

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, couponCode, paymentMethod = 'card', notes } = req.body;

    // Get user with cart
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name price image stock active author medium dimensions'
      })
      .session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of user.cart) {
      if (!item.product || !item.product.active) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'Unknown'}" is no longer available`
        });
      }
      if (item.product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available`
        });
      }
    }

    // Calculate subtotal
    const subtotal = user.cart.reduce((t, i) => t + i.product.price * i.quantity, 0);
    const shippingCost = subtotal > 200 ? 0 : 15;

    let coupon = null;
    let discountAmount = 0;

    // Apply coupon if exists
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      }).session(session);

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error('Coupon usage limit reached');
        }

        if (subtotal < coupon.minOrderAmount) {
          throw new Error(`Minimum order amount of $${coupon.minOrderAmount} required`);
        }

        discountAmount = coupon.discountType === 'percentage'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;

        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }

        discountAmount = Math.min(discountAmount, subtotal);
        coupon.usedCount += 1;
        await coupon.save({ session });
      }
    }

    const totalAmount = subtotal + shippingCost - discountAmount;

    // Prepare order items
    const orderItems = user.cart.map(i => ({
      product: i.product._id,
      quantity: i.quantity,
      priceAtOrder: i.product.price,
      name: i.product.name,
      image: i.product.image,
      author: i.product.author?.name || 'Unknown Artist',
      medium: i.product.medium
    }));

    // Create order
    const order = await Order.create([{
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      couponApplied: coupon?._id,
      discountAmount,
      totalAmount,
      paymentMethod,
      notes,
      shippingUpdates: [{ message: 'Order placed successfully', timestamp: new Date() }]
    }], { session });

    // Update stock
    for (const item of user.cart) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Clear cart
    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Generate populated order for invoice/email
    const populatedOrder = await Order.findById(order[0]._id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountType discountValue');

    // ✅ Send Invoice Email
    try {
      const invoiceBuffer = await createInvoice(populatedOrder);
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p>Dear ${populatedOrder.user.name},</p>
          <p>Your order <strong>#${populatedOrder.orderNumber}</strong> has been received.</p>
          <div style="background:#f8f9fa;padding:15px;border-radius:5px;margin:20px 0;">
            <h3>Order Summary</h3>
            <p><strong>Items:</strong> ${populatedOrder.items.length}</p>
            <p><strong>Total:</strong> $${populatedOrder.totalAmount.toFixed(2)}</p>
          </div>
          <p>Thank you for choosing MERN Art Gallery!</p>
        </div>
      `;
      await sendEmail(
        populatedOrder.user.email,
        `Order Confirmation - #${populatedOrder.orderNumber}`,
        emailHtml,
        [
          {
            filename: `invoice-${populatedOrder.orderNumber}.pdf`,
            content: invoiceBuffer
          }
        ]
      );
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: error.message
    });
  }
};


// @desc    Get user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('couponApplied', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching order',
      error: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountType discountValue')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: orders
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, message } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;
    
    if (message) {
      order.shippingUpdates.push({
        message,
        timestamp: new Date()
      });
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountType discountValue');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
      error: error.message
    });
  }
};
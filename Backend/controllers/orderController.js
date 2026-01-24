import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

import { createInvoice } from "../utils/createInvoice.js";
import { sendEmail } from "../utils/sendEmail.js";

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

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`
      });
    }

    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    const finalAmount = subtotal - discountAmount;

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
        finalAmount
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
// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, couponCode, paymentMethod = 'card', notes } = req.body;

    // Get user with populated cart
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate products and stock
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
    const subtotal = user.cart.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    if (isNaN(subtotal) || subtotal < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid cart total calculation'
      });
    }
    
    // Calculate shipping cost
    const shippingCost = subtotal > 200 ? 0 : 15;

    let coupon = null;
    let discountAmount = 0;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      }).session(session);

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
          });
        }
        if (subtotal < coupon.minOrderAmount) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`
          });
        }
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        coupon.usedCount += 1;
        await coupon.save({ session });
      }
    }

    const totalAmount = subtotal + shippingCost - discountAmount;

    if (isNaN(totalAmount) || totalAmount < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount calculation'
      });
    }

    // Generate 7-digit order number
    const generateOrderNumber = async () => {
      try {
        // Generate random 7-digit number (1000000 to 9999999)
        const random7Digit = Math.floor(1000000 + Math.random() * 9000000);
        const orderNumber = `ART${random7Digit}`;
        
        // Check if it already exists
        const existingOrder = await Order.findOne({ orderNumber }).session(session);
        return existingOrder ? null : orderNumber;
      } catch (error) {
        console.error('Error generating order number:', error);
        return null;
      }
    };

    // Try up to 5 times to generate unique number
    let orderNumber = null;
    for (let i = 0; i < 5; i++) {
      orderNumber = await generateOrderNumber();
      if (orderNumber) break;
    }

    // If still not unique, use fallback
    if (!orderNumber) {
      // Last 7 digits of timestamp
      const timestamp = Date.now();
      const last7Digits = timestamp.toString().slice(-7);
      orderNumber = `ART${last7Digits}`;
      
      // Check if fallback also exists
      const existingOrder = await Order.findOne({ orderNumber }).session(session);
      if (existingOrder) {
        // Add a random digit to make it unique
        const randomDigit = Math.floor(Math.random() * 10);
        orderNumber = `ART${last7Digits.slice(0, 6)}${randomDigit}`;
      }
    }

    console.log(`Generated order number: ${orderNumber}`);

    // Prepare order items
    const orderItems = user.cart.map(item => {
      const currentPrice = getCurrentPrice(item.product);
      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtOrder: currentPrice,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image,
        author: item.product.author?.name || 'Unknown Artist',
        medium: item.product.medium
      };
    });

    // Create order
    const orderData = {
      orderNumber,
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      couponApplied: coupon?._id,
      discountAmount,
      totalAmount,
      paymentMethod,
      orderStatus: paymentMethod === 'COD' ? 'confirmed' : 'pending',
      paymentStatus: 'pending', // Always pending at creation
      notes,
      shippingUpdates: [{
        message: 'Order placed successfully',
        timestamp: new Date()
      }]
    };

    const order = new Order(orderData);
    await order.save({ session });

    // Only update stock and clear cart if it's a COD order
    if (paymentMethod === 'COD') {
      
      // Update product stock
      for (const item of user.cart) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      // Clear user's cart
      user.cart = [];
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Only send the invoice email if it's a COD order
    if (paymentMethod === 'COD') {
      try {
        const populatedOrder = await Order.findById(order._id)
          .populate('user', 'name email')
          .populate('couponApplied', 'code discountType discountValue');

        const invoiceBuffer = await createInvoice(populatedOrder);
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for your order!</h2>
            <p>Dear ${populatedOrder.user.name},</p>
            <p>Your order <strong>#${populatedOrder.orderNumber}</strong> has been received and is being processed.</p>
            <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
            <p>Please keep $${populatedOrder.totalAmount.toFixed(2)} ready.</p>
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
        console.error('Error sending COD invoice email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order // Send back the pending order
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Create order error:', error);
    
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
    // This filter hides abandoned 'pending' Razorpay orders
    const filter = {
      user: req.user.id,
      $or: [
        { paymentStatus: { $ne: 'pending' } }, // Show 'paid', 'failed', 'refunded'
        { paymentMethod: 'COD' } // Also show all 'COD' orders
      ]
    };

    const orders = await Order.find(filter)
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
      .populate("user", "name email")
      .populate("couponApplied", "code discountType discountValue")
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
      data: orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      error: error.message,
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
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;

    if (message) {
      order.shippingUpdates.push({
        message,
        timestamp: new Date(),
      });
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("couponApplied", "code discountType discountValue");

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
      error: error.message,
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders/admin/all
// @access  Private/Admin
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = 'createdAt_desc' 
    } = req.query;
    
    // Filter for the main list (respects status filter)
    const listFilter = {};
    
    if (status && status !== 'all') {
      listFilter.orderStatus = status;
    }

    // Filter for the stats (ignores status, but respects search)
    const statsFilter = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      // Apply search to both filters
      listFilter.user = { $in: userIds };
      statsFilter.user = { $in: userIds };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'totalAmount_asc':
        sortOptions.totalAmount = 1;
        break;
      case 'totalAmount_desc':
        sortOptions.totalAmount = -1;
        break;
      case 'createdAt_asc':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Use listFilter for finding orders
    const orders = await Order.find(listFilter)
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountType discountValue')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Use listFilter for counting total
    const total = await Order.countDocuments(listFilter);

    // Use statsFilter for calculating stats
    const stats = await Order.aggregate([
      { $match: statsFilter }, // Match only by search (if present), not status
      {
        $group: {
          _id: null,
          
          // Total Revenue (ONLY 'paid' orders + 'COD' orders that are not 'cancelled')
          totalRevenue: {
            $sum: {
              $cond: [
                { $or: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $and: [
                        { $eq: ["$paymentMethod", "COD"] },
                        { $ne: ["$orderStatus", "cancelled"] }
                    ]}
                ]},
                "$totalAmount",
                0
              ]
            }
          },
          
          // Total Pending Amount (ONLY 'pending' ONLINE orders)
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $and: [
                    { $eq: ["$paymentStatus", "pending"] },
                    { $ne: ["$paymentMethod", "COD"] }
                ]},
                "$totalAmount",
                0
              ]
            }
          },

          // Total Failed Amount
          totalFailedAmount: {
            $sum: {
              $cond: [ { $eq: ["$paymentStatus", "failed"] }, "$totalAmount", 0 ]
            }
          },

          // Total Orders (all)
          totalOrders: { $sum: 1 },

          // Total "Successful" Orders
          totalSuccessfulOrders: {
            $sum: {
              $cond: [
                { $or: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $and: [
                        { $eq: ["$paymentMethod", "COD"] },
                        { $ne: ["$orderStatus", "cancelled"] }
                    ]}
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalPendingAmount: 1,
          totalFailedAmount: 1,
          totalOrders: 1,
          totalSuccessfulOrders: 1,
          // Calculate true Average Order Value (AOV)
          averageOrderValue: {
            $cond: [
              { $eq: ["$totalSuccessfulOrders", 0] },
              0, // Avoid division by zero
              { $divide: ["$totalRevenue", "$totalSuccessfulOrders"] }
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      // Return the first object from the stats array, or default values
      stats: stats[0] || { 
        totalRevenue: 0, 
        totalPendingAmount: 0, 
        totalFailedAmount: 0,
        totalOrders: 0, 
        totalSuccessfulOrders: 0,
        averageOrderValue: 0 
      },
      data: orders
    });

  } catch (error) {
    console.error('Get all orders admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message
    });
  }
};

// @desc    Get order details for admin
// @route   GET /api/v1/orders/admin/:id
// @access  Private/Admin
export const getOrderDetailsAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phoneNumber addresses")
      .populate("couponApplied", "code discountType discountValue");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order details admin error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching order details",
      error: error.message,
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/admin/:id/status
// @access  Private/Admin
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderStatus, message } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    
    const statusMessages = {
      confirmed: 'Order has been confirmed and is being prepared for processing',
      processing: 'Order is being processed and prepared for shipment',
      shipped: 'Order has been shipped and is on its way to you',
      delivered: 'Order has been successfully delivered',
      cancelled: 'Order has been cancelled'
    };

    if (statusMessages[orderStatus] && oldStatus !== orderStatus) {
      order.shippingUpdates.push({
        message: message || statusMessages[orderSjrtatus],
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
    console.error('Update order status admin error:', error);
    
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

// @desc    Add shipping update (Admin)
// @route   POST /api/v1/orders/admin/:id/shipping-update
// @access  Private/Admin
export const addShippingUpdate = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shipping update message is required'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.shippingUpdates.push({
      message: message.trim(),
      timestamp: new Date()
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('couponApplied', 'code discountType discountValue');

    res.json({
      success: true,
      message: 'Shipping update added successfully',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Add shipping update error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding shipping update',
      error: error.message
    });
  }
};

// @desc    Get order invoice (Admin)
// @route   GET /api/v1/orders/admin/:id/invoice
// @access  Private/Admin
export const getOrderInvoiceAdmin = async (req, res) => {
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

    const invoiceBuffer = await createInvoice(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${order.orderNumber}.pdf`
    });

    res.send(invoiceBuffer);

  } catch (error) {
    console.error('Get order invoice admin error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while generating invoice',
      error: error.message
    });
  }
};

// Helper function to calculate current price
const getCurrentPrice = (product) => {
  if (!product) return 0;
  
  if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
    return product.discountPrice;
  }
  return product.mrpPrice || 0;
};

// ---
// ---
// --- ⬇️ FUNCTION RENAMED AND UPDATED ⬇️ ---
// ---

// @desc    Delete a pending or failed order (Admin)
// @route   DELETE /api/v1/orders/admin/:id
// @access  Private/Admin
export const deleteAbandonedOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // --- 💡 START OF FIX ---
    // Check if payment is 'pending' OR 'failed'
    if (order.paymentStatus !== 'pending' && order.paymentStatus !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Only orders with a "pending" or "failed" payment status can be deleted.',
      });
    }
    // --- 💡 END OF FIX ---
    
    // Check it's not a COD order (these should be 'cancelled')
    if (order.paymentMethod === 'COD') {
      return res.status(400).json({
        success: false,
        message: 'Pending COD orders cannot be deleted. They must be "cancelled" via status update.',
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: "Abandoned order deleted successfully.",
    });

  } catch (error) {
    console.error("Delete abandoned order error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting order",
      error: error.message,
    });
  }
};
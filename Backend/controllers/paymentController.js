import razorpay from '../config/razorpay.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js'; // 1. Import Product
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createInvoice } from '../utils/createInvoice.js'; // 2. Import utils
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount, currency = 'USD' } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${order.orderNumber}`,
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      data: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// @desc    Verify payment and update order
// @route   POST /api/v1/payments/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    // 1. Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 2. Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      
      order.paymentStatus = 'failed';
      await order.save(); // Save outside transaction
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // --- 💡 START OF FIX ---
    // Payment is successful!
    // Now we do all the steps that orderController used to do.

    // 3. Update Order
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed'; // Mark order as confirmed
    
    order.shippingUpdates.push({
      message: 'Payment received. Order confirmed and being processed.',
      timestamp: new Date()
    });

    await order.save({ session });

    // 4. Update Product Stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // 5. Clear User's Cart
    await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { cart: [] } },
      { session }
    );
    // --- 💡 END OF FIX ---

    // 6. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // 7. Send confirmation email (outside the transaction)
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('couponApplied', 'code discountType discountValue');

      const invoiceBuffer = await createInvoice(populatedOrder);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p>Dear ${populatedOrder.user.name},</p>
          <p>Your payment was successful and your order <strong>#${populatedOrder.orderNumber}</strong> has been confirmed.</p>
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
      console.error('Error sending payment confirmation email:', emailError);
      // Do not fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order: order._id,
        paymentId: razorpay_payment_id,
        orderNumber: order.orderNumber
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// @desc    Handle payment failure
// @route   POST /api/v1/payments/payment-failed
// @access  Private
export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      order.shippingUpdates.push({
        message: `Payment failed or was cancelled by user: ${error.description || 'User closed modal'}`,
        timestamp: new Date()
      });
      await order.save();
    }

    res.json({
      success: true,
      message: 'Payment failure recorded',
      data: order
    });

  } catch (error) {
    console.error('Handle payment failure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment failure',
      error: error.message
    });
  }
};

// @desc    Get payment status
// @route   GET /api/v1/payments/status/:orderId
// @access  Private
export const getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user.id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        razorpayOrderId: order.razorpayOrderId,
        totalAmount: order.totalAmount
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};
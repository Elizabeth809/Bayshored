import razorpay from '../config/razorpay.js';
import Order from '../models/orderModel.js';
import crypto from 'crypto';

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount, currency = 'INR' } = req.body;

    // Validate order exists and belongs to user
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

    // Create Razorpay order
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

    // Update order with Razorpay order ID
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
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    // Verify the order belongs to the user
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

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      
      // Update order status to failed
      order.paymentStatus = 'failed';
      await order.save();
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Payment successful - update order
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    
    // Add shipping update
    order.shippingUpdates.push({
      message: 'Payment received. Order confirmed and being processed.',
      timestamp: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Send confirmation email (you can reuse your email function here)
    // await sendOrderConfirmationEmail(order);

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

    // Update order status
    order.paymentStatus = 'failed';
    order.shippingUpdates.push({
      message: `Payment failed: ${error.description || 'Unknown error'}`,
      timestamp: new Date()
    });

    await order.save();

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
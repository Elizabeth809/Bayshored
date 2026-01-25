import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import fedexService from '../services/fedexService.js';

// =============================================
// HELPER FUNCTIONS
// =============================================

// Calculate current price
const getCurrentPrice = (product) => {
  if (!product) return 0;
  
  if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
    return product.discountPrice;
  }
  return product.mrpPrice || 0;
};

// Calculate package details from cart
const calculatePackageDetails = (cartItems) => {
  let totalWeight = 0;
  let maxDimensions = { length: 0, width: 0, height: 0 };

  cartItems.forEach(item => {
    const product = item.product;
    const quantity = item.quantity;

    // Calculate weight - estimate based on dimensions if not provided
    let itemWeight = 5; // Default 5 lbs
    
    if (product.dimensions) {
      // Estimate weight based on artwork size (typical framed art)
      const area = (product.dimensions.height || 0) * (product.dimensions.width || 0);
      itemWeight = Math.max(2, Math.min(50, area / 100)); // 2-50 lbs based on size
    }
    
    totalWeight += itemWeight * quantity;

    // Calculate dimensions (convert cm to inches)
    if (product.dimensions) {
      let length = (product.dimensions.width || 24) / 2.54; // width becomes length
      let width = (product.dimensions.height || 24) / 2.54;  // height becomes width
      let height = (product.dimensions.depth || 6) / 2.54;   // depth becomes height

      maxDimensions.length = Math.max(maxDimensions.length, length);
      maxDimensions.width = Math.max(maxDimensions.width, width);
      maxDimensions.height = Math.max(maxDimensions.height, Math.max(height, 4)); // Minimum 4 inches
    }
  });

  // Apply minimums
  totalWeight = Math.max(totalWeight, 2);
  if (maxDimensions.length === 0) {
    maxDimensions = { length: 24, width: 24, height: 6 };
  }

  return {
    weight: {
      value: Math.ceil(totalWeight),
      units: 'LB'
    },
    dimensions: {
      length: Math.ceil(maxDimensions.length),
      width: Math.ceil(maxDimensions.width),
      height: Math.ceil(maxDimensions.height),
      units: 'IN'
    }
  };
};

// Helper to parse transit days from FedEx response
const parseTransitDays = (transitDays) => {
  if (!transitDays) return null;
  
  // If it's already a number or string number
  if (typeof transitDays === 'number') {
    return transitDays.toString();
  }
  
  if (typeof transitDays === 'string') {
    return transitDays;
  }
  
  // If it's an object (FedEx format)
  if (typeof transitDays === 'object') {
    // Try to extract the value
    if (transitDays.value) {
      return transitDays.value.toString();
    }
    if (transitDays.minimumTransitTime) {
      // Convert FedEx format like "ONE_DAY" to "1"
      const transitMap = {
        'ONE_DAY': '1',
        'TWO_DAYS': '2',
        'THREE_DAYS': '3',
        'FOUR_DAYS': '4',
        'FIVE_DAYS': '5',
        'SIX_DAYS': '6',
        'SEVEN_DAYS': '7'
      };
      return transitMap[transitDays.minimumTransitTime] || transitDays.description || '3-5';
    }
    if (transitDays.description) {
      return transitDays.description;
    }
  }
  
  return '3-5'; // Default
};

// Helper to format available rates for storage
const formatAvailableRates = (rates) => {
  if (!rates || !Array.isArray(rates)) return [];
  
  return rates.map(rate => ({
    serviceType: rate.serviceType || '',
    serviceName: rate.serviceName || rate.name || '',
    deliveryDate: rate.deliveryTimestamp ? new Date(rate.deliveryTimestamp) : null,
    transitDays: parseTransitDays(rate.transitDays),
    totalCharge: rate.price || rate.totalCharge?.amount || 0,
    currency: rate.totalCharge?.currency || 'USD',
    isEstimated: rate.isEstimated || false
  }));
};

// Fallback shipping rates
const getFallbackShippingRates = (subtotal) => {
  const freeShippingThreshold = 500;
  const baseGroundRate = subtotal >= freeShippingThreshold ? 0 : 15;

  return [
    {
      id: 'FEDEX_GROUND',
      serviceType: 'FEDEX_GROUND',
      name: 'FedEx Ground',
      price: baseGroundRate,
      currency: 'USD',
      transitDays: '3-5',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'GROUND_HOME_DELIVERY',
      serviceType: 'GROUND_HOME_DELIVERY',
      name: 'FedEx Home Delivery',
      price: baseGroundRate + 3,
      currency: 'USD',
      transitDays: '3-5',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'FEDEX_EXPRESS_SAVER',
      serviceType: 'FEDEX_EXPRESS_SAVER',
      name: 'FedEx Express Saver',
      price: 22,
      currency: 'USD',
      transitDays: '3',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'FEDEX_2_DAY',
      serviceType: 'FEDEX_2_DAY',
      name: 'FedEx 2Day',
      price: 28,
      currency: 'USD',
      transitDays: '2',
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'STANDARD_OVERNIGHT',
      serviceType: 'STANDARD_OVERNIGHT',
      name: 'FedEx Standard Overnight',
      price: 45,
      currency: 'USD',
      transitDays: '1',
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'PRIORITY_OVERNIGHT',
      serviceType: 'PRIORITY_OVERNIGHT',
      name: 'FedEx Priority Overnight',
      price: 55,
      currency: 'USD',
      transitDays: '1',
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    }
  ];
};

// =============================================
// COUPON CONTROLLER
// =============================================

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

// =============================================
// ADDRESS VALIDATION
// =============================================

// @desc    Validate shipping address with FedEx
// @route   POST /api/v1/orders/validate-address
// @access  Private
export const validateShippingAddress = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Validate required fields
    const requiredFields = ['streetLine1', 'city', 'stateCode', 'zipCode'];
    const streetLine1 = shippingAddress.streetLine1 || shippingAddress.street;
    const stateCode = shippingAddress.stateCode || shippingAddress.state;
    
    if (!streetLine1 || !shippingAddress.city || !stateCode || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required address fields'
      });
    }

    // Call FedEx validation
    const validationResult = await fedexService.validateAddress({
      streetLine1: streetLine1,
      streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment,
      city: shippingAddress.city,
      stateCode: stateCode,
      zipCode: shippingAddress.zipCode
    });

    return res.status(200).json({
      success: true,
      message: validationResult.isValid 
        ? 'Address validated successfully' 
        : 'Address requires verification',
      data: {
        isValid: validationResult.isValid,
        isResidential: validationResult.isResidential,
        classification: validationResult.classification,
        normalizedAddress: validationResult.normalizedAddress,
        messages: validationResult.messages || [],
        requiresManualVerification: validationResult.requiresManualVerification,
        originalAddress: shippingAddress
      }
    });
  } catch (error) {
    console.error('Address validation error:', error);
    
    return res.status(200).json({
      success: true,
      message: 'Address validation skipped',
      data: {
        isValid: false,
        requiresManualVerification: true,
        warning: error.message
      }
    });
  }
};

// =============================================
// SHIPPING OPTIONS
// =============================================

// @desc    Get shipping options with FedEx rates
// @route   POST /api/v1/orders/shipping-options
// @access  Private
export const getShippingOptions = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Get user cart
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name mrpPrice discountPrice dimensions offer'
    });

    if (!user || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate package details
    const packageDetails = calculatePackageDetails(user.cart);

    // Calculate subtotal for insurance
    const subtotal = user.cart.reduce((total, item) => {
      return total + getCurrentPrice(item.product) * item.quantity;
    }, 0);

    // Build rate request
    const rateRequest = {
      destination: {
        streetLine1: shippingAddress.streetLine1 || shippingAddress.street,
        streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment,
        city: shippingAddress.city,
        stateCode: shippingAddress.stateCode || shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        isResidential: shippingAddress.isResidential !== false
      },
      packages: [{
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        insuredValue: {
          amount: subtotal,
          currency: 'USD'
        }
      }]
    };

    // Get FedEx rates
    const rateResult = await fedexService.getShippingRates(rateRequest);

    if (rateResult.success && rateResult.rates.length > 0) {
      // Format rates for frontend
      const formattedRates = rateResult.rates.map(rate => ({
        id: rate.serviceType,
        serviceType: rate.serviceType,
        name: rate.serviceName,
        price: rate.price || rate.totalCharge?.amount || 0,
        currency: rate.totalCharge?.currency || 'USD',
        transitDays: parseTransitDays(rate.transitDays),
        deliveryDate: rate.deliveryTimestamp,
        guaranteed: rate.guaranteed || false,
        fedexService: true,
        isEstimated: rate.isEstimated || false,
        baseCharge: rate.baseCharge,
        surcharges: rate.surcharges
      }));

      return res.json({
        success: true,
        message: rateResult.isEstimated 
          ? 'Estimated shipping rates retrieved' 
          : 'Shipping options retrieved',
        data: {
          rates: formattedRates,
          packageDetails,
          subtotal,
          fedexAvailable: true,
          fromWarehouse: rateResult.fromWarehouse,
          isEstimated: rateResult.isEstimated || false
        }
      });
    }

    // Fallback rates
    const fallbackRates = getFallbackShippingRates(subtotal);

    return res.json({
      success: true,
      message: 'Shipping options retrieved (fallback rates)',
      data: {
        rates: fallbackRates,
        packageDetails,
        subtotal,
        fedexAvailable: false,
        warning: rateResult.error || 'FedEx rates unavailable'
      }
    });
  } catch (error) {
    console.error('Get shipping options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting shipping options',
      error: error.message
    });
  }
};

// =============================================
// CREATE ORDER
// =============================================

// @desc    Create new order with FedEx shipping
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shippingAddress,
      couponCode,
      paymentMethod = 'card',
      notes,
      shippingMethod = 'ground',
      signatureRequired = false
    } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const streetLine1 = shippingAddress.streetLine1 || shippingAddress.street;
    const stateCode = shippingAddress.stateCode || shippingAddress.state;
    const phoneNumber = shippingAddress.phoneNumber || shippingAddress.phoneNo;

    if (!streetLine1 || !shippingAddress.city || !stateCode || !shippingAddress.zipCode || !phoneNumber) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required'
      });
    }

    // Get user with populated cart
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer sku',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.cart.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate products and stock
    for (const item of user.cart) {
      if (!item.product || !item.product.active) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'Unknown'}" is no longer available`
        });
      }
      if (item.product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available`
        });
      }
    }

    // Calculate subtotal
    const subtotal = user.cart.reduce((total, item) => {
      return total + getCurrentPrice(item.product) * item.quantity;
    }, 0);

    // Calculate package details
    const packageDetails = calculatePackageDetails(user.cart);

    // Get shipping rates
    let shippingCost = 0;
    let fedexAvailable = false;
    let selectedRate = null;
    let allRates = [];

    try {
      const rateRequest = {
        destination: {
          streetLine1: streetLine1,
          streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment || '',
          city: shippingAddress.city,
          stateCode: stateCode,
          zipCode: shippingAddress.zipCode,
          isResidential: shippingAddress.isResidential !== false
        },
        packages: [{
          weight: packageDetails.weight,
          dimensions: packageDetails.dimensions,
          insuredValue: { amount: subtotal, currency: 'USD' }
        }]
      };

      const rateResult = await fedexService.getShippingRates(rateRequest);

      if (rateResult.success && rateResult.rates.length > 0) {
        fedexAvailable = true;
        allRates = rateResult.rates;
        
        // Find the selected shipping method
        const serviceTypeMap = {
          'ground': ['FEDEX_GROUND', 'GROUND_HOME_DELIVERY'],
          'home_delivery': ['GROUND_HOME_DELIVERY', 'FEDEX_GROUND'],
          'express_saver': ['FEDEX_EXPRESS_SAVER'],
          '2_day': ['FEDEX_2_DAY', 'FEDEX_2_DAY_AM'],
          'overnight': ['STANDARD_OVERNIGHT', 'PRIORITY_OVERNIGHT', 'FIRST_OVERNIGHT']
        };

        const preferredTypes = serviceTypeMap[shippingMethod] || ['FEDEX_GROUND', 'GROUND_HOME_DELIVERY'];
        
        for (const serviceType of preferredTypes) {
          selectedRate = allRates.find(rate => rate.serviceType === serviceType);
          if (selectedRate) break;
        }

        if (!selectedRate && allRates.length > 0) {
          selectedRate = allRates[0];
        }

        if (selectedRate) {
          shippingCost = selectedRate.price || selectedRate.totalCharge?.amount || 0;
        }
      }
    } catch (error) {
      console.error('FedEx rate error:', error);
    }

    // Fallback shipping cost
    if (!fedexAvailable || shippingCost === 0) {
      const fallbackRates = getFallbackShippingRates(subtotal);
      allRates = fallbackRates;
      
      selectedRate = fallbackRates.find(r => 
        r.serviceType === 'FEDEX_GROUND' || r.serviceType === 'GROUND_HOME_DELIVERY'
      ) || fallbackRates[0];
      
      shippingCost = selectedRate?.price || (subtotal >= 500 ? 0 : 15);
    }

    // Apply coupon
    let coupon = null;
    let discountAmount = 0;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      }).session(session);

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }
        if (subtotal < coupon.minOrderAmount) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Minimum order amount of $${coupon.minOrderAmount} required`
          });
        }

        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
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

    // Validate address with FedEx (optional, don't block on failure)
    let addressValidation = { isValid: false, requiresManualVerification: true };
    try {
      addressValidation = await fedexService.validateAddress({
        streetLine1: streetLine1,
        streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment,
        city: shippingAddress.city,
        stateCode: stateCode,
        zipCode: shippingAddress.zipCode
      });
    } catch (error) {
      console.warn('Address validation failed:', error.message);
    }

    // Prepare order items
    const orderItems = user.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtOrder: getCurrentPrice(item.product),
      name: item.product.name,
      image: item.product.images?.[0] || item.product.image,
      author: item.product.author?.name || 'Unknown Artist',
      medium: item.product.medium,
      sku: item.product.sku
    }));

    // Generate order number BEFORE creating the order
    const orderNumber = await Order.generateOrderNumber();
    
    console.log('Generated order number:', orderNumber);

    // Create order object
    const orderData = {
      orderNumber, // Set explicitly
      user: req.user.id,
      items: orderItems,
      shippingAddress: {
        recipientName: shippingAddress.recipientName || user.name,
        companyName: shippingAddress.companyName || '',
        streetLine1: streetLine1,
        streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment || '',
        city: shippingAddress.city,
        stateCode: stateCode.toUpperCase(),
        zipCode: shippingAddress.zipCode,
        countryCode: 'US',
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        email: shippingAddress.email || user.email,
        isResidential: shippingAddress.isResidential !== false,
        specialInstructions: shippingAddress.specialInstructions || '',
        addressVerified: addressValidation.isValid,
        fedexClassification: addressValidation.classification || null,
        normalizedByFedex: addressValidation.normalizedAddress || null
      },
      subtotal,
      shippingCost,
      couponApplied: coupon?._id || null,
      discountAmount,
      totalAmount,
      currency: 'USD',
      paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod,
      orderStatus: paymentMethod === 'cod' || paymentMethod === 'COD' ? 'confirmed' : 'pending',
      paymentStatus: 'pending',
      shippingMethod,
      carrier: fedexAvailable ? 'fedex' : 'other',
      signatureRequired,
      fedex: {
        serviceType: selectedRate?.serviceType || 'FEDEX_GROUND',
        serviceName: selectedRate?.serviceName || selectedRate?.name || 'FedEx Ground',
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        shippingCost: {
          baseCharge: selectedRate?.baseCharge || 0,
          surcharges: selectedRate?.surcharges || 0,
          totalNetCharge: shippingCost,
          currency: 'USD'
        },
        estimatedDeliveryDate: selectedRate?.deliveryTimestamp ? new Date(selectedRate.deliveryTimestamp) : null,
        addressValidation: {
          validated: addressValidation.isValid,
          classification: addressValidation.classification || null,
          originalAddress: shippingAddress,
          normalizedAddress: addressValidation.normalizedAddress || null,
          validationMessages: addressValidation.messages || []
        },
        availableRates: formatAvailableRates(allRates),
        fedexAvailable
      },
      notes: {
        customer: notes || ''
      },
      shippingUpdates: [{
        message: 'Order placed successfully',
        timestamp: new Date(),
        status: 'order_placed'
      }]
    };

    const order = new Order(orderData);
    await order.save({ session });

    // Update stock and clear cart
    for (const item of user.cart) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
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
  } finally {
    session.endSession();
  }
};

// ===========================================
// TRACKING - AUTO-SYNC WITH FEDEX
// ===========================================

// @desc    Track order and sync status from FedEx
// @route   GET /api/v1/orders/track/:orderId
// @access  Private
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // If no tracking number, return order info only
    if (!order.fedex?.trackingNumber) {
      return res.json({
        success: true,
        message: 'No tracking number available',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            shippingUpdates: order.shippingUpdates
          },
          tracking: null,
          hasTracking: false
        }
      });
    }

    // Fetch live tracking from FedEx
    const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

    if (!trackingResult.success) {
      return res.json({
        success: true,
        message: 'Tracking service temporarily unavailable',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            fedex: order.fedex
          },
          tracking: null,
          hasTracking: true,
          error: trackingResult.error
        }
      });
    }

    // Update order with FedEx tracking data
    const shouldUpdateStatus = shouldSyncOrderStatus(order.orderStatus, trackingResult.mappedOrderStatus);

    if (shouldUpdateStatus) {
      order.orderStatus = trackingResult.mappedOrderStatus;
      
      // Add shipping update
      order.shippingUpdates.push({
        message: `FedEx: ${trackingResult.currentStatus.description}`,
        timestamp: new Date(trackingResult.currentStatus.timestamp),
        location: trackingResult.currentStatus.location,
        status: trackingResult.mappedOrderStatus,
        fedexEventCode: trackingResult.currentStatus.code
      });
    }

    // Update FedEx tracking info
    order.fedex.currentStatus = {
      code: trackingResult.currentStatus.code,
      description: trackingResult.currentStatus.description,
      location: {
        city: trackingResult.currentStatus.location?.split(', ')[0] || '',
        stateOrProvinceCode: trackingResult.currentStatus.location?.split(', ')[1] || ''
      },
      timestamp: new Date(trackingResult.currentStatus.timestamp)
    };

    // Update estimated delivery if available
    if (trackingResult.estimatedDelivery) {
      order.fedex.estimatedDeliveryTimeWindow = {
        begins: trackingResult.estimatedDelivery.begins ? new Date(trackingResult.estimatedDelivery.begins) : null,
        ends: trackingResult.estimatedDelivery.ends ? new Date(trackingResult.estimatedDelivery.ends) : null
      };
      
      if (trackingResult.estimatedDelivery.ends) {
        order.fedex.estimatedDeliveryDate = new Date(trackingResult.estimatedDelivery.ends);
      }
    }

    // Update actual delivery if delivered
    if (trackingResult.isDelivered && trackingResult.deliveryDetails.actualDeliveryTimestamp) {
      order.fedex.actualDeliveryDate = new Date(trackingResult.deliveryDetails.actualDeliveryTimestamp);
      order.orderStatus = 'delivered';
    }

    // Store tracking history (limit to last 50 events)
    if (trackingResult.events && trackingResult.events.length > 0) {
      order.fedex.trackingHistory = trackingResult.events.slice(0, 50).map(event => ({
        timestamp: new Date(event.timestamp),
        eventType: event.eventType,
        eventDescription: event.eventDescription,
        location: event.location,
        derivedStatus: event.derivedStatus
      }));
    }

    order.fedex.lastTrackingUpdate = new Date();

    await order.save();

    // Prepare response
    res.json({
      success: true,
      message: 'Tracking information retrieved',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress
        },
        tracking: {
          trackingNumber: order.fedex.trackingNumber,
          carrier: 'FedEx',
          serviceType: order.fedex.serviceType,
          serviceName: order.fedex.serviceName,
          currentStatus: trackingResult.currentStatus,
          mappedOrderStatus: trackingResult.mappedOrderStatus,
          estimatedDelivery: trackingResult.estimatedDelivery,
          deliveryDetails: trackingResult.deliveryDetails,
          events: trackingResult.events,
          shipmentDetails: trackingResult.shipmentDetails,
          isDelivered: trackingResult.isDelivered,
          isInTransit: trackingResult.isInTransit,
          hasException: trackingResult.hasException,
          lastUpdated: new Date()
        },
        hasTracking: true,
        isMockData: trackingResult.isMockData || false
      }
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking order',
      error: error.message
    });
  }
};

// Helper to determine if order status should be synced
const shouldSyncOrderStatus = (currentStatus, newStatus) => {
  const statusPriority = {
    'pending': 1,
    'confirmed': 2,
    'processing': 3,
    'ready_to_ship': 4,
    'shipped': 5,
    'out_for_delivery': 6,
    'delivered': 7,
    'cancelled': 0,
    'returned': 0
  };

  // Only update if new status is further along in the process
  const currentPriority = statusPriority[currentStatus] || 0;
  const newPriority = statusPriority[newStatus] || 0;

  return newPriority > currentPriority;
};

// @desc    Get order tracking info (lightweight)
// @route   GET /api/v1/orders/:orderId/tracking-status
// @access  Private
export const getTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select('fedex orderStatus orderNumber user');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    if (!order.fedex?.trackingNumber) {
      return res.json({
        success: true,
        data: {
          hasTracking: false,
          orderStatus: order.orderStatus,
          orderNumber: order.orderNumber
        }
      });
    }

    // Fetch fresh tracking data
    const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

    res.json({
      success: true,
      data: {
        hasTracking: true,
        trackingNumber: order.fedex.trackingNumber,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        currentStatus: trackingResult.success ? trackingResult.currentStatus : null,
        estimatedDelivery: trackingResult.success ? trackingResult.estimatedDelivery : null,
        isDelivered: trackingResult.success ? trackingResult.isDelivered : false,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get tracking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user orders with live tracking status
// @route   GET /api/v1/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, includeTracking = 'false' } = req.query;

    const filter = {
      user: req.user.id,
      $or: [
        { paymentStatus: { $ne: 'pending' } },
        { paymentMethod: 'COD' }
      ]
    };

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('couponApplied', 'code discountType discountValue')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Optionally fetch live tracking for shipped orders
    let ordersWithTracking = orders;
    
    if (includeTracking === 'true') {
      ordersWithTracking = await Promise.all(
        orders.map(async (order) => {
          const orderObj = order.toObject();
          
          if (order.fedex?.trackingNumber && 
              ['shipped', 'out_for_delivery'].includes(order.orderStatus)) {
            try {
              const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);
              
              if (trackingResult.success) {
                orderObj.liveTracking = {
                  currentStatus: trackingResult.currentStatus,
                  estimatedDelivery: trackingResult.estimatedDelivery,
                  isDelivered: trackingResult.isDelivered,
                  isInTransit: trackingResult.isInTransit,
                  hasException: trackingResult.hasException,
                  lastEvent: trackingResult.events?.[0]
                };
              }
            } catch (error) {
              console.error(`Tracking error for order ${order._id}:`, error.message);
            }
          }
          
          return orderObj;
        })
      );
    }

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: ordersWithTracking
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
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching order',
      error: error.message
    });
  }
};

// =============================================
// TRACKING
// =============================================

// @desc    Get shipping label
// @route   GET /api/v1/orders/:orderId/shipping-label
// @access  Private
export const getShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!order.fedex?.labelUrl && !order.fedex?.labelData) {
      return res.status(404).json({
        success: false,
        message: 'No shipping label available'
      });
    }

    res.json({
      success: true,
      message: 'Shipping label retrieved',
      data: {
        labelUrl: order.fedex.labelUrl,
        labelData: order.fedex.labelData,
        trackingNumber: order.fedex.trackingNumber,
        labelFormat: order.fedex.labelFormat || 'PDF'
      }
    });
  } catch (error) {
    console.error('Get shipping label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting shipping label',
      error: error.message
    });
  }
};

// =============================================
// FEDEX LOCATIONS
// =============================================

// @desc    Find nearby FedEx locations
// @route   POST /api/v1/orders/fedex-locations
// @access  Public
export const findFedExLocations = async (req, res) => {
  try {
    const { address, radius = 25 } = req.body;

    if (!address || !address.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'ZIP code is required'
      });
    }

    const locationResult = await fedexService.searchLocations({
      street: address.street || address.streetLine1,
      city: address.city,
      state: address.stateCode || address.state,
      zipCode: address.zipCode,
      radius,
      limit: 10
    });

    res.json({
      success: locationResult.success,
      message: locationResult.success ? 'Locations found' : 'No locations found',
      count: locationResult.count || 0,
      data: locationResult.locations || []
    });
  } catch (error) {
    console.error('Find FedEx locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding locations',
      error: error.message
    });
  }
};

// =============================================
// ADMIN FUNCTIONS
// =============================================

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
      sortBy = 'createdAt_desc',
      paymentStatus,
      carrier
    } = req.query;
    
    const listFilter = {};
    const statsFilter = {};

    if (status && status !== 'all') {
      listFilter.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      listFilter.paymentStatus = paymentStatus;
      statsFilter.paymentStatus = paymentStatus;
    }

    if (carrier && carrier !== 'all') {
      listFilter.carrier = carrier;
      statsFilter.carrier = carrier;
    }

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      listFilter.$or = [
        { user: { $in: userIds } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'fedex.trackingNumber': { $regex: search, $options: 'i' } }
      ];
      statsFilter.$or = listFilter.$or;
    }

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

    const orders = await Order.find(listFilter)
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountType discountValue')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(listFilter);

    const stats = await Order.aggregate([
      { $match: statsFilter },
      {
        $group: {
          _id: null,
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
          totalOrders: { $sum: 1 },
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
          totalOrders: 1,
          totalSuccessfulOrders: 1,
          averageOrderValue: {
            $cond: [
              { $eq: ["$totalSuccessfulOrders", 0] },
              0,
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
      stats: stats[0] || { 
        totalRevenue: 0, 
        totalPendingAmount: 0, 
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
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order details admin error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Order not found" });
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

    const validStatuses = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    
    const statusMessages = {
      confirmed: 'Order has been confirmed',
      processing: 'Order is being processed',
      ready_to_ship: 'Order is ready for shipment',
      shipped: 'Order has been shipped',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned'
    };

    if (oldStatus !== orderStatus) {
      order.addShippingUpdate({
        message: message || statusMessages[orderStatus],
        status: orderStatus
      });
    }

    if (orderStatus === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user.id;
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
      return res.status(404).json({ success: false, message: 'Order not found' });
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
    const { message, location, status } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shipping update message is required'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.addShippingUpdate({
      message: message.trim(),
      location,
      status
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding shipping update',
      error: error.message
    });
  }
};

// @desc    Create FedEx shipment for order (Admin)
// @route   POST /api/v1/orders/admin/:id/create-shipment
// @access  Private/Admin
export const createShipment = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { serviceType, signatureRequired } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Shipment already created for this order',
        trackingNumber: order.fedex.trackingNumber
      });
    }

    const shipmentData = {
      orderNumber: order.orderNumber,
      recipient: {
        contact: {
          personName: order.shippingAddress.recipientName,
          phoneNumber: order.shippingAddress.phoneNumber,
          emailAddress: order.shippingAddress.email || order.user.email,
          companyName: order.shippingAddress.companyName
        },
        address: {
          streetLine1: order.shippingAddress.streetLine1,
          streetLine2: order.shippingAddress.streetLine2,
          city: order.shippingAddress.city,
          stateCode: order.shippingAddress.stateCode,
          zipCode: order.shippingAddress.zipCode,
          isResidential: order.shippingAddress.isResidential
        }
      },
      packages: [{
        weight: order.fedex?.weight || { value: 5, units: 'LB' },
        dimensions: order.fedex?.dimensions || { length: 24, width: 24, height: 6, units: 'IN' },
        description: 'Artwork'
      }],
      serviceType: serviceType || order.fedex?.serviceType || 'FEDEX_GROUND',
      signatureRequired: signatureRequired ?? order.signatureRequired,
      insuranceAmount: order.subtotal
    };

    const shipmentResult = await fedexService.createShipment(shipmentData);

    if (!shipmentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create FedEx shipment',
        error: shipmentResult.error
      });
    }

    order.fedex.trackingNumber = shipmentResult.trackingNumber;
    order.fedex.masterTrackingNumber = shipmentResult.trackingNumber;
    order.fedex.labelUrl = shipmentResult.labelUrl;
    order.fedex.labelData = shipmentResult.labelData;
    order.fedex.shipmentId = shipmentResult.shipmentId;
    order.fedex.serviceType = shipmentResult.serviceType;
    order.fedex.serviceName = shipmentResult.serviceName;
    order.fedex.shipmentCreatedAt = new Date();
    order.fedex.labelCreatedAt = new Date();
    
    if (shipmentResult.estimatedDeliveryDate) {
      order.fedex.estimatedDeliveryDate = new Date(shipmentResult.estimatedDeliveryDate);
    }

    order.orderStatus = 'ready_to_ship';
    order.addShippingUpdate({
      message: `FedEx shipment created. Tracking: ${shipmentResult.trackingNumber}`,
      status: 'shipment_created'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Shipment created successfully',
      data: {
        trackingNumber: shipmentResult.trackingNumber,
        labelUrl: shipmentResult.labelUrl,
        serviceType: shipmentResult.serviceType,
        serviceName: shipmentResult.serviceName,
        estimatedDelivery: shipmentResult.estimatedDeliveryDate
      }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating shipment',
      error: error.message
    });
  }
};

// @desc    Cancel FedEx shipment (Admin)
// @route   POST /api/v1/orders/admin/:id/cancel-shipment
// @access  Private/Admin
export const cancelShipment = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'No shipment to cancel'
      });
    }

    if (['delivered', 'out_for_delivery'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel shipment that is out for delivery or delivered'
      });
    }

    const cancelResult = await fedexService.cancelShipment(order.fedex.trackingNumber);

    if (!cancelResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel shipment',
        error: cancelResult.error
      });
    }

    order.addShippingUpdate({
      message: 'FedEx shipment cancelled',
      status: 'shipment_cancelled'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: cancelResult
    });
  } catch (error) {
    console.error('Cancel shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling shipment',
      error: error.message
    });
  }
};

// @desc    Delete abandoned order (Admin)
// @route   DELETE /api/v1/orders/admin/:id
// @access  Private/Admin
export const deleteAbandonedOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== 'pending' && order.paymentStatus !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Only orders with pending or failed payment can be deleted'
      });
    }
    
    if (order.paymentMethod === 'COD') {
      return res.status(400).json({
        success: false,
        message: 'COD orders cannot be deleted. Use cancel instead.'
      });
    }

    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: "Abandoned order deleted successfully"
    });
  } catch (error) {
    console.error("Delete abandoned order error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting order",
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Return order data for invoice generation
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order invoice admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating invoice',
      error: error.message
    });
  }
};

// Export additional functions for compatibility
export const getAllOrders = getAllOrdersAdmin;
export const updateOrderStatus = updateOrderStatusAdmin;
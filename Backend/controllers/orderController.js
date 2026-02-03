import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import fedexService from '../services/fedexService.js';
import PDFDocument from 'pdfkit';

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

// Calculate package details from cart - IMPROVED FOR ART
const calculatePackageDetails = (cartItems) => {
  let totalWeight = 0;
  let maxDimensions = { length: 0, width: 0, height: 0 };

  cartItems.forEach(item => {
    const product = item.product;
    const quantity = item.quantity;

      // Prefer explicit shipping weight if available on the product
      let itemWeight = 0;

      if (product.shipping && product.shipping.weight && product.shipping.weight.value) {
        // Convert to pounds using product virtual if available
        if (typeof product.weightInLbs === 'number' && product.weightInLbs > 0) {
          itemWeight = product.weightInLbs;
        } else {
          // Fallback: use shipping.weight.value and unit
          const w = product.shipping.weight;
          switch ((w.unit || 'lb').toLowerCase()) {
            case 'lb': itemWeight = w.value; break;
            case 'oz': itemWeight = w.value / 16; break;
            case 'kg': itemWeight = w.value * 2.20462; break;
            case 'g': itemWeight = w.value * 0.00220462; break;
            default: itemWeight = w.value; break;
          }
        }

        // Use provided package dimensions if present
        if (product.shipping.packageDimensions) {
          const pd = product.shipping.packageDimensions;
          const unit = (pd.unit || 'in').toLowerCase();
          const lengthIn = unit === 'cm' ? pd.length / 2.54 : pd.length;
          const widthIn = unit === 'cm' ? pd.width / 2.54 : pd.width;
          const heightIn = unit === 'cm' ? pd.height / 2.54 : pd.height;

          const padding = 4;
          maxDimensions.length = Math.max(maxDimensions.length, Math.ceil(lengthIn + padding));
          maxDimensions.width = Math.max(maxDimensions.width, Math.ceil(widthIn + padding));
          maxDimensions.height = Math.max(maxDimensions.height, Math.ceil(heightIn + padding));
        }
      } else {
        // Calculate weight based on art type and dimensions (legacy fallback)
        itemWeight = 5; // Default 5 lbs
      
        if (product.dimensions) {
          // Calculate area in square inches (convert from cm if needed)
          const heightCm = product.dimensions.height || 60;
          const widthCm = product.dimensions.width || 60;
          const depthCm = product.dimensions.depth || 5;
        
          // Convert cm to inches
          const heightIn = heightCm / 2.54;
          const widthIn = widthCm / 2.54;
          const depthIn = Math.max(depthCm / 2.54, 4); // Minimum 4 inches for framing
        
          // Calculate weight based on size and type
          const areaSquareInches = heightIn * widthIn;
        
          // Weight formula: base weight + area factor
          // Canvas/framed art: heavier
          // Prints: lighter
          const weightPerSquareInch = product.medium?.toLowerCase().includes('canvas') ? 0.015 : 0.008;
          const frameWeight = depthIn > 2 ? 3 : 1; // Extra weight for deep frames
        
          itemWeight = Math.max(2, Math.min(70, (areaSquareInches * weightPerSquareInch) + frameWeight));
        
          // Update max dimensions (add padding for packaging)
          const padding = 4; // 4 inches padding for protection
          maxDimensions.length = Math.max(maxDimensions.length, widthIn + padding);
          maxDimensions.width = Math.max(maxDimensions.width, heightIn + padding);
          maxDimensions.height = Math.max(maxDimensions.height, depthIn + padding);
        }
      }
    
    totalWeight += itemWeight * quantity;
  });

  // Apply FedEx limits and minimums
  totalWeight = Math.max(2, Math.min(150, totalWeight)); // 2-150 lbs
  
  // Ensure minimum dimensions
  if (maxDimensions.length === 0) {
    maxDimensions = { length: 24, width: 24, height: 6 };
  }
  
  // Apply FedEx dimension limits
  maxDimensions.length = Math.max(6, Math.min(119, Math.ceil(maxDimensions.length)));
  maxDimensions.width = Math.max(6, Math.min(119, Math.ceil(maxDimensions.width)));
  maxDimensions.height = Math.max(4, Math.min(70, Math.ceil(maxDimensions.height)));

  return {
    weight: {
      value: Math.ceil(totalWeight),
      units: 'LB'
    },
    dimensions: {
      length: maxDimensions.length,
      width: maxDimensions.width,
      height: maxDimensions.height,
      units: 'IN'
    }
  };
};

// Parse transit days - FIXED
const parseTransitDays = (transitDays) => {
  if (!transitDays) return null;
  
  // If it's already a number
  if (typeof transitDays === 'number') {
    return transitDays;
  }
  
  // If it's a string number
  if (typeof transitDays === 'string') {
    const parsed = parseInt(transitDays, 10);
    if (!isNaN(parsed)) return parsed;
    return transitDays; // Return as-is if not a number (e.g., "3-5")
  }
  
  // If it's an object (FedEx format)
  if (typeof transitDays === 'object') {
    if (transitDays.value !== undefined) {
      return typeof transitDays.value === 'number' ? transitDays.value : parseInt(transitDays.value, 10);
    }
    
    if (transitDays.minimumTransitTime) {
      const transitMap = {
        'ONE_DAY': 1,
        'TWO_DAYS': 2,
        'THREE_DAYS': 3,
        'FOUR_DAYS': 4,
        'FIVE_DAYS': 5,
        'SIX_DAYS': 6,
        'SEVEN_DAYS': 7
      };
      return transitMap[transitDays.minimumTransitTime] || null;
    }
    
    if (transitDays.description) {
      // Try to extract number from description like "1 Business Day"
      const match = transitDays.description.match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
      return transitDays.description;
    }
  }
  
  return null;
};

// Format available rates for storage - FIXED
const formatAvailableRates = (rates) => {
  if (!rates || !Array.isArray(rates)) return [];
  
  return rates.map(rate => {
    const transitDays = parseTransitDays(rate.transitDays);
    
    return {
      serviceType: rate.serviceType || '',
      serviceName: rate.serviceName || rate.name || '',
      deliveryDate: rate.deliveryTimestamp ? new Date(rate.deliveryTimestamp) : null,
      transitDays: typeof transitDays === 'number' ? transitDays.toString() : transitDays,
      totalCharge: rate.price || rate.totalCharge?.amount || 0,
      currency: rate.totalCharge?.currency || 'USD',
      isEstimated: rate.isEstimated || false
    };
  });
};

// Fallback shipping rates - FIXED with realistic pricing
const getFallbackShippingRates = (subtotal, packageWeight = 5) => {
  const freeShippingThreshold = 500;
  
  // Base rates adjusted by weight
  const weightMultiplier = Math.max(1, packageWeight / 10);
  
  const baseGroundRate = subtotal >= freeShippingThreshold ? 0 : Math.round(12 * weightMultiplier);

  return [
    {
      id: 'FEDEX_GROUND',
      serviceType: 'FEDEX_GROUND',
      name: 'FedEx Ground',
      price: baseGroundRate,
      currency: 'USD',
      transitDays: 5,
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
      transitDays: 5,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'FEDEX_EXPRESS_SAVER',
      serviceType: 'FEDEX_EXPRESS_SAVER',
      name: 'FedEx Express Saver',
      price: Math.round(22 * weightMultiplier),
      currency: 'USD',
      transitDays: 3,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'FEDEX_2_DAY',
      serviceType: 'FEDEX_2_DAY',
      name: 'FedEx 2Day',
      price: Math.round(28 * weightMultiplier),
      currency: 'USD',
      transitDays: 2,
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'STANDARD_OVERNIGHT',
      serviceType: 'STANDARD_OVERNIGHT',
      name: 'FedEx Standard Overnight',
      price: Math.round(45 * weightMultiplier),
      currency: 'USD',
      transitDays: 1,
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    },
    {
      id: 'PRIORITY_OVERNIGHT',
      serviceType: 'PRIORITY_OVERNIGHT',
      name: 'FedEx Priority Overnight',
      price: Math.round(55 * weightMultiplier),
      currency: 'USD',
      transitDays: 1,
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true
    }
  ];
};

// Helper function for status sync - IMPROVED
const shouldSyncOrderStatus = (currentOrderStatus, fedexMappedStatus) => {
  if (!fedexMappedStatus) return false;
  
  // Never downgrade certain statuses
  const protectedStatuses = ['cancelled', 'returned', 'refunded'];
  if (protectedStatuses.includes(currentOrderStatus)) {
    return false;
  }
  
  // Status hierarchy
  const statusHierarchy = {
    'pending': 0,
    'confirmed': 1,
    'processing': 2,
    'ready_to_ship': 3,
    'shipped': 4,
    'out_for_delivery': 5,
    'delivered': 6
  };
  
  const currentIndex = statusHierarchy[currentOrderStatus] ?? -1;
  const newIndex = statusHierarchy[fedexMappedStatus] ?? -1;
  
  // Only update if new status is higher in hierarchy
  return newIndex > currentIndex;
};

// Parse location helper
const parseLocation = (locationString) => {
  if (!locationString) return { city: '', stateOrProvinceCode: '' };
  
  if (typeof locationString === 'object') {
    return {
      city: locationString.city || '',
      stateOrProvinceCode: locationString.state || locationString.stateOrProvinceCode || ''
    };
  }
  
  const parts = locationString.split(', ');
  return {
    city: parts[0] || '',
    stateOrProvinceCode: parts[1] || ''
  };
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

    // Extract address fields with fallbacks
    const streetLine1 = (shippingAddress.streetLine1 || shippingAddress.street || '').trim();
    const streetLine2 = (shippingAddress.streetLine2 || shippingAddress.apartment || '').trim();
    const city = (shippingAddress.city || '').trim();
    const stateCode = (shippingAddress.stateCode || shippingAddress.state || '').toUpperCase().trim();
    const zipCode = (shippingAddress.zipCode || shippingAddress.postalCode || '').trim();

    // Validate required fields
    if (!streetLine1 || !city || !stateCode || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required address fields',
        data: {
          isValid: false,
          requiresManualVerification: true,
          missingFields: {
            streetLine1: !streetLine1,
            city: !city,
            stateCode: !stateCode,
            zipCode: !zipCode
          }
        }
      });
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format. Use 12345 or 12345-6789',
        data: {
          isValid: false,
          requiresManualVerification: true
        }
      });
    }

    // Call FedEx validation
    const validationResult = await fedexService.validateAddress({
      streetLine1,
      streetLine2,
      city,
      stateCode,
      zipCode
    });

    return res.status(200).json({
      success: true,
      message: validationResult.isValid 
        ? 'Address validated successfully' 
        : 'Address requires verification',
      data: {
        isValid: validationResult.isValid,
        isResidential: validationResult.isResidential,
        isBusiness: validationResult.isBusiness,
        classification: validationResult.classification,
        normalizedAddress: validationResult.normalizedAddress,
        messages: validationResult.messages || [],
        requiresManualVerification: validationResult.requiresManualVerification,
        originalAddress: {
          streetLine1,
          streetLine2,
          city,
          stateCode,
          zipCode
        }
      }
    });
  } catch (error) {
    console.error('Address validation error:', error);
    
    // Return a soft failure - don't block the checkout
    return res.status(200).json({
      success: true,
      message: 'Address validation skipped',
      data: {
        isValid: false,
        requiresManualVerification: true,
        warning: 'Address validation service temporarily unavailable',
        error: error.message
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
      select: 'name mrpPrice discountPrice dimensions offer medium shipping'
    });

    if (!user || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate package details from cart items
    const packageDetails = calculatePackageDetails(user.cart);

    // Calculate subtotal for insurance
    const subtotal = user.cart.reduce((total, item) => {
      return total + getCurrentPrice(item.product) * item.quantity;
    }, 0);

    // Prepare address for FedEx
    const streetLine1 = (shippingAddress.streetLine1 || shippingAddress.street || '').trim();
    const streetLine2 = (shippingAddress.streetLine2 || shippingAddress.apartment || '').trim();
    const city = (shippingAddress.city || '').trim();
    const stateCode = (shippingAddress.stateCode || shippingAddress.state || '').toUpperCase().trim();
    const zipCode = (shippingAddress.zipCode || shippingAddress.postalCode || '').trim();

    // Validate required fields
    if (!streetLine1 || !city || !stateCode || !zipCode) {
      const fallbackRates = getFallbackShippingRates(subtotal, packageDetails.weight.value);
      return res.json({
        success: true,
        message: 'Shipping options retrieved (incomplete address)',
        data: {
          rates: fallbackRates,
          packageDetails,
          subtotal,
          fedexAvailable: false,
          warning: 'Complete address required for accurate shipping rates'
        }
      });
    }

    // Validate address with FedEx to get classification and normalized address
    let addressValidation = { isValid: false, requiresManualVerification: true };
    try {
      addressValidation = await fedexService.validateAddress({
        streetLine1,
        streetLine2,
        city,
        stateCode,
        zipCode
      });
    } catch (err) {
      console.warn('Address validation error (shipping-options):', err.message);
    }

    // Use normalized address if available, otherwise fall back to provided fields
    const destStreetLines = (addressValidation.normalizedAddress?.streetLines) || [streetLine1, streetLine2].filter(Boolean);
    const destCity = addressValidation.normalizedAddress?.city || city;
    const destState = addressValidation.normalizedAddress?.stateCode || stateCode;
    const destZip = addressValidation.normalizedAddress?.zipCode || zipCode;
    const isResidential = addressValidation.isResidential ?? (shippingAddress.isResidential !== false);

    // Build rate request
    const rateRequest = {
      destination: {
        streetLines: destStreetLines,
        streetLine1: destStreetLines[0] || streetLine1,
        streetLine2: destStreetLines[1] || streetLine2,
        city: destCity,
        stateCode: destState,
        zipCode: destZip,
        isResidential
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
        transitDays: rate.transitDays,
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
    const fallbackRates = getFallbackShippingRates(subtotal, packageDetails.weight.value);

    return res.json({
      success: true,
      message: 'Shipping options retrieved (estimated rates)',
      data: {
        rates: fallbackRates,
        packageDetails,
        subtotal,
        fedexAvailable: false,
        warning: rateResult.error || 'Live FedEx rates unavailable'
      }
    });
  } catch (error) {
    console.error('Get shipping options error:', error);
    
    // Return fallback rates on error
    try {
      const user = await User.findById(req.user.id).populate('cart.product');
      const subtotal = user?.cart?.reduce((total, item) => {
        return total + getCurrentPrice(item.product) * item.quantity;
      }, 0) || 0;
      
      const fallbackRates = getFallbackShippingRates(subtotal);
      
      return res.json({
        success: true,
        message: 'Shipping options retrieved (fallback)',
        data: {
          rates: fallbackRates,
          fedexAvailable: false,
          warning: 'Shipping service temporarily unavailable'
        }
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: 'Server error while getting shipping options',
        error: error.message
      });
    }
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
        select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer sku shipping',
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
      // Validate address with FedEx before requesting rates
      let addressValidationForOrder = { isValid: false };
      try {
        addressValidationForOrder = await fedexService.validateAddress({
          streetLine1: streetLine1,
          streetLine2: shippingAddress.streetLine2 || shippingAddress.apartment,
          city: shippingAddress.city,
          stateCode: stateCode,
          zipCode: shippingAddress.zipCode
        });
      } catch (err) {
        console.warn('Address validation error (createOrder):', err.message);
      }

      const reqStreetLines = (addressValidationForOrder.normalizedAddress?.streetLines) || [streetLine1, shippingAddress.streetLine2 || shippingAddress.apartment].filter(Boolean);
      const reqCity = addressValidationForOrder.normalizedAddress?.city || shippingAddress.city;
      const reqState = addressValidationForOrder.normalizedAddress?.stateCode || stateCode;
      const reqZip = addressValidationForOrder.normalizedAddress?.zipCode || shippingAddress.zipCode;
      const reqIsResidential = addressValidationForOrder.isResidential ?? (shippingAddress.isResidential !== false);

      const rateRequest = {
        destination: {
          streetLines: reqStreetLines,
          streetLine1: reqStreetLines[0] || streetLine1,
          streetLine2: reqStreetLines[1] || (shippingAddress.streetLine2 || shippingAddress.apartment || ''),
          city: reqCity,
          stateCode: reqState,
          zipCode: reqZip,
          isResidential: reqIsResidential
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

// ===========================================
// @desc    Manually refresh tracking for an order (Admin)
// @route   POST /api/v1/orders/:orderId/refresh-tracking
// @access  Private/Admin
// ===========================================

export const refreshTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order has no tracking number'
      });
    }

    // Force fresh fetch from FedEx
    const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

    if (!trackingResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch tracking',
        error: trackingResult.error
      });
    }

    // Update order status
    const previousStatus = order.orderStatus;
    
    if (trackingResult.mappedOrderStatus) {
      const shouldUpdate = shouldSyncOrderStatus(
        order.orderStatus, 
        trackingResult.mappedOrderStatus
      );
      
      if (shouldUpdate) {
        order.orderStatus = trackingResult.mappedOrderStatus;
      }
    }

    // Update all tracking fields
    order.fedex.currentStatus = {
      code: trackingResult.currentStatus?.code || '',
      description: trackingResult.currentStatus?.description || '',
      location: parseLocation(trackingResult.currentStatus?.location),
      timestamp: trackingResult.currentStatus?.timestamp 
        ? new Date(trackingResult.currentStatus.timestamp) 
        : new Date()
    };

    if (trackingResult.estimatedDelivery) {
      order.fedex.estimatedDeliveryTimeWindow = {
        begins: trackingResult.estimatedDelivery.begins 
          ? new Date(trackingResult.estimatedDelivery.begins) 
          : null,
        ends: trackingResult.estimatedDelivery.ends 
          ? new Date(trackingResult.estimatedDelivery.ends) 
          : null
      };
    }

    if (trackingResult.events) {
      order.fedex.trackingHistory = trackingResult.events.slice(0, 50).map(event => ({
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        eventType: event.eventType || '',
        eventDescription: event.eventDescription || '',
        location: event.location || {},
        derivedStatus: event.derivedStatus || ''
      }));
    }

    order.fedex.lastTrackingUpdate = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Tracking refreshed successfully',
      data: {
        previousStatus,
        currentStatus: order.orderStatus,
        statusChanged: previousStatus !== order.orderStatus,
        tracking: trackingResult
      }
    });

  } catch (error) {
    console.error('Refresh tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing tracking',
      error: error.message
    });
  }
};

// ===========================================
// @desc    Bulk update tracking for all shipped orders (Cron Job)
// @route   POST /api/v1/orders/bulk-update-tracking
// @access  Private/Admin or System
// ===========================================

export const bulkUpdateTracking = async (req, res) => {
  try {
    // Find all orders that are shipped but not delivered
    const orders = await Order.find({
      orderStatus: { $in: ['shipped', 'out_for_delivery'] },
      'fedex.trackingNumber': { $exists: true, $ne: null }
    }).limit(50); // Process 50 at a time

    const results = {
      total: orders.length,
      updated: 0,
      failed: 0,
      delivered: 0,
      errors: []
    };

    for (const order of orders) {
      try {
        const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

        if (trackingResult.success) {
          // Update status if needed
          if (trackingResult.mappedOrderStatus) {
            const shouldUpdate = shouldSyncOrderStatus(
              order.orderStatus, 
              trackingResult.mappedOrderStatus
            );
            
            if (shouldUpdate) {
              order.orderStatus = trackingResult.mappedOrderStatus;
              
              if (trackingResult.isDelivered) {
                results.delivered++;
              }
            }
          }

          // Update tracking info
          order.fedex.currentStatus = {
            code: trackingResult.currentStatus?.code || '',
            description: trackingResult.currentStatus?.description || '',
            location: parseLocation(trackingResult.currentStatus?.location),
            timestamp: new Date()
          };

          order.fedex.lastTrackingUpdate = new Date();
          await order.save();
          
          results.updated++;
        } else {
          results.failed++;
          results.errors.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            error: trackingResult.error
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (orderError) {
        results.failed++;
        results.errors.push({
          orderId: order._id,
          error: orderError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk tracking update completed',
      data: results
    });

  } catch (error) {
    console.error('Bulk update tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk tracking update',
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





//===========================================================================================================

// ===========================================
// ADMIN: GET ALL ORDERS
// ===========================================

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const {
      status = 'all',
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt_desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // Search by customer name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.user = { $in: users.map(u => u._id) };
    }

    // Sorting
    let sortOption = {};
    const [field, direction] = sortBy.split('_');
    sortOption[field] = direction === 'asc' ? 1 : -1;

    // Execute query
    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountValue discountType')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Calculate stats
    const allOrders = await Order.find({});
    const stats = {
      totalOrders: allOrders.length,
      totalRevenue: allOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      totalFailedAmount: allOrders
        .filter(o => o.paymentStatus === 'failed')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// ===========================================
// ADMIN: GET ORDER DETAILS
// ===========================================

export const getOrderDetailsAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountValue discountType');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details'
    });
  }
};

// ===========================================
// ADMIN: UPDATE ORDER STATUS
// ===========================================

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.orderStatus;
    
    if (order.updateStatus) {
      order.updateStatus(orderStatus, {
        description: `Status updated from ${previousStatus} to ${orderStatus}`,
        updatedBy: 'admin',
        updatedByUser: req.user._id
      });
    } else {
      order.orderStatus = orderStatus;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// ===========================================
// ADMIN: ADD SHIPPING UPDATE
// ===========================================

export const addShippingUpdate = async (req, res) => {
  try {
    const { message } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.addShippingUpdate({
      message,
      timestamp: new Date(),
      status: order.orderStatus,
      updatedBy: 'admin'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Shipping update added successfully',
      data: order
    });
  } catch (error) {
    console.error('Add shipping update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding shipping update'
    });
  }
};

// ===========================================
// ADMIN: CREATE FEDEX SHIPMENT
// ===========================================

export const createShipment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      serviceType = 'FEDEX_GROUND',
      signatureRequired = false,
      packages = null,
      schedulePickup = false,
      pickupDate = null
    } = req.body;

    const order = await Order.findById(orderId).populate('user', 'email name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if already shipped
    if (order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order already has a tracking number',
        trackingNumber: order.fedex.trackingNumber
      });
    }

    // Check order status
    if (['cancelled', 'returned', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot ship ${order.orderStatus} order`
      });
    }

    // Prepare package data
    const packageData = packages || [{
      weight: { value: 5, units: 'LB' },
      dimensions: { length: 12, width: 12, height: 6, units: 'IN' }
    }];

    // Calculate total insured value
    const totalValue = order.items.reduce((sum, item) => {
      return sum + (item.priceAtOrder * item.quantity);
    }, 0);

    // Prepare recipient data
    const recipient = {
      contact: {
        personName: order.shippingAddress.recipientName || order.user?.name,
        phoneNumber: order.shippingAddress.phoneNumber || order.shippingAddress.phoneNo,
        emailAddress: order.shippingAddress.email || order.user?.email,
        companyName: order.shippingAddress.companyName || ''
      },
      address: {
        streetLine1: order.shippingAddress.streetLine1 || order.shippingAddress.street,
        streetLine2: order.shippingAddress.streetLine2 || order.shippingAddress.apartment,
        city: order.shippingAddress.city,
        stateCode: order.shippingAddress.stateCode || order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        countryCode: order.shippingAddress.countryCode || 'US',
        isResidential: order.shippingAddress.isResidential !== false
      }
    };

    console.log(`[Admin] Creating FedEx shipment for order ${order.orderNumber}`);

    // Create FedEx shipment
    const shipmentResult = await fedexService.createShipment({
      orderNumber: order.orderNumber,
      recipient,
      packages: packageData,
      serviceType,
      signatureRequired,
      insuranceAmount: totalValue
    });

    if (!shipmentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create FedEx shipment',
        error: shipmentResult.error,
        alerts: shipmentResult.alerts
      });
    }

    // Update order with FedEx data
    order.fedex = {
      ...order.fedex,
      trackingNumber: shipmentResult.trackingNumber,
      masterTrackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      labelData: shipmentResult.labelData,
      labelFormat: 'PDF',
      shipmentId: shipmentResult.shipmentId,
      serviceType: serviceType,
      serviceName: shipmentResult.serviceName || fedexService.getServiceName(serviceType),
      estimatedDeliveryDate: shipmentResult.estimatedDeliveryDate
        ? new Date(shipmentResult.estimatedDeliveryDate)
        : null,
      shippingCost: shipmentResult.totalCharge ? {
        totalNetCharge: shipmentResult.totalCharge.amount || shipmentResult.totalCharge,
        currency: 'USD'
      } : null,
      dimensions: packageData[0]?.dimensions,
      weight: packageData[0]?.weight,
      insuranceAmount: { amount: totalValue, currency: 'USD' },
      shipmentCreatedAt: new Date(),
      labelCreatedAt: new Date(),
      fedexAvailable: true
    };

    // Update order status
    const previousStatus = order.orderStatus;
    order.orderStatus = 'shipped';
    order.shippedAt = new Date();
    order.carrier = 'fedex';

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'shipped',
      previousStatus,
      timestamp: new Date(),
      description: `Order shipped via FedEx ${shipmentResult.serviceName || serviceType}`,
      updatedBy: 'admin',
      updatedByUser: req.user._id,
      metadata: {
        trackingNumber: shipmentResult.trackingNumber,
        serviceType
      }
    });

    // Add shipping update
    order.addShippingUpdate({
      message: `Shipment created - Tracking: ${shipmentResult.trackingNumber}`,
      timestamp: new Date(),
      status: 'shipped',
      updatedBy: 'admin'
    });

    await order.save();

    // Schedule pickup if requested
    let pickupResult = null;
    if (schedulePickup) {
      try {
        pickupResult = await schedulePickupForOrder(order, pickupDate);
      } catch (pickupError) {
        console.error('Pickup scheduling error:', pickupError);
        // Don't fail the shipment if pickup fails
      }
    }

    res.json({
      success: true,
      message: 'Order shipped successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        tracking: {
          trackingNumber: shipmentResult.trackingNumber,
          carrier: 'FedEx',
          serviceType: serviceType,
          serviceName: shipmentResult.serviceName,
          labelUrl: shipmentResult.labelUrl,
          estimatedDeliveryDate: shipmentResult.estimatedDeliveryDate,
          trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${shipmentResult.trackingNumber}`
        },
        pickup: pickupResult
      }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating shipment',
      error: error.message
    });
  }
};

// ===========================================
// ADMIN: SCHEDULE PICKUP
// ===========================================

export const schedulePickup = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { pickupDate, readyTime, closeTime } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order must be shipped first'
      });
    }

    const pickupResult = await schedulePickupForOrder(order, pickupDate, readyTime, closeTime);

    res.json({
      success: true,
      message: 'Pickup scheduled successfully',
      data: pickupResult
    });
  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling pickup',
      error: error.message
    });
  }
};

// Helper function to schedule pickup
async function schedulePickupForOrder(order, pickupDate = null, readyTime = '09:00', closeTime = '17:00') {
  try {
    // Use tomorrow if no date specified
    const scheduledDate = pickupDate ? new Date(pickupDate) : new Date();
    if (!pickupDate) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const pickupRequest = {
      pickupDate: scheduledDate.toISOString().split('T')[0],
      readyTime: readyTime,
      closeTime: closeTime,
      location: {
        contact: {
          personName: order.shippingAddress.recipientName,
          phoneNumber: order.shippingAddress.phoneNumber || order.shippingAddress.phoneNo,
          companyName: order.shippingAddress.companyName || 'Art Gallery Inc.'
        },
        address: {
          streetLines: [
            order.shippingAddress.streetLine1 || order.shippingAddress.street,
            order.shippingAddress.streetLine2 || order.shippingAddress.apartment
          ].filter(Boolean),
          city: order.shippingAddress.city,
          stateOrProvinceCode: order.shippingAddress.stateCode || order.shippingAddress.state,
          postalCode: order.shippingAddress.zipCode,
          countryCode: 'US'
        }
      },
      packageDetails: {
        packageCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalWeight: {
          value: order.fedex?.weight?.value || 5,
          units: order.fedex?.weight?.units || 'LB'
        }
      },
      trackingNumbers: [order.fedex.trackingNumber]
    };

    // Call FedEx pickup API (you'll need to implement this in fedexService)
    const result = await fedexService.schedulePickup(pickupRequest);

    if (result.success) {
      // Update order with pickup info
      order.fedex.pickupConfirmationNumber = result.confirmationNumber;
      order.fedex.pickupDate = scheduledDate;
      order.fedex.pickupLocation = `${order.shippingAddress.city}, ${order.shippingAddress.stateCode}`;

      order.addShippingUpdate({
        message: `Pickup scheduled for ${scheduledDate.toDateString()} - Confirmation: ${result.confirmationNumber}`,
        timestamp: new Date(),
        status: order.orderStatus,
        updatedBy: 'admin'
      });

      await order.save();
    }

    return result;
  } catch (error) {
    console.error('Schedule pickup helper error:', error);
    throw error;
  }
}

// ===========================================
// ADMIN: CANCEL SHIPMENT
// ===========================================

export const cancelShipment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'No tracking number to cancel'
      });
    }

    // Cancel with FedEx
    const cancelResult = await fedexService.cancelShipment(order.fedex.trackingNumber);

    if (cancelResult.success) {
      // Update order
      order.fedex.trackingNumber = null;
      order.fedex.labelUrl = null;
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;

      order.addShippingUpdate({
        message: 'Shipment cancelled',
        timestamp: new Date(),
        status: 'cancelled',
        updatedBy: 'admin'
      });

      await order.save();

      res.json({
        success: true,
        message: 'Shipment cancelled successfully',
        data: order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel shipment',
        error: cancelResult.error
      });
    }
  } catch (error) {
    console.error('Cancel shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling shipment',
      error: error.message
    });
  }
};

// ===========================================
// ADMIN: GET INVOICE
// ===========================================

export const getOrderInvoiceAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order #${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Customer info
    doc.text('Bill To:');
    doc.text(order.user.name);
    doc.text(order.user.email);
    doc.moveDown();

    // Items
    doc.text('Items:');
    order.items.forEach(item => {
      doc.text(`${item.name} x ${item.quantity} - $${item.priceAtOrder}`);
    });
    doc.moveDown();

    // Total
    doc.fontSize(14).text(`Total: $${order.totalAmount}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice'
    });
  }
};

// ===========================================
// ADMIN: DELETE ABANDONED ORDER
// ===========================================

export const deleteAbandonedOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion of pending/failed orders that are not COD
    if (
      (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') &&
      order.paymentMethod !== 'COD'
    ) {
      await Order.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Only pending or failed non-COD orders can be deleted'
      });
    }
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
};

// ===========================================
// USER: TRACK ORDER
// ===========================================

export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Use findById without modification first
    const order = await Order.findById(orderId).lean(); // .lean() returns plain JS object

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = req.user._id || req.user.id;
    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // No tracking number case
    if (!order.fedex?.trackingNumber) {
      return res.json({
        success: true,
        message: 'No tracking number available yet',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            shippingUpdates: order.shippingUpdates || [],
            items: order.items,
            totalAmount: order.totalAmount
          },
          tracking: null,
          hasTracking: false
        }
      });
    }

    // Fetch tracking from FedEx
    let trackingResult;
    try {
      trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);
    } catch (fedexError) {
      console.error('FedEx API Error:', fedexError.message);

      // Return cached data if available
      return res.json({
        success: true,
        message: 'Using cached tracking data',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            fedex: order.fedex,
            shippingAddress: order.shippingAddress
          },
          tracking: order.fedex.currentStatus ? {
            trackingNumber: order.fedex.trackingNumber,
            carrier: 'FedEx',
            serviceType: order.fedex.serviceType,
            serviceName: order.fedex.serviceName,
            currentStatus: order.fedex.currentStatus,
            estimatedDelivery: order.fedex.estimatedDeliveryTimeWindow,
            events: order.fedex.trackingHistory || [],
            lastUpdated: order.fedex.lastTrackingUpdate,
            isCached: true
          } : null,
          hasTracking: true,
          error: 'FedEx service temporarily unavailable. Showing last known status.'
        }
      });
    }

    // If tracking failed
    if (!trackingResult.success) {
      return res.json({
        success: true,
        message: 'Tracking information unavailable',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            fedex: order.fedex,
            shippingAddress: order.shippingAddress
          },
          tracking: order.fedex.currentStatus ? {
            trackingNumber: order.fedex.trackingNumber,
            currentStatus: order.fedex.currentStatus,
            isCached: true
          } : null,
          hasTracking: true,
          isMockData: trackingResult.isMockData || false,
          error: trackingResult.error
        }
      });
    }

    // Build atomic update object
    const updateData = {
      'fedex.lastTrackingUpdate': new Date()
    };

    // Update current status
    if (trackingResult.currentStatus) {
      updateData['fedex.currentStatus'] = {
        code: trackingResult.currentStatus.code || '',
        description: trackingResult.currentStatus.description || '',
        location: parseLocation(trackingResult.currentStatus.location),
        timestamp: trackingResult.currentStatus.timestamp
          ? new Date(trackingResult.currentStatus.timestamp)
          : new Date()
      };
    }

    // Update estimated delivery
    if (trackingResult.estimatedDelivery) {
      updateData['fedex.estimatedDeliveryTimeWindow'] = {
        begins: trackingResult.estimatedDelivery.begins
          ? new Date(trackingResult.estimatedDelivery.begins)
          : null,
        ends: trackingResult.estimatedDelivery.ends
          ? new Date(trackingResult.estimatedDelivery.ends)
          : null
      };

      if (trackingResult.estimatedDelivery.ends) {
        updateData['fedex.estimatedDeliveryDate'] = new Date(trackingResult.estimatedDelivery.ends);
      }
    }

    // Update tracking history (limit to 50 events)
    if (trackingResult.events && trackingResult.events.length > 0) {
      updateData['fedex.trackingHistory'] = trackingResult.events.slice(0, 50).map(event => ({
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        eventType: event.eventType || '',
        eventDescription: event.eventDescription || event.description || '',
        location: typeof event.location === 'object'
          ? event.location
          : { formatted: event.location || '' },
        derivedStatus: event.derivedStatus || '',
        exceptionDescription: event.exceptionDescription || null
      }));
    }

    // Check if order status should be updated
    let statusUpdated = false;
    let newOrderStatus = order.orderStatus;

    if (trackingResult.mappedOrderStatus) {
      const shouldUpdate = shouldSyncOrderStatus(
        order.orderStatus,
        trackingResult.mappedOrderStatus
      );

      if (shouldUpdate) {
        newOrderStatus = trackingResult.mappedOrderStatus;
        statusUpdated = true;
        updateData.orderStatus = newOrderStatus;

        // Handle delivery
        if (trackingResult.isDelivered) {
          updateData.orderStatus = 'delivered';
          newOrderStatus = 'delivered';

          if (trackingResult.deliveryDetails?.actualDeliveryTimestamp) {
            updateData['fedex.actualDeliveryDate'] = new Date(
              trackingResult.deliveryDetails.actualDeliveryTimestamp
            );
          }

          // Update payment status for COD
          if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
            updateData.paymentStatus = 'paid';
          }
        }
      }
    }

    // Use findByIdAndUpdate for atomic update (no version conflict)
    await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: false } // We don't need the updated document
    );

    // Add shipping update if status changed (separate operation)
    if (statusUpdated && trackingResult.currentStatus) {
      await Order.findByIdAndUpdate(
        orderId,
        {
          $push: {
            shippingUpdates: {
              $each: [{
                message: `FedEx: ${trackingResult.currentStatus.description || 'Status updated'}`,
                timestamp: new Date(),
                location: trackingResult.currentStatus.location || '',
                status: newOrderStatus,
                fedexEventCode: trackingResult.currentStatus.code || ''
              }],
              $slice: -50 // Keep only last 50 updates
            }
          }
        }
      );
    }

    // Return response
    res.json({
      success: true,
      message: statusUpdated
        ? 'Tracking retrieved and order status updated'
        : 'Tracking information retrieved',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: newOrderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          items: order.items,
          totalAmount: order.totalAmount,
          statusUpdated
        },
        tracking: {
          trackingNumber: order.fedex.trackingNumber,
          carrier: 'FedEx',
          serviceType: order.fedex.serviceType,
          serviceName: order.fedex.serviceName || fedexService.getServiceName(order.fedex.serviceType),
          currentStatus: trackingResult.currentStatus,
          mappedOrderStatus: trackingResult.mappedOrderStatus,
          estimatedDelivery: trackingResult.estimatedDelivery,
          deliveryDetails: trackingResult.deliveryDetails,
          events: trackingResult.events || [],
          shipmentDetails: trackingResult.shipmentDetails,
          isDelivered: trackingResult.isDelivered || false,
          isInTransit: trackingResult.isInTransit || false,
          hasException: trackingResult.hasException || false,
          lastUpdated: new Date().toISOString()
        },
        hasTracking: true,
        isMockData: trackingResult.isMockData || false
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    
    // Log specific error types
    if (error.name === 'VersionError') {
      console.warn('[Order] Version conflict during tracking update - this is handled gracefully');
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while tracking order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===========================================
// USER: GET TRACKING STATUS (Quick)
// ===========================================

export const getTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // Use lean() to get plain object (no versioning issues)
    const order = await Order.findById(orderId)
      .select('user orderNumber orderStatus fedex shippingAddress')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = req.user._id || req.user.id;
    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // No tracking number
    if (!order.fedex?.trackingNumber) {
      return res.json({
        success: true,
        data: {
          hasTracking: false,
          orderStatus: order.orderStatus
        }
      });
    }

    // Check cache freshness (5 minutes)
    const cacheAge = order.fedex.lastTrackingUpdate
      ? (Date.now() - new Date(order.fedex.lastTrackingUpdate).getTime()) / 1000 / 60
      : Infinity;

    // Return cached data if fresh enough
    if (cacheAge < 5 && order.fedex.currentStatus) {
      return res.json({
        success: true,
        data: {
          hasTracking: true,
          trackingNumber: order.fedex.trackingNumber,
          currentStatus: order.fedex.currentStatus,
          estimatedDelivery: order.fedex.estimatedDeliveryTimeWindow,
          isDelivered: order.orderStatus === 'delivered',
          isInTransit: ['shipped', 'out_for_delivery'].includes(order.orderStatus),
          isCached: true,
          cacheAge: Math.round(cacheAge)
        }
      });
    }

    // Fetch fresh tracking data
    try {
      const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

      if (trackingResult.success) {
        // Build atomic update
        const updateData = {
          'fedex.lastTrackingUpdate': new Date()
        };

        if (trackingResult.currentStatus) {
          updateData['fedex.currentStatus'] = {
            code: trackingResult.currentStatus.code,
            description: trackingResult.currentStatus.description,
            location: parseLocation(trackingResult.currentStatus.location),
            timestamp: new Date(trackingResult.currentStatus.timestamp)
          };
        }

        // Check status update
        const shouldUpdate = shouldSyncOrderStatus(
          order.orderStatus,
          trackingResult.mappedOrderStatus
        );

        if (shouldUpdate) {
          updateData.orderStatus = trackingResult.mappedOrderStatus;
        }

        // Atomic update - no version conflict
        await Order.findByIdAndUpdate(orderId, { $set: updateData });

        return res.json({
          success: true,
          data: {
            hasTracking: true,
            trackingNumber: order.fedex.trackingNumber,
            serviceName: order.fedex.serviceName,
            currentStatus: trackingResult.currentStatus,
            estimatedDelivery: trackingResult.estimatedDelivery,
            isDelivered: trackingResult.isDelivered,
            isInTransit: trackingResult.isInTransit,
            hasException: trackingResult.hasException,
            events: trackingResult.events?.slice(0, 3),
            isCached: false,
            isMockData: trackingResult.isMockData || false
          }
        });
      }

      // Tracking failed - return cached data
      return res.json({
        success: true,
        data: {
          hasTracking: true,
          trackingNumber: order.fedex.trackingNumber,
          currentStatus: order.fedex.currentStatus,
          orderStatus: order.orderStatus,
          error: trackingResult.error,
          isCached: true,
          isMockData: trackingResult.isMockData || false
        }
      });

    } catch (fedexError) {
      console.error('FedEx quick status error:', fedexError.message);

      return res.json({
        success: true,
        data: {
          hasTracking: true,
          trackingNumber: order.fedex.trackingNumber,
          currentStatus: order.fedex.currentStatus,
          orderStatus: order.orderStatus,
          error: 'FedEx service temporarily unavailable',
          isCached: true
        }
      });
    }

  } catch (error) {
    console.error('Get tracking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking status'
    });
  }
};

export default {
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
  addShippingUpdate,
  createShipment,
  schedulePickup,
  cancelShipment,
  getOrderInvoiceAdmin,
  deleteAbandonedOrder,
  trackOrder,
  getTrackingStatus
};
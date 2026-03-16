import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Coupon from "../models/couponModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import fedexService from '../services/fedexService.js';
import PDFDocument from 'pdfkit';
import NodeCache from 'node-cache';

// =============================================
// CACHING & RATE LIMITING
// =============================================

const shippingRateCache = new NodeCache({
  stdTTL: 300, // 5 minutes cache
  checkperiod: 60,
  useClones: false
});

const CACHE_KEYS = {
  RATE: (addressHash, cartHash) => `rate:${addressHash}:${cartHash}`,
  ADDRESS: (address) => `addr:${Buffer.from(JSON.stringify(address)).toString('base64').slice(0, 20)}`
};

// =============================================
// LOGGER (Production Ready)
// =============================================

const logger = {
  info: (context, message, data = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context,
      message,
      ...data
    }));
  },
  warn: (context, message, data = {}) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      context,
      message,
      ...data
    }));
  },
  error: (context, message, error = {}, data = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context,
      message,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ...data
    }));
  },
  debug: (context, message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        context,
        message,
        ...data
      }));
    }
  }
};

// =============================================
// HELPER FUNCTIONS
// =============================================

// Circuit breaker for external API calls
class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  canExecute() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('CircuitBreaker', 'Circuit opened due to failures', {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }
}

const fedexCircuitBreaker = new CircuitBreaker();

// Calculate current price
const getCurrentPrice = (product) => {
  if (!product) return 0;

  if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
    return product.discountPrice;
  }
  return product.mrpPrice || 0;
};

// Generate hash for cache keys
const generateHash = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// Calculate item weight from product data
const calculateItemWeight = (product) => {
  const context = 'WeightCalculation';

  // Priority 1: Explicit shipping weight
  if (product.shipping?.weight?.value) {
    try {
      const weightValue = parseFloat(product.shipping.weight.value);
      const unit = (product.shipping.weight.unit || 'lb').toLowerCase();

      if (!isNaN(weightValue) && weightValue > 0) {
        let weightInLbs = weightValue;

        switch (unit) {
          case 'kg':
            weightInLbs = weightValue * 2.20462;
            break;
          case 'g':
            weightInLbs = weightValue * 0.00220462;
            break;
          case 'oz':
            weightInLbs = weightValue / 16;
            break;
          case 'lb':
          case 'lbs':
          default:
            weightInLbs = weightValue;
        }

        logger.debug(context, 'Using shipping weight', {
          productId: product._id,
          weightValue,
          unit,
          weightInLbs
        });

        return Math.max(0.1, Math.min(150, weightInLbs));
      }
    } catch (error) {
      logger.warn(context, 'Failed to parse shipping weight', {
        productId: product._id,
        error: error.message
      });
    }
  }

  // Priority 2: Direct weightInLbs field
  if (product.weightInLbs) {
    try {
      const weight = parseFloat(product.weightInLbs);
      if (!isNaN(weight) && weight > 0) {
        logger.debug(context, 'Using weightInLbs', {
          productId: product._id,
          weight
        });
        return Math.max(0.1, Math.min(150, weight));
      }
    } catch (error) {
      logger.warn(context, 'Failed to parse weightInLbs', {
        productId: product._id,
        error: error.message
      });
    }
  }

  // Priority 3: Estimate from package dimensions
  if (product.shipping?.packageDimensions) {
    try {
      const dims = product.shipping.packageDimensions;
      const length = parseFloat(dims.length) || 0;
      const width = parseFloat(dims.width) || 0;
      const height = parseFloat(dims.height) || 0;
      const unit = (dims.unit || 'in').toLowerCase();

      if (length > 0 && width > 0 && height > 0) {
        let lengthIn = length;
        let widthIn = width;
        let heightIn = height;

        // Convert to inches if needed
        if (unit === 'cm') {
          lengthIn = length / 2.54;
          widthIn = width / 2.54;
          heightIn = height / 2.54;
        }

        // Calculate volume in cubic inches
        const volume = lengthIn * widthIn * heightIn;

        // Estimate weight based on volume (for framed art)
        // 0.5 lbs per cubic foot (1728 cubic inches)
        const weight = Math.max(2, Math.min(50, (volume / 1728) * 0.5));

        logger.debug(context, 'Estimated weight from package dimensions', {
          productId: product._id,
          dimensions: { lengthIn, widthIn, heightIn },
          volume,
          estimatedWeight: weight
        });

        return weight;
      }
    } catch (error) {
      logger.warn(context, 'Failed to estimate from package dimensions', {
        productId: product._id,
        error: error.message
      });
    }
  }

  // Priority 4: Estimate from artwork dimensions
  if (product.dimensions) {
    try {
      let heightCm = 60, widthCm = 60, depthCm = 5;

      if (typeof product.dimensions === 'object') {
        heightCm = parseFloat(product.dimensions.height) || heightCm;
        widthCm = parseFloat(product.dimensions.width) || widthCm;
        depthCm = parseFloat(product.dimensions.depth) || depthCm;
      }

      // Convert to inches
      const heightIn = heightCm / 2.54;
      const widthIn = widthCm / 2.54;
      const depthIn = Math.max(depthCm / 2.54, 4);

      const areaSquareInches = heightIn * widthIn;
      const medium = (product.medium || '').toLowerCase();

      let weightPerSquareInch = 0.008; // Default for prints/paper
      if (medium.includes('canvas')) weightPerSquareInch = 0.015;
      if (medium.includes('oil') || medium.includes('acrylic')) weightPerSquareInch = 0.02;
      if (medium.includes('watercolor')) weightPerSquareInch = 0.005;
      if (medium.includes('frame') || medium.includes('framed')) weightPerSquareInch = 0.012;

      // Frame weight based on depth
      const frameWeight = depthIn > 2 ? 3 : 1.5;
      const weight = Math.max(2, Math.min(70, (areaSquareInches * weightPerSquareInch) + frameWeight));

      logger.debug(context, 'Estimated weight from artwork dimensions', {
        productId: product._id,
        dimensions: { heightCm, widthCm, depthCm },
        medium,
        areaSquareInches,
        estimatedWeight: weight
      });

      return weight;
    } catch (error) {
      logger.warn(context, 'Failed to estimate from artwork dimensions', {
        productId: product._id,
        error: error.message
      });
    }
  }

  // Default weight based on product type
  const defaultWeights = {
    'print': 2,
    'painting': 8,
    'sculpture': 15,
    'photography': 3,
    'drawing': 2
  };

  const productType = (product.category || 'print').toLowerCase();
  const defaultWeight = defaultWeights[productType] || 5;

  logger.debug(context, 'Using default weight', {
    productId: product._id,
    productType,
    defaultWeight
  });

  return defaultWeight;
};

// Calculate package details from cart items
const calculatePackageDetails = (cartItems) => {

  const context = 'PackageCalculation';

  if (!cartItems || cartItems.length === 0) {

    logger.warn(context, 'Empty cart, using default package');

    return {
      packages: [{
        weight: { value: 5, units: 'LB' },
        dimensions: { length: 24, width: 24, height: 6, units: 'IN' },
        insuredValue: { amount: 50, currency: 'USD' }
      }],
      totalWeight: 5,
      totalInsuredValue: 50
    };
  }

  const packages = [];
  let totalWeight = 0;
  let totalInsuredValue = 0;

  logger.debug(context, 'Building multi-package shipment', {
    itemCount: cartItems.length
  });

  cartItems.forEach((item, index) => {

    try {

      const product = item.product;
      const quantity = Math.max(1, item.quantity || 1);

      for (let i = 0; i < quantity; i++) {

        // 🔥 TRUST PRODUCT MODEL ONLY
        const shippingData = product.getFedExShippingData(1);

        let weight = shippingData.weight?.value || 5;
        let dimensions = shippingData.dimensions || {
          length: 24,
          width: 24,
          height: 6,
          units: 'IN'
        };

        // -----------------------------
        // Safety Limits (FedEx)
        // -----------------------------

        weight = Math.max(1, Math.min(150, Math.ceil(weight)));

        dimensions = {
          length: Math.max(6, Math.min(119, Math.ceil(dimensions.length))),
          width: Math.max(6, Math.min(119, Math.ceil(dimensions.width))),
          height: Math.max(4, Math.min(70, Math.ceil(dimensions.height))),
          units: 'IN'
        };

        const declaredValue =
          shippingData.declaredValue?.amount ||
          getCurrentPrice(product) ||
          100;

        packages.push({
          weight: { value: weight, units: 'LB' },
          dimensions,
          insuredValue: {
            amount: Math.ceil(declaredValue),
            currency: 'USD'
          }
        });

        totalWeight += weight;
        totalInsuredValue += declaredValue;
      }

    } catch (error) {

      logger.error(context, 'Package build error', {
        index,
        error: error.message
      });

      // Conservative fallback
      packages.push({
        weight: { value: 10, units: 'LB' },
        dimensions: { length: 30, width: 30, height: 8, units: 'IN' },
        insuredValue: { amount: 200, currency: 'USD' }
      });

      totalWeight += 10;
      totalInsuredValue += 200;
    }
  });

  logger.info(context, 'Multi-package shipment created', {
    packageCount: packages.length,
    totalWeight,
    totalInsuredValue
  });

  return {
    packages,
    totalWeight,
    totalInsuredValue
  };
};


// Parse transit days
const parseTransitDays = (transitDays) => {
  if (!transitDays) return null;

  if (typeof transitDays === 'number') {
    return transitDays;
  }

  if (typeof transitDays === 'string') {
    const parsed = parseInt(transitDays, 10);
    if (!isNaN(parsed)) return parsed;
    return transitDays;
  }

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
  }

  return null;
};

// Format available rates for storage
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
      isEstimated: rate.isEstimated || false,
      baseCharge: rate.baseCharge || 0,
      surcharges: rate.surcharges || 0
    };
  });
};

// Smart fallback shipping rates based on actual package data
const getSmartFallbackRates = (packageDetails, stateCode = null, subtotal = 0) => {
  const weight = packageDetails.weight.value;
  const dimensions = packageDetails.dimensions;
  const volume = (dimensions.length * dimensions.width * dimensions.height) / 1728; // cubic feet

  // Base rates for standard package
  let groundRate = 25;
  let expressRate = 45;
  let overnightRate = 85;

  // Weight-based adjustments
  if (weight > 20) {
    groundRate += Math.ceil(weight * 0.5);
    expressRate += Math.ceil(weight * 0.8);
    overnightRate += Math.ceil(weight * 1.2);
  }

  // Volume-based adjustments for large items
  if (volume > 5) {
    groundRate += Math.ceil(volume * 3);
    expressRate += Math.ceil(volume * 4);
    overnightRate += Math.ceil(volume * 6);
  }

  // Distance adjustments
  const westCoast = ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'CO', 'NM', 'WY', 'MT', 'ID', 'HI', 'AK'];
  const midwest = ['IL', 'MI', 'OH', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'];

  if (westCoast.includes(stateCode)) {
    groundRate *= 1.4;
    expressRate *= 1.3;
    overnightRate *= 1.2;
  } else if (midwest.includes(stateCode)) {
    groundRate *= 1.2;
    expressRate *= 1.15;
    overnightRate *= 1.1;
  }

  // Apply free shipping for orders over $500
  const freeShippingApplied = subtotal >= 500;

  return [
    {
      id: 'FEDEX_GROUND_FALLBACK',
      serviceType: 'FEDEX_GROUND',
      name: 'FedEx Ground',
      price: freeShippingApplied ? 0 : Math.round(groundRate),
      currency: 'USD',
      transitDays: '5-7',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true,
      freeShippingApplied,
      details: `~${weight} lbs, ${dimensions.length}" × ${dimensions.width}" × ${dimensions.height}"`
    },
    {
      id: 'FEDEX_2DAY_FALLBACK',
      serviceType: 'FEDEX_2_DAY',
      name: 'FedEx 2Day',
      price: Math.round(expressRate),
      currency: 'USD',
      transitDays: '2-3',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true,
      details: `Priority shipping for ${weight} lbs package`
    },
    {
      id: 'STANDARD_OVERNIGHT_FALLBACK',
      serviceType: 'STANDARD_OVERNIGHT',
      name: 'FedEx Standard Overnight',
      price: Math.round(overnightRate),
      currency: 'USD',
      transitDays: '1-2',
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true,
      details: `Expedited shipping for ${weight} lbs package`
    }
  ];
};

// Helper function for status sync
const shouldSyncOrderStatus = (currentOrderStatus, fedexMappedStatus) => {
  if (!fedexMappedStatus) return false;

  const protectedStatuses = ['cancelled', 'returned', 'refunded'];
  if (protectedStatuses.includes(currentOrderStatus)) {
    return false;
  }

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
// HELPER FUNCTIONS
// =============================================

// Fallback shipping rates with realistic pricing
const getFallbackShippingRates = (subtotal, packageWeight = 5, stateCode = null) => {
  const freeShippingThreshold = 500;

  // Base rates adjusted by weight
  let weightMultiplier = Math.max(1, packageWeight / 10);

  // Distance multiplier based on state
  let distanceMultiplier = 1;
  if (stateCode) {
    const westCoast = ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'CO', 'NM', 'WY', 'MT', 'ID', 'HI', 'AK'];
    const midwest = ['IL', 'MI', 'OH', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'];

    if (westCoast.includes(stateCode)) {
      distanceMultiplier = 1.5;
    } else if (midwest.includes(stateCode)) {
      distanceMultiplier = 1.25;
    }
  }

  const baseGroundRate = subtotal >= freeShippingThreshold
    ? 0
    : Math.round(15 * weightMultiplier * distanceMultiplier);

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
      isEstimated: true,
      freeShippingApplied: subtotal >= freeShippingThreshold
    },
    {
      id: 'GROUND_HOME_DELIVERY',
      serviceType: 'GROUND_HOME_DELIVERY',
      name: 'FedEx Home Delivery',
      price: baseGroundRate > 0 ? baseGroundRate + 3 : 0,
      currency: 'USD',
      transitDays: 5,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fedexService: false,
      isEstimated: true,
      freeShippingApplied: subtotal >= freeShippingThreshold
    },
    {
      id: 'FEDEX_EXPRESS_SAVER',
      serviceType: 'FEDEX_EXPRESS_SAVER',
      name: 'FedEx Express Saver',
      price: Math.round(25 * weightMultiplier * distanceMultiplier),
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
      price: Math.round(35 * weightMultiplier * distanceMultiplier),
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
      price: Math.round(55 * weightMultiplier * distanceMultiplier),
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
      price: Math.round(75 * weightMultiplier * distanceMultiplier),
      currency: 'USD',
      transitDays: 1,
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
  const context = 'ApplyCoupon';

  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    logger.info(context, 'Applying coupon', { code, subtotal });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      logger.warn(context, 'Coupon not found or expired', { code });
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      logger.warn(context, 'Coupon usage limit reached', {
        code,
        usedCount: coupon.usedCount,
        limit: coupon.usageLimit
      });
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    if (subtotal < coupon.minOrderAmount) {
      logger.warn(context, 'Minimum order amount not met', {
        subtotal,
        minOrderAmount: coupon.minOrderAmount
      });
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

    logger.info(context, 'Coupon applied successfully', {
      code,
      discountAmount,
      finalAmount
    });

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.maxDiscountAmount
        },
        discountAmount,
        finalAmount
      }
    });
  } catch (error) {
    logger.error(context, 'Apply coupon error', error, { code });
    res.status(500).json({
      success: false,
      message: 'Server error while applying coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================
// ADDRESS VALIDATION
// =============================================

export const validateShippingAddress = async (req, res) => {
  const context = 'AddressValidation';

  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Extract address fields
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

    // Validate state code format
    const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
      'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
      'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
      'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
      'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

    if (!validStates.includes(stateCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state code. Must be a valid US state.',
        data: {
          isValid: false,
          requiresManualVerification: true
        }
      });
    }

    logger.info(context, 'Validating address', { city, stateCode, zipCode });

    // Check cache first
    const cacheKey = CACHE_KEYS.ADDRESS({ streetLine1, city, stateCode, zipCode });
    const cachedValidation = shippingRateCache.get(cacheKey);

    if (cachedValidation) {
      logger.debug(context, 'Returning cached validation result');
      return res.status(200).json({
        success: true,
        message: 'Address validated successfully (cached)',
        data: cachedValidation
      });
    }

    // Call FedEx validation with circuit breaker
    if (!fedexCircuitBreaker.canExecute()) {
      logger.warn(context, 'Circuit breaker open, skipping FedEx validation');
      return res.status(200).json({
        success: true,
        message: 'Address validation service temporarily unavailable',
        data: {
          isValid: false,
          requiresManualVerification: true,
          fallback: true,
          classification: 'UNKNOWN',
          warning: 'Validation service temporarily unavailable'
        }
      });
    }

    let validationResult;
    try {
      validationResult = await fedexService.validateAddress({
        streetLine1,
        streetLine2,
        city,
        stateCode,
        zipCode
      });
      fedexCircuitBreaker.recordSuccess();
    } catch (fedexError) {
      fedexCircuitBreaker.recordFailure();
      logger.error(context, 'FedEx validation failed', fedexError);
      throw fedexError;
    }

    // Cache successful validations
    if (validationResult.isValid) {
      shippingRateCache.set(cacheKey, validationResult, 3600); // Cache for 1 hour
    }

    logger.info(context, 'Validation result', {
      isValid: validationResult.isValid,
      classification: validationResult.classification
    });

    return res.status(200).json({
      success: true,
      message: validationResult.isValid
        ? 'Address validated successfully'
        : 'Address requires manual verification',
      data: {
        ...validationResult,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(context, 'Address validation error', error);

    // Return soft failure for production
    return res.status(200).json({
      success: true,
      message: 'Address validation skipped',
      data: {
        isValid: false,
        requiresManualVerification: true,
        warning: 'Address validation service temporarily unavailable',
        fallback: true,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

// =============================================
// SHIPPING OPTIONS (PRODUCTION READY)
// =============================================

export const getShippingOptions = async (req, res) => {
  const context = 'ShippingOptions';
  const startTime = Date.now();

  try {
    const { shippingAddress, cartItems } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // -----------------------------
    // Normalize Address
    // -----------------------------

    const streetLine1 = (shippingAddress.streetLine1 || '').trim();
    const streetLine2 = (shippingAddress.streetLine2 || '').trim();
    const city = (shippingAddress.city || '').trim();
    const stateCode = (shippingAddress.stateCode || '').toUpperCase().trim();
    const zipCode = (shippingAddress.zipCode || '').trim();
    const isResidential = shippingAddress.isResidential !== false;

    logger.info(context, 'Request received', {
      city,
      stateCode,
      itemCount: cartItems?.length || 0
    });

    // ------------------------------------------------
    // 🔥 NEVER TRUST FRONTEND — FETCH PRODUCTS FROM DB
    // ------------------------------------------------

    let itemsForCalculation = [];

    if (!cartItems || cartItems.length === 0) {

      const user = await User.findById(req.user.id).populate({
        path: 'cart.product',
        select: 'name mrpPrice discountPrice shipping weightInLbs offer'
      });

      if (!user || user.cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      itemsForCalculation = user.cart.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));

    } else {

      const productIds = cartItems.map(i => i.productId);

      const products = await Product.find({
        _id: { $in: productIds },
        active: true
      });

      itemsForCalculation = cartItems.map(cartItem => {

        const product = products.find(
          p => p._id.toString() === cartItem.productId
        );

        if (!product) {
          throw new Error("Invalid product in cart");
        }

        return {
          product,
          quantity: cartItem.quantity
        };
      });
    }

    // -----------------------------
    // Calculate subtotal securely
    // -----------------------------

    const subtotal = itemsForCalculation.reduce((total, item) => {
      return total + getCurrentPrice(item.product) * item.quantity;
    }, 0);

    // ---------------------------------------------------
    // 🔥 MULTI PACKAGE CALCULATION (VERY IMPORTANT)
    // ---------------------------------------------------

    const packages = [];
    let totalWeight = 0;

    itemsForCalculation.forEach(item => {

      const shippingData = item.product.getFedExShippingData(1);

      for (let i = 0; i < item.quantity; i++) {

        packages.push({
          weight: shippingData.weight,
          dimensions: shippingData.dimensions,
          insuredValue: shippingData.declaredValue
        });

        totalWeight += shippingData.weight.value;
      }
    });

    if (packages.length === 0) {
      throw new Error("No packages created for shipment");
    }

    logger.info(context, 'Packages built', {
      packageCount: packages.length,
      totalWeight
    });

    // -----------------------------
    // Cache Key
    // -----------------------------

    const addressHash = generateHash({
      streetLine1,
      city,
      stateCode,
      zipCode
    });

    const cartHash = generateHash(
      itemsForCalculation.map(i => ({
        id: i.product._id,
        qty: i.quantity
      }))
    );

    const cacheKey = CACHE_KEYS.RATE(addressHash, cartHash);

    const cachedRates = shippingRateCache.get(cacheKey);

    if (cachedRates) {
      return res.json({
        success: true,
        message: 'Shipping options retrieved (cached)',
        data: {
          ...cachedRates,
          isCached: true,
          processingTime: Date.now() - startTime
        }
      });
    }

    // -----------------------------
    // Validate Address with FedEx
    // -----------------------------

    let addressValidation = { isValid: false };

    try {

      addressValidation = await fedexService.validateAddress({
        streetLine1,
        streetLine2,
        city,
        stateCode,
        zipCode
      });

    } catch (err) {
      logger.warn(context, 'Address validation failed', err);
    }

    // -----------------------------
    // Build Rate Request
    // -----------------------------

    const rateRequest = {
      destination: {
        streetLine1,
        streetLine2,
        city,
        stateCode,
        zipCode,
        isResidential
      },
      packages
    };

    // -----------------------------
    // Fetch FedEx Rates
    // -----------------------------

    let formattedRates = [];
    let fedexAvailable = false;

    if (fedexCircuitBreaker.canExecute()) {

      try {

        const rateResult = await fedexService.getShippingRates(rateRequest);

        fedexCircuitBreaker.recordSuccess();

        if (rateResult.success && rateResult.rates.length > 0) {

          fedexAvailable = true;

          const SHIPPING_MARGIN = 1.08; // 🔥 Protect profit

          formattedRates = rateResult.rates.map(rate => {

            const basePrice =
              rate.price || rate.totalCharge?.amount || 0;

            // const markedUpPrice = Math.ceil(basePrice * SHIPPING_MARGIN);

            const isGround =
              rate.serviceType === 'FEDEX_GROUND' ||
              rate.serviceType === 'GROUND_HOME_DELIVERY';

            const SHIPPING_MARGIN = 1.08;

            const markedUpPrice = Math.ceil(price * SHIPPING_MARGIN);

            const finalPrice =
              (subtotal >= 500 && isGround)
                ? 0
                : markedUpPrice;


            return {
              id: rate.serviceType,
              serviceType: rate.serviceType,
              name: rate.serviceName,
              price: finalPrice,
              originalPrice: basePrice,
              currency: 'USD',
              transitDays: rate.transitDays,
              deliveryDate: rate.deliveryTimestamp,
              fedexService: true,
              insured: true
            };
          });
        }

      } catch (error) {

        fedexCircuitBreaker.recordFailure();

        logger.error(context, 'FedEx rate error', error);
      }
    }

    // -----------------------------
    // Fallback Rates
    // -----------------------------

    if (!fedexAvailable) {

      const fallbackRates = getSmartFallbackRates(
        { weight: { value: totalWeight } },
        stateCode,
        subtotal
      );

      return res.json({
        success: true,
        message: 'Estimated shipping rates',
        data: {
          rates: fallbackRates,
          fedexAvailable: false,
          isEstimated: true,
          processingTime: Date.now() - startTime
        }
      });
    }

    // -----------------------------
    // Cache Success
    // -----------------------------

    const responseData = {
      rates: formattedRates,
      fedexAvailable: true,
      subtotal,
      packageCount: packages.length,
      addressValidation,
      processingTime: Date.now() - startTime
    };

    shippingRateCache.set(cacheKey, responseData);

    return res.json({
      success: true,
      message: 'Shipping options retrieved',
      data: responseData
    });

  } catch (error) {

    logger.error('ShippingOptions Fatal', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shipping options'
    });
  }
};


// =============================================
// CREATE ORDER (UPDATED)
// =============================================

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const context = 'CreateOrder';
  const startTime = Date.now();

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

    logger.info(context, 'Creating order', {
      userId: req.user.id,
      shippingMethod,
      paymentMethod
    });

    // Get user with populated cart
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer sku shipping weightInLbs category',
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
    const stockErrors = [];
    for (const item of user.cart) {
      if (!item.product || !item.product.active) {
        stockErrors.push(`Product "${item.product?.name || 'Unknown'}" is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        stockErrors.push(`Insufficient stock for "${item.product.name}". Only ${item.product.stock} available`);
      }
    }

    if (stockErrors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Stock validation failed',
        errors: stockErrors
      });
    }

    // Calculate subtotal
    const subtotal = user.cart.reduce((total, item) => {
      return total + getCurrentPrice(item.product) * item.quantity;
    }, 0);

    // Calculate package details from cart
    const packageDetails = calculatePackageDetails(user.cart.map(item => ({
      product: item.product,
      quantity: item.quantity
    })));

    logger.info(context, 'Order package details', {
      weight: packageDetails.weight.value,
      dimensions: packageDetails.dimensions,
      insuredValue: packageDetails.insuredValue.amount,
      subtotal
    });

    // Get shipping rates
    let shippingCost = 0;
    let fedexAvailable = false;
    let selectedRate = null;
    let allRates = [];

    try {
      // Validate address
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
        logger.warn(context, 'Address validation error', err);
      }

      const reqStreetLines = (addressValidationForOrder.normalizedAddress?.streetLines) ||
        [streetLine1, shippingAddress.streetLine2 || shippingAddress.apartment].filter(Boolean);
      const reqCity = addressValidationForOrder.normalizedAddress?.city || shippingAddress.city;
      const reqState = addressValidationForOrder.normalizedAddress?.stateCode || stateCode;
      const reqZip = addressValidationForOrder.normalizedAddress?.zipCode || shippingAddress.zipCode;
      const reqIsResidential = addressValidationForOrder.isResidential ??
        (shippingAddress.isResidential !== false);

      const rateRequest = {
        destination: {
          streetLines: reqStreetLines,
          streetLine1: reqStreetLines[0] || streetLine1,
          streetLine2: reqStreetLines[1] || '',
          city: reqCity,
          stateCode: reqState,
          zipCode: reqZip,
          isResidential: reqIsResidential
        },
        packages: [{
          weight: packageDetails.weight,
          dimensions: packageDetails.dimensions,
          insuredValue: packageDetails.insuredValue
        }]
      };

      if (fedexCircuitBreaker.canExecute()) {
        const rateResult = await fedexService.getShippingRates(rateRequest);
        fedexCircuitBreaker.recordSuccess();

        if (rateResult.success && rateResult.rates && rateResult.rates.length > 0) {
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

            // Apply free shipping for orders over $500 on ground services
            const isGround = selectedRate.serviceType === 'FEDEX_GROUND' ||
              selectedRate.serviceType === 'GROUND_HOME_DELIVERY';
            if (subtotal >= 500 && isGround) {
              shippingCost = 0;
            }
          }
        }
      } else {
        logger.warn(context, 'Circuit breaker open, using fallback rates');
      }
    } catch (error) {
      fedexCircuitBreaker.recordFailure();
      logger.error(context, 'FedEx rate error', error);
    }

    // Fallback shipping cost if FedEx unavailable
    if (!fedexAvailable || !selectedRate) {
      const fallbackRates = getSmartFallbackRates(packageDetails, stateCode, subtotal);
      allRates = fallbackRates;

      selectedRate = fallbackRates.find(r =>
        r.serviceType === 'FEDEX_GROUND' || r.serviceType === 'GROUND_HOME_DELIVERY'
      ) || fallbackRates[0];

      shippingCost = selectedRate?.price || (subtotal >= 500 ? 0 : 25);
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
          return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
          });
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

        logger.info(context, 'Coupon applied', {
          code: coupon.code,
          discountAmount
        });
      }
    }

    const totalAmount = subtotal + shippingCost - discountAmount;

    // Validate address
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
      logger.warn(context, 'Address validation failed', error);
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
      sku: item.product.sku,
      weight: calculateItemWeight(item.product),
      dimensions: item.product.dimensions
    }));

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    logger.info(context, 'Generated order number', { orderNumber });

    // Create order
    const orderData = {
      orderNumber,
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
        estimatedDeliveryDate: selectedRate?.deliveryTimestamp ?
          new Date(selectedRate.deliveryTimestamp) : null,
        addressValidation: {
          validated: addressValidation.isValid,
          classification: addressValidation.classification || null,
          originalAddress: shippingAddress,
          normalizedAddress: addressValidation.normalizedAddress || null,
          validationMessages: addressValidation.messages || []
        },
        availableRates: formatAvailableRates(allRates),
        fedexAvailable,
        packageDetails: {
          weight: packageDetails.weight,
          dimensions: packageDetails.dimensions,
          insuredValue: packageDetails.insuredValue
        }
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

      logger.debug(context, 'Updated product stock', {
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        newStock: item.product.stock - item.quantity
      });
    }

    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();

    logger.info(context, 'Order created successfully', {
      orderId: order._id,
      orderNumber,
      totalAmount,
      processingTime: Date.now() - startTime
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(context, 'Create order error', error);

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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// =============================================
// TRACKING
// =============================================

// @desc    Manually refresh tracking for an order (Admin)
// @route   POST /api/v1/orders/:orderId/refresh-tracking
// @access  Private/Admin
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

    const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

    if (!trackingResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch tracking',
        error: trackingResult.error
      });
    }

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

// @desc    Bulk update tracking for all shipped orders (Cron Job)
// @route   POST /api/v1/orders/bulk-update-tracking
// @access  Private/Admin or System
export const bulkUpdateTracking = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $in: ['shipped', 'out_for_delivery'] },
      'fedex.trackingNumber': { $exists: true, $ne: null }
    }).limit(50);

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
// ADMIN: GET ALL ORDERS
// =============================================

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

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.user = { $in: users.map(u => u._id) };
    }

    let sortOption = {};
    const [field, direction] = sortBy.split('_');
    sortOption[field] = direction === 'asc' ? 1 : -1;

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('couponApplied', 'code discountValue discountType')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

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

// =============================================
// ADMIN: GET ORDER DETAILS
// =============================================

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

// =============================================
// ADMIN: UPDATE ORDER STATUS
// =============================================

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

// =============================================
// ADMIN: ADD SHIPPING UPDATE
// =============================================

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

// =============================================
// ADMIN: CREATE FEDEX SHIPMENT
// =============================================

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

    if (order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order already has a tracking number',
        trackingNumber: order.fedex.trackingNumber
      });
    }

    if (['cancelled', 'returned', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot ship ${order.orderStatus} order`
      });
    }

    const packageData = packages || [{
      weight: order.fedex?.weight || { value: 5, units: 'LB' },
      dimensions: order.fedex?.dimensions || { length: 12, width: 12, height: 6, units: 'IN' }
    }];

    const totalValue = order.items.reduce((sum, item) => {
      return sum + (item.priceAtOrder * item.quantity);
    }, 0);

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

    const previousStatus = order.orderStatus;
    order.orderStatus = 'shipped';
    order.shippedAt = new Date();
    order.carrier = 'fedex';

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

    order.addShippingUpdate({
      message: `Shipment created - Tracking: ${shipmentResult.trackingNumber}`,
      timestamp: new Date(),
      status: 'shipped',
      updatedBy: 'admin'
    });

    await order.save();

    let pickupResult = null;
    if (schedulePickup) {
      try {
        pickupResult = await schedulePickupForOrder(order, pickupDate);
      } catch (pickupError) {
        console.error('Pickup scheduling error:', pickupError);
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

// =============================================
// ADMIN: SCHEDULE PICKUP
// =============================================

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

    const result = await fedexService.schedulePickup(pickupRequest);

    if (result.success) {
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

// =============================================
// ADMIN: CANCEL SHIPMENT
// =============================================

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

    const cancelResult = await fedexService.cancelShipment(order.fedex.trackingNumber);

    if (cancelResult.success) {
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

// =============================================
// ADMIN: GET INVOICE
// =============================================

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

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order #${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.text('Bill To:');
    doc.text(order.user.name);
    doc.text(order.user.email);
    doc.moveDown();

    doc.text('Items:');
    order.items.forEach(item => {
      doc.text(`${item.name} x ${item.quantity} - $${item.priceAtOrder}`);
    });
    doc.moveDown();

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

// =============================================
// ADMIN: DELETE ABANDONED ORDER
// =============================================

export const deleteAbandonedOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

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

// =============================================
// USER: TRACK ORDER
// =============================================

export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId).lean();

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

    let trackingResult;
    try {
      trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);
    } catch (fedexError) {
      console.error('FedEx API Error:', fedexError.message);

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

    const updateData = {
      'fedex.lastTrackingUpdate': new Date()
    };

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

        if (trackingResult.isDelivered) {
          updateData.orderStatus = 'delivered';
          newOrderStatus = 'delivered';

          if (trackingResult.deliveryDetails?.actualDeliveryTimestamp) {
            updateData['fedex.actualDeliveryDate'] = new Date(
              trackingResult.deliveryDetails.actualDeliveryTimestamp
            );
          }

          if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
            updateData.paymentStatus = 'paid';
          }
        }
      }
    }

    await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: false }
    );

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
              $slice: -50
            }
          }
        }
      );
    }

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

    if (error.name === 'VersionError') {
      console.warn('[Order] Version conflict during tracking update - handled gracefully');
    }

    res.status(500).json({
      success: false,
      message: 'Server error while tracking order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// =============================================
// USER: GET TRACKING STATUS (Quick)
// =============================================

export const getTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

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

    if (!order.fedex?.trackingNumber) {
      return res.json({
        success: true,
        data: {
          hasTracking: false,
          orderStatus: order.orderStatus
        }
      });
    }

    const cacheAge = order.fedex.lastTrackingUpdate
      ? (Date.now() - new Date(order.fedex.lastTrackingUpdate).getTime()) / 1000 / 60
      : Infinity;

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

    try {
      const trackingResult = await fedexService.trackShipment(order.fedex.trackingNumber);

      if (trackingResult.success) {
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

        const shouldUpdate = shouldSyncOrderStatus(
          order.orderStatus,
          trackingResult.mappedOrderStatus
        );

        if (shouldUpdate) {
          updateData.orderStatus = trackingResult.mappedOrderStatus;
        }

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
  applyCoupon,
  validateShippingAddress,
  getShippingOptions,
  createOrder,
  refreshTracking,
  bulkUpdateTracking,
  getMyOrders,
  getOrderById,
  getShippingLabel,
  findFedExLocations,
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
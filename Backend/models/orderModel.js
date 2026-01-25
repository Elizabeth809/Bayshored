import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtOrder: {
    type: Number,
    required: true,
    min: 0
  },
  name: String,
  image: String,
  author: String,
  medium: String,
  sku: String
});

const shippingUpdateSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: String,
  status: String,
  fedexEventCode: String
});

// Available rates schema - Fixed transitDays to be String
const availableRateSchema = new mongoose.Schema({
  serviceType: String,
  serviceName: String,
  deliveryDate: Date,
  transitDays: String, // Changed from Number to String to handle "1-2 days" format
  totalCharge: Number,
  currency: {
    type: String,
    default: 'USD'
  },
  isEstimated: Boolean
}, { _id: false });

// Comprehensive FedEx tracking schema
const fedexTrackingSchema = new mongoose.Schema({
  // Tracking identifiers
  trackingNumber: {
    type: String,
    sparse: true,
    index: true
  },
  masterTrackingNumber: String,
  
  // Label information
  labelUrl: String,
  labelData: String,
  labelFormat: {
    type: String,
    enum: ['PDF', 'PNG', 'ZPL'],
    default: 'PDF'
  },
  
  // Shipment details
  shipmentId: String,
  serviceType: String,
  serviceName: String,
  
  // Package dimensions
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    units: {
      type: String,
      enum: ['IN', 'CM'],
      default: 'IN'
    }
  },
  
  // Package weight
  weight: {
    value: Number,
    units: {
      type: String,
      enum: ['LB', 'KG'],
      default: 'LB'
    }
  },
  
  // Insurance
  insuranceAmount: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Shipping cost breakdown
  shippingCost: {
    baseCharge: Number,
    surcharges: Number,
    taxes: Number,
    totalNetCharge: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Delivery estimates
  estimatedDeliveryDate: Date,
  estimatedDeliveryTimeWindow: {
    begins: Date,
    ends: Date
  },
  actualDeliveryDate: Date,
  
  // Pickup information
  pickupConfirmationNumber: String,
  pickupDate: Date,
  pickupLocation: String,
  
  // Current status
  currentStatus: {
    code: String,
    description: String,
    location: {
      city: String,
      stateOrProvinceCode: String,
      postalCode: String,
      countryCode: String
    },
    timestamp: Date
  },
  
  // Tracking history
  trackingHistory: [{
    timestamp: Date,
    eventType: String,
    eventDescription: String,
    location: {
      city: String,
      stateOrProvinceCode: String,
      postalCode: String,
      countryCode: String,
      residential: Boolean
    },
    derivedStatus: String,
    exceptionDescription: String
  }],
  
  // Address validation results
  addressValidation: {
    validated: Boolean,
    classification: String,
    originalAddress: mongoose.Schema.Types.Mixed,
    normalizedAddress: mongoose.Schema.Types.Mixed,
    validationMessages: [String]
  },
  
  // Available rates - using the fixed schema
  availableRates: [availableRateSchema],
  
  // Timestamps
  shipmentCreatedAt: Date,
  labelCreatedAt: Date,
  lastTrackingUpdate: Date,
  
  // Metadata
  fedexTransactionId: String,
  fedexAvailable: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: true
  },
  companyName: String,
  streetLine1: {
    type: String,
    required: true
  },
  streetLine2: String,
  city: {
    type: String,
    required: true
  },
  stateCode: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  zipCode: {
    type: String,
    required: true
  },
  countryCode: {
    type: String,
    required: true,
    default: 'US'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: String,
  isResidential: {
    type: Boolean,
    default: true
  },
  specialInstructions: String,
  addressVerified: {
    type: Boolean,
    default: false
  },
  fedexClassification: String,
  normalizedByFedex: mongoose.Schema.Types.Mixed
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  items: [orderItemSchema],
  
  shippingAddress: shippingAddressSchema,
  
  // Pricing (all in USD)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },

  // Payment fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  stripePaymentIntentId: String,
  stripeSessionId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'applepay', 'googlepay', 'stripe', 'razorpay', 'COD'],
    required: true
  },
  paidAt: Date,

  // Order status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Shipping method selected
  shippingMethod: {
    type: String,
    default: 'ground'
  },
  
  // Carrier information
  carrier: {
    type: String,
    enum: ['fedex', 'ups', 'usps', 'dhl', 'other'],
    default: 'fedex'
  },
  
  // FedEx integration
  fedex: fedexTrackingSchema,
  
  // Shipping updates timeline
  shippingUpdates: [shippingUpdateSchema],
  
  // Order notes
  notes: {
    customer: {
      type: String,
      maxlength: 500
    },
    internal: {
      type: String,
      maxlength: 1000
    }
  },
  
  // Delivery information
  signatureRequired: {
    type: Boolean,
    default: false
  },
  deliveryInstructions: String,
  
  // Cancellation/Return
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const prefix = 'ORD';
  let orderNumber = null;
  
  for (let i = 0; i < 10; i++) {
    const random7Digit = Math.floor(1000000 + Math.random() * 9000000);
    const potentialOrderNumber = `${prefix}${random7Digit}`;
    
    const existingOrder = await this.findOne({ orderNumber: potentialOrderNumber });
    if (!existingOrder) {
      orderNumber = potentialOrderNumber;
      break;
    }
  }

  if (!orderNumber) {
    const timestamp = Date.now().toString().slice(-10);
    orderNumber = `${prefix}${timestamp}`;
  }

  return orderNumber;
};

// Indexes
orderSchema.index({ 'fedex.trackingNumber': 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

// Virtual for estimated delivery
orderSchema.virtual('estimatedDelivery').get(function() {
  return this.fedex?.estimatedDeliveryDate || this.fedex?.estimatedDeliveryTimeWindow?.ends;
});

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  return !nonCancellableStatuses.includes(this.orderStatus);
};

// Instance method to add shipping update
orderSchema.methods.addShippingUpdate = function(update) {
  this.shippingUpdates.push({
    message: update.message,
    timestamp: update.timestamp || new Date(),
    location: update.location,
    status: update.status,
    fedexEventCode: update.fedexEventCode
  });
};

export default mongoose.model('Order', orderSchema);
import mongoose from 'mongoose';

// ===========================================
// ORDER ITEM SCHEMA
// ===========================================
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

// ===========================================
// SHIPPING UPDATE SCHEMA (Updated)
// ===========================================
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
  fedexEventCode: String,
  // ✅ ADDED: Track who/what made the update
  updatedBy: {
    type: String,
    enum: ['system', 'admin', 'fedex', 'customer', 'FedEx System'],
    default: 'system'
  }
}, { _id: false });

// ===========================================
// AVAILABLE RATES SCHEMA
// ===========================================
const availableRateSchema = new mongoose.Schema({
  serviceType: String,
  serviceName: String,
  deliveryDate: Date,
  transitDays: String,
  totalCharge: Number,
  currency: {
    type: String,
    default: 'USD'
  },
  isEstimated: Boolean
}, { _id: false });

// ===========================================
// TRACKING LOCATION SCHEMA (New - for reuse)
// ===========================================
const trackingLocationSchema = new mongoose.Schema({
  city: String,
  stateOrProvinceCode: String,
  postalCode: String,
  countryCode: {
    type: String,
    default: 'US'
  },
  residential: Boolean,
  // ✅ ADDED: Formatted string for easy display
  formatted: String
}, { _id: false });

// ===========================================
// TRACKING EVENT SCHEMA (New - for clarity)
// ===========================================
const trackingEventSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  eventType: String,
  eventDescription: String,
  location: trackingLocationSchema,
  derivedStatus: String,
  derivedStatusCode: String,
  exceptionCode: String,
  exceptionDescription: String,
  // ✅ ADDED: Flag for delivery attempts
  isDeliveryAttempt: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// ===========================================
// DELIVERY DETAILS SCHEMA (New)
// ===========================================
const deliveryDetailsSchema = new mongoose.Schema({
  actualDeliveryTimestamp: Date,
  deliveryLocation: String,        // e.g., "Front Door", "Garage", "Neighbor"
  deliveryLocationType: String,    // e.g., "RESIDENCE", "BUSINESS"
  signedBy: String,                // Name of person who signed
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  // ✅ ADDED: Proof of delivery
  proofOfDeliveryAvailable: {
    type: Boolean,
    default: false
  },
  proofOfDeliveryUrl: String
}, { _id: false });

// ===========================================
// FEDEX TRACKING SCHEMA (Updated)
// ===========================================
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
  packagingType: String,
  
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
  
  // ✅ ADDED: Billed weight (may differ from actual)
  billedWeight: {
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
    discounts: Number,
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
    ends: Date,
    description: String
  },
  
  // ✅ UPDATED: Using new schema
  actualDeliveryDate: Date,
  deliveryDetails: deliveryDetailsSchema,
  
  // Pickup information
  pickupConfirmationNumber: String,
  pickupDate: Date,
  pickupLocation: String,
  
  // Current status
  currentStatus: {
    code: String,
    derivedCode: String,
    description: String,
    statusByLocale: String,
    location: trackingLocationSchema,
    timestamp: Date,
    // ✅ ADDED: Additional status info
    ancillaryDetails: mongoose.Schema.Types.Mixed
  },
  
  // ✅ UPDATED: Using new event schema
  trackingHistory: [trackingEventSchema],
  
  // Address validation results
  addressValidation: {
    validated: Boolean,
    classification: {
      type: String,
      enum: ['RESIDENTIAL', 'BUSINESS', 'MIXED', 'UNKNOWN']
    },
    isResidential: Boolean,
    isBusiness: Boolean,
    originalAddress: mongoose.Schema.Types.Mixed,
    normalizedAddress: mongoose.Schema.Types.Mixed,
    validationMessages: [String],
    validatedAt: Date
  },
  
  // Available rates
  availableRates: [availableRateSchema],
  selectedRate: availableRateSchema,
  
  // Timestamps
  shipmentCreatedAt: Date,
  labelCreatedAt: Date,
  lastTrackingUpdate: Date,
  
  // ✅ ADDED: Tracking sync metadata
  trackingSyncCount: {
    type: Number,
    default: 0
  },
  lastSyncError: String,
  lastSuccessfulSync: Date,
  
  // Metadata
  fedexTransactionId: String,
  fedexAvailable: {
    type: Boolean,
    default: false
  },
  
  // ✅ ADDED: Exception tracking
  hasException: {
    type: Boolean,
    default: false
  },
  exceptionDetails: {
    code: String,
    description: String,
    timestamp: Date,
    resolution: String
  },
  
  // ✅ ADDED: For sandbox/test mode identification
  isMockData: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// ===========================================
// SHIPPING ADDRESS SCHEMA
// ===========================================
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
  normalizedByFedex: mongoose.Schema.Types.Mixed,
  // ✅ ADDED: Validation timestamp
  verifiedAt: Date
}, { _id: false });

// ===========================================
// STATUS HISTORY SCHEMA (New - for admin tracking)
// ===========================================
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  previousStatus: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: String,
  updatedBy: {
    type: String,
    enum: ['system', 'admin', 'fedex', 'customer'],
    default: 'system'
  },
  updatedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

// ===========================================
// MAIN ORDER SCHEMA
// ===========================================
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
    enum: ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  },
  
  // ✅ ADDED: Status history for audit trail
  statusHistory: [statusHistorySchema],
  
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
  
  // ✅ ADDED: Gift options
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    maxlength: 250
  },
  
  // Cancellation/Return
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ✅ ADDED: Return tracking
  returnTrackingNumber: String,
  returnReason: String,
  returnedAt: Date,
  
  // ✅ ADDED: Processing metadata
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES
// ===========================================

// Primary indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1 });
orderSchema.index({ 'fedex.trackingNumber': 1 }, { sparse: true });

// Status and date indexes for queries
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// ✅ ADDED: Index for tracking updates
orderSchema.index({ 'fedex.lastTrackingUpdate': 1 }, { sparse: true });

// ✅ ADDED: Compound index for tracking sync job
orderSchema.index({ 
  orderStatus: 1, 
  'fedex.trackingNumber': 1, 
  'fedex.lastTrackingUpdate': 1 
});

// ✅ ADDED: Index for shipped orders needing tracking updates
orderSchema.index({ 
  orderStatus: 1, 
  carrier: 1 
}, { 
  partialFilterExpression: { 
    orderStatus: { $in: ['shipped', 'out_for_delivery'] } 
  } 
});

// ===========================================
// VIRTUALS
// ===========================================

// Estimated delivery
orderSchema.virtual('estimatedDelivery').get(function() {
  return this.fedex?.estimatedDeliveryDate || 
         this.fedex?.estimatedDeliveryTimeWindow?.ends;
});

// ✅ ADDED: Is trackable
orderSchema.virtual('isTrackable').get(function() {
  return !!(this.fedex?.trackingNumber && 
            ['shipped', 'out_for_delivery', 'delivered'].includes(this.orderStatus));
});

// ✅ ADDED: Is delivered
orderSchema.virtual('isDelivered').get(function() {
  return this.orderStatus === 'delivered';
});

// ✅ ADDED: Is in transit
orderSchema.virtual('isInTransit').get(function() {
  return ['shipped', 'out_for_delivery'].includes(this.orderStatus);
});

// ✅ ADDED: Days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  const now = new Date();
  const orderDate = new Date(this.createdAt);
  const diffTime = Math.abs(now - orderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ✅ ADDED: Tracking URL
orderSchema.virtual('trackingUrl').get(function() {
  if (!this.fedex?.trackingNumber) return null;
  return `https://www.fedex.com/fedextrack/?trknbr=${this.fedex.trackingNumber}`;
});

// ✅ ADDED: Latest shipping update
orderSchema.virtual('latestUpdate').get(function() {
  if (!this.shippingUpdates || this.shippingUpdates.length === 0) return null;
  return this.shippingUpdates[this.shippingUpdates.length - 1];
});

// ===========================================
// STATIC METHODS
// ===========================================

// Generate order number
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

// ✅ ADDED: Find orders needing tracking update
orderSchema.statics.findOrdersNeedingTrackingUpdate = async function(options = {}) {
  const { 
    limit = 50, 
    maxAgeMinutes = 30,  // Orders not updated in last 30 minutes
    carrier = 'fedex' 
  } = options;
  
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  return this.find({
    orderStatus: { $in: ['shipped', 'out_for_delivery'] },
    carrier: carrier,
    'fedex.trackingNumber': { $exists: true, $ne: null },
    $or: [
      { 'fedex.lastTrackingUpdate': { $lt: cutoffTime } },
      { 'fedex.lastTrackingUpdate': { $exists: false } }
    ]
  })
  .sort({ 'fedex.lastTrackingUpdate': 1 })
  .limit(limit)
  .select('_id orderNumber fedex.trackingNumber orderStatus');
};

// ✅ ADDED: Get orders by tracking status
orderSchema.statics.getOrdersByTrackingStatus = async function(status) {
  const statusMap = {
    'pending_shipment': ['pending', 'confirmed', 'processing', 'ready_to_ship'],
    'in_transit': ['shipped', 'out_for_delivery'],
    'delivered': ['delivered'],
    'problem': ['cancelled', 'returned', 'refunded']
  };
  
  const statuses = statusMap[status] || [status];
  
  return this.find({
    orderStatus: { $in: statuses }
  }).sort({ createdAt: -1 });
};

// ===========================================
// INSTANCE METHODS
// ===========================================

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  return !nonCancellableStatuses.includes(this.orderStatus);
};

// Add shipping update
orderSchema.methods.addShippingUpdate = function(update) {
  if (!this.shippingUpdates) {
    this.shippingUpdates = [];
  }
  
  // Check for duplicate
  const lastUpdate = this.shippingUpdates[this.shippingUpdates.length - 1];
  if (lastUpdate && 
      lastUpdate.fedexEventCode === update.fedexEventCode &&
      lastUpdate.message === update.message) {
    return false; // Duplicate, don't add
  }
  
  this.shippingUpdates.push({
    message: update.message,
    timestamp: update.timestamp || new Date(),
    location: update.location,
    status: update.status,
    fedexEventCode: update.fedexEventCode,
    updatedBy: update.updatedBy || 'system'
  });
  
  return true;
};

// ✅ ADDED: Update status with history
orderSchema.methods.updateStatus = function(newStatus, options = {}) {
  const { description, updatedBy = 'system', updatedByUser, metadata } = options;
  
  const previousStatus = this.orderStatus;
  
  // Don't update if same status
  if (previousStatus === newStatus) {
    return false;
  }
  
  // Initialize status history if needed
  if (!this.statusHistory) {
    this.statusHistory = [];
  }
  
  // Add to history
  this.statusHistory.push({
    status: newStatus,
    previousStatus,
    timestamp: new Date(),
    description: description || `Status changed from ${previousStatus} to ${newStatus}`,
    updatedBy,
    updatedByUser,
    metadata
  });
  
  // Update current status
  this.orderStatus = newStatus;
  
  // Update timestamp fields
  switch (newStatus) {
    case 'processing':
      this.processedAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      if (this.paymentMethod === 'COD') {
        this.paymentStatus = 'paid';
        this.paidAt = new Date();
      }
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  return true;
};

// ✅ ADDED: Update FedEx tracking data
orderSchema.methods.updateTrackingData = function(trackingResult) {
  if (!trackingResult) return false;
  
  // Initialize fedex object if needed
  if (!this.fedex) {
    this.fedex = {};
  }
  
  // Update current status
  if (trackingResult.currentStatus) {
    this.fedex.currentStatus = {
      code: trackingResult.currentStatus.code || '',
      derivedCode: trackingResult.currentStatus.derivedCode || '',
      description: trackingResult.currentStatus.description || '',
      location: this._parseLocation(trackingResult.currentStatus.location),
      timestamp: trackingResult.currentStatus.timestamp 
        ? new Date(trackingResult.currentStatus.timestamp) 
        : new Date()
    };
  }
  
  // Update estimated delivery
  if (trackingResult.estimatedDelivery) {
    this.fedex.estimatedDeliveryTimeWindow = {
      begins: trackingResult.estimatedDelivery.begins 
        ? new Date(trackingResult.estimatedDelivery.begins) 
        : null,
      ends: trackingResult.estimatedDelivery.ends 
        ? new Date(trackingResult.estimatedDelivery.ends) 
        : null,
      description: trackingResult.estimatedDelivery.description
    };
    
    if (trackingResult.estimatedDelivery.ends) {
      this.fedex.estimatedDeliveryDate = new Date(trackingResult.estimatedDelivery.ends);
    }
  }
  
  // Update delivery details if delivered
  if (trackingResult.isDelivered && trackingResult.deliveryDetails) {
    this.fedex.deliveryDetails = {
      actualDeliveryTimestamp: trackingResult.deliveryDetails.actualDeliveryTimestamp 
        ? new Date(trackingResult.deliveryDetails.actualDeliveryTimestamp) 
        : new Date(),
      deliveryLocation: trackingResult.deliveryDetails.deliveryLocation,
      deliveryLocationType: trackingResult.deliveryDetails.deliveryLocationType,
      signedBy: trackingResult.deliveryDetails.signedBy,
      deliveryAttempts: trackingResult.deliveryDetails.deliveryAttempts || 0
    };
    this.fedex.actualDeliveryDate = this.fedex.deliveryDetails.actualDeliveryTimestamp;
  }
  
  // Update tracking history
  if (trackingResult.events && trackingResult.events.length > 0) {
    this.fedex.trackingHistory = trackingResult.events.slice(0, 50).map(event => ({
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      eventType: event.eventType || '',
      eventDescription: event.eventDescription || event.description || '',
      location: this._parseLocation(event.location),
      derivedStatus: event.derivedStatus || '',
      derivedStatusCode: event.derivedStatusCode || '',
      exceptionCode: event.exceptionCode || null,
      exceptionDescription: event.exceptionDescription || null,
      isDeliveryAttempt: event.isDeliveryAttempt || false
    }));
  }
  
  // Update exception status
  this.fedex.hasException = trackingResult.hasException || false;
  
  // Update sync metadata
  this.fedex.lastTrackingUpdate = new Date();
  this.fedex.lastSuccessfulSync = new Date();
  this.fedex.trackingSyncCount = (this.fedex.trackingSyncCount || 0) + 1;
  this.fedex.lastSyncError = null;
  this.fedex.isMockData = trackingResult.isMockData || false;
  
  return true;
};

// ✅ ADDED: Helper to parse location
orderSchema.methods._parseLocation = function(location) {
  if (!location) return null;
  
  if (typeof location === 'string') {
    const parts = location.split(', ');
    return {
      city: parts[0] || '',
      stateOrProvinceCode: parts[1] || '',
      formatted: location
    };
  }
  
  if (typeof location === 'object') {
    return {
      city: location.city || '',
      stateOrProvinceCode: location.stateOrProvinceCode || location.state || '',
      postalCode: location.postalCode || '',
      countryCode: location.countryCode || location.country || 'US',
      residential: location.residential,
      formatted: location.formatted || 
        [location.city, location.stateOrProvinceCode || location.state]
          .filter(Boolean)
          .join(', ')
    };
  }
  
  return null;
};

// ✅ ADDED: Get formatted tracking summary
orderSchema.methods.getTrackingSummary = function() {
  if (!this.fedex?.trackingNumber) {
    return {
      hasTracking: false,
      message: 'No tracking information available'
    };
  }
  
  return {
    hasTracking: true,
    trackingNumber: this.fedex.trackingNumber,
    trackingUrl: this.trackingUrl,
    carrier: 'FedEx',
    serviceType: this.fedex.serviceType,
    serviceName: this.fedex.serviceName,
    currentStatus: this.fedex.currentStatus,
    estimatedDelivery: this.fedex.estimatedDeliveryDate,
    isDelivered: this.orderStatus === 'delivered',
    isInTransit: ['shipped', 'out_for_delivery'].includes(this.orderStatus),
    hasException: this.fedex.hasException,
    deliveryDetails: this.fedex.deliveryDetails,
    lastUpdated: this.fedex.lastTrackingUpdate,
    recentEvents: (this.fedex.trackingHistory || []).slice(0, 5)
  };
};

// ✅ ADDED: Check if tracking needs refresh
orderSchema.methods.needsTrackingRefresh = function(maxAgeMinutes = 30) {
  // Don't refresh if delivered or cancelled
  if (['delivered', 'cancelled', 'returned', 'refunded'].includes(this.orderStatus)) {
    return false;
  }
  
  // Don't refresh if no tracking number
  if (!this.fedex?.trackingNumber) {
    return false;
  }
  
  // Check last update time
  if (!this.fedex.lastTrackingUpdate) {
    return true;
  }
  
  const now = new Date();
  const lastUpdate = new Date(this.fedex.lastTrackingUpdate);
  const ageMinutes = (now - lastUpdate) / (1000 * 60);
  
  return ageMinutes > maxAgeMinutes;
};

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

orderSchema.pre('save', function(next) {
  // Auto-update deliveredAt when status changes to delivered
  if (this.isModified('orderStatus') && this.orderStatus === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  // Auto-update shippedAt when status changes to shipped
  if (this.isModified('orderStatus') && this.orderStatus === 'shipped' && !this.shippedAt) {
    this.shippedAt = new Date();
  }
  
  next();
});

// ===========================================
// EXPORT
// ===========================================

const Order = mongoose.model('Order', orderSchema);

export default Order;
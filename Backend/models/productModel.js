// models/productModel.js
import mongoose from 'mongoose';
import slugify from 'slugify';

// ============================================
// Sub-schemas for better organization
// ============================================

// Product dimensions (artwork dimensions)
const dimensionsSchema = new mongoose.Schema({
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [0.1, 'Height must be at least 0.1 inches']
  },
  width: {
    type: Number,
    required: [true, 'Width is required'],
    min: [0.1, 'Width must be at least 0.1 inches']
  },
  depth: {
    type: Number,
    default: 0,
    min: [0, 'Depth cannot be negative']
  },
  unit: {
    type: String,
    enum: ['in', 'cm'],
    default: 'in' // US default
  }
}, { _id: false });

// Weight schema
const weightSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0.01, 'Weight must be greater than 0']
  },
  unit: {
    type: String,
    enum: ['lb', 'oz', 'kg', 'g'],
    default: 'lb' // US default
  }
}, { _id: false });

// Shipping package dimensions
const packageDimensionsSchema = new mongoose.Schema({
  length: {
    type: Number,
    required: [true, 'Package length is required'],
    min: [0.1, 'Length must be at least 0.1 inches']
  },
  width: {
    type: Number,
    required: [true, 'Package width is required'],
    min: [0.1, 'Width must be at least 0.1 inches']
  },
  height: {
    type: Number,
    required: [true, 'Package height is required'],
    min: [0.1, 'Height must be at least 0.1 inches']
  },
  unit: {
    type: String,
    enum: ['in', 'cm'],
    default: 'in' // US default
  }
}, { _id: false });

// Shipping information schema
const shippingSchema = new mongoose.Schema({
  weight: {
    type: weightSchema,
    required: [true, 'Shipping weight is required']
  },
  packageDimensions: {
    type: packageDimensionsSchema,
    required: [true, 'Package dimensions are required']
  },
  isFragile: {
    type: Boolean,
    default: true // Art is typically fragile
  },
  requiresSignature: {
    type: Boolean,
    default: true // High-value items
  },
  insuranceRequired: {
    type: Boolean,
    default: true
  },
  packagingType: {
    type: String,
    enum: ['box', 'tube', 'crate', 'flat', 'custom'],
    default: 'box'
  },
  specialHandling: {
    type: String,
    trim: true,
    maxlength: [500, 'Special handling notes cannot exceed 500 characters']
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  freeShippingMinAmount: {
    type: Number,
    default: 0 // Free shipping if order >= this amount (in USD)
  },
  shippingClass: {
    type: String,
    enum: ['standard', 'express', 'priority', 'overnight', 'freight'],
    default: 'standard'
  },
  originZipCode: {
    type: String,
    trim: true,
    default: '' // Will use store default if not set
  }
}, { _id: false });

// Offer/Discount schema
const offerSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  validFrom: {
    type: Date,
    default: null
  },
  validUntil: {
    type: Date,
    default: null
  }
}, { _id: false });

// SEO schema
const seoSchema = new mongoose.Schema({
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  metaKeywords: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { _id: false });

// ============================================
// Main Product Schema
// ============================================

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },

  // Pricing (in USD)
  mrpPrice: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    default: undefined,
    validate: {
      validator: function(value) {
        if (value === null || value === undefined || value === '') {
          return true;
        }
        return typeof value === 'number' && value <= this.mrpPrice;
      },
      message: 'Discount price cannot be greater than regular price'
    }
  },
  askForPrice: {
    type: Boolean,
    default: false,
    index: true
  },

  // Inventory
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1
  },
  lowStockThreshold: {
    type: Number,
    default: 2,
    min: [0, 'Threshold cannot be negative']
  },
  trackInventory: {
    type: Boolean,
    default: true
  },

  // Media
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],

  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Artist/Author is required'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Artwork Dimensions
  dimensions: {
    type: dimensionsSchema,
    required: [true, 'Artwork dimensions are required']
  },

  // Shipping Information (for FedEx)
  shipping: {
    type: shippingSchema,
    required: [true, 'Shipping information is required']
  },

  // Art-specific fields
  medium: {
    type: String,
    required: [true, 'Art medium is required'],
    trim: true,
    maxlength: [100, 'Medium cannot exceed 100 characters']
  },
  style: {
    type: String,
    trim: true,
    maxlength: [100, 'Style cannot exceed 100 characters']
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  yearCreated: {
    type: Number,
    min: [1000, 'Invalid year'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  isOriginal: {
    type: Boolean,
    default: true
  },
  isFramed: {
    type: Boolean,
    default: false
  },
  frameDetails: {
    type: String,
    trim: true,
    maxlength: [200, 'Frame details cannot exceed 200 characters']
  },
  certificateOfAuthenticity: {
    type: Boolean,
    default: false
  },

  // SEO
  seo: {
    type: seoSchema,
    default: {}
  },

  // Offer/Discount
  offer: {
    type: offerSchema,
    default: {}
  },

  // Status flags
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// Indexes
// ============================================

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, author: 1 });
productSchema.index({ 'offer.isActive': 1 });
productSchema.index({ featured: 1, active: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ mrpPrice: 1 });
productSchema.index({ 'shipping.weight.value': 1 });

// ============================================
// Virtual Fields
// ============================================

// Current price (considers discount)
productSchema.virtual('currentPrice').get(function() {
  if (this.askForPrice) return null;
  
  if (this.isOfferValid() && this.discountPrice && this.discountPrice < this.mrpPrice) {
    return this.discountPrice;
  }
  return this.mrpPrice;
});

// Discount percentage
productSchema.virtual('calculatedDiscount').get(function() {
  if (this.discountPrice && this.discountPrice < this.mrpPrice) {
    return Math.round(((this.mrpPrice - this.discountPrice) / this.mrpPrice) * 100);
  }
  return 0;
});

// Formatted artwork dimensions
productSchema.virtual('formattedDimensions').get(function() {
  const d = this.dimensions;
  if (!d) return 'N/A';
  
  const unit = d.unit === 'cm' ? 'cm' : '"'; // Use " for inches
  if (d.depth > 0) {
    return `${d.height}${unit} H × ${d.width}${unit} W × ${d.depth}${unit} D`;
  }
  return `${d.height}${unit} H × ${d.width}${unit} W`;
});

// Formatted weight
productSchema.virtual('formattedWeight').get(function() {
  const w = this.shipping?.weight;
  if (!w) return 'N/A';
  return `${w.value} ${w.unit}`;
});

// Formatted package dimensions
productSchema.virtual('formattedPackageDimensions').get(function() {
  const d = this.shipping?.packageDimensions;
  if (!d) return 'N/A';
  
  const unit = d.unit === 'cm' ? 'cm' : '"';
  return `${d.length}${unit} L × ${d.width}${unit} W × ${d.height}${unit} H`;
});

// Weight in LBS (standardized for FedEx US)
productSchema.virtual('weightInLbs').get(function() {
  const w = this.shipping?.weight;
  if (!w) return 0;
  
  switch (w.unit) {
    case 'lb': return w.value;
    case 'oz': return w.value / 16;
    case 'kg': return w.value * 2.20462;
    case 'g': return w.value * 0.00220462;
    default: return w.value;
  }
});

// Weight in KG
productSchema.virtual('weightInKg').get(function() {
  const w = this.shipping?.weight;
  if (!w) return 0;
  
  switch (w.unit) {
    case 'kg': return w.value;
    case 'g': return w.value / 1000;
    case 'lb': return w.value * 0.453592;
    case 'oz': return w.value * 0.0283495;
    default: return w.value;
  }
});

// Package dimensions in inches (for FedEx US)
productSchema.virtual('packageDimensionsInInches').get(function() {
  const d = this.shipping?.packageDimensions;
  if (!d) return { length: 0, width: 0, height: 0 };
  
  if (d.unit === 'cm') {
    return {
      length: Math.ceil(d.length / 2.54),
      width: Math.ceil(d.width / 2.54),
      height: Math.ceil(d.height / 2.54)
    };
  }
  
  return {
    length: d.length,
    width: d.width,
    height: d.height
  };
});

// Package dimensions in CM
productSchema.virtual('packageDimensionsInCm').get(function() {
  const d = this.shipping?.packageDimensions;
  if (!d) return { length: 0, width: 0, height: 0 };
  
  if (d.unit === 'in') {
    return {
      length: Math.ceil(d.length * 2.54),
      width: Math.ceil(d.width * 2.54),
      height: Math.ceil(d.height * 2.54)
    };
  }
  
  return {
    length: d.length,
    width: d.width,
    height: d.height
  };
});

// Volumetric/Dimensional weight (FedEx uses divisor 139 for inches/lbs in US)
productSchema.virtual('dimensionalWeight').get(function() {
  const dims = this.packageDimensionsInInches;
  // FedEx dimensional weight divisor: 139 for domestic US (inches)
  const dimWeightLbs = (dims.length * dims.width * dims.height) / 139;
  
  return {
    value: Math.ceil(dimWeightLbs * 100) / 100,
    unit: 'lb'
  };
});

// Billable weight (greater of actual and dimensional)
productSchema.virtual('billableWeight').get(function() {
  const actualLbs = this.weightInLbs;
  const dimLbs = this.dimensionalWeight.value;
  const billable = Math.max(actualLbs, dimLbs);
  
  return {
    value: Math.ceil(billable * 100) / 100,
    unit: 'lb',
    isDimensional: dimLbs > actualLbs
  };
});

// In stock status
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ============================================
// Instance Methods
// ============================================

// Check if offer is valid
productSchema.methods.isOfferValid = function() {
  if (!this.offer?.isActive) return false;
  
  const now = new Date();
  if (this.offer.validFrom && now < this.offer.validFrom) return false;
  if (this.offer.validUntil && now > this.offer.validUntil) return false;
  
  return true;
};

// Get FedEx-ready shipping data
productSchema.methods.getFedExShippingData = function(quantity = 1) {
  const dims = this.packageDimensionsInInches;
  const billable = this.billableWeight;
  
  return {
    weight: {
      value: Math.ceil(billable.value * quantity * 100) / 100,
      units: 'LB'
    },
    dimensions: {
      length: Math.ceil(dims.length),
      width: Math.ceil(dims.width),
      height: Math.ceil(dims.height),
      units: 'IN'
    },
    packageCount: quantity,
    packagingType: this.shipping?.packagingType || 'YOUR_PACKAGING',
    specialServices: {
      signatureRequired: this.shipping?.requiresSignature || false,
      fragile: this.shipping?.isFragile || false,
      insuranceRequired: this.shipping?.insuranceRequired || false
    },
    declaredValue: {
      amount: this.currentPrice || this.mrpPrice,
      currency: 'USD'
    }
  };
};

// Update stock
productSchema.methods.updateStock = async function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    if (this.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
    this.soldCount += quantity;
  } else {
    this.stock += quantity;
  }
  
  return this.save();
};

// ============================================
// Static Methods
// ============================================

productSchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    stock: { $gt: 0 },
    trackInventory: true
  });
};

productSchema.statics.findOutOfStock = function() {
  return this.find({
    stock: 0,
    trackInventory: true
  });
};

// ============================================
// Pre-save Middleware
// ============================================

// Generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Generate SKU
productSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    const prefix = 'ART';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Auto-generate SEO fields
productSchema.pre('save', function(next) {
  if (!this.seo) this.seo = {};
  
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.name.substring(0, 60);
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.description.substring(0, 160);
  }
  
  // Auto-calculate discount
  if (!this.askForPrice && this.discountPrice && this.discountPrice < this.mrpPrice) {
    const percentage = Math.round(((this.mrpPrice - this.discountPrice) / this.mrpPrice) * 100);
    
    if (!this.offer) this.offer = {};
    this.offer.isActive = true;
    this.offer.discountPercentage = percentage;
  } else if (!this.discountPrice || this.askForPrice) {
    if (!this.offer) this.offer = {};
    this.offer.isActive = false;
    this.offer.discountPercentage = 0;
  }
  
  // Handle askForPrice
  if (this.askForPrice) {
    this.mrpPrice = 0;
    this.discountPrice = undefined;
  }
  
  next();
});

// Pre-update middleware
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update.discountPrice === null || update.discountPrice === '') {
    this.set({ discountPrice: undefined });
  }
  
  if (update.$set?.discountPrice === null || update.$set?.discountPrice === '') {
    update.$set.discountPrice = undefined;
  }
  
  next();
});

export default mongoose.model('Product', productSchema);
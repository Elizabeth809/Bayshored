import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  mrpPrice: {
    type: Number,
    required: [true, 'MRP price is required'],
    min: [0, 'MRP price cannot be negative']
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
        if (typeof value === 'number' && typeof this.mrpPrice === 'number') {
          return value <= this.mrpPrice;
        }
        return true;
      },
      message: 'Discount price cannot be greater than MRP price'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1
  },
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Product author is required']
  },
  dimensions: {
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [1, 'Height must be at least 1cm']
    },
    width: {
      type: Number,
      required: [true, 'Width is required'],
      min: [1, 'Width must be at least 1cm']
    },
    depth: {
      type: Number,
      default: 0
    }
  },
  medium: {
    type: String,
    required: [true, 'Art medium is required'],
    trim: true,
    maxlength: [100, 'Medium cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
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
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  askForPrice: {
    type: Boolean,
    default: false
  },
  offer: {
    isActive: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%'],
      default: 0
    },
    validUntil: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Generate slug before saving
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

// Auto-generate meta fields if not provided
productSchema.pre('save', function(next) {
  if (!this.metaTitle) {
    this.metaTitle = this.name.substring(0, 60);
  }
  if (!this.metaDescription) {
    this.metaDescription = this.description.substring(0, 160);
  }
  
  // Auto-calculate discount percentage if discount price is set
  if (this.discountPrice && this.discountPrice < this.mrpPrice) {
    const discountPercentage = Math.round(((this.mrpPrice - this.discountPrice) / this.mrpPrice) * 100);
    this.offer = {
      isActive: true,
      discountPercentage: discountPercentage,
      validUntil: this.offer?.validUntil || null
    };
  } else if (this.discountPrice === this.mrpPrice || !this.discountPrice) {
    this.offer = {
      isActive: false,
      discountPercentage: 0,
      validUntil: null
    };
  }
  
  next();
});

// Virtual for current price (considers discount)
productSchema.virtual('currentPrice').get(function() {
  if (this.offer?.isActive && this.discountPrice && this.discountPrice < this.mrpPrice) {
    return this.discountPrice;
  }
  return this.mrpPrice;
});

// Virtual for discount percentage
productSchema.virtual('calculatedDiscount').get(function() {
  if (this.discountPrice && this.discountPrice < this.mrpPrice) {
    return Math.round(((this.mrpPrice - this.discountPrice) / this.mrpPrice) * 100);
  }
  return 0;
});

// Virtual for formatted dimensions
productSchema.virtual('formattedDimensions').get(function() {
  if (this.dimensions.depth > 0) {
    return `${this.dimensions.height}H × ${this.dimensions.width}W × ${this.dimensions.depth}D cm`;
  }
  return `${this.dimensions.height}H × ${this.dimensions.width}W cm`;
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, author: 1 });
productSchema.index({ 'offer.isActive': 1 });
productSchema.index({ discountPrice: 1 });
productSchema.index({ featured: 1, active: 1 });
productSchema.index({ askForPrice: 1 });

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Middleware to handle discountPrice updates properly
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If discountPrice is explicitly set to null or empty string, remove it from the update
  if (update.discountPrice === null || update.discountPrice === '') {
    this.set({ discountPrice: undefined });
  }
  
  // Handle nested update operators
  if (update.$set && (update.$set.discountPrice === null || update.$set.discountPrice === '')) {
    update.$set.discountPrice = undefined;
  }
  
  next();
});

export default mongoose.model('Product', productSchema);
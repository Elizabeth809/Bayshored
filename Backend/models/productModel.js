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
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 1
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
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
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
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
  next();
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, author: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1, active: 1 });

// Virtual for formatted dimensions
productSchema.virtual('formattedDimensions').get(function() {
  if (this.dimensions.depth > 0) {
    return `${this.dimensions.height}H × ${this.dimensions.width}W × ${this.dimensions.depth}D cm`;
  }
  return `${this.dimensions.height}H × ${this.dimensions.width}W cm`;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
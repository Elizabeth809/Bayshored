import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true,
    default: ''
  },

  streetLine1: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true
  },

  streetLine2: {
    type: String,
    trim: true,
    default: ''
  },

  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },

  stateCode: {
    type: String,
    required: [true, 'State is required'],
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 2,
    validate: {
      validator: function(v) {
        const usStates = [
          'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
          'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
          'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
          'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
          'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];
        return usStates.includes(v);
      },
      message: props => `${props.value} is not a valid US state code`
    }
  },

  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{5}(-\d{4})?$/.test(v);
      },
      message: props => `${props.value} is not a valid US ZIP code`
    }
  },

  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    default: 'US',
    enum: ['US']
  },

  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        const cleaned = v.replace(/\D/g, '');
        return cleaned.length >= 10;
      },
      message: props => `${props.value} is not a valid phone number`
    }
  },

  isResidential: {
    type: Boolean,
    default: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  // FedEx validation fields
  fedexValidated: {
    type: Boolean,
    default: false
  },

  fedexClassification: {
    type: String,
    enum: ['RESIDENTIAL', 'BUSINESS', 'MIXED', 'UNKNOWN', null],
    default: null
  },

  normalizedAddress: {
    streetLines: [String],
    city: String,
    stateCode: String,
    zipCode: String,
    countryCode: String
  }
}, { timestamps: true });

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  addresses: [addressSchema],
  cart: [cartItemSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get default address
userSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0] || null;
};

// Virtual for cart total
userSchema.virtual('cartTotal').get(function() {
  return (this.cart || []).reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
});

// Virtual for cart items count
userSchema.virtual('cartItemsCount').get(function() {
  return (this.cart || []).reduce((total, item) => total + item.quantity, 0);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'addresses.isDefault': 1 });
userSchema.index({ 'addresses.zipCode': 1 });

export default mongoose.model('User', userSchema);
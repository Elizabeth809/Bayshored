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
  medium: String
});

const shippingUpdateSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

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
  shippingAddress: {
    flatNo: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    phoneNo: {
      type: String,
      required: true
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
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

  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'razorpay', 'COD'],
    required: true
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingUpdates: [shippingUpdateSchema],
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Generate 7-digit order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      // Method 1: Generate unique 7-digit number
      const generateOrderNumber = async () => {
        // Generate random 7-digit number (1000000 to 9999999)
        const random7Digit = Math.floor(1000000 + Math.random() * 9000000);
        const orderNumber = `ART${random7Digit}`;
        
        // Check if it already exists
        const existingOrder = await mongoose.model('Order').findOne({ orderNumber });
        return existingOrder ? null : orderNumber;
      };

      // Try up to 5 times to generate unique number
      let orderNumber = null;
      for (let i = 0; i < 5; i++) {
        orderNumber = await generateOrderNumber();
        if (orderNumber) break;
      }

      // If still not unique, use timestamp with last 7 digits
      if (!orderNumber) {
        const timestamp = Date.now();
        const last7Digits = timestamp.toString().slice(-7);
        orderNumber = `ART${last7Digits}`;
        
        // One more check for uniqueness
        const existingOrder = await mongoose.model('Order').findOne({ orderNumber });
        if (existingOrder) {
          // Add a random digit to make it unique
          orderNumber = `ART${last7Digits.slice(0, 6)}${Math.floor(Math.random() * 10)}`;
        }
      }

      console.log(`Generated order number: ${orderNumber}`);
      this.orderNumber = orderNumber;
      next();
    } catch (error) {
      console.error('Error generating order number:', error);
      next(error);
    }
  } else {
    next();
  }
});

// Alternative: Sequential order numbers (more professional)
// Uncomment this if you want sequential numbers

/*
// First, create a Counter model in a separate file or in your init
const Counter = mongoose.model('Counter') || 
  mongoose.model('Counter', new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000000 }
  }));

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      this.orderNumber = `ART${counter.seq}`;
      console.log(`Generated sequential order number: ${this.orderNumber}`);
      next();
    } catch (error) {
      console.error('Error generating sequential order number:', error);
      
      // Fallback to random 7-digit
      const random7Digit = Math.floor(1000000 + Math.random() * 9000000);
      this.orderNumber = `ART${random7Digit}`;
      next();
    }
  } else {
    next();
  }
});
*/

// Index for better search performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

export default mongoose.model('Order', orderSchema);
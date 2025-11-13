import mongoose from 'mongoose';

const priceInquirySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid mobile number']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  budget: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true,
    enum: ['personal', 'corporate', 'gift', 'investment', 'other'],
    default: 'personal'
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'resolved'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
priceInquirySchema.index({ product: 1 });
priceInquirySchema.index({ email: 1 });
priceInquirySchema.index({ status: 1 });
priceInquirySchema.index({ createdAt: -1 });

export default mongoose.model('PriceInquiry', priceInquirySchema);
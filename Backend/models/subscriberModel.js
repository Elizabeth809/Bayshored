import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'website'
  }
}, {
  timestamps: true
});

// Index for better search performance
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ subscribedAt: -1 });
subscriberSchema.index({ isActive: 1 });

export default mongoose.model('Subscriber', subscriberSchema);
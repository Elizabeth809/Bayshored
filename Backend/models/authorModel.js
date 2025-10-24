import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    required: [true, 'Author bio is required'],
    trim: true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add index for better search performance
authorSchema.index({ name: 'text', bio: 'text' });

export default mongoose.model('Author', authorSchema);
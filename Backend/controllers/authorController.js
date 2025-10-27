import Author from '../models/authorModel.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Create a new author
// @route   POST /api/v1/authors
// @access  Private/Admin
export const createAuthor = async (req, res) => {
  try {
    const { name, bio, email, website, socialMedia } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Author profile image is required'
      });
    }

    // Parse socialMedia if it's a string
    let parsedSocialMedia = socialMedia;
    if (typeof socialMedia === 'string') {
      try {
        parsedSocialMedia = JSON.parse(socialMedia);
      } catch (error) {
        parsedSocialMedia = {};
      }
    }

    // Create author
    const author = await Author.create({
      name,
      bio,
      profileImage: req.file.path, // Cloudinary URL
      email: email || '',
      website: website || '',
      socialMedia: parsedSocialMedia || {}
    });

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author
    });

  } catch (error) {
    console.error('Create author error:', error);
    
    // Delete uploaded image from Cloudinary if author creation fails
    if (req.file) {
      try {
        const publicId = req.file.filename;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating author',
      error: error.message
    });
  }
};

// @desc    Update author
// @route   PUT /api/v1/authors/:id
// @access  Private/Admin
export const updateAuthor = async (req, res) => {
  try {
    const { name, bio, email, website, socialMedia } = req.body;

    // Find existing author
    let author = await Author.findById(req.params.id);
    if (!author) {
      // Delete newly uploaded image if author not found
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Parse socialMedia if it's a string
    let parsedSocialMedia = socialMedia;
    if (typeof socialMedia === 'string') {
      try {
        parsedSocialMedia = JSON.parse(socialMedia);
      } catch (error) {
        parsedSocialMedia = {};
      }
    }

    // Prepare update data
    const updateData = {
      name,
      bio,
      email: email || '',
      website: website || '',
      socialMedia: parsedSocialMedia || {}
    };

    // If new image is uploaded, update image and delete old one from Cloudinary
    if (req.file) {
      // Delete old image from Cloudinary
      if (author.profileImage) {
        try {
          const oldPublicId = author.profileImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`mern_art/authors/${oldPublicId}`);
        } catch (cloudinaryError) {
          console.error('Error deleting old image from Cloudinary:', cloudinaryError);
        }
      }
      updateData.profileImage = req.file.path;
    }

    // Update author
    author = await Author.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Author updated successfully',
      data: author
    });

  } catch (error) {
    console.error('Update author error:', error);
    
    // Delete newly uploaded image if update fails
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating author',
      error: error.message
    });
  }
};

// @desc    Delete author
// @route   DELETE /api/v1/authors/:id
// @access  Private/Admin
export const deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Delete image from Cloudinary
    if (author.profileImage) {
      try {
        const publicId = author.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`mern_art/authors/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    // Delete author from database
    await Author.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Author deleted successfully'
    });

  } catch (error) {
    console.error('Delete author error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting author',
      error: error.message
    });
  }
};

// @desc    Get all authors
// @route   GET /api/v1/authors
// @access  Public
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ name: 1 });

    res.json({
      success: true,
      count: authors.length,
      data: authors
    });

  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching authors',
      error: error.message
    });
  }
};

// @desc    Get single author by ID
// @route   GET /api/v1/authors/:id
// @access  Public
export const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.json({
      success: true,
      data: author
    });

  } catch (error) {
    console.error('Get author error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching author',
      error: error.message
    });
  }
};
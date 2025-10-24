import Author from '../models/authorModel.js';

// @desc    Create a new author
// @route   POST /api/v1/authors
// @access  Private/Admin
export const createAuthor = async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;

    const author = await Author.create({
      name,
      bio,
      profileImage: profileImage || ''
    });

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author
    });

  } catch (error) {
    console.error('Create author error:', error);
    
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

// @desc    Update author
// @route   PUT /api/v1/authors/:id
// @access  Private/Admin
export const updateAuthor = async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;

    let author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    author = await Author.findByIdAndUpdate(
      req.params.id,
      { name, bio, profileImage },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Author updated successfully',
      data: author
    });

  } catch (error) {
    console.error('Update author error:', error);
    
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
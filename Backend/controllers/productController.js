import Product from '../models/productModel.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      author,
      dimensions,
      medium,
      metaTitle,
      metaDescription,
      tags,
      featured
    } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Product image is required'
      });
    }

    // Parse dimensions if it's a string
    let parsedDimensions = dimensions;
    if (typeof dimensions === 'string') {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dimensions format'
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      image: req.file.path, // Cloudinary URL
      category,
      author,
      dimensions: parsedDimensions,
      medium,
      metaTitle,
      metaDescription,
      tags: parsedTags,
      featured: featured === 'true'
    });

    // Populate category and author details
    await product.populate('category', 'name');
    await product.populate('author', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Delete uploaded image from Cloudinary if product creation fails
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

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
      error: error.message
    });
  }
};

// @desc    Get all products with filtering and sorting
// @route   GET /api/v1/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      author,
      featured,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt_desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = { active: true };

    if (category) {
      filter.category = category;
    }

    if (author) {
      filter.author = author;
    }

    if (featured) {
      filter.featured = featured === 'true';
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'price_asc':
        sortOptions.price = 1;
        break;
      case 'price_desc':
        sortOptions.price = -1;
        break;
      case 'name_asc':
        sortOptions.name = 1;
        break;
      case 'name_desc':
        sortOptions.name = -1;
        break;
      case 'createdAt_asc':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('author', 'name bio profileImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages,
      currentPage: pageNum,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      active: true 
    })
    .populate('category', 'name description')
    .populate('author', 'name bio profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('author', 'name bio profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      author,
      dimensions,
      medium,
      metaTitle,
      metaDescription,
      tags,
      featured,
      active
    } = req.body;

    // Find existing product
    let product = await Product.findById(req.params.id);
    if (!product) {
      // Delete newly uploaded image if product not found
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Parse dimensions if it's a string
    let parsedDimensions = dimensions;
    if (typeof dimensions === 'string') {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dimensions format'
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Prepare update data
    const updateData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      author,
      dimensions: parsedDimensions,
      medium,
      metaTitle,
      metaDescription,
      tags: parsedTags,
      featured: featured === 'true',
      active: active === 'true'
    };

    // If new image is uploaded, update image and delete old one from Cloudinary
    if (req.file) {
      // Delete old image from Cloudinary
      if (product.image) {
        try {
          const oldPublicId = product.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`mern_art/products/${oldPublicId}`);
        } catch (cloudinaryError) {
          console.error('Error deleting old image from Cloudinary:', cloudinaryError);
        }
      }
      updateData.image = req.file.path;
    }

    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name').populate('author', 'name');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    
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
        message: 'Product not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image from Cloudinary
    if (product.image) {
      try {
        const publicId = product.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`mern_art/products/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: error.message
    });
  }
};

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      featured: true, 
      active: true 
    })
    .populate('category', 'name')
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .limit(8);

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products',
      error: error.message
    });
  }
};
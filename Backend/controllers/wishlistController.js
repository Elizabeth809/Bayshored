import User from '../models/userModel.js';
import Product from '../models/productModel.js';

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        select: 'name description mrpPrice discountPrice stock images slug active dimensions medium author category tags askForPrice offer',
        populate: [
          {
            path: 'author',
            select: 'name profileImage bio'
          },
          {
            path: 'category',
            select: 'name'
          }
        ]
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out products that are no longer active or don't exist
    const validWishlist = user.wishlist.filter(product => 
      product && product.active
    );

    // Update wishlist if some items were filtered out
    if (validWishlist.length !== user.wishlist.length) {
      user.wishlist = validWishlist.map(product => product._id);
      await user.save();
    }

    res.json({
      success: true,
      data: {
        items: validWishlist,
        itemsCount: validWishlist.length
      }
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching wishlist',
      error: error.message
    });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is active
    const product = await Product.findOne({ 
      _id: productId, 
      active: true 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist'
      });
    }

    // Add product to wishlist
    user.wishlist.push(productId);
    await user.save();

    // Populate the wishlist to return complete data
    await user.populate({
      path: 'wishlist',
      select: 'name description mrpPrice discountPrice stock images slug active dimensions medium author category tags askForPrice offer',
      populate: [
        {
          path: 'author',
          select: 'name profileImage bio'
        },
        {
          path: 'category',
          select: 'name'
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: {
        items: user.wishlist,
        itemsCount: user.wishlist.length
      }
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding to wishlist',
      error: error.message
    });
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is in wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );

    await user.save();

    // Populate the wishlist to return complete data
    await user.populate({
      path: 'wishlist',
      select: 'name description mrpPrice discountPrice stock images slug active dimensions medium author category tags askForPrice offer',
      populate: [
        {
          path: 'author',
          select: 'name profileImage bio'
        },
        {
          path: 'category',
          select: 'name'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: {
        items: user.wishlist,
        itemsCount: user.wishlist.length
      }
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing from wishlist',
      error: error.message
    });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isInWishlist = user.wishlist.includes(productId);

    res.json({
      success: true,
      data: {
        isInWishlist
      }
    });

  } catch (error) {
    console.error('Check wishlist error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while checking wishlist',
      error: error.message
    });
  }
};
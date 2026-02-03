import User from '../models/userModel.js';
import Product from '../models/productModel.js';

// Helper function to calculate current price
const getCurrentPrice = (product) => {
  if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
    return product.discountPrice;
  }
  return product.mrpPrice;
};

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer shipping',
        populate: {
          path: 'author',
          select: 'name'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out products that are no longer active or out of stock
    const validCartItems = user.cart.filter(item => 
      item.product && 
      item.product.active && 
      item.product.stock > 0
    );

    // Update cart if some items were filtered out
    if (validCartItems.length !== user.cart.length) {
      user.cart = validCartItems;
      await user.save();
    }

    const cartTotal = validCartItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        items: validCartItems,
        total: cartTotal,
        itemsCount: validCartItems.reduce((count, item) => count + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart',
      error: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

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

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than ${product.stock} items to cart`
        });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].addedAt = new Date();
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity: quantity
      });
    }

    await user.save();

    // Populate the cart to return complete data
    await user.populate({
      path: 'cart.product',
      select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer shipping',
      populate: {
        path: 'author',
        select: 'name'
      }
    });

    const cartTotal = user.cart.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        items: user.cart,
        total: cartTotal,
        itemsCount: user.cart.reduce((count, item) => count + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding to cart',
      error: error.message
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/:productId
// @access  Private
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
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

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the item in cart
    const cartItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    user.cart[cartItemIndex].quantity = quantity;
    user.cart[cartItemIndex].addedAt = new Date();

    await user.save();

    // Populate the cart to return complete data
    await user.populate({
      path: 'cart.product',
      select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer shipping',
      populate: {
        path: 'author',
        select: 'name'
      }
    });

    const cartTotal = user.cart.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        items: user.cart,
        total: cartTotal,
        itemsCount: user.cart.reduce((count, item) => count + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('Update cart quantity error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating cart',
      error: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove item from cart
    user.cart = user.cart.filter(
      item => item.product.toString() !== productId
    );

    await user.save();

    // Populate the cart to return complete data
    await user.populate({
      path: 'cart.product',
      select: 'name mrpPrice discountPrice images slug stock active dimensions medium author offer shipping',
      populate: {
        path: 'author',
        select: 'name'
      }
    });

    const cartTotal = user.cart.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        items: user.cart,
        total: cartTotal,
        itemsCount: user.cart.reduce((count, item) => count + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing from cart',
      error: error.message
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        total: 0,
        itemsCount: 0
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart',
      error: error.message
    });
  }
};
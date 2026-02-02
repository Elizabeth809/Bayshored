import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  Heart,
  ShoppingCart,
  Eye,
  X,
  CheckCircle,
  Info,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isAuthenticated, token, updateWishlistCount, updateCartCount } = useAuth();
  const navigate = useNavigate();

  // Quick View States
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState({ active: false, message: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, navigate]);

  // Close quick view
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowQuickView(false);
      }
    };
    if (showQuickView) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showQuickView]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Wishlist API Response:', data); // Debug log

      if (data.success) {
        setWishlist(data.data);
        updateWishlistCount(data.data.itemsCount);
      } else {
        console.error('Failed to fetch wishlist:', data.message);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setUpdating(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setWishlist(data.data);
        updateWishlistCount(data.data.itemsCount);
        showFeedback('Removed from Wishlist');
      } else {
        showFeedback(data.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showFeedback('Failed to remove from wishlist');
    } finally {
      setUpdating(false);
    }
  };

  const moveToCart = async (product) => {
    setUpdating(true);
    try {
      const cartResponse = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });

      const cartData = await cartResponse.json();

      if (cartData.success) {
        const wishlistResponse = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/${product._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const wishlistData = await wishlistResponse.json();

        if (wishlistData.success) {
          setWishlist(wishlistData.data);
          updateWishlistCount(wishlistData.data.itemsCount);
          updateCartCount(cartData.data.itemsCount);
          showFeedback('Moved to Cart!');
        }
      } else {
        showFeedback(cartData.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error moving to cart:', error);
      showFeedback('Failed to move to cart');
    } finally {
      setUpdating(false);
    }
  };

  // Quick View Handlers
  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleQuickViewAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }
    setAddingToCart(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: selectedProduct._id, quantity: 1 })
      });
      const data = await response.json();
      if (data.success) {
        updateCartCount(data.data.itemsCount);
        setShowQuickView(false);
        showFeedback('Added to Cart!');
      } else {
        showFeedback(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showFeedback('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Show feedback
  const showFeedback = (message) => {
    setFeedback({ active: true, message });
    setTimeout(() => {
      setFeedback({ active: false, message: '' });
    }, 2500);
  };

  // Helper Functions
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '$0.00';
    }
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericPrice);
  };

  const getDiscountPercentage = (product) => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const getCurrentPrice = (product) => {
    if (product.discountPrice && product.discountPrice < (product.mrpPrice || product.price)) {
      return product.discountPrice;
    }
    return product.mrpPrice || product.price;
  };

  // FIXED: Enhanced product data extraction
  const getProductData = (item) => {
    // The item should be the product object directly from the populated wishlist
    const product = item;
    
    console.log('Processing product:', product); // Debug log
    
    return {
      _id: product._id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      mrpPrice: product.mrpPrice,
      discountPrice: product.discountPrice,
      stock: product.stock,
      images: product.images || [],
      image: product.image,
      category: product.category || { name: 'Uncategorized' },
      author: product.author || { name: 'Unknown Artist' },
      medium: product.medium,
      dimensions: product.dimensions || { height: 0, width: 0, depth: 0 },
      tags: product.tags || [],
      askForPrice: product.askForPrice || false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-16 text-center">
          <div className="text-gray-400 !mb-4">
            <Heart className="!mx-auto !h-16 !w-16" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 !mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 !mb-8">Save your favorite artworks here!</p>
          <Link
            to="/store"
            className="bg-gray-600 text-white !px-6 !py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Explore Artworks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        <div className="!mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 !mt-2">{wishlist.itemsCount || wishlist.items.length} items saved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.items.map((item, index) => {
            const product = getProductData(item);
            const isSoldOut = product.stock === 0;
            const discountPercentage = getDiscountPercentage(product);
            const currentPrice = getCurrentPrice(product);
            const hasAskForPrice = product.askForPrice === true;
            const mainImage = product.images?.[0] || product.image || 'https://via.placeholder.com/600x600?text=Image+Not+Found';

            console.log('Rendering product:', product.name, product.category); // Debug log

            return (
              <motion.div
                key={product._id}
                className="!relative !bg-white !rounded-xl !shadow-lg !overflow-hidden !transition-all !duration-300 !hover:shadow-2xl !border !border-gray-100"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
              >
                {/* Image Container */}
                <div className="!relative !h-80 !bg-neutral-100 !overflow-hidden">
                  <Link to={`/product/${product.slug}`} className="!block !w-full !h-full">
                    <motion.img
                      src={mainImage}
                      alt={product.name}
                      className="!w-full !h-full !object-contain"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                      }}
                    />
                  </Link>

                  {/* Action Icons */}
                  <div className="!absolute !top-4 !right-4 !z-10 !flex !flex-col !space-y-3">
                    {/* Remove from Wishlist Button */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => removeFromWishlist(product._id)}
                      disabled={updating}
                      className="!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200 !disabled:!opacity-50 cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      {updating ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <Trash2 className="!text-red-500" size={20} />
                      )}
                    </motion.button>

                    {/* Quick View Button */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickView(product)}
                      className="!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200 cursor-pointer"
                      title="Quick View"
                    >
                      <Eye className="!text-gray-700 !hover:!text-gray-600" size={20} />
                    </motion.button>

                    {/* Add to Cart Button - Hide for Ask for Price products */}
                    {!hasAskForPrice && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => moveToCart(product)}
                        disabled={updating || isSoldOut}
                        className={`!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200 cursor-pointer ${isSoldOut
                          ? '!cursor-not-allowed'
                          : '!disabled:!opacity-50'
                          }`}
                        title={isSoldOut ? "Sold Out" : "Move to Cart"}
                      >
                        {updating ? (
                          <LoadingSpinner size="small" />
                        ) : isSoldOut ? (
                          <Info className="!text-red-500" size={20} />
                        ) : (
                          <ShoppingCart className="!text-gray-700 !hover:!text-gray-600" size={20} />
                        )}
                      </motion.button>
                    )}
                  </div>

                  {/* Discount Badge */}
                  {discountPercentage > 0 && !hasAskForPrice && (
                    <div className="!absolute !top-4 !left-4 !z-10">
                      <span className="!bg-gray-600 !text-white !px-3 !py-1 !rounded-full !text-xs !font-bold !shadow-lg">
                        {discountPercentage}% OFF
                      </span>
                    </div>
                  )}

                  {/* Ask for Price Badge */}
                  {hasAskForPrice && (
                    <div className="!absolute !top-4 !left-4 !z-10">
                      <span className="!bg-gray-600 !text-white !px-3 !py-1 !rounded-full !text-xs !font-bold !shadow-lg">
                        Ask Upon Price
                      </span>
                    </div>
                  )}

                  {/* Sold Out Overlay */}
                  {isSoldOut && (
                    <div className="!absolute !inset-0 !bg-black/50 !flex !items-center !justify-center">
                      <span className="!bg-white/90 !text-red-600 !px-4 !py-2 !rounded-full !font-bold !text-sm !backdrop-blur-sm">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="!p-6 !text-center">
                  <Link to={`/product/${product.slug}`}>
                    {/* Category */}
                    <div className="!mb-2">
                      <span className="!text-sm !font-semibold !text-gray-700 !uppercase !tracking-wider">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-playfair !text-xl !font-bold !text-gray-900 !line-clamp-2 !transition-colors !duration-300 !hover:!text-gray-800 !mb-3">
                      {product.name}
                    </h3>

                    {/* Artist Name */}
                    <p className="font-parisienne !text-xl !text-gray-600 !mb-4 !truncate">
                      by {product.author?.name || 'Unknown Artist'}
                    </p>

                    {/* Price Section */}
                    <div className="!flex !items-baseline !justify-center !space-x-2">
                      {hasAskForPrice ? (
                        <span className="font-playfair !text-2xl !font-bold !text-gray-700">
                          Price Upon Request
                        </span>
                      ) : (
                        <>
                          <span className="font-playfair !text-2xl !font-bold !text-gray-900">
                            {formatPrice(currentPrice)}
                          </span>
                          {discountPercentage > 0 && (
                            <span className="!text-lg !text-gray-400 !line-through">
                              {formatPrice(product.mrpPrice)}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="!mt-3 !text-sm !text-gray-600">
                      <div className="!flex !justify-between !items-center">
                        <span>{product.medium || 'Mixed Media'}</span>
                        <span>
                          {product.dimensions?.height || 0} × {product.dimensions?.width || 0} cm
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && selectedProduct && (
          <motion.div
            className="!fixed !inset-0 !bg-black/50 !z-50 !flex !items-center !justify-center !p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickView(false)}
          >
            <motion.div
              className="!bg-white !rounded-2xl !max-w-4xl !w-full !max-h-[90vh] !overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="!relative">
                <button
                  onClick={() => setShowQuickView(false)}
                  className="!absolute !top-4 !right-4 !p-2 !bg-white !rounded-full !shadow-lg !z-10 !hover:!bg-gray-100 !transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-8 !p-8">
                  <div className="!relative !aspect-square !bg-gray-100 !rounded-xl !overflow-hidden">
                    <img
                      src={selectedProduct.images?.[0] || selectedProduct.image || 'https://via.placeholder.com/600x600?text=Image+Not+Found'}
                      alt={selectedProduct.name}
                      className="!w-full !h-full !object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="!flex !flex-col font-playfair">
                    <h2 className="!text-3xl !font-bold !text-gray-900 !mb-2">{selectedProduct.name}</h2>
                    <p className="font-parisienne !text-2xl !text-gray-700 !mb-4">
                      by {selectedProduct.author?.name || 'Unknown Artist'}
                    </p>
                    
                    {/* Price Section in Quick View */}
                    <div className="!mb-4">
                      {selectedProduct.askForPrice ? (
                        <div className="!flex !items-center !space-x-2 !mb-2">
                          <span className="!text-3xl !font-bold !text-gray-700">
                            Price Upon Request
                          </span>
                          <span className="!bg-gray-100 !text-gray-800 !px-2 !py-1 !rounded-full !text-sm !font-bold">
                            Ask Upon Price
                          </span>
                        </div>
                      ) : (
                        <div className="!flex !items-baseline !space-x-2 !mb-2">
                          <span className="!text-3xl !font-bold !text-gray-900">
                            {formatPrice(getCurrentPrice(selectedProduct))}
                          </span>
                          {getDiscountPercentage(selectedProduct) > 0 && (
                            <>
                              <span className="!text-xl !text-gray-400 !line-through">
                                {formatPrice(selectedProduct.mrpPrice)}
                              </span>
                              <span className="!bg-red-100 !text-red-800 !px-2 !py-1 !rounded-full !text-sm !font-bold">
                                {getDiscountPercentage(selectedProduct)}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="!text-gray-600 !text-base !leading-relaxed !mb-6 !line-clamp-4">
                      {selectedProduct.description || 'No description available.'}
                    </p>
                    <div className="!space-y-3 !mb-6 !text-sm">
                      <div className="!flex !justify-between">
                        <span className="!text-gray-600">Medium:</span>
                        <span className="!font-medium">{selectedProduct.medium || 'Mixed Media'}</span>
                      </div>
                      <div className="!flex !justify-between">
                        <span className="!text-gray-600">Dimensions:</span>
                        <span className="!font-medium">
                          {selectedProduct.dimensions?.height || 0} × {selectedProduct.dimensions?.width || 0} cm
                        </span>
                      </div>
                      <div className="!flex !justify-between">
                        <span className="!text-gray-600">Stock:</span>
                        <span className={`!font-medium ${selectedProduct.stock > 0 ? '!text-gray-600' : '!text-red-600'}`}>
                          {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      {selectedProduct.askForPrice && (
                        <div className="!flex !justify-between">
                          <span className="!text-gray-600">Pricing:</span>
                          <span className="!font-medium !text-gray-700">Available Upon Request</span>
                        </div>
                      )}
                    </div>

                    {/* Tags Section */}
                    {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                      <div className="!mb-6">
                        <h3 className="!font-bold !text-gray-900 !text-lg !mb-2">Tags</h3>
                        <div className="!flex !flex-wrap !gap-2">
                          {selectedProduct.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="!bg-gray-100 !text-gray-800 !px-3 !py-1 !rounded-full !text-sm !font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="!flex !space-x-3 !mt-auto">
                      <button
                        onClick={() => removeFromWishlist(selectedProduct._id)}
                        disabled={updating}
                        className="!flex-1 !bg-red-600 !text-white !py-3 !px-6 !rounded-lg !hover:!bg-red-700 !disabled:!bg-gray-300 !disabled:!cursor-not-allowed !transition-colors !duration-200 !font-medium"
                      >
                        {updating ? 'Removing...' : 'Remove from Wishlist'}
                      </button>
                      
                      {!selectedProduct.askForPrice && (
                        <button
                          onClick={handleQuickViewAddToCart}
                          disabled={addingToCart || selectedProduct.stock === 0}
                          className="!flex-1 !bg-gray-600 !text-white !py-3 !px-6 !rounded-lg !hover:!bg-gray-700 !disabled:!bg-gray-300 !disabled:!cursor-not-allowed !transition-colors !duration-200 !font-medium"
                        >
                          {addingToCart ? 'Adding...' : selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Message */}
      <AnimatePresence>
        {feedback.active && (
          <motion.div
            className="!fixed !bottom-4 !right-4 !bg-gray-600 !text-white !p-4 !rounded-lg !shadow-lg !flex !items-center !justify-center !z-50"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          >
            <CheckCircle size={18} className="!mr-2" />
            <span className="!font-semibold !text-sm">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
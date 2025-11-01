import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../others/LoadingSpinner';
import {
  Heart,
  ShoppingCart,
  Eye,
  X,
  CheckCircle,
  Info
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../others/clientApiUrl';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard = ({ product, index }) => {
  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();

  // Action States
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);

  // UI States
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState({ active: false, message: '' });

  // Check wishlist status
  useEffect(() => {
    if (isAuthenticated && product) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

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

  // Show feedback
  const showFeedback = (message) => {
    setFeedback({ active: true, message });
    setTimeout(() => {
      setFeedback({ active: false, message: '' });
    }, 2500);
  };

  // API Functions
  const checkWishlistStatus = async () => {
    if (!isAuthenticated || !product) return;
    setCheckingWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/check/${product._id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setIsWishlisted(data.data.isInWishlist);
      }
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    } finally {
      setCheckingWishlist(false);
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showFeedback('Please login first');
      return;
    }
    if (isWishlisted) {
      await handleRemoveFromWishlist(e);
      return;
    }
    setAddingToWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id })
      });
      const data = await response.json();
      if (data.success) {
        updateWishlistCount(data.data.itemsCount);
        setIsWishlisted(true);
        showFeedback('Added to Wishlist!');
      } else {
        showFeedback(data.message || 'Failed to add');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showFeedback('Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleRemoveFromWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !product) return;
    setAddingToWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/${product._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        updateWishlistCount(data.data.itemsCount);
        setIsWishlisted(false);
        showFeedback('Removed from Wishlist');
      } else {
        showFeedback(data.message || 'Failed to remove');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      showFeedback('Failed to remove');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showFeedback('Please login first');
      return;
    }
    setAddingToCart(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await response.json();
      if (data.success) {
        updateCartCount(data.data.itemsCount);
        showFeedback('Added to Cart!');
      } else {
        showFeedback(data.message || 'Failed to add');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showFeedback('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Quick View Modal Handlers
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
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await response.json();
      if (data.success) {
        updateCartCount(data.data.itemsCount);
        setShowQuickView(false);
      } else {
        alert(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuickViewWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      return;
    }
    if (isWishlisted) {
      await handleRemoveFromWishlist(e);
    } else {
      await handleAddToWishlist(e);
    }
  };

  // Helper Functions
  const formatPrice = (price) => {
    if (!price) return formatPrice(0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const getCurrentPrice = () => {
    if (product.discountPrice && product.discountPrice < (product.mrpPrice || product.price)) {
      return product.discountPrice;
    }
    return product.mrpPrice || product.price;
  };

  const isSoldOut = product.stock === 0;
  const discountPercentage = getDiscountPercentage();
  const currentPrice = getCurrentPrice();
  const mainImage = product.images?.[0] || product.image || 'https://via.placeholder.com/600x600?text=Image+Not+Found';

  return (
    <>
      <motion.div
        className="!relative !bg-white !rounded-xl !shadow-lg !overflow-hidden !transition-all !duration-300 !hover:shadow-2xl !border !border-emerald-100"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: (index || 0) * 0.1 }}
      >
        {/* Image Container */}
        <div className="!relative !h-80 !bg-neutral-100 !overflow-hidden">
          <Link to={`/product/${product.slug}`} className="!block !w-full !h-full">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="!absolute !inset-0 !bg-gray-200 !animate-pulse !flex !items-center !justify-center">
                <div className="!text-gray-400">Loading...</div>
              </div>
            )}

            {/* Main Image */}
            <motion.img
              src={mainImage}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                setImageLoaded(true);
              }}
              className={`!w-full !h-full !object-contain !transition-opacity !duration-300 ${imageLoaded ? '!opacity-100' : '!opacity-0'
                }`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          </Link>

          {/* Action Icons - Fixed Animation */}
          <div className="!absolute !top-4 !right-4 !z-10 !flex !flex-col !space-y-3">
            {/* Wishlist Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToWishlist}
              disabled={addingToWishlist || checkingWishlist}
              className="!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200 !disabled:!opacity-50"
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {addingToWishlist || checkingWishlist ? (
                <LoadingSpinner size="small" />
              ) : isWishlisted ? (
                <Heart className="!text-red-500" fill="currentColor" size={20} />
              ) : (
                <Heart className="!text-gray-700 !hover:!text-red-500" size={20} />
              )}
            </motion.button>

            {/* Quick View Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200"
              title="Quick View"
            >
              <Eye className="!text-gray-700 !hover:!text-emerald-600" size={20} />
            </motion.button>

            {/* Add to Cart Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              onClick={isSoldOut ? undefined : handleAddToCart}
              disabled={addingToCart || isSoldOut}
              className={`!p-3 !bg-white/90 !backdrop-blur-sm !rounded-full !shadow-lg !transition-all !duration-200 ${isSoldOut
                ? '!cursor-not-allowed'
                : '!disabled:!opacity-50'
                }`}
              title={isSoldOut ? "Sold Out" : "Add to Cart"}
            >
              {addingToCart ? (
                <LoadingSpinner size="small" />
              ) : isSoldOut ? (
                <Info className="!text-red-500" size={20} />
              ) : (
                <ShoppingCart className="!text-gray-700 !hover:!text-emerald-600" size={20} />
              )}
            </motion.button>
          </div>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="!absolute !top-4 !left-4 !z-10">
              <span className="!bg-emerald-600 !text-white !px-3 !py-1 !rounded-full !text-xs !font-bold !shadow-lg">
                {discountPercentage}% OFF
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
              <span className="!text-sm !font-semibold !text-emerald-700 !uppercase !tracking-wider">
                {product.category?.name || 'Uncategorized'}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-playfair !text-xl !font-bold !text-gray-900 !line-clamp-2 !transition-colors !duration-300 !hover:!text-emerald-800 !mb-3">
              {product.name}
            </h3>

            {/* Artist Name */}
            <p className="font-parisienne !text-xl !text-gray-600 !mb-4 !truncate">
              by {product.author?.name || 'Unknown Artist'}
            </p>

            {/* Price Section */}
            <div className="!flex !items-baseline !justify-center !space-x-2">
              <span className="font-playfair !text-2xl !font-bold !text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {discountPercentage > 0 && (
                <span className="!text-lg !text-gray-400 !line-through">
                  {formatPrice(product.mrpPrice)}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Feedback Message */}
        <AnimatePresence>
          {feedback.active && (
            <motion.div
              className="!absolute !bottom-0 !left-0 !right-0 !bg-emerald-600 !text-white !p-3 !flex !items-center !justify-center !z-20"
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
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
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
                      src={mainImage}
                      alt={product.name}
                      className="!w-full !h-full !object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="!flex !flex-col font-playfair">
                    <h2 className="!text-3xl !font-bold !text-gray-900 !mb-2">{product.name}</h2>
                    <p className="font-parisienne !text-2xl !text-emerald-700 !mb-4">
                      by {product.author?.name || 'Unknown Artist'}
                    </p>
                    <div className="!mb-4">
                      <div className="!flex !items-baseline !space-x-2 !mb-2">
                        <span className="!text-3xl !font-bold !text-gray-900">
                          {formatPrice(currentPrice)}
                        </span>
                        {discountPercentage > 0 && (
                          <>
                            <span className="!text-xl !text-gray-400 !line-through">
                              {formatPrice(product.mrpPrice)}
                            </span>
                            <span className="!bg-red-100 !text-red-800 !px-2 !py-1 !rounded-full !text-sm !font-bold">
                              {discountPercentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="!text-gray-600 !text-base !leading-relaxed !mb-6 !line-clamp-4">
                      {product.description || 'No description available.'}
                    </p>
                    <div className="!space-y-3 !mb-6 !text-sm">
                      <div className="!flex !justify-between">
                        <span className="!text-gray-600">Medium:</span>
                        <span className="!font-medium">{product.medium || 'Mixed Media'}</span>
                      </div>
                      <div className="!flex !justify-between">
                        <span className="!text-gray-600">Dimensions:</span>
                        <span className="!font-medium">
                          {product.dimensions?.height || 0} × {product.dimensions?.width || 0} cm
                        </span>
                      </div>
                    </div>

                    {/* Tags Section - Fixed Structure */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="!mb-6">
                        <h3 className="!font-bold !text-gray-900 !text-lg !mb-2">Tags</h3>
                        <div className="!flex !flex-wrap !gap-2">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="!bg-emerald-100 !text-emerald-800 !px-3 !py-1 !rounded-full !text-sm !font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
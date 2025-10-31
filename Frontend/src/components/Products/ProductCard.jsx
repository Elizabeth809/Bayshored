import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../others/LoadingSpinner';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Star, 
  Zap,
  Shield,
  Truck,
  X
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../others/clientApiUrl';

const ProductCard = ({ product }) => {
  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Check wishlist status when component mounts and when product changes
  useEffect(() => {
    if (isAuthenticated && product) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

  // Close quick view when clicking outside or pressing escape
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

  // Check if product is in wishlist
  const checkWishlistStatus = async () => {
    if (!isAuthenticated || !product) return;
    
    setCheckingWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/check/${product._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

  // --- Add to Wishlist Handler ---
  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      return;
    }

    // If already wishlisted, remove from wishlist
    if (isWishlisted) {
      await handleRemoveFromWishlist();
      return;
    }

    // Add to wishlist
    setAddingToWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id })
      });

      const data = await response.json();

      if (data.success) {
        updateWishlistCount(data.data.itemsCount);
        setIsWishlisted(true);
      } else {
        alert(data.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  // --- Remove from Wishlist Handler ---
  const handleRemoveFromWishlist = async () => {
    if (!isAuthenticated || !product) return;

    setAddingToWishlist(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        updateWishlistCount(data.data.itemsCount);
        setIsWishlisted(false);
      } else {
        alert(data.message || 'Failed to remove from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      alert('Failed to remove from wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });

      const data = await response.json();

      if (data.success) {
        updateCartCount(data.data.itemsCount);
        // Show success feedback
        const button = e.target;
        const originalText = button.innerHTML;
        const originalClass = button.className;
        button.innerHTML = '<span class="flex items-center !space-x-2"><span>✓</span><span>Added!</span></span>';
        button.className = originalClass.replace('from-blue-600 to-purple-600', 'from-green-600 to-green-700');
        setTimeout(() => {
          button.innerHTML = originalText;
          button.className = originalClass;
        }, 2000);
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

  const handleQuickViewAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  const hasActiveOffer = () => {
    return product.offer?.isActive === true;
  };

  const getCurrentPrice = () => {
    if (product.discountPrice && product.discountPrice < (product.mrpPrice || product.price)) {
      return product.discountPrice;
    }
    return product.mrpPrice || product.price;
  };

  const getStockStatus = () => {
    if (!product.stock && product.stock !== 0) return { text: 'In Stock', class: 'bg-green-100 text-green-800' };
    if (product.stock === 0) return { text: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    if (product.stock <= 5) return { text: 'Low Stock', class: 'bg-orange-100 text-orange-800' };
    if (product.stock <= 10) return { text: 'Limited Stock', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', class: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus();
  const discountPercentage = getDiscountPercentage();
  const currentPrice = getCurrentPrice();
  const mainImage = product.images?.[0] || product.image || '/api/placeholder/400/400';

  const handleQuickViewWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      return;
    }

    if (isWishlisted) {
      await handleRemoveFromWishlist();
    } else {
      await handleAddToWishlist(e);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group relative transform hover:-translate-y-1">
        {/* Badges Container */}
        <div className="absolute top-3 left-3 z-10 flex flex-col !space-y-2">
          {/* Featured Badge */}
          {product.featured && (
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white !px-3 !py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
              <Star size={12} className="!mr-1" fill="currentColor" />
              Featured
            </span>
          )}
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white !px-3 !py-1 rounded-full text-xs font-bold shadow-lg">
              {discountPercentage}% OFF
            </span>
          )}
          
          {/* Offer Badge */}
          {hasActiveOffer() && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white !px-3 !py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
              <Zap size={12} className="!mr-1" fill="currentColor" />
              Special Offer
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col !space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Wishlist Button */}
          <button
            onClick={handleAddToWishlist}
            disabled={addingToWishlist || checkingWishlist}
            className="!p-2 bg-white rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {addingToWishlist || checkingWishlist ? (
              <LoadingSpinner size="small" />
            ) : isWishlisted ? (
              <Heart className="text-red-500" fill="currentColor" size={18} />
            ) : (
              <Heart className="text-gray-600 hover:text-red-500" size={18} />
            )}
          </button>

          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickView(true);
            }}
            className="!p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
            title="Quick View"
          >
            <Eye className="text-gray-600 hover:text-blue-600" size={18} />
          </button>
        </div>

        {/* Product Image */}
        <Link to={`/product/${product.slug}`}>
          <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}
            
            <img
              src={mainImage}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                setImageLoaded(true);
              }}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Stock Overlay */}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white font-bold text-lg bg-red-600 !px-4 !py-2 rounded-lg">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Quick Add to Cart Overlay */}
            {product.stock > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent !p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full bg-white text-gray-900 !py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center !space-x-2"
                >
                  <ShoppingCart size={18} />
                  <span>{addingToCart ? 'Adding...' : 'Quick Add'}</span>
                </button>
              </div>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="!p-5">
          {/* Category & Artist */}
          <div className="flex items-center justify-between !mb-2">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 !px-2 !py-1 rounded-full">
              {product.category?.name || 'Uncategorized'}
            </span>
            <span className="text-xs text-gray-500 truncate ml-2">
              by {product.author?.name || 'Unknown Artist'}
            </span>
          </div>

          {/* Product Name */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors !mb-2 text-lg leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Medium & Dimensions */}
          <div className="flex items-center justify-between text-sm text-gray-600 !mb-3">
            <span className="truncate">{product.medium || 'Mixed Media'}</span>
            <span className="text-xs bg-gray-100 !px-2 !py-1 rounded">
              {product.dimensions?.height || 0} × {product.dimensions?.width || 0} cm
            </span>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between !mb-3">
            <div className="flex items-baseline !space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {discountPercentage > 0 && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.mrpPrice)}
                </span>
              )}
            </div>
            
            {/* Stock Status */}
            <span className={`!px-2 !py-1 rounded-full text-xs font-medium ${stockStatus.class}`}>
              {stockStatus.text}
            </span>
          </div>

          {/* Primary Add to Cart Button */}
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white !py-3 !px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center !space-x-2"
            >
              {addingToCart ? (
                <>
                  <LoadingSpinner size="small" className="!mr-2" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 !py-3 !px-4 rounded-xl cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center !space-x-2"
            >
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center !p-4 animate-fadeIn"
          onClick={() => setShowQuickView(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setShowQuickView(false)}
                className="absolute top-4 right-4 !p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 !p-8">
                {/* Image Section */}
                <div className="relative">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                      }}
                    />
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-gray-900 !mb-2">{product.name}</h2>
                  <p className="text-blue-600 !mb-4">by {product.author?.name || 'Unknown Artist'}</p>
                  
                  <div className="!mb-4">
                    <div className="flex items-baseline !space-x-2 !mb-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(currentPrice)}
                      </span>
                      {discountPercentage > 0 && (
                        <>
                          <span className="text-xl text-gray-400 line-through">
                            {formatPrice(product.mrpPrice)}
                          </span>
                          <span className="bg-red-100 text-red-800 !px-2 !py-1 rounded-full text-sm font-bold">
                            {discountPercentage}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <span className={`!px-3 !py-1 rounded-full text-sm font-medium ${stockStatus.class}`}>
                      {stockStatus.text}
                    </span>
                  </div>

                  <div className="!space-y-3 !mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medium:</span>
                      <span className="font-medium">{product.medium || 'Mixed Media'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">
                        {product.dimensions?.height || 0} × {product.dimensions?.width || 0}
                        {product.dimensions?.depth > 0 && ` × ${product.dimensions.depth}`} cm
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category?.name || 'Uncategorized'}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed !mb-6">
                    {product.description || 'No description available.'}
                  </p>

                  <div className="flex !space-x-3 mt-auto">
                    <button
                      onClick={handleQuickViewAddToCart}
                      disabled={addingToCart || product.stock === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center !space-x-2"
                    >
                      <ShoppingCart size={18} />
                      <span>
                        {addingToCart ? 'Adding...' : 
                         product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </span>
                    </button>
                    <button
                      onClick={handleQuickViewWishlist}
                      disabled={addingToWishlist}
                      className="!px-4 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center"
                      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      {addingToWishlist ? (
                        <LoadingSpinner size="small" />
                      ) : isWishlisted ? (
                        <Heart className="text-red-500" fill="currentColor" size={20} />
                      ) : (
                        <Heart className="text-gray-600" size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProductCard;
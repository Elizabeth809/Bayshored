import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../others/LoadingSpinner';
import { Heart } from 'lucide-react';
import { CLIENT_BASE_URL } from '../others/clientApiUrl';

const ProductCard = ({ product }) => {
  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);

  // Check wishlist status when component mounts and when product changes
  useEffect(() => {
    if (isAuthenticated && product) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group relative">
      {/* Wishlist Button */}
      <button
        onClick={handleAddToWishlist}
        disabled={addingToWishlist || checkingWishlist}
        className="absolute top-3 right-3 !p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 disabled:opacity-50"
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {addingToWishlist || checkingWishlist ? (
          <LoadingSpinner size="small" />
        ) : isWishlisted ? (
          <Heart className="text-red-500" fill="currentColor" size={20} />
        ) : (
          <Heart className="text-gray-400 hover:text-red-500" size={20} />
        )}
      </button>

      <Link to={`/product/${product.slug}`}>
        <div className="aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <div className="!p-4">
          <div className="!mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 !mt-1">{product.author?.name}</p>
          </div>

          <div className="flex items-center justify-between !mb-3">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-500">
              {product.dimensions?.height} × {product.dimensions?.width} cm
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 !mb-3">
            <span>{product.medium}</span>
            <span className={`!px-2 py-1 rounded-full text-xs ${
              product.stock > 10 
                ? 'bg-green-100 text-green-800' 
                : product.stock > 0 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className="w-full bg-blue-600 text-white !py-2 !px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
          >
            {addingToCart ? (
              <>
                <LoadingSpinner size="small" className="!mr-2" />
                Adding...
              </>
            ) : product.stock > 0 ? (
              'Add to Cart'
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
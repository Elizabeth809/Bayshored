import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isAuthenticated, token, updateWishlistCount, updateCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, navigate]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setWishlist(data.data);
        updateWishlistCount(data.data.itemsCount);
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
      } else {
        alert(data.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove from wishlist');
    } finally {
      setUpdating(false);
    }
  };

  const moveToCart = async (product) => {
    setUpdating(true);
    try {
      // Add to cart
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
        // Remove from wishlist after successful add to cart
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
        }
      } else {
        alert(cartData.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error moving to cart:', error);
      alert('Failed to move to cart');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-16 text-center">
          <div className="text-gray-400 !mb-4">
            <svg className="!mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 !mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 !mb-8">Save your favorite artworks here!</p>
          <Link
            to="/store"
            className="bg-blue-600 text-white !px-6 !py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
          <p className="text-gray-600 !mt-2">{wishlist.itemsCount} items saved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.items.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group relative">
              {/* Remove from Wishlist Button */}
              <button
                onClick={() => removeFromWishlist(product._id)}
                disabled={updating}
                className="absolute top-3 right-3 !p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 disabled:opacity-50"
                title="Remove from Wishlist"
              >
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <Link to={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              
              <div className="!p-4">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors !mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 !mb-2">by {product.author?.name}</p>
                </Link>

                <div className="flex items-center justify-between !mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.dimensions?.height} × {product.dimensions?.width} cm
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 !mb-4">
                  <span>{product.medium}</span>
                  <span className={`!px-2 !py-1 rounded-full text-xs ${
                    product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => moveToCart(product)}
                    disabled={updating || product.stock === 0}
                    className="flex-1 bg-blue-600 text-white !py-2 !px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
                  >
                    {updating ? 'Moving...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
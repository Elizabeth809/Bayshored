import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Import CartContext
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const Cart = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const { 
    items, 
    cartItemsCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart
  } = useCart(); // Use CartContext instead of local state
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Initialize cart from server
    initializeCart();
  }, [isAuthenticated, navigate]);

  const initializeCart = async () => {
    try {
      setLoading(true);
      // Fetch cart data directly since CartContext might not be initialized yet
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // CartContext will handle the state update via its own useEffect
        // We just need to ensure it's loaded
        console.log('Cart initialized from server');
      } else {
        console.error('Cart API error:', data.message);
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(true);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    setUpdating(true);
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(error.message || 'Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    setUpdating(true);
    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert(error.message || 'Failed to clear cart');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate current price based on discount logic
  const getCurrentPrice = (product) => {
    if (!product) return 0;
    
    // Check if product has offer and discount price
    if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return product.discountPrice;
    }
    return product.mrpPrice || product.price || 0;
  };

  // Calculate discount percentage
  const getDiscountPercentage = (product) => {
    if (!product || !product.mrpPrice || !product.discountPrice) return 0;
    
    if (product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const formatPrice = (price) => {
    if (isNaN(price) || price === null || price === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Calculate cart totals
  const calculateTotals = () => {
    if (!items || items.length === 0) {
      return { subtotal: 0, shippingCost: 0, finalTotal: 0 };
    }

    const subtotal = items.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);

    const shippingCost = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const finalTotal = subtotal + shippingCost;

    return {
      subtotal,
      shippingCost,
      finalTotal
    };
  };

  const { subtotal, shippingCost, finalTotal } = calculateTotals();
  const isEmpty = !items || items.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-16 text-center">
          <div className="text-gray-400 !mb-4">
            <svg className="!mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 !mb-4">Your cart is empty</h2>
          <p className="text-gray-600 !mb-8">Add some amazing artworks to get started!</p>
          <Link
            to="/store"
            className="bg-gray-600 text-white !px-6 !py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center !mb-8">
          <h1 className="text-3xl font-bold text-gray-900 !mb-4 lg:!mb-0">Shopping Cart</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClearCart}
              disabled={updating}
              className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 font-medium cursor-pointer"
            >
              {updating ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const product = item.product || {};
                  const currentPrice = getCurrentPrice(product);
                  const discountPercentage = getDiscountPercentage(product);
                  const itemTotal = currentPrice * item.quantity;
                  const mainImage = product.images?.[0] || product.image || '/placeholder-image.jpg';

                  return (
                    <div key={item._id || product._id} className="!p-6 flex flex-col sm:flex-row items-start sm:items-center !space-y-4 sm:!space-y-0 sm:!space-x-6">
                      <Link 
                        to={`/product/${product.slug}`}
                        className="flex-shrink-0"
                      >
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          <Link 
                            to={`/product/${product.slug}`} 
                            className="hover:text-gray-700 transition-colors"
                          >
                            {product.name || 'Unknown Product'}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          by {product.author?.name || 'Unknown Artist'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">{product.medium || ''}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {product.dimensions?.height || ''} × {product.dimensions?.width || ''} cm
                        </p>
                        
                        {/* Price display */}
                        <div className="flex items-center !space-x-2 !mt-3">
                          {discountPercentage > 0 ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(currentPrice)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(product.mrpPrice)}
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 !px-2 !py-1 rounded-full font-bold">
                                {discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(currentPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto !space-x-6">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(product._id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                            className="!px-3 !py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 rounded-l-lg"
                          >
                            -
                          </button>
                          <span className="!px-4 !py-2 border-l border-r border-gray-300 min-w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(product._id, item.quantity + 1)}
                            disabled={updating || item.quantity >= (product.stock || 1)}
                            className="!px-3 !py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 rounded-r-lg"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-28">
                          <p className="font-semibold text-gray-900 text-lg">
                            {formatPrice(itemTotal)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">
                              {formatPrice(currentPrice)} each
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(product._id)}
                          disabled={updating}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors !p-2 rounded-lg disabled:opacity-50 cursor-pointer"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 !p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 !mb-6">Order Summary</h2>

              <div className="!space-y-4 !mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartItemsCount} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost > 0 ? formatPrice(shippingCost) : (
                      <span className="text-gray-600 font-bold">FREE</span>
                    )}
                  </span>
                </div>
                {shippingCost > 0 && subtotal < 100 && (
                  <div className="text-sm text-gray-600 bg-gray-50 !p-3 rounded-lg">
                    🚚 Add ${formatPrice(100 - subtotal).replace('$', '')} more for free shipping!
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 !pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gray-900">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="!space-y-3">
                <Link
                  to="/checkout"
                  className="block w-full bg-gray-600 text-white !py-3 !px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium text-center shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/store"
                  className="block w-full text-center bg-gray-100 text-gray-900 !py-3 !px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
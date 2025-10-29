import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import {
  ChevronRight,
  Heart,
  HeartOff,
  Minus,
  Plus,
  ShieldCheck,
  Undo2,
  Gift
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products/slug/${slug}`);
      const data = await response.json();
      if (data.success) setProduct(data.data);
      else setError('Product not found');
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

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

  // --- Add to Cart Handler ---
  const handleAddToCart = async () => {
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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity }),
      });

      const data = await response.json();
      if (data.success) {
        updateCartCount(data.data.itemsCount);
        alert('Added to cart!');
      } else {
        alert(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // --- Add to Wishlist Handler ---
  const handleAddToWishlist = async () => {
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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id }),
      });

      const data = await response.json();
      if (data.success) {
        updateWishlistCount(data.data.itemsCount);
        setIsWishlisted(true);
      } else {
        alert(data.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
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

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 !mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/store"
            className="bg-blue-600 text-white !px-6 !py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Breadcrumb */}
        <nav className="flex !mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center !space-x-4 text-gray-500">
            <li>
              <Link to="/" className="hover:text-gray-700">Home</Link>
            </li>
            <ChevronRight size={16} />
            <li>
              <Link to="/store" className="hover:text-gray-700">Store</Link>
            </li>
            <ChevronRight size={16} />
            <li>
              <span className="text-gray-700">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* Product Detail Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 !p-8">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden !mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="!mb-6">
                <h1 className="text-3xl font-bold text-gray-900 !mb-2">{product.name}</h1>
                <Link
                  to={`/artist/${product.author?._id}`}
                  className="text-xl text-blue-600 hover:text-blue-800 transition-colors"
                >
                  by {product.author?.name}
                </Link>
              </div>

              <div className="!mb-6">
                <p className="text-3xl font-bold text-gray-900 !mb-4">
                  {formatPrice(product.price)}
                </p>
                <span
                  className={`!px-3 !py-1 rounded-full text-sm ${
                    product.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : product.stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4 !mb-6 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Medium:</span>
                  <p className="text-gray-600">{product.medium}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Dimensions:</span>
                  <p className="text-gray-600">
                    {product.dimensions?.height} × {product.dimensions?.width}
                    {product.dimensions?.depth > 0 && ` × ${product.dimensions.depth}`} cm
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Category:</span>
                  <p className="text-gray-600">{product.category?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">SKU:</span>
                  <p className="text-gray-600">{product.slug}</p>
                </div>
              </div>

              {/* Description */}
              <div className="!mb-6">
                <h3 className="font-medium text-gray-900 !mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Add to Cart Section */}
              <div className="border-t border-gray-200 !pt-6">
                {product.stock > 0 ? (
                  <div className="!space-y-4">
                    <div className="flex items-center !space-x-4">
                      <label className="font-medium text-gray-900">Quantity:</label>
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          className="!px-3 !py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="!px-4 !py-2 border-l border-r border-gray-300">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            setQuantity((prev) => Math.min(product.stock, prev + 1))
                          }
                          className="!px-3 !py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">Max: {product.stock}</span>
                    </div>

                    <div className="flex !space-x-4">
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="flex-1 bg-blue-600 text-white !py-3 !px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {addingToCart ? (
                          <>
                            <LoadingSpinner size="small" className="!mr-2" /> Adding...
                          </>
                        ) : (
                          'Add to Cart'
                        )}
                      </button>

                      <button
                        onClick={handleAddToWishlist}
                        disabled={addingToWishlist || checkingWishlist}
                        className="flex items-center justify-center !px-6 !py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        {addingToWishlist || checkingWishlist ? (
                          <LoadingSpinner size="small" />
                        ) : isWishlisted ? (
                          <Heart className="text-red-500" fill="currentColor" size={22} />
                        ) : (
                          <Heart className="text-red-500" size={22} />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-red-600 font-medium !mb-4">
                      This product is currently out of stock
                    </p>
                    <button
                      onClick={handleAddToWishlist}
                      disabled={addingToWishlist || checkingWishlist}
                      className="bg-gray-600 text-white !py-3 !px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center mx-auto"
                    >
                      {addingToWishlist || checkingWishlist ? (
                        <LoadingSpinner size="small" className="!mr-2" />
                      ) : null}
                      Notify When Available
                    </button>
                  </div>
                )}
              </div>

              {/* Extra Info */}
              <div className="!mt-6 !pt-6 border-t border-gray-200 text-sm text-gray-600 !space-y-1">
                <p className="flex items-center gap-2"><ShieldCheck size={16} /> Free shipping worldwide</p>
                <p className="flex items-center gap-2"><Undo2 size={16} /> 30-day return policy</p>
                <p className="flex items-center gap-2"><Gift size={16} /> Ready to hang with certificate of authenticity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Info Section */}
        {product.author && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-8 !mt-8">
            <h2 className="text-2xl font-bold text-gray-900 !mb-6">About the Artist</h2>
            <div className="flex items-start !space-x-6">
              {product.author.profileImage && (
                <img
                  src={product.author.profileImage}
                  alt={product.author.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 !mb-2">
                  {product.author.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.author.bio || 'No biography available for this artist.'}
                </p>
                <Link
                  to={`/artist/${product.author._id}`}
                  className="inline-block !mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all works by {product.author.name} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
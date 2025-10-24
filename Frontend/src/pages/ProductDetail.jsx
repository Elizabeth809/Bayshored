import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/others/LoadingSpinner';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { addToCart, items } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/products/slug/${slug}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setError('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
  };

  const handleAddToWishlist = () => {
    // TODO: Implement wishlist functionality
    alert('Wishlist functionality coming soon!');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getCartQuantity = () => {
    const cartItem = items.find(item => item._id === product?._id);
    return cartItem ? cartItem.quantity : 0;
  };

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
          <p className="text-gray-600 !mb-8">The product you're looking for doesn't exist.</p>
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
          <ol className="flex items-center !space-x-4">
            <li>
              <Link to="/" className="text-gray-400 hover:text-gray-500">Home</Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link to="/store" className="text-gray-400 hover:text-gray-500">Store</Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-500">{product.name}</span>
            </li>
          </ol>
        </nav>

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
                
                <div className="flex items-center !space-x-4 text-sm text-gray-600 !mb-4">
                  <span className={`!px-3 !py-1 rounded-full ${
                    product.stock > 10 
                      ? 'bg-green-100 text-green-800' 
                      : product.stock > 0 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                  {getCartQuantity() > 0 && (
                    <span className="text-blue-600">
                      {getCartQuantity()} in cart
                    </span>
                  )}
                </div>
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
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="!px-3 !py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          -
                        </button>
                        <span className="!px-4 !py-2 border-l border-r border-gray-300">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                          className="!px-3 !py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        Max: {product.stock}
                      </span>
                    </div>

                    <div className="flex !space-x-4">
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-blue-600 text-white !py-3 !px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={handleAddToWishlist}
                        className="flex items-center justify-center !px-6 !py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Add to Wishlist"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-red-600 font-medium !mb-4">This product is currently out of stock</p>
                    <button
                      onClick={handleAddToWishlist}
                      className="bg-gray-600 text-white !py-3 !px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Notify When Available
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="!mt-6 !pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>🛡️ Free shipping worldwide</p>
                  <p>↩️ 30-day return policy</p>
                  <p>🎁 Ready to hang with certificate of authenticity</p>
                </div>
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
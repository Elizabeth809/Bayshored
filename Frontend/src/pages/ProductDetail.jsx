import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Gift,
  X,
  ChevronLeft,
  ChevronRight as RightIcon,
  Search
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  
  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Related products states
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Filter states for related products
  const [filters, setFilters] = useState({
    category: product?.category?._id || '',
    author: product?.author?._id || '',
    sortBy: 'createdAt_desc',
    limit: 8
  });
  
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
      fetchFilterData();
    }
  }, [product, filters]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products/slug/${slug}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
        // Update filters with product data
        setFilters(prev => ({
          ...prev,
          category: data.data.category?._id || '',
          author: data.data.author?._id || ''
        }));
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        fetch(`${CLIENT_BASE_URL}/api/v1/categories`),
        fetch(`${CLIENT_BASE_URL}/api/v1/authors`)
      ]);

      const categoriesData = await categoriesRes.json();
      const authorsData = await authorsRes.json();

      if (categoriesData.success) setCategories(categoriesData.data);
      if (authorsData.success) setAuthors(authorsData.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    setLoadingRelated(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      // Exclude current product
      queryParams.append('exclude', product._id);

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setRelatedProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    } finally {
      setLoadingRelated(false);
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

  // Image gallery functions
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const navigateImage = (direction) => {
    const images = product.images || [product.image];
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateImage('prev');
      if (e.key === 'ArrowRight') navigateImage('next');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  const getDiscountPercentage = () => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const hasActiveOffer = () => {
    return product.offer?.isActive === true;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: product?.category?._id || '',
      author: product?.author?._id || '',
      sortBy: 'createdAt_desc',
      limit: 8
    });
    setSearchTerm('');
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

  const images = product.images || [product.image];
  const discountPercentage = getDiscountPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={() => navigateImage('prev')}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button
            onClick={() => navigateImage('next')}
            className="absolute right-16 text-white hover:text-gray-300 z-10"
          >
            <RightIcon size={32} />
          </button>

          <div className="max-w-4xl max-h-full !p-4">
            <img
              src={images[selectedImageIndex]}
              alt={`${product.name} - Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

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
              {/* Main Image */}
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden !mb-4 cursor-zoom-in"
                onClick={() => openLightbox(selectedImageIndex)}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
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
                <div className="flex items-center !space-x-4 !mb-2">
                  {product.discountPrice ? (
                    <>
                      <p className="text-3xl font-bold text-red-600">
                        {formatPrice(product.discountPrice)}
                      </p>
                      <p className="text-xl text-gray-400 line-through">
                        {formatPrice(product.mrpPrice)}
                      </p>
                      {discountPercentage > 0 && (
                        <span className="bg-red-100 text-red-800 !px-2 !py-1 rounded-full text-sm font-bold">
                          {discountPercentage}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {formatPrice(product.mrpPrice || product.price)}
                    </p>
                  )}
                </div>
                
                {hasActiveOffer() && (
                  <div className="bg-orange-100 text-orange-800 !px-3 !py-2 rounded-lg !mb-2">
                    <strong>Special Offer!</strong> {product.offer?.discountPercentage}% discount
                    {product.offer?.validUntil && ` until ${new Date(product.offer.validUntil).toLocaleDateString()}`}
                  </div>
                )}

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

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="!mb-6">
                  <h3 className="font-medium text-gray-900 !mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 !px-2 !py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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

        {/* Related Products Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-8 !mt-8">
          <div className="flex justify-between items-center !mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Related Artworks</h2>
            
            {/* Filters for Related Products */}
            <div className="flex items-center !space-x-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search related..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!pl-10 !pr-4 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>

              {/* Author Filter */}
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Artists</option>
                {authors.map(author => (
                  <option key={author._id} value={author._id}>{author.name}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="price_asc">Price Low to High</option>
                <option value="price_desc">Price High to Low</option>
                <option value="discount_desc">Highest Discount</option>
              </select>

              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingRelated ? (
            <div className="flex justify-center !py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter(product => 
                  searchTerm === '' || 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((relatedProduct) => (
                  <div key={relatedProduct._id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <Link to={`/product/${relatedProduct.slug}`}>
                      <div className="aspect-square bg-gray-200 overflow-hidden">
                        <img
                          src={relatedProduct.images?.[0] || relatedProduct.image}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="!p-4">
                        <h3 className="font-semibold text-gray-900 !mb-1 truncate">{relatedProduct.name}</h3>
                        <p className="text-gray-600 text-sm !mb-2">{relatedProduct.author?.name}</p>
                        <div className="flex items-center justify-between">
                          {relatedProduct.discountPrice ? (
                            <div className="flex items-center !space-x-2">
                              <span className="font-bold text-red-600">
                                {formatPrice(relatedProduct.discountPrice)}
                              </span>
                              <span className="text-gray-400 line-through text-sm">
                                {formatPrice(relatedProduct.mrpPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-gray-900">
                              {formatPrice(relatedProduct.mrpPrice || relatedProduct.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center !py-8 text-gray-500">
              No related products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
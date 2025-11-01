import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Undo2,
  Gift,
  X,
  ChevronLeft,
  ChevronRight as RightIcon,
  Search,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion

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
  const [slideDirection, setSlideDirection] = useState(1); // 1 for next, -1 for prev
  
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

  // NEW: Feedback state (replaces alerts)
  const [feedback, setFeedback] = useState({ active: false, message: '', type: 'success' });

  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();

  useEffect(() => {
    // Reset states on slug change
    setLoading(true);
    setProduct(null);
    setError('');
    setSelectedImageIndex(0);
    setQuantity(1);
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

  useEffect(() => {
    if (product) {
      // Set initial filters based on the product
      setFilters(prev => ({
        ...prev,
        category: product.category?._id || '', // <--- THIS WAS THE FIX
        author: product.author?._id || ''     // <--- THIS WAS THE FIX
      }));
      fetchFilterData();
    }
  }, [product]);

  // Fetch related products when filters change
  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product, filters]); // Re-fetch when filters change

  // --- NEW: Feedback Helper ---
  const showFeedback = (message, type = 'success') => {
    setFeedback({ active: true, message, type });
    setTimeout(() => {
      setFeedback({ active: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products/slug/${slug}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
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
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
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

  // --- Add to Cart Handler (NO ALERTS) ---
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login to add items to cart', 'error');
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
        showFeedback('Added to cart!');
      } else {
        showFeedback(data.message || 'Failed to add to cart', 'error');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      showFeedback('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  // --- Add to Wishlist Handler (NO ALERTS) ---
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login to add items to wishlist', 'error');
      return;
    }
    if (isWishlisted) {
      await handleRemoveFromWishlist();
      return;
    }
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
        showFeedback('Added to wishlist!');
      } else {
        showFeedback(data.message || 'Failed to add to wishlist', 'error');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      showFeedback('Failed to add to wishlist', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

  // --- Remove from Wishlist Handler (NO ALERTS) ---
  const handleRemoveFromWishlist = async () => {
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
        showFeedback('Removed from wishlist');
      } else {
        showFeedback(data.message || 'Failed to remove from wishlist', 'error');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      showFeedback('Failed to remove from wishlist', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

  // --- Image gallery functions ---
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const navigateImage = (direction) => {
    const images = product.images || [product.image];
    setSlideDirection(direction === 'next' ? 1 : -1);
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

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

  // --- Helper Functions ---
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

  // --- Framer Motion Variants for Lightbox ---
  const lightboxVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9
    }),
  };


  if (loading) {
    return (
      <div className="!min-h-screen !bg-neutral-50 !flex !items-center !justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="!min-h-screen !bg-neutral-50 !flex !items-center !justify-center font-playfair">
        <div className="!text-center">
          <h1 className="!text-3xl !font-bold !text-gray-900 !mb-4">Product Not Found</h1>
          <p className="!text-gray-600 !mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/store"
            className="!bg-green-700 !text-white !px-6 !py-3 !rounded-lg !hover:bg-green-800 !transition-colors !font-semibold"
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
    <div className="!min-h-screen !bg-neutral-50 font-playfair">
      {/* === NEW Lightbox Modal === */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            className="!fixed !inset-0 !bg-white/70 !backdrop-blur-md !z-50 !flex !items-center !justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="!absolute !top-6 !right-6 !text-gray-900 !hover:text-black !z-10 !p-2 !bg-white/50 !rounded-full !transition-colors"
            >
              <X size={32} />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
              className="!absolute !left-6 !text-gray-900 !hover:text-black !z-10 !p-2 !bg-white/50 !rounded-full !transition-colors"
            >
              <ChevronLeft size={40} />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
              className="!absolute !right-6 !text-gray-900 !hover:text-black !z-10 !p-2 !bg-white/50 !rounded-full !transition-colors"
            >
              <RightIcon size={40} />
            </button>

            <AnimatePresence initial={false} custom={slideDirection}>
              <motion.img
                key={selectedImageIndex}
                src={images[selectedImageIndex]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="!max-w-[90vw] !max-h-[90vh] !object-contain !shadow-2xl !rounded-lg"
                variants={lightboxVariants}
                custom={slideDirection}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing on image click
              />
            </AnimatePresence>

            <div className="!absolute !bottom-6 !left-1/2 !transform !-translate-x-1/2 !text-gray-900 !bg-white/50 !px-3 !py-1 !rounded-full !text-lg !font-semibold">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* === NEW Feedback Toast === */}
      <AnimatePresence>
        {feedback.active && (
          <motion.div
            className={`!fixed !bottom-6 !left-1/2 !-translate-x-1/2 !z-50 !flex !items-center !gap-2 !py-3 !px-5 !rounded-lg !shadow-lg ${
              feedback.type === 'success' ? '!bg-green-700 !text-white' : '!bg-red-600 !text-white'
            }`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <CheckCircle size={20} />
            <span className="!font-semibold">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Breadcrumb */}
        <nav className="!flex !mb-8" aria-label="Breadcrumb">
          <ol className="!flex !items-center !space-x-4 !text-gray-500">
            <li>
              <Link to="/" className="!hover:text-gray-900">Home</Link>
            </li>
            <li><ChevronRight size={16} /></li>
            <li>
              <Link to="/store" className="!hover:text-gray-900">Store</Link>
            </li>
            <li><ChevronRight size={16} /></li>
            <li>
              <span className="!text-gray-800 !font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* Product Detail Section */}
        <div className="!bg-white !rounded-2xl !shadow-xl !overflow-hidden">
          <div className="!grid !grid-cols-1 lg:!grid-cols-2">
            {/* Product Images */}
            <div className="!p-6 sm:!p-8">
              {/* Main Image */}
              <div 
                className="!aspect-square !bg-neutral-100 !rounded-lg !overflow-hidden !mb-4 !cursor-zoom-in !relative !group"
                onClick={() => openLightbox(selectedImageIndex)}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="!w-full !h-full !object-contain !transition-transform !duration-300 !group-hover:scale-105"
                />
                <div className="!absolute !inset-0 !bg-black/5 !opacity-0 !group-hover:opacity-100 !transition-opacity !flex !items-center !justify-center">
                  <Search size={48} className="!text-white" />
                </div>
              </div>
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="!grid !grid-cols-5 !gap-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`!aspect-square !bg-neutral-100 !rounded-md !overflow-hidden !cursor-pointer !border-2 !transition-all ${
                        selectedImageIndex === index ? '!border-green-700 !shadow-md' : '!border-transparent !opacity-70 !hover:opacity-100'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="!w-full !h-full !object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="!p-6 sm:!p-8 !border-l !border-gray-100">
              <div className="!mb-6">
                <h1 className="!text-4xl !font-bold !text-gray-900 !mb-2">{product.name}</h1>
                <Link
                  to={`/artist/${product.author?._id}`}
                  className="font-parisienne !text-3xl !text-green-700 !hover:text-green-800 !transition-colors"
                >
                  by {product.author?.name}
                </Link>
              </div>

              <div className="!mb-6">
                <div className="!flex !items-baseline !space-x-3 !mb-2">
                  {product.discountPrice ? (
                    <>
                      <p className="!text-4xl !font-bold !text-gray-900">
                        {formatPrice(product.discountPrice)}
                      </p>
                      <p className="!text-2xl !text-gray-400 !line-through">
                        {formatPrice(product.mrpPrice)}
                      </p>
                      {discountPercentage > 0 && (
                        <span className="!bg-green-100 !text-green-800 !px-3 !py-1 !rounded-full !text-sm !font-bold">
                          {discountPercentage}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="!text-4xl !font-bold !text-gray-900">
                      {formatPrice(product.mrpPrice || product.price)}
                    </p>
                  )}
                </div>
                
                <span
                  className={`!px-3 !py-1 !rounded-full !text-sm !font-semibold ${
                    product.stock > 10
                      ? '!bg-green-100 !text-green-800'
                      : product.stock > 0
                      ? '!bg-yellow-100 !text-yellow-800'
                      : '!bg-red-100 !text-red-800'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Product Details */}
              <div className="!space-y-3 !mb-6 !text-base">
                <div className="!flex">
                  <span className="!font-semibold !text-gray-900 !w-28 !flex-shrink-0">Medium:</span>
                  <p className="!text-gray-600">{product.medium}</p>
                </div>
                <div className="!flex">
                  <span className="!font-semibold !text-gray-900 !w-28 !flex-shrink-0">Dimensions:</span>
                  <p className="!text-gray-600">
                    {product.dimensions?.height} × {product.dimensions?.width}
                    {product.dimensions?.depth > 0 && ` × ${product.dimensions.depth}`} cm
                  </p>
                </div>
                <div className="!flex">
                  <span className="!font-semibold !text-gray-900 !w-28 !flex-shrink-0">Category:</span>
                  <p className="!text-gray-600">{product.category?.name}</p>
                </div>
              </div>

              {/* Description */}
              <div className="!mb-6">
                <h3 className="!font-bold !text-gray-900 !text-lg !mb-2">Description</h3>
                <p className="!text-gray-600 !leading-relaxed !whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="!mb-6">
                  <h3 className="!font-bold !text-gray-900 !text-lg !mb-2">Tags</h3>
                  <div className="!flex !flex-wrap !gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="!bg-neutral-100 !text-gray-700 !px-3 !py-1 !rounded-full !text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart Section */}
              <div className="!border-t !border-gray-100 !pt-6">
                {product.stock > 0 ? (
                  <div className="!space-y-4">
                    <div className="!flex !items-center !space-x-4">
                      <label className="!font-semibold !text-gray-900">Quantity:</label>
                      <div className="!flex !items-center !border !border-gray-300 !rounded-lg">
                        <button
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          className="!px-3 !py-3 !text-gray-600 !hover:text-black !transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="!px-5 !py-2 !border-l !border-r !border-gray-300 !font-semibold !text-lg">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            setQuantity((prev) => Math.min(product.stock, prev + 1))
                          }
                          className="!px-3 !py-3 !text-gray-600 !hover:text-black !transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="!flex !space-x-4">
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="!flex-1 !bg-green-700 !text-white !py-3 !px-6 !rounded-lg !hover:bg-green-800 !transition-colors !font-semibold !disabled:bg-gray-400 !disabled:cursor-not-allowed !flex !items-center !justify-center !gap-2"
                      >
                        {addingToCart ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <ShoppingCart size={20} />
                        )}
                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                      </button>

                      <button
                        onClick={handleAddToWishlist}
                        disabled={addingToWishlist || checkingWishlist}
                        className={`!flex !items-center !justify-center !px-5 !py-3 !border-2 !rounded-lg !transition-colors !disabled:opacity-50 ${
                          isWishlisted
                            ? '!border-green-700 !bg-green-50'
                            : '!border-gray-300 !hover:bg-neutral-50'
                        }`}
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        {addingToWishlist || checkingWishlist ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <Heart className={`!text-green-700 ${isWishlisted ? '!fill-current' : ''}`} size={22} />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="!text-left">
                    <p className="!text-red-600 !font-semibold !text-lg !mb-4">
                      This artwork is currently sold out.
                    </p>
                  </div>
                )}
              </div>

              {/* Extra Info */}
              <div className="!mt-6 !pt-6 !border-t !border-gray-100 !text-sm !text-gray-600 !space-y-2">
                <p className="!flex !items-center !gap-2"><ShieldCheck size={16} className="!text-green-700" /> Free shipping worldwide</p>
                <p className="!flex !items-center !gap-2"><Undo2 size={16} className="!text-green-700" /> 30-day return policy</p>
                <p className="!flex !items-center !gap-2"><Gift size={16} className="!text-green-700" /> Ready to hang with certificate of authenticity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Info Section */}
        {product.author && (
          <div className="!bg-white !rounded-2xl !shadow-xl !p-8 !mt-8">
            <h2 className="font-playfair !text-3xl !font-bold !text-gray-900 !mb-6">About the Artist</h2>
            <div className="!flex !flex-col sm:!flex-row !items-start !space-y-4 sm:!space-y-0 sm:!space-x-6">
              {product.author.profileImage && (
                <img
                  src={product.author.profileImage}
                  alt={product.author.name}
                  className="!w-32 !h-32 !rounded-full !object-cover !border-4 !border-white !shadow-lg"
                />
              )}
              <div>
                <h3 className="font-parisienne !text-4xl !font-bold !text-gray-900 !mb-2">
                  {product.author.name}
                </h3>
                <p className="!text-gray-600 !leading-relaxed !line-clamp-3">
                  {product.author.bio || 'No biography available for this artist.'}
                </p>
                <Link
                  to={`/artist/${product.author._id}`}
                  className="!inline-block !mt-4 !text-green-700 !hover:text-green-800 !font-semibold"
                >
                  View all works by {product.author.name} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related Products Section */}
        <div className="!bg-white !rounded-2xl !shadow-xl !p-8 !mt-8">
          <div className="!flex !flex-wrap !justify-between !items-center !gap-4 !mb-6">
            <h2 className="font-playfair !text-3xl !font-bold !text-gray-900">Related Artworks</h2>
            
            {/* Filters for Related Products */}
            <div className="!flex !flex-wrap !items-center !gap-3">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="!px-3 !py-2 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-green-600 !focus:border-green-600"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>

              <select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="!px-3 !py-2 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-green-600 !focus:border-green-600"
              >
                <option value="">All Artists</option>
                {authors.map(author => (
                  <option key={author._id} value={author._id}>{author.name}</option>
                ))}
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="!px-3 !py-2 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-green-600 !focus:border-green-600"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="price_asc">Price Low to High</option>
                <option value="price_desc">Price High to Low</option>
              </select>
            </div>
          </div>
          
          {/* Note: Search bar removed for cleaner filter UI, logic is still present if you want to add it back */}

          {loadingRelated ? (
            <div className="!flex !justify-center !py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4 !gap-6">
              {/* Using a simple card design here as ProductCard component is not provided */}
              {relatedProducts
                .filter(product => 
                  searchTerm === '' || 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((relatedProduct) => (
                  <div key={relatedProduct._id} className="!bg-neutral-50 !rounded-lg !overflow-hidden !hover:shadow-lg !transition-shadow !border !border-neutral-100">
                    <Link to={`/product/${relatedProduct.slug}`} className="!block">
                      <div className="!aspect-[4/5] !bg-neutral-100 !overflow-hidden">
                        <img
                          src={relatedProduct.images?.[0] || relatedProduct.image}
                          alt={relatedProduct.name}
                          className="!w-full !h-full !object-cover !hover:scale-105 !transition-transform !duration-300"
                        />
                      </div>
                      <div className="!p-4 !text-center">
                        <h3 className="font-playfair !font-semibold !text-gray-900 !mb-1 !truncate">{relatedProduct.name}</h3>
                        <p className="font-parisienne !text-gray-600 !text-lg !mb-2">{relatedProduct.author?.name}</p>
                        <div className="!flex !items-center !justify-center !space-x-2">
                          {relatedProduct.discountPrice ? (
                            <>
                              <span className="!font-bold !text-lg !text-gray-900">
                                {formatPrice(relatedProduct.discountPrice)}
                              </span>
                              <span className="!text-gray-400 !line-through !text-sm">
                                {formatPrice(relatedProduct.mrpPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="!font-bold !text-lg !text-gray-900">
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
            <div className="!text-center !py-8 !text-gray-500">
              No related products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
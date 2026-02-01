// src/pages/ProductDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import ProductCard from '../components/Products/ProductCard';
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
  Check,
  MessageCircle,
  Mail,
  Phone,
  User,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Palette,
  Maximize2
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-900">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Flower decoration component
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
  </svg>
);

// Corner decoration
const CornerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill="currentColor" />
  </svg>
);

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, updateCartCount, updateWishlistCount } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);
  
  // Related products states
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Ask for Price states
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    message: '',
    budget: '',
    purpose: 'personal'
  });

  // Feedback state
  const [feedback, setFeedback] = useState({ active: false, message: '', type: 'success' });

  // Scroll animations
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Generate floating petals
  const petals = Array.from({ length: 10 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 10,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  // Animation variants
  const textReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
    })
  };

  const lineAnimation = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1, 
      transition: { duration: 1, ease: "easeInOut" } 
    }
  };

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setError('');
    setSelectedImageIndex(0);
    setQuantity(1);
    setImageLoaded(false);
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
    }
  }, [product]);

  // Feedback Helper
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

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    setLoadingRelated(true);
    try {
      const queryParams = new URLSearchParams();
      if (product.category?._id) queryParams.append('category', product.category._id);
      queryParams.append('limit', '4');
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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login first', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      showFeedback('Added to cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showFeedback('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      showFeedback('Please login first', 'error');
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
        showFeedback('Added to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      showFeedback('Failed to add', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

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
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleAskForPrice = () => {
    setIsInquiryModalOpen(true);
  };

  const handleInquiryFormChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    
    if (!inquiryForm.fullName.trim() || !inquiryForm.email.trim() || !inquiryForm.mobile.trim()) {
      showFeedback('Please fill required fields', 'error');
      return;
    }

    setSubmittingInquiry(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products/${product._id}/price-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm),
      });

      const data = await response.json();
      if (data.success) {
        showFeedback('Inquiry submitted successfully');
        setIsInquiryModalOpen(false);
        setInquiryForm({
          fullName: '', email: '', mobile: '', message: '', budget: '', purpose: 'personal'
        });
      } else {
        showFeedback(data.message || 'Failed to submit', 'error');
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      showFeedback('Failed to submit', 'error');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Image gallery functions
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
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

  // Helper Functions
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const getDiscountPercentage = () => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  // Lightbox variants
  const lightboxVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border border-gray-900/20 flex items-center justify-center"
        >
          <div className="w-8 h-8 border-t border-gray-900" />
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8">
            <FlowerDecor className="w-10 h-10 text-gray-900/20" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-900/60 mb-8">
            The artwork you're looking for doesn't exist.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-gray-900 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Collection
              <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const images = product.images || [product.image];
  const discountPercentage = getDiscountPercentage();
  const isSoldOut = product.stock === 0;

  return (
    <div ref={containerRef} className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={i} {...petal} />
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close button */}
            <motion.button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
            {/* Navigation */}
            <motion.button
              onClick={() => navigateImage('prev')}
              className="absolute left-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              onClick={() => navigateImage('next')}
              className="absolute right-6 w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 transition-colors z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RightIcon className="w-5 h-5" />
            </motion.button>

            {/* Image */}
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={selectedImageIndex}
                className="max-w-[85vw] max-h-[85vh] relative"
                variants={lightboxVariants}
                custom={slideDirection}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={`${product.name} - ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain"
                />
                
                {/* Corner decorations */}
                <div className="absolute top-4 left-4">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute top-4 right-4 rotate-90">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute bottom-4 left-4 -rotate-90">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
                <div className="absolute bottom-4 right-4 rotate-180">
                  <CornerDecor className="w-6 h-6 text-gray-900/10" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <span className="text-sm text-gray-900/60">
                {selectedImageIndex + 1} / {images.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask for Price Modal */}
      <AnimatePresence>
        {isInquiryModalOpen && (
          <motion.div
            className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInquiryModalOpen(false)}
          >
            <motion.div
              className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-900/10">
                <div>
                  <h3 className="font-playfair text-2xl font-bold text-gray-900">
                    Request Price
                  </h3>
                  <p className="text-sm text-gray-900/50 mt-1">
                    We'll contact you with details
                  </p>
                </div>
                <button
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="w-10 h-10 border border-gray-900/10 flex items-center justify-center hover:border-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitInquiry} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="text"
                      name="fullName"
                      value={inquiryForm.fullName}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="email"
                      name="email"
                      value={inquiryForm.email}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone <span className="text-gray-900/40">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900/30" />
                    <input
                      type="tel"
                      name="mobile"
                      value={inquiryForm.mobile}
                      onChange={handleInquiryFormChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="Enter your phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={inquiryForm.budget}
                      onChange={handleInquiryFormChange}
                      className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                      placeholder="e.g., $500-$1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Purpose
                    </label>
                    <select
                      name="purpose"
                      value={inquiryForm.purpose}
                      onChange={handleInquiryFormChange}
                      className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors bg-white"
                    >
                      <option value="personal">Personal</option>
                      <option value="corporate">Corporate</option>
                      <option value="gift">Gift</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows="3"
                    value={inquiryForm.message}
                    onChange={handleInquiryFormChange}
                    className="w-full px-4 py-3 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors resize-none"
                    placeholder="Any additional details..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-900/10">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="flex-1 py-3 border border-gray-900/10 text-gray-900 font-medium hover:border-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submittingInquiry}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingInquiry ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.active && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-900/50 mb-8"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-gray-900 transition-colors">Collection</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </motion.nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div 
              className="relative aspect-[4/5] border border-gray-900/10 bg-gray-50 cursor-zoom-in group overflow-hidden"
              onClick={() => openLightbox(selectedImageIndex)}
            >
              {/* Loading skeleton */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-100">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}

              <motion.img
                src={images[selectedImageIndex]}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain transition-all duration-500 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Corner decorations */}
              <div className="absolute top-4 left-4">
                <CornerDecor className="w-6 h-6 text-gray-900/10" />
              </div>
              <div className="absolute top-4 right-4 rotate-90">
                <CornerDecor className="w-6 h-6 text-gray-900/10" />
              </div>
              <div className="absolute bottom-4 left-4 -rotate-90">
                <CornerDecor className="w-6 h-6 text-gray-900/10" />
              </div>
              <div className="absolute bottom-4 right-4 rotate-180">
                <CornerDecor className="w-6 h-6 text-gray-900/10" />
              </div>

              {/* Zoom icon */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <div className="w-14 h-14 bg-white border border-gray-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-5 h-5 text-gray-900" />
                </div>
              </motion.div>

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {discountPercentage > 0 && !product.askForPrice && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    {discountPercentage}% OFF
                  </span>
                )}
                {product.askForPrice && (
                  <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium">
                    Price on Request
                  </span>
                )}
                {isSoldOut && (
                  <span className="bg-white text-gray-900 px-3 py-1 text-xs font-medium border border-gray-900">
                    Sold Out
                  </span>
                )}
              </div>
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`aspect-square border cursor-pointer overflow-hidden transition-all ${
                      selectedImageIndex === index 
                        ? 'border-gray-900' 
                        : 'border-gray-900/10 opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Category & Title */}
            <div>
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px bg-gray-900 mb-6 origin-left"
              />

              <motion.span
                custom={0}
                variants={textReveal}
                className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-3"
              >
                {product.category?.name || 'Artwork'}
              </motion.span>

              <motion.h1
                custom={1}
                variants={textReveal}
                className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
              >
                {product.name}
              </motion.h1>

              {/* Artist */}
              <motion.div custom={2} variants={textReveal}>
                <Link
                  to={`/artist/${product.author?._id}`}
                  className="text-lg text-gray-900/60 hover:text-gray-900 transition-colors group"
                >
                  by{' '}
                  <span className="relative">
                    {product.author?.name || 'Unknown Artist'}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Price */}
            <motion.div 
              custom={3}
              variants={textReveal}
              className="py-6 border-y border-gray-900/10"
            >
              {product.askForPrice ? (
                <div>
                  <span className="font-playfair text-3xl font-bold text-gray-900">
                    Price on Request
                  </span>
                  <p className="text-sm text-gray-900/50 mt-2">
                    Contact us for pricing and availability
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-4">
                  <span className="font-playfair text-3xl font-bold text-gray-900">
                    {formatPrice(product.discountPrice || product.mrpPrice || product.price)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-xl text-gray-900/40 line-through">
                        {formatPrice(product.mrpPrice)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Stock status */}
              <div className="mt-4">
                <span className={`text-sm ${isSoldOut ? 'text-gray-900/50' : 'text-gray-900/70'}`}>
                  {isSoldOut ? 'Currently unavailable' : `${product.stock} in stock`}
                </span>
              </div>
            </motion.div>

            {/* Details */}
            <motion.div custom={4} variants={textReveal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs tracking-wide text-gray-900/40 uppercase">Medium</span>
                  <p className="text-gray-900 font-medium mt-1">{product.medium || 'Mixed Media'}</p>
                </div>
                <div>
                  <span className="text-xs tracking-wide text-gray-900/40 uppercase">Dimensions</span>
                  <p className="text-gray-900 font-medium mt-1">
                    {product.dimensions?.height} × {product.dimensions?.width}
                    {product.dimensions?.depth > 0 && ` × ${product.dimensions.depth}`} cm
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div custom={5} variants={textReveal}>
              <h3 className="text-xs tracking-wide text-gray-900/40 uppercase mb-3">Description</h3>
              <p className="text-gray-900/70 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </motion.div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <motion.div custom={6} variants={textReveal}>
                <h3 className="text-xs tracking-wide text-gray-900/40 uppercase mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 border border-gray-900/10 text-sm text-gray-900/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div 
              custom={7} 
              variants={textReveal}
              className="pt-6 border-t border-gray-900/10 space-y-4"
            >
              {!isSoldOut && (
                <>
                  {/* Quantity - Only for regular products */}
                  {!product.askForPrice && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-900/60">Quantity</span>
                      <div className="flex items-center border border-gray-900/10">
                        <button
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    {product.askForPrice ? (
                      <motion.button
                        onClick={handleAskForPrice}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Request Price
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {addingToCart ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </motion.button>
                    )}

                    <motion.button
                      onClick={handleAddToWishlist}
                      disabled={addingToWishlist || checkingWishlist}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 border flex items-center justify-center transition-all ${
                        isWishlisted 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-900/20 hover:border-gray-900'
                      }`}
                    >
                      {addingToWishlist || checkingWishlist ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {isSoldOut && (
                <div className="text-center py-8 border border-gray-900/10">
                  <p className="text-gray-900/60">This artwork is currently sold out</p>
                  <button
                    onClick={handleAddToWishlist}
                    className="mt-4 text-sm font-medium text-gray-900 underline underline-offset-4"
                  >
                    Add to wishlist for updates
                  </button>
                </div>
              )}
            </motion.div>

            {/* Benefits */}
            <motion.div 
              custom={8} 
              variants={textReveal}
              className="space-y-3 pt-6 border-t border-gray-900/10"
            >
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>Free worldwide shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <Undo2 className="w-4 h-4" strokeWidth={1.5} />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/60">
                <Gift className="w-4 h-4" strokeWidth={1.5} />
                <span>Certificate of authenticity included</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Artist Section */}
        {product.author && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 pt-16 border-t border-gray-900/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <FlowerDecor className="w-6 h-6 text-gray-900/20" />
              <span className="text-xs tracking-[0.3em] text-gray-900/50 uppercase">The Artist</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {product.author.profileImage && (
                <div className="lg:col-span-3">
                  <div className="aspect-square border border-gray-900/10 overflow-hidden">
                    <img
                      src={product.author.profileImage}
                      alt={product.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className={`${product.author.profileImage ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                <h3 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
                  {product.author.name}
                </h3>
                <p className="text-gray-900/60 leading-relaxed mb-6 line-clamp-3">
                  {product.author.bio || 'No biography available for this artist.'}
                </p>
                <Link
                  to={`/artist/${product.author._id}`}
                  className="inline-flex items-center gap-2 text-gray-900 font-medium group"
                >
                  <span className="relative">
                    View all works by {product.author.name}
                    <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Related Products */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 pt-16 border-t border-gray-900/10"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px bg-gray-900 mx-auto mb-6"
            />
            <span className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-3">
              You May Also Like
            </span>
            <h2 className="font-playfair text-3xl font-bold text-gray-900">
              Related Artworks
            </h2>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] border border-gray-900/10 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={relatedProduct} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FlowerDecor className="w-12 h-12 text-gray-900/10 mx-auto mb-4" />
              <p className="text-gray-900/50">No related artworks found</p>
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-gray-900 font-medium group"
              >
                <span className="relative">
                  Browse Full Collection
                  <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </motion.section>
      </div>

      {/* Bottom decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-gray-900/10 mx-auto my-16"
      />
    </div>
  );
};

export default ProductDetail;
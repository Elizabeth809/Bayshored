// src/pages/Authors/AuthorDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/others/LoadingSpinner';
import ProductCard from '../../components/Products/ProductCard';
import { 
  Mail, 
  ExternalLink, 
  Instagram, 
  Facebook, 
  Twitter,
  ArrowLeft,
  MapPin,
  Calendar,
  Award,
  Palette,
  ArrowRight
} from 'lucide-react';
import { CLIENT_BASE_URL } from '../../components/others/clientApiUrl';
import { motion, useScroll, useTransform } from 'framer-motion';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop&q=80';

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

const AuthorDetail = () => {
  const { authorId } = useParams();
  const [author, setAuthor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 8,
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

  // Data Fetching
  useEffect(() => {
    const fetchAuthorDetails = async () => {
      setLoadingAuthor(true);
      setError('');
      try {
        const response = await fetch(`${CLIENT_BASE_URL}/api/v1/authors/${authorId}`);
        const data = await response.json();
        if (data.success) {
          setAuthor(data.data);
        } else {
          setError(data.message || 'Author not found');
        }
      } catch (err) {
        console.error('Error fetching author details:', err);
        setError('Failed to load author details.');
      } finally {
        setLoadingAuthor(false);
      }
    };
    fetchAuthorDetails();
  }, [authorId]);

  useEffect(() => {
    if (author) {
      const fetchAuthorProducts = async () => {
        setLoadingProducts(true);
        try {
          const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?author=${authorId}`);
          const data = await response.json();
          if (data.success) {
            setProducts(data.data);
          } else {
            setProducts([]);
          }
        } catch (err) {
          console.error('Error fetching author products:', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchAuthorProducts();
    } else {
      setLoadingProducts(false);
      setProducts([]);
    }
  }, [author, authorId]);

  // Loading State
  if (loadingAuthor) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
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
  if (error || !author) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 border border-gray-900/10 flex items-center justify-center mx-auto mb-8">
            <FlowerDecor className="w-10 h-10 text-gray-900/20" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
            Artist Not Found
          </h2>
          <p className="text-gray-900/60 mb-8">
            {error || 'The requested artist could not be found.'}
          </p>
          <Link 
            to="/artists" 
            className="inline-flex items-center gap-2 text-gray-900 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Back to Artists
              <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
            </span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
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

      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 pt-8"
      >
        <Link 
          to="/artists" 
          className="inline-flex items-center gap-3 text-gray-900/60 hover:text-gray-900 transition-colors group"
        >
          <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center group-hover:border-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Artists</span>
        </Link>
      </motion.div>

      {/* Hero Section */}
      <motion.section 
        style={{ y: headerY, opacity: headerOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative">
              {/* Main Image */}
              <div className="relative border border-gray-900/10 overflow-hidden">
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
                  src={imageUrl}
                  alt={author.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                    setImageLoaded(true);
                  }}
                  className={`w-full h-[300px] object-cover transition-opacity duration-700 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2 }}
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

                {/* Flower decorations */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute top-8 left-8"
                >
                  <FlowerDecor className="w-8 h-8 text-gray-900/10" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute bottom-8 right-8"
                >
                  <FlowerDecor className="w-8 h-8 text-gray-900/10" />
                </motion.div>
              </div>

              {/* Image caption */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 mt-4"
              >
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="w-8 h-px bg-gray-900/30 origin-left"
                />
                <span className="text-xs text-gray-900/40 tracking-wide">Portrait</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-10"
          >
            {/* Name & Title */}
            <div>
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px bg-gray-900 mb-6 origin-left"
              />

              <motion.span
                custom={0}
                variants={textReveal}
                className="text-sm tracking-[0.3em] text-gray-900/50 uppercase block mb-4"
              >
                Artist
              </motion.span>

              <motion.h1
                custom={1}
                variants={textReveal}
                className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
              >
                {author.name}
              </motion.h1>

              {/* Location */}
              {author.location && (
                <motion.div
                  custom={2}
                  variants={textReveal}
                  className="flex items-center gap-2 text-gray-900/50"
                >
                  <MapPin className="w-4 h-4" strokeWidth={1.5} />
                  <span>{author.location}</span>
                </motion.div>
              )}
            </div>

            {/* Stats */}
            <motion.div
              custom={3}
              variants={textReveal}
              className="flex flex-wrap gap-8 py-8 border-y border-gray-900/10"
            >
              {products.length > 0 && (
                <div>
                  <span className="font-playfair text-3xl font-bold text-gray-900">
                    {products.length}
                  </span>
                  <span className="text-sm text-gray-900/50 ml-2">Artworks</span>
                </div>
              )}
              {author.experience && (
                <>
                  <div className="w-px h-12 bg-gray-900/10" />
                  <div>
                    <span className="font-playfair text-3xl font-bold text-gray-900">
                      {author.experience}+
                    </span>
                    <span className="text-sm text-gray-900/50 ml-2">Years</span>
                  </div>
                </>
              )}
              {author.awards && (
                <>
                  <div className="w-px h-12 bg-gray-900/10" />
                  <div>
                    <span className="font-playfair text-3xl font-bold text-gray-900">
                      {author.awards}
                    </span>
                    <span className="text-sm text-gray-900/50 ml-2">Awards</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Biography */}
            <motion.div custom={4} variants={textReveal}>
              <h2 className="text-sm tracking-[0.2em] text-gray-900/50 uppercase mb-4">
                Biography
              </h2>
              <p className="text-gray-900/70 text-lg leading-relaxed whitespace-pre-wrap">
                {author.bio || "No biography provided for this artist."}
              </p>
            </motion.div>

            {/* Specialty */}
            {author.specialty && (
              <motion.div custom={5} variants={textReveal}>
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-900/40" strokeWidth={1.5} />
                  <span className="text-gray-900/60">Specializes in</span>
                  <span className="text-gray-900 font-medium">{author.specialty}</span>
                </div>
              </motion.div>
            )}

            {/* Contact & Social */}
            <motion.div
              custom={6}
              variants={textReveal}
              className="space-y-4 pt-6 border-t border-gray-900/10"
            >
              <h2 className="text-sm tracking-[0.2em] text-gray-900/50 uppercase mb-4">
                Connect
              </h2>

              <div className="flex flex-wrap gap-4">
                {author.email && (
                  <motion.a
                    href={`mailto:${author.email}`}
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-900/10 hover:border-gray-900 transition-colors group"
                  >
                    <Mail className="w-4 h-4 text-gray-900/50 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">{author.email}</span>
                  </motion.a>
                )}

                {author.website && (
                  <motion.a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-900/10 hover:border-gray-900 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-900/50 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    <span className="text-sm text-gray-900">Website</span>
                  </motion.a>
                )}
              </div>

              {/* Social Icons */}
              {(author.socialMedia?.instagram || author.socialMedia?.facebook || author.socialMedia?.twitter) && (
                <div className="flex items-center gap-3 pt-4">
                  {author.socialMedia?.instagram && (
                    <motion.a
                      href={author.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 border border-gray-900/10 flex items-center justify-center hover:border-gray-900 hover:bg-gray-900 group transition-all"
                    >
                      <Instagram className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </motion.a>
                  )}
                  {author.socialMedia?.facebook && (
                    <motion.a
                      href={author.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 border border-gray-900/10 flex items-center justify-center hover:border-gray-900 hover:bg-gray-900 group transition-all"
                    >
                      <Facebook className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </motion.a>
                  )}
                  {author.socialMedia?.twitter && (
                    <motion.a
                      href={author.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 border border-gray-900/10 flex items-center justify-center hover:border-gray-900 hover:bg-gray-900 group transition-all"
                    >
                      <Twitter className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </motion.a>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Artworks Section */}
      <section className="relative z-10 border-t border-gray-900/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px bg-gray-900 mx-auto mb-8"
            />

            <span className="text-sm tracking-[0.3em] text-gray-900/50 uppercase block mb-4">
              Collection
            </span>

            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Artworks by {author.name}
            </h2>

            {/* Decorative element */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px bg-gray-900/20 origin-right"
              />
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="w-2 h-2 border border-gray-900/30"
              />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-12 h-px bg-gray-900/20 origin-left"
              />
            </div>
          </motion.div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-[4/5] border border-gray-900/10 relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-20 h-20 border border-gray-900/10 mb-6"
              >
                <Palette className="w-8 h-8 text-gray-900/30" strokeWidth={1} />
              </motion.div>
              <p className="text-gray-900/60 text-lg">
                No artworks available at the moment.
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="w-16 h-px bg-gray-900/10 mx-auto mt-6"
              />
            </motion.div>
          )}

          {/* View More Link */}
          {products.length > 6 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <Link
                to={`/products?author=${authorId}`}
                className="group inline-flex items-center gap-3 text-gray-900"
              >
                <span className="relative font-medium">
                  View All Artworks
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom Decorative Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 border-t border-gray-900/10 py-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <FlowerDecor className="w-8 h-8 text-gray-900/10" />
              <div>
                <p className="text-gray-900/40 text-sm">Explore more artists</p>
                <p className="text-gray-900 font-medium">Discover our curated collection</p>
              </div>
            </div>

            <Link
              to="/artists"
              className="group flex items-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 border border-gray-900 px-6 py-3 hover:bg-gray-900 group transition-colors"
              >
                <span className="font-medium text-gray-900 group-hover:text-white transition-colors">
                  Browse All Artists
                </span>
                <ArrowRight className="w-4 h-4 text-gray-900 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Final decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="w-32 h-px bg-gray-900/10 mx-auto mt-12"
        />
      </motion.section>
    </div>
  );
};

export default AuthorDetail;
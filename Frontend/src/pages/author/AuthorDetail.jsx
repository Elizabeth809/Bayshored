import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/others/LoadingSpinner'; // Adjust path
import ProductCard from '../../components/Products/ProductCard'; // Adjust path
import { Mail, Link as LinkIcon, Instagram, Facebook, Twitter } from 'lucide-react';
import { CLIENT_BASE_URL } from '../../components/others/clientApiUrl';
import { motion } from 'framer-motion';

// Using a neutral placeholder
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400/e0e0e0/b0b0b0?text=Artist';

const AuthorDetail = () => {
  const { authorId } = useParams();
  const [author, setAuthor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Function to generate random dots for the background
  const generateDots = () => {
    const dots = [];
    const numDots = 20; // Number of dots
    for (let i = 0; i < numDots; i++) {
      const size = Math.random() * 20 + 10;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = Math.random() * 4 + 4;
      dots.push(
        <div
          key={i}
          className="animated-dot"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        ></div>
      );
    }
    return dots;
  };

  // --- Data Fetching (No changes) ---
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
            console.warn('Failed to fetch products for author:', data.message);
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
  
  // --- Loading and Error States (No major changes) ---
  if (loadingAuthor) {
    return (
      <div className="!min-h-[70vh] !flex !justify-center !items-center !bg-neutral-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="!min-h-[70vh] !flex !justify-center !items-center !text-center !p-4 !bg-neutral-50 font-playfair">
        <div>
          <h2 className="!text-3xl !font-bold !text-red-700 !mb-4">Error Loading Artist</h2>
          <p className="!text-gray-700 !mb-6">{error || 'The requested artist could not be found.'}</p>
          <Link to="/artists" className="!text-green-700 !hover:underline !text-lg !transition-colors">
            &larr; Back to Artists List
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  // --- NEW ARTISTIC LAYOUT ---
  return (
    <div className="!min-h-screen !bg-neutral-50 !relative !overflow-hidden">
      {/* Animated Background Dots */}
      <div className="!absolute !inset-0 !w-full !h-full !pointer-events-none !z-0">
        {generateDots()}
      </div>

      {/* Main Content Container */}
      <div className="!relative !z-10 !max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-16 sm:!py-24">
        {/* Two-column layout grid */}
        <div className="!grid !grid-cols-1 lg:!grid-cols-3 lg:!gap-16">

          {/* === LEFT (STICKY) COLUMN === */}
          <motion.div
            className="lg:!col-span-1 lg:!sticky lg:!top-24 !self-start !text-center lg:!text-left !mb-12 lg:!mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Artist Portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="!relative !inline-block"
            >
              <img
                src={imageUrl}
                alt={author.name}
                className="!w-56 !h-56 lg:!w-72 lg:!h-72 !object-cover !rounded-2xl !shadow-2xl !border-4 !border-white !bg-gray-100"
                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE }}
              />
              {/* Green glow effect */}
              <div className="!absolute !inset-0 !-m-2 !rounded-2xl !bg-green-300/30 !mix-blend-multiply !filter !blur-lg !-z-10"></div>
            </motion.div>

            {/* Artist Signature (Name) */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-parisienne !text-6xl !font-bold !text-gray-900 !mt-8 !mb-6"
            >
              {author.name}
            </motion.h1>

            {/* Social & Contact Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="!flex !flex-col !items-center lg:!items-start !gap-y-4 !text-base font-playfair !text-gray-600"
            >
              {author.email && (
                <a href={`mailto:${author.email}`} className="!flex !items-center !gap-2 !hover:text-green-700 !transition-colors !duration-300">
                  <Mail size={20} className="!text-green-500 !flex-shrink-0" /> {author.email}
                </a>
              )}
              {author.website && (
                <a href={author.website} target="_blank" rel="noopener noreferrer" className="!flex !items-center !gap-2 !hover:text-green-700 !transition-colors !duration-300">
                  <LinkIcon size={20} className="!text-green-500 !flex-shrink-0" /> Visit Website
                </a>
              )}
              {/* Social Icons */}
              <div className="!flex !items-center !gap-x-4 !pt-2">
                {author.socialMedia?.instagram && (
                  <a href={author.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="!text-gray-500 !hover:text-pink-600 !transition-colors !duration-300" title="Instagram">
                    <Instagram size={24} />
                  </a>
                )}
                {author.socialMedia?.facebook && (
                  <a href={author.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="!text-gray-500 !hover:text-blue-700 !transition-colors !duration-300" title="Facebook">
                    <Facebook size={24} />
                  </a>
                )}
                {author.socialMedia?.twitter && (
                  <a href={author.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="!text-gray-500 !hover:text-sky-500 !transition-colors !duration-300" title="Twitter">
                    <Twitter size={24} />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* === RIGHT (SCROLLABLE) COLUMN === */}
          <motion.div
            className="lg:!col-span-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Biography Section */}
            <section className="!mb-16">
              <h2 className="font-playfair !text-4xl !font-bold !text-gray-900 !mb-6 !border-b-2 !border-green-200 !pb-3">
                Biography
              </h2>
              <p className="font-playfair !text-lg !text-gray-700 !leading-relaxed !whitespace-pre-wrap">
                {author.bio || "No biography provided for this artist."}
              </p>
            </section>

            {/* Artworks Section */}
            <section>
              {/* Artistic "Artworks" heading */}
              <h2 className="font-parisienne !text-6xl !font-bold !text-green-700 !mb-10 !text-center">
                Artworks
              </h2>

              {loadingProducts ? (
                <div className="!flex !justify-center !items-center !h-40 !p-8">
                  <LoadingSpinner />
                </div>
              ) : products.length > 0 ? (
                <div className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-8">
                  {products.map((product, index) => (
                    // Pass index for potential staggered animation in ProductCard
                    <ProductCard key={product._id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="font-playfair !text-center !text-gray-600 !bg-white !p-10 !rounded-lg !shadow-md !border !border-gray-100">
                  <p className="!text-lg">No artworks found for this artist at the moment.</p>
                </div>
              )}
            </section>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AuthorDetail;
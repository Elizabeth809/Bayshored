import React, { useState, useEffect } from 'react';
import AuthorCard from '../../components/Author/AuthorCard'; // Adjust path as needed
import LoadingSpinner from '../../components/others/LoadingSpinner'; // Adjust path as needed
import { CLIENT_BASE_URL } from '../../components/others/clientApiUrl';
import { motion } from 'framer-motion';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/authors`);
      const data = await response.json();

      if (data.success) {
        setAuthors(data.data);
      } else {
        setError(data.message || 'Failed to fetch authors');
      }
    } catch (err) {
      console.error('Error fetching authors:', err);
      setError('An error occurred while fetching authors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use an off-white background for the page
    <div className="!min-h-screen !bg-neutral-50 !py-16 sm:!py-24">
      <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
        
        {/* === Header Section === */}
        <motion.div
          className="!text-center !mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Artistic font in black */}
          <h1 className="font-parisienne !text-6xl sm:!text-7xl !font-bold !text-gray-900 !mb-4">
            Meet Our Artists
          </h1>
          {/* Elegant body font in dark gray */}
          <p className="font-playfair !text-xl !text-center !text-gray-600 !max-w-2xl !mx-auto">
            Discover the talented individuals behind the stunning artworks in our collection.
          </p>
        </motion.div>

        {/* === Content Section === */}
        {loading ? (
          <div className="!flex !justify-center !items-center !h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          // Error state remains red for clear UX
          <div className="font-playfair !text-center !text-red-700 !bg-red-50 !p-6 !rounded-lg !border !border-red-200">
            <p className="!text-lg">Error: {error}</p>
            <button
              onClick={fetchAuthors}
              className="!mt-4 !px-6 !py-2 !bg-red-600 !text-white !rounded-full !font-semibold !hover:bg-red-700 !transition-colors"
            >
              Retry
            </button>
          </div>
        ) : authors.length > 0 ? (
          <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 !gap-x-8 !gap-y-16">
            {authors.map((author, index) => (
              <AuthorCard key={author._id} author={author} index={index} />
            ))}
          </div>
        ) : (
          <div className="font-playfair !text-center !text-gray-500 !py-16 !text-lg">
            <p>No artists found at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Authors;
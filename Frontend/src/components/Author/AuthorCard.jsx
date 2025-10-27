import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Define a placeholder image URL (same as before)
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150?text=NA';

const AuthorCard = ({ author }) => {
  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  return (
    <Link to={`/artist/${author._id}`} className="block group">
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-center transition-all duration-300 ease-in-out hover:shadow-lg hover:border-blue-200"
        whileHover={{ y: -5 }} // Slight lift on hover
      >
        <div className="aspect-square bg-gray-100">
          <img
            src={imageUrl}
            alt={author.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 truncate">
            {author.name}
          </h3>
          {/* Optional: Add a short bio snippet if needed */}
          {/* <p className="text-sm text-gray-500 line-clamp-2 mt-1">{author.bio}</p> */}
        </div>
      </motion.div>
    </Link>
  );
};

export default AuthorCard;
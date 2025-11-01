import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Using a neutral placeholder
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x500/e0e0e0/b0b0b0?text=Artist';

const AuthorCard = ({ author, index }) => {
  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  // Animation variants for scroll-triggered fade-in
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: index * 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <Link to={`/artist/${author._id}`} className="!block !group">
        {/* Card container with white background and shadow */}
        <div className="!bg-white !rounded-lg !shadow-lg !overflow-hidden !transition-all !duration-300 !ease-in-out !hover:shadow-2xl !hover:-translate-y-1">
          
          {/* === Artist Image === */}
          <div className="!aspect-[4/5] !overflow-hidden">
            <img
              src={imageUrl}
              alt={author.name}
              className="!w-full !h-full !object-cover !transition-transform !duration-500 !ease-in-out !group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
            />
          </div>

          {/* === Text Content Area === */}
          <div className="!p-6 !text-center">
            {/* Name: Black by default, Green on hover */}
            <h3 className="font-playfair !text-2xl !font-bold !text-gray-900 !transition-colors !duration-300 !group-hover:text-green-700 !truncate">
              {author.name}
            </h3>
            
            {/* Subtitle: Hidden by default, fades in on hover */}
            <p className="font-parisienne !text-xl !text-green-700 !opacity-0 !transition-opacity !duration-300 !group-hover:opacity-100 !h-0 !group-hover:h-auto">
              View Artist
            </p>
          </div>
          
        </div>
      </Link>
    </motion.div>
  );
};

export default AuthorCard;
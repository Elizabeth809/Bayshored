import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Eye } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&h=500&fit=crop&auto=format&q=80';

const AuthorCard = ({ author, index }) => {
  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
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
      <Link to={`/artist/${author._id}`} className="block group">
        <div className="bg-white rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 relative">
          
          {/* Artist Image */}
          <div className=" overflow-hidden relative">
            <motion.img
              src={imageUrl}
              alt={author.name}
              className="w-full h-[300px] object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
            />
            
            {/* Overlay effect on hover */}
            <motion.div 
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                whileHover={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
              >
                <Eye className="w-6 h-6 text-gray-900" />
              </motion.div>
            </motion.div>
          </div>

          {/* Artist Info */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Palette className="w-5 h-5 text-gray-600" />
              </motion.div>
              <h3 className="text-xl font-medium text-gray-900 text-center truncate">
                {author.name}
              </h3>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Sparkles className="w-5 h-5 text-gray-600" />
              </motion.div>
            </div>

            {/* Specialization/Tags */}
            {author.categories && author.categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {author.categories.slice(0, 2).map((category, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {/* Bio Preview */}
            <p className="text-gray-600 text-center text-sm leading-relaxed line-clamp-2 mb-4">
              {author.bio || 'Contemporary artist creating stunning visual experiences'}
            </p>

            {/* View Profile Link */}
            <motion.div 
              className="flex items-center justify-center gap-2 text-gray-900 font-medium text-sm"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span>View Profile</span>
              <Eye className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Hover border effect */}
          <motion.div
            className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none"
            whileHover={{ borderColor: 'rgba(17, 24, 39, 0.1)' }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </Link>
    </motion.div>
  );
};

export default AuthorCard;
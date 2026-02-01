// src/components/home/ArtistCard.jsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { CLIENT_BASE_URL } from "../others/clientApiUrl";

const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${CLIENT_BASE_URL}${url}`;
};

// Small flower decoration
const FlowerDecor = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
  </svg>
);

const ArtistCard = ({ author, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const img = resolveMediaUrl(author?.profileImage);

  // Default bio if none provided
  const defaultBio = "A passionate artist dedicated to creating meaningful works that inspire and connect with audiences worldwide.";
  const artistBio = author?.bio || defaultBio;
  
  // Truncate bio to 2 lines (approximately 80-100 characters)
  const truncatedBio = artistBio.length > 100 
    ? artistBio.substring(0, 100).trim() + "..." 
    : artistBio;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/4] overflow-hidden border border-gray-900/10">
        {/* Image with zoom effect */}
        <motion.div
          className="absolute inset-0"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {img ? (
            <img
              src={img}
              alt={author?.name || "Artist"}
              className="h-[250px] w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
          )}
        </motion.div>

        {/* Subtle overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Corner flower decorations */}
        <motion.div
          className="absolute top-4 left-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            scale: isHovered ? 1 : 0,
            rotate: isHovered ? 0 : -90
          }}
          transition={{ duration: 0.4 }}
        >
          <FlowerDecor className="w-6 h-6 text-white/60" />
        </motion.div>

        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            scale: isHovered ? 1 : 0,
            rotate: isHovered ? 0 : 90
          }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FlowerDecor className="w-6 h-6 text-white/60" />
        </motion.div>

        {/* Animated inner border on hover */}
        <motion.div
          className="absolute inset-4 border border-white/40 pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            scale: isHovered ? 1 : 0.9 
          }}
          transition={{ duration: 0.4 }}
        />

        {/* View Profile button - appears on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                to={`/artist/${author?._id}`}
                className="group/btn relative"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center gap-2 bg-white px-6 py-3 text-gray-900 font-medium"
                >
                  <span>View Profile</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom line animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-white origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Artist Info - Below image */}
      <div className="mt-5">
        {/* Name with animated underline */}
        <div className="relative inline-block">
          <motion.h3
            className="font-playfair text-xl font-bold text-gray-900"
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {author?.name || "Unknown Artist"}
          </motion.h3>
          <motion.div
            className="absolute -bottom-1 left-0 h-px bg-gray-900 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Artist Bio - 2 lines */}
        <motion.p
          className="mt-3 text-sm text-gray-900/60 leading-relaxed line-clamp-2"
          animate={{ x: isHovered ? 5 : 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {truncatedBio}
        </motion.p>

        {/* Location */}
        {author?.location && (
          <motion.div
            className="flex items-center gap-2 mt-3 text-gray-900/40"
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <MapPin className="w-3 h-3" strokeWidth={1.5} />
            <span className="text-xs">{author.location}</span>
          </motion.div>
        )}

        {/* Stats on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-900/10">
                <div>
                  <span className="text-lg font-playfair font-bold text-gray-900">
                    {author?.artworksCount || 24}
                  </span>
                  <span className="text-xs text-gray-900/40 ml-1">Works</span>
                </div>
                <div className="w-px h-4 bg-gray-900/10" />
                <div>
                  <span className="text-lg font-playfair font-bold text-gray-900">
                    {author?.experience || 5}
                  </span>
                  <span className="text-xs text-gray-900/40 ml-1">Years</span>
                </div>
                {author?.awards && (
                  <>
                    <div className="w-px h-4 bg-gray-900/10" />
                    <div>
                      <span className="text-lg font-playfair font-bold text-gray-900">
                        {author.awards}
                      </span>
                      <span className="text-xs text-gray-900/40 ml-1">Awards</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ArtistCard;
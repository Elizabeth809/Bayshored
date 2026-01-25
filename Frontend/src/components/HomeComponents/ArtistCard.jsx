// src/components/home/ArtistCard.jsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Palette, Award, MapPin, Sparkles, Star, Eye } from "lucide-react";
import { useState } from "react";
import { CLIENT_BASE_URL } from "../others/clientApiUrl";

const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${CLIENT_BASE_URL}${url}`;
};

const ArtistCard = ({ author, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const img = resolveMediaUrl(author?.profileImage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-[500px] overflow-hidden cursor-pointer"
    >
      {/* Main Image Container */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Background Image */}
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.6 }}
        >
          {img ? (
            <img
              src={img}
              alt={author?.name || "Artist"}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600" />
          )}
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Animated pattern overlay */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%',
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Top Corner Badge - Always Visible */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3 + index * 0.1, type: "spring", bounce: 0.6 }}
          className="absolute top-4 right-4 z-20"
        >
          <motion.div
            animate={{
              rotate: isHovered ? [0, 5, -5, 0] : 0,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold px-4 py-2 rounded-full shadow-2xl border-2 border-white/50 backdrop-blur-sm flex items-center gap-2"
          >
            <Star className="fill-white" size={16} />
            <span className="text-sm">Featured</span>
          </motion.div>
        </motion.div>

        {/* Artist Name - Always Visible at Bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 z-10"
          animate={{
            y: isHovered ? 0 : 0,
          }}
        >
          <motion.h3
            className="font-playfair text-3xl font-bold text-white mb-2"
            animate={{
              y: isHovered ? -10 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {author?.name || "Unknown Artist"}
          </motion.h3>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: isHovered ? '100%' : '60px' }}
            transition={{ duration: 0.5 }}
            className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full"
          />
        </motion.div>

        {/* Hover Content - Details */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col justify-end p-6 z-20"
            >
              {/* Specialty */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <Palette className="text-emerald-300" size={20} />
                </div>
                <span className="font-parisienne text-xl text-emerald-200">
                  Contemporary Artist
                </span>
              </motion.div>

              {/* Location */}
              {author?.location && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <MapPin className="text-cyan-300" size={20} />
                  </div>
                  <span className="text-white/90 font-medium">{author.location}</span>
                </motion.div>
              )}

              {/* Bio */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                {author?.bio || "Discover unique artworks, inspiration, and the artist's creative journey. Specializing in contemporary fine art with a focus on nature and emotion."}
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-3 gap-3 mb-4"
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-lg">24</div>
                  <div className="text-white/70 text-xs font-semibold">Artworks</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-lg">5</div>
                  <div className="text-white/70 text-xs font-semibold">Years</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-lg">12</div>
                  <div className="text-white/70 text-xs font-semibold">Awards</div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to={`/artist/${author?._id}`}
                  className="group/btn relative inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white px-6 py-4 font-bold text-emerald-900 overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <Eye size={20} />
                    View Full Profile
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight size={20} />
                    </motion.div>
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Sparkles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 15}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <Sparkles className="text-yellow-300" size={20} />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Shimmer effect on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 z-10"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ArtistCard;
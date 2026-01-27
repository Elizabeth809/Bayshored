// src/components/home/ArtistRail.jsx
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useScroll } from "framer-motion";
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Sparkles, 
  Star,
  TrendingUp,
  Award,
  Palette
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import ArtistCard from "./ArtistCard";

const ArtistRail = ({ 
  title, 
  subtitle, 
  loading, 
  authors = [], 
  viewAllHref = "/artists" 
}) => {
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredButton, setHoveredButton] = useState(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      return () => scrollEl.removeEventListener('scroll', checkScroll);
    }
  }, [authors]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Floating particles animation
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5
  }));

  return (
    <motion.div 
      ref={containerRef}
      style={{ opacity }}
      className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-white"
    >
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          style={{ y: y1 }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-48 -left-48 w-96 h-96  rounded-full blur-3xl"
        />
        
        <motion.div
          style={{ y: y2 }}
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-48 -right-48 w-96 h-96  rounded-full blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 w-64 h-64  rounded-full blur-2xl"
        />

        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full "
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      <div className="relative p-8 sm:p-10 lg:p-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1"
          >
            {/* Icon and Title */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <Users className="text-white" size={32} />
                </div>
                {/* Rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-400/50"
                />
                {/* Pulsing glow */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl"
                />
              </motion.div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
                    {title}
                  </h2>
                  <motion.div
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="text-yellow-500 drop-shadow-lg" size={32} />
                  </motion.div>
                </div>
                
                {/* Animated underline */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-full mt-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  />
                </motion.div>
              </div>
            </div>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-gray-700 text-lg sm:text-xl font-medium ml-20 flex items-center gap-2"
            >
              <Award className="text-emerald-600" size={20} />
              {subtitle}
            </motion.p>

            {/* Stats Badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap gap-3 mt-4 ml-20"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg flex items-center gap-2"
              >
                <TrendingUp className="text-emerald-600" size={16} />
                <span className="text-sm font-semibold text-gray-700">
                  {authors?.length || 0}+ Artists
                </span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg flex items-center gap-2"
              >
                <Star className="text-yellow-500 fill-yellow-500" size={16} />
                <span className="text-sm font-semibold text-gray-700">Premium Quality</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg flex items-center gap-2"
              >
                <Palette className="text-pink-600" size={16} />
                <span className="text-sm font-semibold text-gray-700">Verified</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* View All Button - Desktop */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <Link
              to={viewAllHref}
              className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-4 font-bold text-white shadow-2xl shadow-emerald-500/50 overflow-hidden"
              onMouseEnter={() => setHoveredButton('viewAll')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600"
                initial={{ x: '-100%' }}
                animate={{ x: hoveredButton === 'viewAll' ? '0%' : '-100%' }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              <span className="relative z-10 text-lg">View All Artists</span>
              <motion.div
                className="relative z-10"
                animate={{ x: hoveredButton === 'viewAll' ? [0, 5, 0] : 0 }}
                transition={{ duration: 1.5, repeat: hoveredButton === 'viewAll' ? Infinity : 0 }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>

              {/* Ripple effect on hover */}
              {hoveredButton === 'viewAll' && (
                <motion.span
                  className="absolute inset-0 rounded-2xl border-2 border-white/50"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </Link>
          </motion.div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {!loading && authors?.length > 0 && (
            <>
              {/* Left Button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: canScrollLeft ? 1 : 0.3,
                  x: canScrollLeft ? 0 : -10
                }}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredButton('left')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className="relative">
                  {/* Main button */}
                  <div className="w-16 h-16 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-emerald-200 flex items-center justify-center group-hover:bg-emerald-50 transition-all duration-300">
                    <ChevronLeft 
                      className="text-emerald-700 group-hover:-translate-x-1 transition-transform duration-300" 
                      size={32} 
                    />
                  </div>
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl"
                    animate={{ 
                      scale: hoveredButton === 'left' ? [1, 1.3, 1] : 1,
                      opacity: hoveredButton === 'left' ? [0.5, 0.8, 0.5] : 0
                    }}
                    transition={{ duration: 1.5, repeat: hoveredButton === 'left' ? Infinity : 0 }}
                  />
                  
                  {/* Ripple */}
                  {hoveredButton === 'left' && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.button>

              {/* Right Button */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: canScrollRight ? 1 : 0.3,
                  x: canScrollRight ? 0 : 10
                }}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredButton('right')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <div className="relative">
                  {/* Main button */}
                  <div className="w-16 h-16 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-emerald-200 flex items-center justify-center group-hover:bg-emerald-50 transition-all duration-300">
                    <ChevronRight 
                      className="text-emerald-700 group-hover:translate-x-1 transition-transform duration-300" 
                      size={32} 
                    />
                  </div>
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl"
                    animate={{ 
                      scale: hoveredButton === 'right' ? [1, 1.3, 1] : 1,
                      opacity: hoveredButton === 'right' ? [0.5, 0.8, 0.5] : 0
                    }}
                    transition={{ duration: 1.5, repeat: hoveredButton === 'right' ? Infinity : 0 }}
                  />
                  
                  {/* Ripple */}
                  {hoveredButton === 'right' && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.button>
            </>
          )}

          {/* Cards Container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth gap-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading ? (
              // Enhanced Loading Skeletons
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="w-[350px] flex-shrink-0"
                  >
                    <div className="h-[500px] rounded-2xl bg-gradient-to-br from-emerald-100/50 via-green-100/50 to-teal-100/50 relative overflow-hidden border-2 border-emerald-200/30">
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.2
                        }}
                      />
                      
                      {/* Pulsing elements */}
                      <div className="absolute top-4 left-4 right-4">
                        <motion.div 
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-20 h-20 rounded-full bg-emerald-200/50"
                        />
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 space-y-3">
                        <motion.div 
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                          className="h-6 bg-emerald-200/50 rounded-lg w-3/4"
                        />
                        <motion.div 
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                          className="h-4 bg-emerald-200/50 rounded-lg w-1/2"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : authors?.length ? (
              <div className="flex gap-1">
                {authors.map((artist, idx) => (
                  <motion.div
                    key={artist?._id || idx}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: idx * 0.1,
                      ease: "easeOut"
                    }}
                    className="w-[350px] flex-shrink-0"
                  >
                    <ArtistCard author={artist} index={idx} />
                  </motion.div>
                ))}
              </div>
            ) : (
              // Enhanced Empty State
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full py-24 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-6 shadow-xl relative"
                >
                  <Users className="text-emerald-600" size={48} />
                  
                  {/* Rotating ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-3xl border-4 border-dashed border-emerald-300/50"
                  />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Artists Yet</h3>
                <p className="text-gray-600 text-lg font-medium">
                  Stay tuned! Amazing artists are coming soon.
                </p>
                
                {/* Decorative dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                      className="w-3 h-3 rounded-full bg-emerald-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 lg:hidden"
        >
          <Link
            to={viewAllHref}
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-4 font-bold text-white shadow-2xl shadow-emerald-500/50 overflow-hidden w-full"
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <span className="relative z-10 text-lg">View All Artists</span>
            <motion.div
              className="relative z-10"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-6 w-6" />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Smooth scroll snap for better UX */
        @media (min-width: 640px) {
          .scrollbar-hide {
            scroll-snap-type: x mandatory;
          }
          
          .scrollbar-hide > div > div {
            scroll-snap-align: start;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ArtistRail;
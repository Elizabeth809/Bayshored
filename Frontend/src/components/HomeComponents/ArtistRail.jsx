// src/components/home/ArtistRail.jsx
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Users,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import ArtistCard from "./ArtistCard";

// Flower Petal Component
const FlowerPetal = ({ delay, duration, startX, startY, size, rotation }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: `${startY}%` }}
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{
      opacity: [0, 0.6, 0.6, 0],
      scale: [0, 1, 1, 0.5],
      rotate: [0, rotation, rotation + 180, rotation + 360],
      y: [0, 100, 200, 300],
      x: [0, 30, -20, 40],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-gray-900/10"
    >
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
      <path
        d="M12 12C12 12 16 10 18 10C20 10 22 12 22 12C22 12 20 14 18 14C16 14 12 12 12 12Z"
        fill="currentColor"
      />
      <path
        d="M12 12C12 12 14 16 14 18C14 20 12 22 12 22C12 22 10 20 10 18C10 16 12 12 12 12Z"
        fill="currentColor"
      />
      <path
        d="M12 12C12 12 8 10 6 10C4 10 2 12 2 12C2 12 4 14 6 14C8 14 12 12 12 12Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating Leaf Component
const FloatingLeaf = ({ delay, startX }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20 }}
    animate={{
      opacity: [0, 0.3, 0.3, 0],
      y: [-20, 400, 800],
      x: [0, 50, -30, 80],
      rotate: [0, 45, -45, 90],
    }}
    transition={{
      duration: 15,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-900/10">
      <path
        d="M17 8C17 8 12 2 6 2C6 8 12 14 12 14C12 14 18 8 17 8Z"
        fill="currentColor"
      />
      <path
        d="M12 14L12 22"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  </motion.div>
);

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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const lineWidth = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

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

  // Generate flower petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    duration: 12 + Math.random() * 5,
    startX: Math.random() * 100,
    startY: Math.random() * 30,
    size: 16 + Math.random() * 16,
    rotation: Math.random() * 360,
  }));

  // Generate floating leaves
  const leaves = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 3,
    startX: 10 + i * 15,
  }));

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
      transition: { duration: 1.2, ease: "easeInOut" } 
    }
  };

  return (
    <motion.section 
      ref={containerRef}
      className="relative overflow-hidden bg-white py-24"
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Flower Petals Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FlowerPetal key={i} {...petal} />
        ))}
        {leaves.map((leaf, i) => (
          <FloatingLeaf key={`leaf-${i}`} {...leaf} />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex-1"
          >
            {/* Animated line */}
            <motion.div
              variants={lineAnimation}
              className="w-16 h-px bg-gray-900 mb-8 origin-left"
            />

            {/* Title with icon */}
            <div className="flex items-center gap-6 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 1 }}
                className="w-14 h-14 border border-gray-900/10 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Users className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              <div>
                <motion.h2 
                  custom={0}
                  variants={textReveal}
                  className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900"
                >
                  {title}
                </motion.h2>
              </div>
            </div>

            {/* Subtitle */}
            <motion.p 
              custom={1}
              variants={textReveal}
              className="text-gray-900/60 text-lg ml-20"
            >
              {subtitle}
            </motion.p>

            {/* Simple stats */}
            <motion.div 
              custom={2}
              variants={textReveal}
              className="flex items-center gap-8 mt-6 ml-20"
            >
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-2xl font-playfair font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {authors?.length || 0}+
                </motion.span>
                <span className="text-sm text-gray-900/50">Artists</span>
              </div>
              <div className="w-px h-6 bg-gray-900/10" />
              <span className="text-sm text-gray-900/50">Verified & Curated</span>
            </motion.div>
          </motion.div>

          {/* View All Button - Minimal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <Link to={viewAllHref} className="group">
              <motion.div
                className="flex items-center gap-3 text-gray-900"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="relative text-lg font-medium">
                  View All Artists
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons - Minimal */}
          {!loading && authors?.length > 0 && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: canScrollLeft ? 1 : 0.3 }}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 border border-gray-900/20 bg-white flex items-center justify-center hover:border-gray-900 transition-colors">
                  <ChevronLeft className="text-gray-900 w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: canScrollRight ? 1 : 0.3 }}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 border border-gray-900/20 bg-white flex items-center justify-center hover:border-gray-900 transition-colors">
                  <ChevronRight className="text-gray-900 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            </>
          )}

          {/* Cards Container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth gap-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading ? (
              // Minimal Loading Skeletons
              <div className="flex gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="w-[300px] flex-shrink-0"
                  >
                    <div className="aspect-[3/4] border border-gray-900/10 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.2
                        }}
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-5 bg-gray-100 w-2/3" />
                      <div className="h-4 bg-gray-100 w-1/2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : authors?.length ? (
              <div className="flex gap-6">
                {authors.map((artist, idx) => (
                  <motion.div
                    key={artist?._id || idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.6, 
                      delay: idx * 0.1,
                      ease: "easeOut"
                    }}
                    className="w-[300px] flex-shrink-0"
                  >
                    <ArtistCard author={artist} index={idx} />
                  </motion.div>
                ))}
              </div>
            ) : (
              // Minimal Empty State
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full py-20 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center w-20 h-20 border border-gray-900/10 mb-6"
                >
                  <Users className="text-gray-900/40 w-8 h-8" strokeWidth={1} />
                </motion.div>
                
                <h3 className="text-xl font-playfair font-bold text-gray-900 mb-2">No Artists Yet</h3>
                <p className="text-gray-900/50">
                  Amazing artists are coming soon.
                </p>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="w-16 h-px bg-gray-900/20 mx-auto mt-6"
                />
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
          className="mt-12 lg:hidden text-center"
        >
          <Link to={viewAllHref} className="group inline-flex items-center gap-3 text-gray-900">
            <span className="relative text-lg font-medium">
              View All Artists
              <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900" />
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="w-full h-px bg-gray-900/5 mt-20 origin-center"
        />
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.section>
  );
};

export default ArtistRail;
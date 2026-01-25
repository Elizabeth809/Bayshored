// src/components/home/ArtistRail.jsx
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Users, Sparkles } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import ArtistCard from "./ArtistCard";

const ArtistRail = ({ title, subtitle, loading, authors = [], viewAllHref = "/artists" }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-200/50 to-teal-200/50 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-200/50 to-blue-200/50 rounded-full blur-3xl"
        />
      </div>

      <div className="relative p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
              >
                <Users className="text-white" size={24} />
              </motion.div>
              <div className="flex items-center gap-2">
                <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-gray-900">
                  {title}
                </h2>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="text-yellow-500" size={24} />
                </motion.div>
              </div>
            </div>
            <p className="text-gray-600 text-lg font-medium">{subtitle}</p>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '200px' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mt-3"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to={viewAllHref}
              className="group hidden sm:inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl hover:shadow-emerald-600/30 transition-all"
            >
              <span>View All Artists</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {!loading && authors?.length > 0 && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: canScrollLeft ? 1 : 0.3 }}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-all disabled:cursor-not-allowed group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="text-emerald-700 group-hover:-translate-x-1 transition-transform" size={28} />
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: canScrollRight ? 1 : 0.3 }}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-all disabled:cursor-not-allowed group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="text-emerald-700 group-hover:translate-x-1 transition-transform" size={28} />
              </motion.button>
            </>
          )}

          {/* Cards Container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading ? (
              // Loading Skeletons
              <div className="flex">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[350px] h-[500px] flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 animate-pulse relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                ))}
              </div>
            ) : authors?.length ? (
              <div className="flex">
                {authors.map((artist, idx) => (
                  <div
                    key={artist?._id || idx}
                    className="w-[350px] flex-shrink-0"
                  >
                    <ArtistCard author={artist} index={idx} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full py-20 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                  <Users className="text-emerald-600" size={40} />
                </div>
                <p className="text-gray-600 text-lg font-medium">No artists found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 sm:hidden"
        >
          <Link
            to={viewAllHref}
            className="group flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all w-full"
          >
            <span>View All Artists</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ArtistRail;
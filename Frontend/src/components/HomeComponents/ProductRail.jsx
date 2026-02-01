// src/components/home/ProductRail.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Package } from "lucide-react";
import ProductCard from "../Products/ProductCard";

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      y: [-20, 300, 600],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-900">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

const ProductRail = ({
  title,
  subtitle,
  loading,
  products = [],
  viewAllHref = "/products",
}) => {
  const scrollerRef = useRef(null);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const lineWidth = useTransform(scrollYProgress, [0, 0.3], ["0%", "100%"]);

  const scrollByPx = (px) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: px, behavior: "smooth" });
  };

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 5 + i * 12,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
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
    <section 
      ref={containerRef}
      className="relative overflow-hidden bg-white py-20"
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={i} {...petal} />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Title Section */}
            <div className="space-y-4">
              <motion.div
                variants={lineAnimation}
                className="w-12 h-px bg-gray-900 origin-left"
              />

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", duration: 1 }}
                  className="w-12 h-12 border border-gray-900/10 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Package className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>

                <motion.h2 
                  custom={0}
                  variants={textReveal}
                  className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
                >
                  {title}
                </motion.h2>
              </div>

              <motion.p 
                custom={1}
                variants={textReveal}
                className="text-gray-900/60 text-lg max-w-xl ml-16"
              >
                {subtitle}
              </motion.p>
            </div>

            {/* Navigation - Desktop */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden sm:flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollByPx(-400)}
                  className="w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 hover:bg-gray-900 group transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollByPx(400)}
                  className="w-12 h-12 border border-gray-900/20 flex items-center justify-center hover:border-gray-900 hover:bg-gray-900 group transition-all duration-300"
                >
                  <ArrowRight className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                </motion.button>
              </div>

              <div className="w-px h-8 bg-gray-900/10" />

              <Link to={viewAllHref} className="group">
                <motion.div
                  className="flex items-center gap-2 text-gray-900"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="relative font-medium">
                    View Collection
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Products Scroll Container */}
        <div className="relative">
          {/* Top border line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="absolute top-0 left-0 right-0 h-px bg-gray-900/10 origin-left"
          />

          <div
            ref={scrollerRef}
            className="flex gap-6 py-8 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {loading ? (
              // Minimal Loading Skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="min-w-[300px] sm:min-w-[340px] lg:min-w-[380px] flex-shrink-0"
                >
                  <div className="border border-gray-900/10">
                    <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-100 w-1/3" />
                      <div className="h-6 bg-gray-100 w-3/4" />
                      <div className="h-4 bg-gray-100 w-1/2" />
                      <div className="h-6 bg-gray-100 w-1/4 mt-4" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : products?.length ? (
              products.map((product, idx) => (
                <motion.div
                  key={product?._id || idx}
                  className="min-w-[300px] sm:min-w-[340px] lg:min-w-[380px] flex-shrink-0"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))
            ) : (
              // Empty State
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full py-16 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center w-20 h-20 border border-gray-900/10 mb-6"
                >
                  <Package className="w-8 h-8 text-gray-900/30" strokeWidth={1} />
                </motion.div>
                <h3 className="text-xl font-playfair font-bold text-gray-900 mb-2">
                  No Artworks Available
                </h3>
                <p className="text-gray-900/50">Check back soon for new additions</p>
              </motion.div>
            )}
          </div>

          {/* Bottom border line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0 h-px bg-gray-900/10 origin-right"
          />
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="sm:hidden mt-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollByPx(-300)}
              className="w-10 h-10 border border-gray-900/20 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </button>
            <button
              onClick={() => scrollByPx(300)}
              className="w-10 h-10 border border-gray-900/20 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 text-gray-900" />
            </button>
          </div>

          <Link to={viewAllHref} className="group flex items-center gap-2 text-gray-900">
            <span className="font-medium text-sm">View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default ProductRail;
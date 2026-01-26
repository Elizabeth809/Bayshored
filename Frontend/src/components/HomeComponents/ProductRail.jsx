import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles, Palette, Brush } from "lucide-react";
import ProductCard from "../products/ProductCard";

const ProductRail = ({
  title,
  subtitle,
  loading,
  products = [],
  viewAllHref = "/products",
  variant = "default", // default | sale | vault | featured
}) => {
  const scrollerRef = useRef(null);

  const theme = useMemo(() => {
    const themes = {
      sale: {
        badge: "bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-200",
        border: "border-white/30 bg-gradient-to-br from-white/95 via-rose-50/40 to-amber-50/30 backdrop-blur-sm",
        bg: "bg-gradient-to-br from-white via-rose-50/20 to-amber-50/10",
        accent: "text-rose-600",
        icon: Sparkles,
        hint: "Limited Time Offers",
        pattern: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/30 via-transparent to-transparent"
      },
      vault: {
        badge: "bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-900 text-emerald-100 shadow-xl",
        border: "border-emerald-900/20 bg-gradient-to-br from-white/95 via-emerald-50/20 to-gray-50/50 backdrop-blur-sm",
        bg: "bg-gradient-to-br from-white via-emerald-50/10 to-gray-50",
        accent: "text-emerald-700",
        icon: Palette,
        hint: "Exclusive Collection",
        pattern: "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent"
      },
      featured: {
        badge: "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-200",
        border: "border-white/30 bg-gradient-to-br from-white/95 via-indigo-50/30 to-violet-50/20 backdrop-blur-sm",
        bg: "bg-gradient-to-br from-white via-indigo-50/10 to-violet-50/5",
        accent: "text-indigo-600",
        icon: Brush,
        hint: "Curator's Choice",
        pattern: "bg-[radial-gradient(circle_at_20%_30%,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent"
      },
      default: {
        badge: "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-200",
        border: "border-white/30 bg-gradient-to-br from-white/95 via-emerald-50/30 to-teal-50/20 backdrop-blur-sm",
        bg: "bg-gradient-to-br from-white via-emerald-50/10 to-teal-50/5",
        accent: "text-emerald-600",
        icon: Brush,
        hint: "Curated Selection",
        pattern: "bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent"
      }
    };
    return themes[variant] || themes.default;
  }, [variant]);

  const IconComponent = theme.icon;

  const scrollByPx = (px) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: px, behavior: "smooth" });
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.bg} p-6 sm:p-10 shadow-2xl shadow-black/5`}>
      {/* Background pattern */}
      <div className={`absolute inset-0 ${theme.pattern} pointer-events-none`} />
      
      {/* Decorative corner accents */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-xl" />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-xl" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${theme.badge} backdrop-blur-md`}>
                <IconComponent className="h-4 w-4" />
                {theme.hint}
              </span>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-current/20 to-transparent" />
            </div>
            
            <div>
              <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
              <p className="mt-3 text-lg text-gray-700/90 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollByPx(-900)}
                className="group rounded-2xl border border-white/50 bg-white/80 backdrop-blur-md p-3 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 group-hover:text-emerald-600 transition-colors" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollByPx(900)}
                className="group rounded-2xl border border-white/50 bg-white/80 backdrop-blur-md p-3 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5 text-gray-700 group-hover:text-emerald-600 transition-colors" />
              </motion.button>
            </div>

            <motion.div whileHover={{ x: 3 }}>
              <Link
                to={viewAllHref}
                className="group ml-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-3 font-semibold text-white hover:from-gray-800 hover:to-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Explore Collection
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="mt-10">
          <div
            ref={scrollerRef}
            className="flex gap-8 pb-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-2 -mx-2"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative min-w-[320px] sm:min-w-[380px] lg:min-w-[420px] snap-start rounded-3xl border border-white/50 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-sm p-6 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <div className="h-72 w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                    <div className="mt-6 h-5 w-3/4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                    <div className="mt-4 h-4 w-full rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                    <div className="mt-4 h-4 w-2/3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                    <div className="mt-6 h-10 w-32 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
                  </div>
                </div>
              ))
            ) : products?.length ? (
              products.map((p, idx) => (
                <motion.div
                  key={p?._id || idx}
                  className="min-w-[320px] sm:min-w-[380px] lg:min-w-[420px] snap-start"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <ProductCard 
                    product={p} 
                    index={idx}
                    variant={variant}
                  />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                  <Palette className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-xl text-gray-600/80 font-medium">No artworks available at the moment</p>
                <p className="text-gray-500 mt-2">Check back soon for new additions</p>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="sm:hidden mt-8 flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30">
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollByPx(-700)}
                className="rounded-2xl border border-white bg-white/80 p-3 shadow-lg hover:shadow-xl transition-all"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollByPx(700)}
                className="rounded-2xl border border-white bg-white/80 p-3 shadow-lg hover:shadow-xl transition-all"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5 text-gray-700" />
              </motion.button>
            </div>

            <Link
              to={viewAllHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current/10 to-transparent" />
    </div>
  );
};

export default ProductRail;
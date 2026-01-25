import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "../products/ProductCard";

const ProductRail = ({
  title,
  subtitle,
  loading,
  products = [],
  viewAllHref = "/products",
  variant = "default", // default | sale | vault
}) => {
  const scrollerRef = useRef(null);

  const theme = useMemo(() => {
    if (variant === "sale") {
      return {
        badge: "bg-emerald-600 text-white",
        border: "border-emerald-100",
        bg: "bg-white",
        hint: "Deals you’ll love",
      };
    }
    if (variant === "vault") {
      return {
        badge: "bg-black text-emerald-300",
        border: "border-emerald-100",
        bg: "bg-white",
        hint: "Exclusive / inquiry-only",
      };
    }
    return {
      badge: "bg-emerald-100 text-emerald-900",
      border: "border-emerald-100",
      bg: "bg-white",
      hint: "Curated picks",
    };
  }, [variant]);

  const scrollByPx = (px) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: px, behavior: "smooth" });
  };

  return (
    <div className={`rounded-3xl border ${theme.border} ${theme.bg} p-6 sm:p-8`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${theme.badge}`}>
              {theme.hint}
            </span>
          </div>
          <h2 className="mt-2 font-playfair text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scrollByPx(-900)}
            className="rounded-xl border border-emerald-200 bg-white p-2 hover:bg-emerald-50 transition-colors"
            aria-label="Scroll left"
          >
            <ArrowLeft className="h-5 w-5 text-emerald-800" />
          </button>
          <button
            onClick={() => scrollByPx(900)}
            className="rounded-xl border border-emerald-200 bg-white p-2 hover:bg-emerald-50 transition-colors"
            aria-label="Scroll right"
          >
            <ArrowRight className="h-5 w-5 text-emerald-800" />
          </button>

          <Link
            to={viewAllHref}
            className="ml-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] sm:min-w-[320px] snap-start rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"
              >
                <div className="h-64 w-full rounded-xl bg-emerald-100 animate-pulse" />
                <div className="mt-4 h-4 w-44 rounded bg-emerald-100 animate-pulse" />
                <div className="mt-2 h-3 w-56 rounded bg-emerald-100 animate-pulse" />
                <div className="mt-4 h-6 w-28 rounded bg-emerald-100 animate-pulse" />
              </div>
            ))
          ) : products?.length ? (
            products.map((p, idx) => (
              <motion.div
                key={p?._id || idx}
                className="min-w-[280px] sm:min-w-[320px] snap-start"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.04 }}
              >
                <ProductCard product={p} index={idx} />
              </motion.div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No products found.</div>
          )}
        </div>

        <div className="sm:hidden mt-2 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => scrollByPx(-700)}
              className="rounded-xl border border-emerald-200 bg-white p-2 hover:bg-emerald-50 transition-colors"
              aria-label="Scroll left"
            >
              <ArrowLeft className="h-5 w-5 text-emerald-800" />
            </button>
            <button
              onClick={() => scrollByPx(700)}
              className="rounded-xl border border-emerald-200 bg-white p-2 hover:bg-emerald-50 transition-colors"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-5 w-5 text-emerald-800" />
            </button>
          </div>

          <Link
            to={viewAllHref}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductRail;
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CategoryChips = ({ loading, categories = [] }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/50 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.20),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(16,185,129,0.16),transparent_45%)]" />

      <div className="relative">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900">
              Explore Categories
            </h2>
            <p className="mt-1 text-gray-600">
              Find landscapes, nature, abstracts, and more.
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 animate-pulse rounded-full bg-emerald-100/80"
              />
            ))
          ) : categories?.length ? (
            categories.map((c, idx) => (
              <motion.div
                key={c._id || c.name || idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(c._id || c.name)}`}
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  {c?.name || "Category"}
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No categories found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryChips;
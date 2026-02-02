import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Palette } from "lucide-react";

const AnimatedBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {/* Animated gray blobs */}
      <motion.div
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gray-50"
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gray-50"
        animate={{ x: [0, -35, 0], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-800/10 px-4 py-2 text-gray-800/90 border border-gray-800/10">
            <Palette className="h-4 w-4 text-gray-800" />
            <span className="text-sm">New Collection</span>
          </div>

          <h3 className="mt-4 text-2xl sm:text-3xl font-light text-gray-900">
            Nature & Landscape Collection — curated for calm spaces.
          </h3>
          <p className="mt-2 text-gray-800/80 max-w-2xl">
            Premium originals that elevate your home, office, or studio. Collect with confidence.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/store"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-6 py-3 font-medium text-white hover:bg-gray-500 transition-colors"
            >
              Shop the Collection <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/artists"
              className="inline-flex items-center justify-center rounded-lg border border-gray-800/20 bg-gray-800/10 px-6 py-3 font-medium text-gray-800 hover:bg-gray-800/20 transition-colors"
            >
              Meet the Artists
            </Link>
          </div>
        </div>

        {/* Right: Image frame */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-xl border border-gray-800/15 bg-gray-800/10 p-2"
          >
            <div className="relative overflow-hidden rounded-lg">
              <motion.img
                src="https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=2000&q=80&grayscale"
                alt="Collection highlight"
                className="h-64 w-full object-cover"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Rotating border */}
            <motion.div
              className="pointer-events-none absolute -inset-1 rounded-xl border border-gray-800/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBanner;
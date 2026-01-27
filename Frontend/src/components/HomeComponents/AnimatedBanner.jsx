import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Palette } from "lucide-react";

const AnimatedBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-900 via-emerald-800 to-black">
      {/* animated blobs */}
      <motion.div
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ x: [0, -35, 0], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 sm:p-10 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/90 border border-white/10 backdrop-blur">
            <Palette className="h-4 w-4 text-emerald-300" />
            <span className="text-sm">New Drop</span>
          </div>

          <h3 className="mt-4 font-playfair text-3xl sm:text-4xl font-bold text-white">
            Nature & Landscape Collection — curated for calm spaces.
          </h3>
          <p className="mt-2 text-white/80 max-w-2xl">
            Premium originals that elevate your home, office, or studio. Collect with confidence.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Shop the Collection <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/artists"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15 transition-colors backdrop-blur"
            >
              Meet the Artists
            </Link>
          </div>
        </div>

        {/* Right: “animated frame” */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <motion.img
                src="https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=2000&q=80"
                alt="Collection highlight"
                className="h-64 w-full object-cover"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <div className="font-semibold">Featured Collection</div>
                  <div className="text-sm text-white/80">Nature • Calm • Minimal</div>
                </div>
                <div className="rounded-full bg-emerald-400/20 border border-emerald-300/30 px-4 py-2 text-sm font-semibold text-emerald-50">
                  Limited
                </div>
              </div>
            </div>

            {/* animated stroke */}
            <motion.div
              className="pointer-events-none absolute -inset-1 rounded-3xl"
              style={{
                background:
                  "conic-gradient(from 90deg at 50% 50%, rgba(16,185,129,0.0), rgba(16,185,129,0.55), rgba(16,185,129,0.0))",
              }}
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
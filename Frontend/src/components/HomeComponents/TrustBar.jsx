// src/components/home/TrustBar.jsx
import { motion } from "framer-motion";
import { BadgeCheck, Lock, Truck, Undo2, Sparkles, Shield } from "lucide-react";

const items = [
  { 
    icon: BadgeCheck, 
    title: "Authenticity Guaranteed", 
    desc: "Curated artists & verified originals",
    color: "from-emerald-500 to-green-600",
    accentColor: "emerald"
  },
  { 
    icon: Truck, 
    title: "Free US Shipping", 
    desc: "Reliable delivery nationwide",
    color: "from-teal-500 to-cyan-600",
    accentColor: "teal"
  },
  { 
    icon: Lock, 
    title: "Secure Checkout", 
    desc: "Protected payment gateway",
    color: "from-green-600 to-emerald-700",
    accentColor: "green"
  },
  { 
    icon: Undo2, 
    title: "30-Day Returns", 
    desc: "Hassle-free support",
    color: "from-emerald-600 to-teal-600",
    accentColor: "emerald"
  },
];

const TrustBar = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-emerald-50/30 to-green-50/20 border-emerald-100/50">
      {/* Canvas Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Watercolor wash - left */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.08 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
          className="absolute -left-32 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.1) 60%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Watercolor wash - right */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.08 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.3 }}
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.1) 60%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Floating decorative shapes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 3,
              height: Math.random() * 6 + 3,
              left: `${10 + i * 12}%`,
              top: `${20 + Math.random() * 60}%`,
              background: `rgba(16, 185, 129, ${Math.random() * 0.2 + 0.1})`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Subtle brush stroke decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1200 200">
          <motion.path
            d="M 0 100 Q 300 80, 600 100 T 1200 100"
            stroke="rgb(16, 185, 129)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Optional Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-md mb-3">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-bold text-emerald-900 tracking-wide">
              YOUR PEACE OF MIND
            </span>
          </div>
          <p className="text-gray-700 font-medium text-lg">
            Art collecting made simple, secure, and enjoyable
          </p>
        </motion.div>

        {/* Trust Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full rounded-3xl bg-white/90 backdrop-blur-sm border border-emerald-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Animated gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.8 }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon Container */}
                  <div className="mb-4 relative inline-block">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className={`relative w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300`}
                    >
                      <item.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                      
                      {/* Pulsing glow */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>

                    {/* Sparkle decoration */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0, rotate: -90 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + idx * 0.1, type: "spring", bounce: 0.6 }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                  </div>

                  {/* Text Content */}
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-emerald-800 transition-colors duration-300">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100/40 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Bottom accent line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} rounded-b-3xl`}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }}
                />
              </div>

              {/* Floating badge (appears on hover) */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg z-20"
              >
                <BadgeCheck className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Decorative Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </motion.div>
            <span className="text-sm font-semibold text-gray-700">
              Trusted by over <span className="text-emerald-700 font-bold">10,000+</span> art collectors
            </span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Decorative paint strokes (corner elements) */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-5 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M 10 50 Q 30 20, 50 40 T 90 50"
            stroke="rgb(16, 185, 129)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2 }}
          />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M 90 50 Q 70 80, 50 60 T 10 50"
            stroke="rgb(34, 197, 94)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.3 }}
          />
        </svg>
      </div>
    </section>
  );
};

export default TrustBar;
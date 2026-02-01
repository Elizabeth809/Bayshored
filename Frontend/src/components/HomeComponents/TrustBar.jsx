// src/components/home/TrustBar.jsx
import { motion } from "framer-motion";
import { BadgeCheck, Lock, Truck, Undo2, Sparkles, Shield } from "lucide-react";

const items = [
  { 
    icon: BadgeCheck, 
    title: "Authenticity Guaranteed", 
    desc: "Curated artists & verified originals",
  },
  { 
    icon: Truck, 
    title: "Free US Shipping", 
    desc: "Reliable delivery nationwide",
  },
  { 
    icon: Lock, 
    title: "Secure Checkout", 
    desc: "Protected payment gateway",
  },
  { 
    icon: Undo2, 
    title: "30-Day Returns", 
    desc: "Hassle-free support",
  },
];

const TrustBar = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
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
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Shield className="w-6 h-6 text-white" />
            <span className="text-white text-sm font-medium tracking-wide">
              YOUR PEACE OF MIND
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 font-light text-lg"
          >
            Art collecting made simple, secure, and enjoyable
          </motion.p>
        </motion.div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1,
              }}
              className="relative group"
            >
              {/* Animated line */}
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-px bg-white/30"
                initial={{ width: 0 }}
                whileInView={{ width: '80%' }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 + 0.3, duration: 0.6 }}
              />
              
              {/* Icon animation */}
              <motion.div
                className="mb-6 flex justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="relative"
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                >
                  <item.icon className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <div className="text-center">
                <motion.h3 
                  className="text-white font-medium text-lg mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                >
                  {item.title}
                </motion.h3>
                
                <motion.p 
                  className="text-white/60 text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                >
                  {item.desc}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Decorative Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <motion.div
            className="inline-flex items-center gap-3"
            animate={{ 
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-white/70 text-sm font-light">
              Trusted by over <span className="text-white font-medium">10,000+</span> art collectors
            </span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated background lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" viewBox="0 0 1200 200">
        <motion.path
          d="M 0 100 Q 300 80, 600 100 T 1200 100"
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </svg>
    </section>
  );
};

export default TrustBar;
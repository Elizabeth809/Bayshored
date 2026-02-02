// src/components/home/ArtProcessSection.jsx
import { motion } from 'framer-motion';
import { Search, Heart, CreditCard, Truck, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: "Discover",
    description: "Browse our curated collection of original artworks from talented artists worldwide."
  },
  {
    id: 2,
    icon: Heart,
    title: "Fall in Love",
    description: "Find the piece that speaks to you. Save favorites to your wishlist for later."
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Secure Purchase",
    description: "Complete your purchase with our secure payment system."
  },
  {
    id: 4,
    icon: Truck,
    title: "Careful Delivery",
    description: "Your artwork is carefully packaged and shipped with full insurance."
  },
  {
    id: 5,
    icon: CheckCircle,
    title: "Enjoy",
    description: "Hang your new masterpiece and enjoy the beauty it brings every day."
  }
];

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 16 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.12, 0.12, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 40, -30, 60],
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

// Decorative corner component
const CornerDecor = ({ position }) => {
  const positions = {
    'top-left': 'top-0 left-0 rotate-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  };

  return (
    <div className={`absolute w-6 h-6 ${positions[position]}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full text-gray-900/20">
        <path d="M0 0 L24 0 L24 4 L4 4 L4 24 L0 24 Z" fill="currentColor" />
      </svg>
    </div>
  );
};

const ArtProcessSection = () => {
  // Generate floating petals
  const petals = Array.from({ length: 12 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 8,
    duration: 14 + Math.random() * 8,
    size: 12 + Math.random() * 10,
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
    <section className="relative py-8 overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
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

      {/* Decorative side elements */}
      <motion.div
        className="absolute left-8 top-1/4 w-px h-32 bg-gradient-to-b from-transparent via-gray-900/20 to-transparent"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
      />
      <motion.div
        className="absolute right-8 top-1/3 w-px h-48 bg-gradient-to-b from-transparent via-gray-900/20 to-transparent"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <motion.div
            variants={lineAnimation}
            className="w-16 h-px bg-gray-900 mx-auto mb-8 origin-center"
          />

          <motion.span
            custom={0}
            variants={textReveal}
            className="inline-block text-sm font-medium tracking-[0.3em] text-gray-900/60 uppercase mb-6"
          >
            Your Art Journey
          </motion.span>
          
          <motion.h2 
            custom={1}
            variants={textReveal}
            className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            How It Works
          </motion.h2>

          {/* Elegant decorative element */}
          <motion.div
            custom={2}
            variants={textReveal}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-12 h-px bg-gray-900/30 origin-right"
            />
            <motion.div
              initial={{ scale: 0, rotate: 45 }}
              whileInView={{ scale: 1, rotate: 45 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="w-2 h-2 border border-gray-900/40"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-12 h-px bg-gray-900/30 origin-left"
            />
          </motion.div>
          
          <motion.p 
            custom={3}
            variants={textReveal}
            className="text-lg text-gray-900/60 max-w-2xl mx-auto"
          >
            From discovery to delivery, we make collecting art simple and delightful.
          </motion.p>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative max-w-7xl mx-auto">
          
          {/* Creative Zigzag Timeline - Desktop */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-[500px]" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Animated dash pattern */}
                <pattern id="dashPattern" patternUnits="userSpaceOnUse" width="20" height="1">
                  <motion.rect
                    width="10"
                    height="1"
                    fill="#111827"
                    initial={{ x: 0 }}
                    animate={{ x: [0, 20] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </pattern>
              </defs>

              {/* Main zigzag path */}
              <motion.path
                d="M 100 250 
                   L 200 250 
                   Q 230 250 240 220 
                   L 280 120 
                   Q 290 90 320 90 
                   L 400 90
                   Q 430 90 440 120
                   L 480 220
                   Q 490 250 520 250
                   L 600 250
                   Q 630 250 640 280
                   L 680 380
                   Q 690 410 720 410
                   L 800 410
                   Q 830 410 840 380
                   L 880 280
                   Q 890 250 920 250
                   L 1100 250"
                stroke="#111827"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
                opacity="0.15"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />

              {/* Dotted overlay path */}
              <motion.path
                d="M 100 250 
                   L 200 250 
                   Q 230 250 240 220 
                   L 280 120 
                   Q 290 90 320 90 
                   L 400 90
                   Q 430 90 440 120
                   L 480 220
                   Q 490 250 520 250
                   L 600 250
                   Q 630 250 640 280
                   L 680 380
                   Q 690 410 720 410
                   L 800 410
                   Q 830 410 840 380
                   L 880 280
                   Q 890 250 920 250
                   L 1100 250"
                stroke="#111827"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="4 12"
                opacity="0.3"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
              />

              {/* Animated traveling dot 1 */}
              <motion.circle
                r="6"
                fill="#111827"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path="M 100 250 L 200 250 Q 230 250 240 220 L 280 120 Q 290 90 320 90 L 400 90 Q 430 90 440 120 L 480 220 Q 490 250 520 250 L 600 250 Q 630 250 640 280 L 680 380 Q 690 410 720 410 L 800 410 Q 830 410 840 380 L 880 280 Q 890 250 920 250 L 1100 250"
                />
              </motion.circle>

              {/* Animated traveling dot 2 - delayed */}
              <motion.circle
                r="4"
                fill="#111827"
                opacity="0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0] }}
                transition={{ duration: 5, delay: 2.5, repeat: Infinity, ease: "linear" }}
              >
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path="M 100 250 L 200 250 Q 230 250 240 220 L 280 120 Q 290 90 320 90 L 400 90 Q 430 90 440 120 L 480 220 Q 490 250 520 250 L 600 250 Q 630 250 640 280 L 680 380 Q 690 410 720 410 L 800 410 Q 830 410 840 380 L 880 280 Q 890 250 920 250 L 1100 250"
                />
              </motion.circle>

              {/* Small decorative circles at junction points */}
              {[
                { cx: 100, cy: 250 },
                { cx: 360, cy: 90 },
                { cx: 560, cy: 250 },
                { cx: 760, cy: 410 },
                { cx: 1100, cy: 250 },
              ].map((point, i) => (
                <motion.circle
                  key={i}
                  cx={point.cx}
                  cy={point.cy}
                  r="8"
                  fill="white"
                  stroke="#111827"
                  strokeWidth="1"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.2, type: "spring" }}
                />
              ))}
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                className={`relative group ${
                  index % 2 === 1 ? 'lg:mt-[-60px]' : 'lg:mt-[60px]'
                }`}
              >
                {/* Card with borders */}
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white border border-gray-900/10 p-8 group-hover:border-gray-900/30 transition-all duration-500"
                >

                  {/* Hover border animation */}
                  <motion.div
                    className="absolute inset-0 border-2 border-gray-900 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Step Number - Top right */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1, type: "spring", bounce: 0.5 }}
                    className="absolute -top-4 -right-4 w-10 h-10 bg-white border-2 border-gray-900 flex items-center justify-center text-lg font-bold text-gray-900 z-10"
                  >
                    {step.id}
                  </motion.div>

                  {/* Icon */}
                  <div className="relative mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative w-16 h-16 border border-gray-900/20 flex items-center justify-center group-hover:border-gray-900 group-hover:bg-gray-900 transition-all duration-300"
                    >
                      <step.icon 
                        className="w-7 h-7 text-gray-900 group-hover:text-white transition-colors duration-300" 
                        strokeWidth={1.5} 
                      />
                    </motion.div>

                    {/* Decorative line from icon */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className="absolute top-1/2 left-full w-8 h-px bg-gray-900/20 origin-left hidden lg:block"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-playfair font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-900/60 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Bottom decorative line */}
                    <motion.div
                      className="w-full h-px bg-gray-900/10 group-hover:bg-gray-900/30 transition-colors duration-300"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />

                    {/* Arrow indicator */}
                    <motion.div
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 border-r border-b border-gray-900 rotate-45" />
                    </motion.div>
                  </div>

                  {/* Subtle inner shadow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-900/[0.02] to-transparent" />
                  </div>
                </motion.div>

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-8">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.15 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        className="w-px h-8 bg-gray-900/20 origin-top"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 border border-gray-900/30 rotate-45"
                      />
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        className="w-px h-8 bg-gray-900/20 origin-top"
                      />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-32 text-center"
        >
          {/* Decorative element */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px bg-gray-900/20 origin-right"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-gray-900/30"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-16 h-px bg-gray-900/20 origin-left"
            />
          </div>

          {/* CTA Card */}
          <motion.div
            whileHover={{ y: -4 }}
            className="inline-block border border-gray-900/10 p-8 md:p-10 hover:border-gray-900/30 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 border border-gray-900/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                </motion.div>
                <div className="text-left">
                  <p className="text-gray-900 font-medium">Ready to start your journey?</p>
                  <p className="text-sm text-gray-900/50">Find your perfect piece today</p>
                </div>
              </div>
              
              <motion.a 
                href="/store"
                className="group relative border border-gray-900 px-8 py-4 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover fill */}
                <motion.div
                  className="absolute inset-0 bg-gray-900"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-2 font-medium text-gray-900 group-hover:text-gray-500 transition-colors duration-300">
                  Browse Collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative corner elements */}
        <div className="absolute top-20 left-8 opacity-10 pointer-events-none hidden xl:block">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <motion.path
                d="M 10 50 Q 30 30, 50 50 T 90 50"
                stroke="#111827"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2 }}
              />
              <motion.path
                d="M 10 60 Q 30 40, 50 60 T 90 60"
                stroke="#111827"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.3 }}
              />
            </svg>
          </motion.div>
        </div>

        <div className="absolute bottom-20 right-8 opacity-10 pointer-events-none hidden xl:block">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <motion.rect
                x="20"
                y="20"
                width="60"
                height="60"
                stroke="#111827"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2 }}
              />
              <motion.rect
                x="35"
                y="35"
                width="30"
                height="30"
                stroke="#111827"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, rotate: 45 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
                style={{ transformOrigin: "50px 50px" }}
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ArtProcessSection;
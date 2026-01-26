// src/components/home/ArtProcessSection.jsx
import { motion } from 'framer-motion';
import { Search, Heart, CreditCard, Truck, CheckCircle, Sparkles, Palette } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: "Discover",
    description: "Browse our curated collection of original artworks from talented artists worldwide.",
    color: "from-emerald-500 to-green-600",
    dotColor: "bg-emerald-500"
  },
  {
    id: 2,
    icon: Heart,
    title: "Fall in Love",
    description: "Find the piece that speaks to you. Save favorites to your wishlist for later.",
    color: "from-rose-500 to-pink-600",
    dotColor: "bg-rose-500"
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Secure Purchase",
    description: "Complete your purchase with our secure payment system. Multiple payment options available.",
    color: "from-teal-500 to-cyan-600",
    dotColor: "bg-teal-500"
  },
  {
    id: 4,
    icon: Truck,
    title: "Careful Delivery",
    description: "Your artwork is carefully packaged and shipped directly to your door with full insurance.",
    color: "from-amber-500 to-orange-600",
    dotColor: "bg-amber-500"
  },
  {
    id: 5,
    icon: CheckCircle,
    title: "Enjoy",
    description: "Hang your new masterpiece and enjoy the beauty it brings to your space every day.",
    color: "from-emerald-600 to-green-700",
    dotColor: "bg-emerald-600"
  }
];

const ArtProcessSection = () => {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-br from-stone-50 via-emerald-50/30 to-green-50/20">
      {/* Canvas Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Watercolor Background Washes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left wash */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5 }}
          className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.2) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Bottom right wash */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.12 }}
          viewport={{ once: true }}
          transition={{ duration: 3, delay: 0.5 }}
          className="absolute -bottom-56 -right-56 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Center organic blob */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.08 }}
          viewport={{ once: true }}
          transition={{ duration: 3.5, delay: 1 }}
          className="absolute top-1/3 right-1/4 w-[500px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(34, 197, 94, 0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
            borderRadius: '45% 55% 60% 40% / 50% 45% 55% 50%',
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              borderRadius: [
                '45% 55% 60% 40% / 50% 45% 55% 50%',
                '55% 45% 40% 60% / 45% 55% 45% 55%',
                '45% 55% 60% 40% / 50% 45% 55% 50%'
              ]
            }}
            transition={{ 
              rotate: { duration: 35, repeat: Infinity, ease: "linear" },
              borderRadius: { duration: 18, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Floating paint dots */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1})`,
            }}
            animate={{
              y: [0, Math.random() * -40 - 20, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 1, bounce: 0.5 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200 shadow-lg mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Palette className="w-5 h-5 text-emerald-700" />
            </motion.div>
            <span className="text-sm font-bold tracking-wider text-emerald-900 uppercase">
              Your Art Journey
            </span>
          </motion.div>
          
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            How It{' '}
            <span className="text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text">
              Works
            </span>
          </h2>

          {/* Decorative brush stroke underline */}
          <div className="flex justify-center mb-6">
            <svg className="w-64 h-6" viewBox="0 0 300 20">
              <motion.path
                d="M 10 10 Q 75 5, 150 12 T 290 10"
                stroke="url(#headerUnderline)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
              <defs>
                <linearGradient id="headerUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                  <stop offset="100%" stopColor="rgb(5, 150, 105)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
            From discovery to delivery, we make collecting art simple and delightful.
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Flowing SVG Path - Desktop */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Gradient for the path */}
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.6" />
                  <stop offset="25%" stopColor="rgb(244, 63, 94)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="rgb(20, 184, 166)" stopOpacity="0.6" />
                  <stop offset="75%" stopColor="rgb(245, 158, 11)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.6" />
                </linearGradient>

                {/* Brush texture filter */}
                <filter id="brushTexture">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>
              </defs>

              {/* Flowing curved path */}
              <motion.path
                d="M 120 200 Q 180 120, 300 180 T 540 160 T 780 190 T 1020 170 L 1080 200"
                stroke="url(#pathGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="8 8"
                filter="url(#brushTexture)"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />

              {/* Animated flowing dots along the path */}
              <motion.circle
                r="4"
                fill="rgb(16, 185, 129)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 120 200 Q 180 120, 300 180 T 540 160 T 780 190 T 1020 170 L 1080 200"
                />
              </motion.circle>

              <motion.circle
                r="4"
                fill="rgb(244, 63, 94)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "linear" }}
              >
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 120 200 Q 180 120, 300 180 T 540 160 T 780 190 T 1020 170 L 1080 200"
                />
              </motion.circle>
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-emerald-100/50 hover:shadow-2xl hover:border-emerald-200 transition-all duration-500">
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />

                  {/* Step Number with Icon */}
                  <div className="relative mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`relative w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl mx-auto transform rotate-3 group-hover:rotate-6 transition-transform duration-300`}
                    >
                      <step.icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                      
                      {/* Animated glow */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>

                    {/* Step number badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring", bounce: 0.6 }}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-white border-2 border-emerald-200 rounded-full flex items-center justify-center font-bold text-emerald-700 shadow-lg"
                    >
                      {step.id}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="relative text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-playfair">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                  </div>

                  {/* Bottom accent dot */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <motion.div
                      whileHover={{ scale: 1.3 }}
                      className={`w-6 h-6 ${step.dotColor} rounded-full shadow-lg border-4 border-white`}
                    />
                  </div>
                </div>

                {/* Connecting arrow (mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-6">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.15 }}
                      className="flex flex-col items-center gap-2"
                    >
                      {[0, 1, 2].map((dot) => (
                        <motion.div
                          key={dot}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            delay: dot * 0.2
                          }}
                          className={`w-2 h-2 ${step.dotColor} rounded-full`}
                        />
                      ))}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100">
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <div className="text-left">
              <p className="text-lg font-bold text-gray-900">Ready to start your journey?</p>
              <p className="text-sm text-gray-600">Browse our collection and find your perfect piece</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a 
                href="/products"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Browse Art
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative paint brush strokes */}
        <div className="absolute top-20 left-10 opacity-5 pointer-events-none hidden xl:block">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <motion.path
              d="M 20 100 Q 60 50, 100 80 T 180 100"
              stroke="rgb(16, 185, 129)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <div className="absolute bottom-20 right-10 opacity-5 pointer-events-none hidden xl:block">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <motion.path
              d="M 20 100 Q 60 150, 100 120 T 180 100"
              stroke="rgb(34, 197, 94)"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default ArtProcessSection;
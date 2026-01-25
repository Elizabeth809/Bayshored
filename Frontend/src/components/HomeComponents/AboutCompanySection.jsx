// src/components/home/AboutCompanySection.jsx
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  ArrowRight, 
  Brush, 
  HeartHandshake, 
  Leaf, 
  Palette,
  Award,
  Users,
  Globe,
  Sparkles,
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  Zap,
  Target,
  Heart
} from "lucide-react";

const AboutCompanySection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  const values = [
    { 
      icon: Brush, 
      title: "Artistic Excellence", 
      desc: "Every piece is carefully curated to meet our highest standards of quality and creativity.",
      gradient: "from-purple-500 to-pink-600"
    },
    { 
      icon: Shield, 
      title: "Authenticity Guaranteed", 
      desc: "We verify every artwork and artist, ensuring you receive genuine pieces with certificates.",
      gradient: "from-blue-500 to-cyan-600"
    },
    { 
      icon: Target, 
      title: "Customer First", 
      desc: "Your satisfaction drives everything we do, from curation to delivery and beyond.",
      gradient: "from-emerald-500 to-teal-600"
    },
    { 
      icon: TrendingUp, 
      title: "Growing Community", 
      desc: "Join a thriving community of artists, collectors, and art enthusiasts across the USA.",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white my-8"
    >
      {/* ULTRA ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Massive Animated Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
            x: [0, 150, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-cyan-200/40 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/2 -right-1/4 w-[900px] h-[900px] bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-rose-200/40 rounded-full blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            x: [0, -100, 0],
            y: [0, 150, 0],
            rotate: [0, 360, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-blue-200/30 via-indigo-200/30 to-violet-200/40 rounded-full blur-3xl"
        />

        {/* Animated Pattern Overlays */}
        <motion.div 
          className="absolute inset-0 opacity-[0.07]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "linear"
          }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Floating Geometric Shapes */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className="absolute"
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              borderRadius: Math.random() > 0.5 ? '50%' : '20%',
              background: `linear-gradient(${Math.random() * 360}deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))`,
            }}
            animate={{
              y: [0, Math.random() * -100 - 50, 0],
              x: [0, Math.random() * 60 - 30, 0],
              rotate: [0, Math.random() * 360, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Sparkle Effects */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="text-emerald-400" size={20} />
          </motion.div>
        ))}

        {/* Radial Light Effects */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
              'radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
              'radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <motion.path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-emerald-600"
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative p-8 sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT SIDE - Content */}
          <motion.div 
            className="lg:col-span-5 space-y-8"
            style={{ opacity, scale }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 1, bounce: 0.6 }}
                className="inline-flex items-center gap-3 rounded-full border-2 border-emerald-300 bg-white/80 backdrop-blur-sm px-6 py-3 shadow-xl"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Leaf className="h-6 w-6 text-emerald-700" />
                </motion.div>
                <span className="text-sm font-bold tracking-wide text-emerald-800">ABOUT OUR GALLERY</span>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-8 font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className="text-gray-900">Bringing </span>
                <motion.span 
                  className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                >
                  Art & Culture
                </motion.span>
                <span className="text-gray-900">to Your Space</span>
              </motion.h2>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-gray-700 text-lg leading-relaxed"
              >
                We connect passionate collectors with extraordinary artists across America. 
                Every painting tells a story, transforms a room, and creates lasting memories. 
                Our curated collection brings the beauty of nature, landscapes, and contemporary 
                art directly to your home.
              </motion.p>

              {/* Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/products"
                    className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-5 font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:shadow-2xl hover:shadow-emerald-600/40"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600"
                      initial={{ x: "100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 text-lg">Explore Paintings</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="relative z-10"
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/artists"
                    className="group relative inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-emerald-600 bg-white/80 backdrop-blur-sm px-8 py-5 font-bold text-emerald-800 shadow-lg transition-all hover:bg-emerald-50"
                  >
                    <span className="text-lg">Meet Artists</span>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brush className="h-6 w-6" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Promise Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/50 to-white backdrop-blur-sm p-8 shadow-2xl"
              >
                {/* Animated background gradient */}
                <motion.div
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/20"
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl"
                    >
                      <HeartHandshake className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-playfair text-2xl font-bold text-gray-900">Our Promise</h3>
                      <p className="text-emerald-700 font-semibold">To Every Collector</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    A beautiful buying experience: carefully curated art, transparent pricing, 
                    and dedicated support that respects collectors and celebrates artists.
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-tr-full" />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                >
                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - Images Gallery */}
          <motion.div 
            className="lg:col-span-7"
            style={{ y: y1 }}
          >
            <div className="relative">
              {/* Main Large Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, type: "spring" }}
                whileHover={{ scale: 1.02, rotateY: -5 }}
                className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-20"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                  style={{ transform: 'skewX(-20deg)' }}
                />

                <div className="relative aspect-[4/3] overflow-hidden">
                  <motion.img
                    src="https://images.unsplash.com/photo-1582561833649-b965b5c83e24?w=1200&h=900&fit=crop&q=80"
                    alt="Gallery showcase"
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.3 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2 }}
                    whileHover={{ scale: 1.05 }}
                  />
                  
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent" />

                  {/* Floating Stats Badges */}
                  <motion.div
                    initial={{ scale: 0, x: -50 }}
                    whileInView={{ scale: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
                    className="absolute top-8 left-8"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="bg-white/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border-2 border-emerald-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <Palette className="text-white" size={24} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">500+</div>
                          <div className="text-sm text-gray-600 font-semibold">Artworks</div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0, x: 50 }}
                    whileInView={{ scale: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, type: "spring", bounce: 0.6 }}
                    className="absolute top-8 right-8"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -15, 0],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl px-6 py-4 shadow-2xl border-2 border-white/50"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="text-white fill-white" size={24} />
                        <div>
                          <div className="text-xl font-bold text-white">Top Rated</div>
                          <div className="text-sm text-white/90 font-semibold">Collection</div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Bottom Info Bar */}
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-playfair text-white text-2xl font-bold mb-2">
                          Curated Art Gallery
                        </h4>
                        <p className="text-white/90">Discover masterpieces from talented artists</p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl"
                      >
                        <ArrowRight className="text-emerald-600" size={28} />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-white/30 to-transparent rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-white/30 to-transparent rounded-tl-full" />
              </motion.div>

              {/* Small Floating Images */}
              <motion.div
                initial={{ opacity: 0, x: -100, rotate: -20 }}
                whileInView={{ opacity: 1, x: 0, rotate: -12 }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 1, type: "spring" }}
                style={{ y: y2 }}
                className="absolute -left-16 top-32 w-48 h-56 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hidden xl:block"
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=500&fit=crop&q=80"
                  alt="Art piece 1"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.15, rotate: 2 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/50 to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 100, rotate: 20 }}
                whileInView={{ opacity: 1, x: 0, rotate: 12 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, duration: 1, type: "spring" }}
                style={{ y: y1 }}
                className="absolute -right-16 bottom-24 w-52 h-60 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hidden xl:block"
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=500&fit=crop&q=80"
                  alt="Art piece 2"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.15, rotate: -2 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent" />
              </motion.div>

              {/* Decorative Floating Elements */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -top-12 -right-12 w-32 h-32 border-4 border-emerald-400/40 rounded-full hidden lg:block"
              />
              
              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1.2, 1, 1.2]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -bottom-8 -left-8 w-24 h-24 border-4 border-purple-400/40 rounded-full hidden lg:block"
              />

              {/* Sparkle decorations */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`img-sparkle-${i}`}
                  className="absolute"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 12}%`,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    rotate: [0, 180, 360],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="text-yellow-400" size={24} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Values/Achievements Grid */}
        <div className="mt-20 space-y-12">

          {/* Core Values */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="text-center mb-12">
              <motion.h3 
                className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Our Core Values
              </motion.h3>
              <motion.p
                className="font-parisienne text-3xl text-emerald-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                What Drives Us Every Day
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, idx) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white p-8 shadow-xl hover:shadow-2xl transition-all"
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  <div className="relative z-10 flex items-start gap-6">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className={`flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br ${value.gradient} shadow-xl`}
                    >
                      <value.icon className="text-white" size={32} />
                    </motion.div>

                    <div className="flex-1">
                      <h4 className="font-playfair text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                        {value.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {value.desc}
                      </p>
                    </div>

                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + idx * 0.1, type: "spring", bounce: 0.6 }}
                    >
                      <CheckCircle className="text-emerald-500" size={28} />
                    </motion.div>
                  </div>

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutCompanySection;
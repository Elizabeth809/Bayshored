import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Palette } from 'lucide-react';
import HeroBG from "../../assets/herobg.jpg"

const HeroSlider = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Animated Background Image */}
      <motion.div
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "linear" }}
        className="absolute inset-0"
      >
        {/* Background Image - Keeping the artistic vibe */}
        <img
          src={HeroBG}
          alt="Art Gallery Background"
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-transparent z-10" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-20 h-full flex items-center justify-center text-center px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Icon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Palette className="text-black" size={32} />
            </div>
          </motion.div>

          {/* Welcome Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-playfair text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
          >
            Welcome to Our<br />
            <span className="text-emerald-400">Art Gallery</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-parisienne text-gray-300 text-2xl md:text-3xl mb-8"
          >
            Where Creativity Meets Passion
          </motion.p>

          {/* Main Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Explore breathtaking artworks from talented artists around the world. 
            Each piece tells a unique story, waiting to find its place in your world.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/artists"
              className="inline-flex items-center gap-3 bg-white text-gray-900 hover:bg-gray-100 font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-2xl hover:shadow-3xl text-lg md:text-xl"
            >
              <Palette size={20} />
              Meet Our Artists
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Animated Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl"
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute top-20 right-20 w-48 h-48 bg-white rounded-full blur-3xl"
      />

      {/* Floating Paint Brush Animation */}
      <motion.div
        initial={{ rotate: -45, opacity: 0 }}
        animate={{ rotate: 45, opacity: 0.1 }}
        transition={{ 
          rotate: { 
            duration: 4, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut" 
          },
          opacity: { duration: 2 }
        }}
        className="absolute top-1/4 left-10 text-white/10"
      >
        <Palette size={100} />
      </motion.div>

      <motion.div
        initial={{ rotate: 45, opacity: 0 }}
        animate={{ rotate: -45, opacity: 0.1 }}
        transition={{ 
          rotate: { 
            duration: 5, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut" 
          },
          opacity: { duration: 2 }
        }}
        className="absolute bottom-1/4 right-10 text-white/10"
      >
        <Palette size={80} />
      </motion.div>

      {/* Subtle Particles Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              y: Math.random() * window.innerHeight,
              x: Math.random() * window.innerWidth 
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              y: [Math.random() * window.innerHeight, -100]
            }}
            transition={{ 
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 2 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Scroll Indicator for Desktop */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="flex flex-col items-center space-y-2 text-white/70">
          <span className="text-sm font-semibold">Continue Exploring</span>
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSlider;
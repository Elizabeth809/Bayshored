// src/components/home/HeroSlider.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Palette, Award, TrendingUp } from 'lucide-react';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      title: "Discover Masterpieces",
      subtitle: "Curated Collection of Fine Art",
      description: "Explore stunning artworks from talented artists around the world",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&h=1080&fit=crop",
      cta: "Explore Gallery",
      ctaLink: "/products",
      badge: "New Collection",
      icon: Palette
    },
    {
      id: 2,
      title: "Original Artworks",
      subtitle: "Handpicked by Art Experts",
      description: "Own authentic pieces that transform your space into a gallery",
      image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1920&h=1080&fit=crop",
      cta: "Shop Now",
      ctaLink: "/products",
      badge: "Limited Edition",
      icon: Award
    },
    {
      id: 3,
      title: "Trending Artists",
      subtitle: "Rising Stars in Art World",
      description: "Support emerging artists and discover unique contemporary pieces",
      image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1920&h=1080&fit=crop",
      cta: "Meet Artists",
      ctaLink: "/artists",
      badge: "Trending Now",
      icon: TrendingUp
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* Slides */}
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => {
          const Icon = slide.icon;
          return index === currentSlide ? (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Background Image with Parallax Effect */}
              <motion.div
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10" />
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Content */}
              <div className="relative z-20 h-full flex items-center">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-3xl">
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="flex items-center space-x-2 mb-6"
                    >
                      <div className="bg-emerald-600 p-2 rounded-lg">
                        <Icon className="text-white" size={20} />
                      </div>
                      <span className="bg-emerald-600/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-500/30">
                        {slide.badge}
                      </span>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="font-parisienne text-emerald-400 text-2xl md:text-3xl mb-4"
                    >
                      {slide.subtitle}
                    </motion.p>

                    {/* Title */}
                    <motion.h1
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                    >
                      {slide.title}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl"
                    >
                      {slide.description}
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      <Link
                        to={slide.ctaLink}
                        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                      >
                        {slide.cta}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-600 rounded-full blur-3xl z-0"
              />
            </motion.div>
          ) : null;
        })}
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 md:p-4 rounded-full transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 md:p-4 rounded-full transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="group-hover:translate-x-1 transition-transform" size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'bg-emerald-600 w-12 h-3'
                : 'bg-white/50 hover:bg-white/80 w-3 h-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 hidden md:block"
      >
        <div className="flex flex-col items-center space-y-2 text-white/70">
          <span className="text-sm font-semibold">Scroll to Explore</span>
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
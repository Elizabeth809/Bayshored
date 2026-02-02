// src/components/layout/Footer.jsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Heart } from 'lucide-react';

const Footer = () => {
  const navLinks = [
    { name: 'Store', path: '/store' },
    { name: 'Virtual Gallery', path: '/virtual-gallery' },
    { name: 'Artist', path: '/artists' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const socialLinks = [
    { icon: Facebook, url: 'https://facebook.com', name: 'Facebook' },
    { icon: Instagram, url: 'https://instagram.com', name: 'Instagram' },
    { icon: Twitter, url: 'https://twitter.com', name: 'Twitter' },
    { icon: Linkedin, url: 'https://linkedin.com', name: 'LinkedIn' }
  ];

  return (
    <footer className="relative bg-gray-200 border-t border-gray-400 rounded-t-2xl overflow-hidden">
      {/* Canvas Texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.06 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Link to="/" className="inline-block group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 bg-clip-text mb-3">
                ArtGallery
              </h1>

              {/* Decorative brush stroke underline */}
              <svg className="w-64 md:w-80 h-4 mx-auto" viewBox="0 0 320 16">
                <motion.path
                  d="M 10 8 Q 80 4, 160 10 T 310 8"
                  stroke="url(#logoUnderline)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.5 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="group-hover:opacity-100 transition-opacity"
                />
                <defs>
                  <linearGradient id="logoUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(107, 114, 128)" /> {/* gray-500 */}
                    <stop offset="50%" stopColor="rgb(17, 24, 39)" />   {/* gray-900 */}
                    <stop offset="100%" stopColor="rgb(107, 114, 128)" /> {/* gray-500 */}
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </Link>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-600 mt-4 text-lg font-medium"
          >
            Curating Beauty, Inspiring Creativity
          </motion.p>
        </motion.div>

        {/* Navigation Links */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10"
        >
          {navLinks.map((link, idx) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.05 }}
            >
              <Link
                to={link.path}
                className="group relative text-gray-700 hover:text-gray-700 font-semibold text-lg transition-colors"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gray-600 to-gray-900 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </motion.nav>

        {/* Social Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center gap-4 mb-10"
        >
          {socialLinks.map((social, idx) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.5 + idx * 0.1,
                type: "spring",
                bounce: 0.5
              }}
              whileHover={{ scale: 1.15, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group w-12 h-12 bg-white hover:bg-gradient-to-br hover:from-gray-500 hover:to-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-xl border-2 border-gray-100 hover:border-gray-500 transition-all duration-300"
              aria-label={social.name}
            >
              <social.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
            </motion.a>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="w-full max-w-3xl mx-auto h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"
        />

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center text-gray-600"
        >
          <p className="flex items-center justify-center gap-2 text-sm md:text-base">
            © {new Date().getFullYear()} ArtGallery. Crafted with
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </motion.span>
            for art lovers
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
// src/components/home/AboutCompanySection.jsx
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  ArrowRight, 
  Brush, 
  Palette,
  Award,
  Users,
  Heart,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const AboutCompanySection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const values = [
    { 
      icon: Palette, 
      title: "Curated Collection", 
      desc: "Handpicked masterpieces from emerging and established artists"
    },
    { 
      icon: Award, 
      title: "Authenticity", 
      desc: "Every piece comes with a certificate of authenticity"
    },
    { 
      icon: Users, 
      title: "Artist Support", 
      desc: "We nurture and promote talented artists nationwide"
    },
    { 
      icon: Heart, 
      title: "Art Lovers First", 
      desc: "Your passion for art drives our commitment to excellence"
    }
  ];

  // Text reveal animation
  const textReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
    })
  };

  // Line draw animation
  const lineAnimation = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1, 
      transition: { duration: 1.2, ease: "easeInOut" } 
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-12 overflow-hidden bg-white"
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating animated line */}
      <motion.div
        style={{ y }}
        className="absolute top-40 right-[5%] w-px h-64 bg-gray-900/10 origin-top"
      />
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
        className="absolute bottom-40 left-[5%] w-px h-48 bg-gray-900/10 origin-bottom"
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Animated line above */}
          <motion.div
            variants={lineAnimation}
            className="w-16 h-px bg-gray-900 mx-auto mb-8 origin-left"
          />

          <motion.span
            custom={0}
            variants={textReveal}
            className="inline-block text-sm font-medium tracking-[0.3em] text-gray-900 uppercase mb-6"
          >
            About Us
          </motion.span>

          <motion.h2 
            custom={1}
            variants={textReveal}
            className="font-playfair text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Where Art Meets
          </motion.h2>

          <motion.h2 
            custom={2}
            variants={textReveal}
            className="font-playfair text-5xl lg:text-6xl font-bold text-gray-900 mb-8"
          >
            Passion & Purpose
          </motion.h2>

          <motion.p 
            custom={3}
            variants={textReveal}
            className="text-lg text-gray-900/70 leading-relaxed"
          >
            We bridge the gap between extraordinary artists and discerning collectors, 
            creating meaningful connections through carefully curated artwork.
          </motion.p>

          {/* Animated line below */}
          <motion.div
            variants={lineAnimation}
            className="w-16 h-px bg-gray-900 mx-auto mt-8 origin-right"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-32">
          
          {/* Image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <motion.div 
              className="relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                initial={{ scale: 1.2 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="aspect-[4/5] overflow-hidden"
              >
                <img
                  src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80"
                  alt="Art Gallery"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </motion.div>

              {/* Animated border */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute inset-0 border border-gray-900/20 pointer-events-none"
              />
            </motion.div>

            {/* Caption with line animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center gap-4"
            >
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="w-12 h-px bg-gray-900 origin-left"
              />
              <span className="text-sm text-gray-900/60 tracking-wide">Since 2020</span>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-10"
          >
            <motion.h3 
              custom={0}
              variants={textReveal}
              className="font-playfair text-3xl lg:text-4xl font-bold text-gray-900 leading-tight"
            >
              Bringing the finest art directly to collectors who appreciate beauty
            </motion.h3>
            
            <div className="space-y-6">
              <motion.p 
                custom={1}
                variants={textReveal}
                className="text-gray-900/70 text-lg leading-relaxed"
              >
                We believe art has the power to transform spaces and inspire lives. 
                That's why we've dedicated ourselves to discovering exceptional talent 
                and making their work accessible to you.
              </motion.p>
              <motion.p 
                custom={2}
                variants={textReveal}
                className="text-gray-900/70 text-lg leading-relaxed"
              >
                Every painting in our collection is chosen with care, authenticated with 
                precision, and delivered with pride.
              </motion.p>
            </div>

            {/* Stats - Simple inline */}
            <motion.div 
              custom={3}
              variants={textReveal}
              className="flex flex-wrap gap-x-12 gap-y-6 py-8 border-y border-gray-900/10"
            >
              {[
                { label: "Verified Artists", value: "10+" },
                { label: "Happy Collectors", value: "100+" },
                { label: "Satisfaction", value: "98%" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="group"
                >
                  <motion.div 
                    className="text-3xl font-playfair font-bold text-gray-900"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-gray-900/50 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons - Minimal */}
            <motion.div 
              custom={4}
              variants={textReveal}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link to="/store" className="group">
                <motion.div
                  className="inline-flex items-center gap-3 text-gray-900 font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="relative">
                    Explore Collection
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left"
                      initial={{ scaleX: 1 }}
                      whileHover={{ scaleX: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </Link>

              <Link to="/artists" className="group">
                <motion.div
                  className="inline-flex items-center gap-3 text-gray-900/60 font-medium hover:text-gray-900 transition-colors"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span>Meet Our Artists</span>
                  <Palette className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Section header */}
          <div className="text-center mb-20">
            <motion.div
              variants={lineAnimation}
              className="w-24 h-px bg-gray-900/20 mx-auto mb-8"
            />
            <motion.h3 
              custom={0}
              variants={textReveal}
              className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            >
              Our Guiding Principles
            </motion.h3>
            <motion.p 
              custom={1}
              variants={textReveal}
              className="text-lg text-gray-900/60 max-w-2xl mx-auto"
            >
              The values that shape every decision we make
            </motion.p>
          </div>

          {/* Values - Simple list */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                className="group text-center lg:text-left border border-gray-900/10 text-gray-900 p-4 rounded-2xl"
              >
                {/* Icon with hover animation */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center justify-center w-12 h-12 mb-6 border border-gray-900/10 text-gray-900 rounded-2xl"
                >
                  <value.icon className="w-5 h-5" strokeWidth={1.5} />
                </motion.div>

                <h4 className="font-playfair text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h4>
                
                <p className="text-gray-900/60 leading-relaxed text-sm">
                  {value.desc}
                </p>

                {/* Animated underline on hover */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  className="w-8 h-px bg-gray-900 mt-4 origin-left mx-auto lg:mx-0"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AboutCompanySection;
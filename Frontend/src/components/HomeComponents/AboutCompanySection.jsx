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
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

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

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-amber-50/30" />
      
      {/* Subtle artistic pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating paint strokes */}
      <motion.div
        style={{ y }}
        className="absolute top-20 right-[10%] w-64 h-64 opacity-10"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <motion.path
            d="M20,100 Q50,20 100,40 T180,100 Q150,180 100,160 T20,100"
            fill="none"
            stroke="#0f766e"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-block mb-6"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-teal-200 bg-white/80 backdrop-blur-sm shadow-sm">
              <Brush className="w-5 h-5 text-teal-700" />
              <span className="text-sm font-semibold text-teal-900 tracking-wider">ABOUT US</span>
            </div>
          </motion.div>

          <h2 className="font-playfair text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Where Art Meets
            <span className="block mt-2 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
              Passion & Purpose
            </span>
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed">
            We bridge the gap between extraordinary artists and discerning collectors, 
            creating meaningful connections through carefully curated artwork.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-32">
          
          {/* Gallery Images */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            {/* Main Image Frame */}
            <div className="relative">
              {/* Decorative frame shadow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-teal-100 via-emerald-50 to-amber-100 rounded-2xl rotate-1" />
              
              <motion.div 
                className="relative bg-white p-4 rounded-2xl shadow-2xl"
                whileHover={{ y: -8, rotate: -1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80"
                    alt="Art Gallery"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                {/* Frame label */}
                <div className="mt-4 text-center">
                  <p className="font-playfair text-lg text-gray-800">Curated Excellence</p>
                  <p className="text-sm text-gray-500">Since 2020</p>
                </div>
              </motion.div>

              {/* Floating small image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                whileHover={{ y: -5, rotate: 3 }}
                className="absolute -bottom-12 -right-12 w-48 bg-white p-3 rounded-xl shadow-xl hidden lg:block"
              >
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80"
                    alt="Featured Art"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Stats badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -top-6 -left-6 bg-white px-6 py-4 rounded-2xl shadow-xl border border-teal-100"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-700">500+</div>
                  <div className="text-sm text-gray-600 font-medium">Artworks</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="font-playfair text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Bringing the finest art directly to collectors who appreciate beauty
              </h3>
              
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  We believe art has the power to transform spaces and inspire lives. 
                  That's why we've dedicated ourselves to discovering exceptional talent 
                  and making their work accessible to you.
                </p>
                <p>
                  Every painting in our collection is chosen with care, authenticated with 
                  precision, and delivered with pride. We're not just selling art—we're 
                  building a community of passionate collectors and visionary artists.
                </p>
              </div>
            </div>

            {/* Key features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Verified Artists", value: "100+" },
                { label: "Happy Collectors", value: "2,000+" },
                { label: "Satisfaction Rate", value: "98%" },
                { label: "States Covered", value: "50" }
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gradient-to-br from-teal-50 to-emerald-50 p-5 rounded-xl border border-teal-100"
                >
                  <div className="text-2xl font-bold text-teal-700 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/products"
                  className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-teal-700 to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-teal-700/30 hover:shadow-xl hover:shadow-teal-700/40 transition-all"
                >
                  Explore Collection
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/artists"
                  className="inline-flex items-center justify-center gap-3 bg-white text-teal-800 px-8 py-4 rounded-xl font-semibold border-2 border-teal-200 hover:bg-teal-50 transition-all"
                >
                  Meet Our Artists
                  <Palette className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Section header */}
          <div className="text-center mb-16">
            <h3 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Guiding Principles
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The values that shape every decision we make and every relationship we build
            </p>
          </div>

          {/* Values grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 mb-6 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center"
                  >
                    <value.icon className="w-8 h-8 text-teal-700" />
                  </motion.div>

                  {/* Content */}
                  <h4 className="font-playfair text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {value.desc}
                  </p>

                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Promise Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 relative overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 rounded-3xl p-12 lg:p-16 shadow-2xl">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                  d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                  fill="white"
                  initial={{ d: "M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" }}
                  animate={{ d: "M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z" }}
                  transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                />
              </svg>
            </div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <h3 className="font-playfair text-3xl lg:text-4xl font-bold text-white mb-6">
                Our Promise to You
              </h3>
              
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                Every artwork comes with our commitment to quality, authenticity, and exceptional 
                service. We stand behind every piece we sell, ensuring your investment brings 
                joy for years to come.
              </p>

              <div className="flex flex-wrap justify-center gap-6">
                {['Free Shipping', 'Authenticity Guarantee', '30-Day Returns', '24/7 Support'].map((item, idx) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AboutCompanySection;
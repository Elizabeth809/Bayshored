// src/pages/ContactPage.jsx
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  User, 
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Clock,
  CheckCircle2,
  Sparkles,
  Heart,
  Palette
} from 'lucide-react';
import { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
      });
      setIsSubmitted(false);
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      details: "+1 (555) 123-4567",
      subDetails: "Mon-Fri 9am-6pm EST",
      color: "from-emerald-500 to-green-600"
    },
    {
      icon: Mail,
      title: "Email Us",
      details: "hello@artgallery.com",
      subDetails: "We reply within 24 hours",
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: "123 Art Street, Gallery District",
      subDetails: "New York, NY 10001",
      color: "from-green-600 to-emerald-700"
    }
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#", color: "hover:text-blue-600" },
    { icon: Instagram, name: "Instagram", url: "#", color: "hover:text-pink-600" },
    { icon: Twitter, name: "Twitter", url: "#", color: "hover:text-sky-600" },
    { icon: Linkedin, name: "LinkedIn", url: "#", color: "hover:text-blue-700" }
  ];

  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden">
      {/* Canvas Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Watercolor washes */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.1) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.12 }}
          transition={{ duration: 2.5, delay: 0.5 }}
          className="absolute -bottom-64 -right-64 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          />
        </motion.div>

        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-400/20"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * -50 - 20, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Animated Flower Drawings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 1000">
        <defs>
          <linearGradient id="flowerGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
            <stop offset="100%" stopColor="rgba(5, 150, 105, 0.1)" />
          </linearGradient>
          
          <linearGradient id="flowerGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.15)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
          </linearGradient>

          <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.15)" />
            <stop offset="100%" stopColor="rgba(22, 163, 74, 0.08)" />
          </linearGradient>
        </defs>

        {/* Flower 1 - Top Left */}
        <g>
          {/* Stem */}
          <motion.path
            d="M 150 200 Q 145 300, 160 400"
            stroke="url(#stemGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          
          {/* Leaves */}
          <motion.path
            d="M 150 280 Q 120 290, 110 280 Q 120 270, 150 280"
            fill="url(#stemGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            style={{ transformOrigin: '150px 280px' }}
          />
          <motion.path
            d="M 155 320 Q 185 330, 195 320 Q 185 310, 155 320"
            fill="url(#stemGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            style={{ transformOrigin: '155px 320px' }}
          />

          {/* Flower petals - drawing animation */}
          {[0, 72, 144, 216, 288].map((rotation, i) => (
            <motion.ellipse
              key={i}
              cx="150"
              cy="170"
              rx="25"
              ry="45"
              fill="url(#flowerGradient1)"
              transform={`rotate(${rotation} 150 200)`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2 + i * 0.1 }}
              style={{ transformOrigin: '150px 200px' }}
            />
          ))}
          
          {/* Flower center */}
          <motion.circle
            cx="150"
            cy="200"
            r="15"
            fill="rgba(245, 158, 11, 0.3)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 2.8 }}
          />
          <motion.circle
            cx="150"
            cy="200"
            r="8"
            fill="rgba(217, 119, 6, 0.4)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 3 }}
          />
        </g>

        {/* Flower 2 - Top Right */}
        <g>
          <motion.path
            d="M 1050 150 Q 1055 280, 1040 380"
            stroke="url(#stemGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
          
          {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
            <motion.ellipse
              key={i}
              cx="1050"
              cy="120"
              rx="20"
              ry="40"
              fill="url(#flowerGradient2)"
              transform={`rotate(${rotation} 1050 150)`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.5 + i * 0.08 }}
              style={{ transformOrigin: '1050px 150px' }}
            />
          ))}
          
          <motion.circle
            cx="1050"
            cy="150"
            r="12"
            fill="rgba(236, 72, 153, 0.3)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 3.3 }}
          />
        </g>

        {/* Flower 3 - Bottom Left */}
        <g>
          <motion.path
            d="M 200 850 Q 195 750, 210 650"
            stroke="url(#stemGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
          />
          
          <motion.path
            d="M 200 750 Q 170 760, 160 750 Q 170 740, 200 750"
            fill="url(#stemGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            style={{ transformOrigin: '200px 750px' }}
          />

          {[0, 90, 180, 270].map((rotation, i) => (
            <motion.path
              key={i}
              d="M 200 650 Q 180 620, 200 590 Q 220 620, 200 650"
              fill="url(#flowerGradient1)"
              transform={`rotate(${rotation} 200 650)`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 3 + i * 0.12 }}
              style={{ transformOrigin: '200px 650px' }}
            />
          ))}
          
          <motion.circle
            cx="200"
            cy="650"
            r="18"
            fill="rgba(16, 185, 129, 0.3)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 3.8 }}
          />
        </g>

        {/* Decorative Swirls and Vines */}
        <motion.path
          d="M 400 100 Q 450 80, 500 100 T 600 100 Q 650 120, 700 100"
          stroke="rgba(16, 185, 129, 0.1)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 1 }}
        />

        <motion.path
          d="M 500 900 Q 550 920, 600 900 T 700 900 Q 750 880, 800 900"
          stroke="rgba(34, 197, 94, 0.1)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 1.5 }}
        />

        {/* Small decorative circles */}
        {[...Array(12)].map((_, i) => (
          <motion.circle
            key={`circle-${i}`}
            cx={300 + i * 70}
            cy={50 + Math.sin(i) * 30}
            r="3"
            fill="rgba(16, 185, 129, 0.2)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2 + i * 0.1, duration: 0.4 }}
          />
        ))}
      </svg>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
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
              Get In Touch
            </span>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </motion.div>
          </motion.div>

          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Let's Create{' '}
            <span className="text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text">
              Together
            </span>
          </h1>

          {/* Decorative underline */}
          <div className="flex justify-center mb-6">
            <svg className="w-96 h-8" viewBox="0 0 400 30">
              <motion.path
                d="M 20 15 Q 100 8, 200 18 T 380 15"
                stroke="url(#contactUnderline)"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="contactUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                  <stop offset="50%" stopColor="rgb(5, 150, 105)" />
                  <stop offset="100%" stopColor="rgb(4, 120, 87)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
            Have a question about our collection? Want to commission a piece? 
            We'd love to hear from you and help bring art into your life.
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {contactInfo.map((info, idx) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className="relative h-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-emerald-100 transition-all duration-500 overflow-hidden">
                {/* Gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`relative w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto transform rotate-3 group-hover:rotate-6 transition-transform`}
                >
                  <info.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  
                  {/* Glow effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${info.color} rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Content */}
                <div className="text-center relative z-10">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    {info.title}
                  </h3>
                  <p className="text-emerald-700 font-semibold mb-1">
                    {info.details}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {info.subDetails}
                  </p>
                </div>

                {/* Bottom accent */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${info.color}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Contact Section */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-emerald-100 relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/50 to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <MessageSquare className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-playfair text-3xl font-bold text-gray-900">
                      Send a Message
                    </h2>
                    <p className="text-gray-600">We'll respond within 24 hours</p>
                  </div>
                </div>

                {isSubmitted ? (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. We'll get back to you soon!
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-gray-900"
                          placeholder="John Doe"
                        />
                      </div>
                    </motion.div>

                    {/* Phone & Email Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Phone className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-gray-900"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Mail className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-gray-900"
                            placeholder="john@example.com"
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Subject */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-gray-900"
                        placeholder="How can we help you?"
                      />
                    </motion.div>

                    {/* Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-gray-900 resize-none"
                        placeholder="Tell us about your inquiry..."
                      />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Animated shimmer */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                        animate={{ x: isSubmitting ? ['-100%', '200%'] : '-100%' }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: isSubmitting ? Infinity : 0,
                          ease: "linear" 
                        }}
                      />
                      
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-6 h-6" />
                            </motion.div>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >

            {/* Social Media */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-emerald-100 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-100/50 to-transparent rounded-tr-full" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="font-playfair text-2xl font-bold text-gray-900">
                    Follow Our Journey
                  </h3>
                </div>

                <p className="text-gray-600 mb-6">
                  Stay connected and be the first to see new collections, artist features, and exclusive events.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social, idx) => (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + idx * 0.1, type: "spring", bounce: 0.5 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={`flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 transition-all group ${social.color}`}
                    >
                      <social.icon className="w-6 h-6 text-gray-600 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-gray-700">{social.name}</span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
              {/* Animated background pattern */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px',
                }}
              />

              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                >
                  <MapPin className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="font-playfair text-3xl font-bold mb-4">
                  Visit Our Gallery
                </h3>
                
                <p className="text-white/90 text-lg mb-6 leading-relaxed">
                  Experience our collection in person. Our gallery is located in the heart of the art district, featuring rotating exhibitions and artist meet-and-greets.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">123 Art Street, Gallery District</p>
                      <p className="text-white/80">New York, NY 10001</p>
                    </div>
                  </div>
                </div>

                <motion.a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Get Directions
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.div>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Decorative Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-20"
        >
          <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-emerald-100">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <p className="font-playfair text-2xl md:text-3xl text-gray-800 italic mb-4">
              "Art is not what you see, but what you make others see."
            </p>
            <p className="text-emerald-700 font-semibold">— Edgar Degas</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
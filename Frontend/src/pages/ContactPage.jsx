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
  CheckCircle2,
  Sparkles,
  Building2,
  Navigation,
  Clock
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
      icon: Building2,
      title: "Location",
      details: "The Grand Retail Plaza",
      subDetails: "1717 N Bayshore Dr #121",
      fullAddress: "Miami, FL 33132, United States"
    },
    {
      icon: Phone,
      title: "Phone",
      details: "+1 305-371-3060",
      subDetails: "Mon-Fri 10am-8pm EST",
      fullAddress: "Sat-Sun 11am-6pm EST"
    },
    {
      icon: Mail,
      title: "Email",
      details: "bayshoreart@gmail.com",
      subDetails: "We reply within 24 hours",
      fullAddress: "Contact us anytime"
    }
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#" },
    { icon: Instagram, name: "Instagram", url: "#" },
    { icon: Twitter, name: "Twitter", url: "#" },
    { icon: Linkedin, name: "LinkedIn", url: "#" }
  ];

  // Google Maps embed URL for the exact address
  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.883147443072!2d-80.18739172422224!3d25.78618917737203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b6823bcf83f7%3A0xef6b2824b4e9f65f!2s1717%20N%20Bayshore%20Dr%20%23121%2C%20Miami%2C%20FL%2033132%2C%20USA!5e0!3m2!1sen!2s!4v1701200000000!5m2!1sen!2s";

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gray-900/10"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <MapPin className="w-8 h-8 text-gray-900" />
            <Sparkles className="w-6 h-6 text-gray-900" />
            <Building2 className="w-8 h-8 text-gray-900" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 mb-4">
            Visit Our Gallery
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Located in The Grand Retail Plaza, Miami. Experience art in person at our beautiful gallery space.
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {contactInfo.map((info, idx) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg p-6 text-center"
            >
              <motion.div
                className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <info.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="font-medium text-gray-900 text-lg mb-2">
                {info.title}
              </h3>
              <p className="text-gray-900 font-medium mb-1">
                {info.details}
              </p>
              <p className="text-gray-600 text-sm mb-1">
                {info.subDetails}
              </p>
              <p className="text-gray-500 text-xs">
                {info.fullAddress}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-6 border-b border-gray-100">
              <Navigation className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-medium text-gray-900">
                Find Us on the Map
              </h2>
            </div>
            
            {/* Google Maps Embed */}
            <div className="relative h-96">
              <iframe
                src={googleMapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bayshore Art Gallery Location"
                className="absolute inset-0"
              />
              {/* Overlay to make map interactive */}
              <div className="absolute inset-0 pointer-events-none" />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600">📍 Navigate to:</p>
                  <p className="font-medium text-gray-900">The Grand Retail Plaza</p>
                  <p className="text-sm text-gray-600">1717 N Bayshore Dr #121, Miami, FL 33132</p>
                </div>
                <a
                  href="https://maps.google.com/?q=1717+N+Bayshore+Dr+%23121,+Miami,+FL+33132"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Contact Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-medium text-gray-900">
                    Send a Message
                  </h2>
                  <p className="text-gray-600 text-sm">We'll respond within 24 hours</p>
                </div>
              </div>

              {isSubmitted ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600">
                    Thank you for reaching out. We'll get back to you soon!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Phone & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Phone className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900"
                      placeholder="How can we help you?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-900 resize-none"
                      placeholder="Tell us about your inquiry..."
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Right Side - Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Hours of Operation */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
                >
                  <Clock className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    Gallery Hours
                  </h3>
                  <p className="text-gray-600 text-sm">Visit us at these times</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="font-medium text-gray-900">10:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Saturday</span>
                  <span className="font-medium text-gray-900">11:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Sunday</span>
                  <span className="font-medium text-gray-900">11:00 AM - 6:00 PM</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> Extended hours available by appointment for private viewings.
                </p>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
                >
                  <Building2 className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900">
                  Connect With Us
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Follow our journey on social media for gallery updates, artist features, and exhibition previews.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social, idx) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <social.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">{social.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Contact */}
            <div className="bg-gray-900 text-white rounded-lg p-6">
              <h3 className="text-xl font-medium mb-4">
                Need Immediate Assistance?
              </h3>
              
              <p className="text-white/80 mb-4">
                For urgent inquiries during business hours, call us directly:
              </p>

              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5" />
                <a 
                  href="tel:+13053713060" 
                  className="text-xl font-medium hover:text-white/90 transition-colors"
                >
                  +1 305-371-3060
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <a 
                  href="mailto:bayshoreart@gmail.com" 
                  className="font-medium hover:text-white/90 transition-colors"
                >
                  bayshoreart@gmail.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            
            <p className="text-lg text-gray-600 italic mb-2">
              "Art enables us to find ourselves and lose ourselves at the same time."
            </p>
            <p className="text-gray-900 font-medium">— Thomas Merton</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
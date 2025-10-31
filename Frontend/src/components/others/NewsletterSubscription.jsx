import { useState, useEffect } from 'react';

// --- MOCK DEPENDENCIES TO FIX IMPORT ERRORS ---

// Mock for './clientApiUrl'
// We use an empty string so fetch requests are relative to the current origin.
const CLIENT_BASE_URL = '';

// Mock for './LoadingSpinner'
const LoadingSpinner = ({ size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    large: 'w-10 h-10',
  };
  return (
    <svg
      className={`animate-spin ${sizeClasses[size] || 'w-5 h-5'} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

// Mock for '../../context/AuthContext'
// --- FIX: Define mock data outside the hook to prevent re-creation ---
// This ensures the 'user' object is stable and doesn't trigger the infinite loop.
const mockAuthData = {
  isAuthenticated: true,
  user: {
    name: 'Alice Artist',
    email: 'alice@example.com'
  }
};
// const mockAuthData = { isAuthenticated: false, user: null }; // For testing logged-out state

const useAuth = () => {
  // Return the stable mock data object
  return mockAuthData;
};

// --- END OF MOCK DEPENDENCIES ---


// --- Style Injector Component ---
// This adds the Google Font and all our custom animations
// directly into the component for a single-file solution.
const StyleInjector = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
    
    .font-playfair {
      font-family: 'Playfair Display', serif;
    }

    // --- Floating Icons Animation ---
    .art-icon-float {
      position: absolute;
      display: block;
      color: rgba(99, 102, 241, 0.15); // Light indigo
      animation: float-up 20s linear infinite;
      bottom: -150px;
    }

    @keyframes float-up {
      0% {
        transform: translateY(0);
        opacity: 0.1;
      }
      100% {
        transform: translateY(-100vh);
        opacity: 0;
      }
    }

    // --- Frame Shimmer Animation ---
    .frame-shimmer::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(255, 255, 255, 0.3) 50%,
        transparent 100%
      );
      transform: rotate(25deg);
      animation: shimmer 5s infinite linear;
      opacity: 0.7;
    }

    @keyframes shimmer {
      0% {
        transform: rotate(25deg) translateX(-150%);
      }
      100% {
        transform: rotate(25deg) translateX(150%);
      }
    }
  `}</style>
);

// --- Floating Icons Background Component ---
const FloatingArtIcons = () => {
  // Icons: Paintbrush, Palette, Frame, Sculpture/Bust
  const icons = [
    { d: 'M19.58,2.5c-1.03-0.51-2.2-0.7-3.41-0.7c-2.43,0-4.68,1.2-6.24,3.15L3.29,11.59c-0.39,0.39-0.39,1.02,0,1.41l7.07,7.07c0.39,0.39,1.02,0.39,1.41,0l6.64-6.64C19.83,11.99,21,10.05,21,7.91c0-1.18-0.19-2.31-0.68-3.36L19.58,2.5z M18.17,11.17l-5.66,5.66l-5.66-5.66l5.66-5.66C13.23,4.79,14.3,4.3,15.5,4.3c0.91,0,1.75,0.26,2.46,0.71L18.17,11.17z M2.92,19.08L6.7,15.3l1.41,1.41l-3.77,3.77c-0.39,0.39-1.02,0.39-1.41,0C2.53,20.1,2.53,19.47,2.92,19.08z', size: 'w-16 h-16' },
    { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.69-.28 3.89-.77l.31-.12c.3-.11.49-.39.49-.7v-1.8c0-.28-.14-.54-.38-.69l-.21-.13c-1.63-1.03-2.6-2.9-2.6-4.91 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.01-.97 3.88-2.6 4.91l-.21.13c-.24.15-.38.41-.38.69v1.8c0 .31.19.59.49.7l.31.12C19.31 21.72 20.62 22 22 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z', size: 'w-12 h-12' },
    { d: 'M20 4v12H8V4h12m0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z', size: 'w-20 h-20' },
    { d: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM11.5 11.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.42 2.08c-.01.01-.01.02 0 .03 1.18.63 2.08 1.8 2.08 3.14V18H9.25v-1.25c0-1.34.9-2.51 2.08-3.14.01-.01.01-.02 0-.03C9.09 13.04 8 10.96 8 8.5c0-2.39 1.4-4.46 3.5-5.32 2.1-.87 4.54-.08 5.8 1.86C18.6 6.77 19.5 9 19 11.5c-.37 1.91-1.4 3.57-2.92 4.67-1.11.8-2.45 1.23-3.83 1.23-.9 0-1.76-.15-2.58-.42z', size: 'w-10 h-10' },
  ];

  return (
    <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none" aria-hidden="true">
      {icons.map((icon, i) => (
        <svg
          key={i}
          className={`art-icon-float ${icon.size}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d={icon.d} />
        </svg>
      ))}
    </div>
  );
};

// --- Animated Art Frame Component ---
const ArtFrame = () => (
  <div className="w-full max-w-sm mx-auto group">
    <div className="relative p-2 rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
      <div className="relative p-1 bg-white rounded-sm frame-shimmer overflow-hidden">
        <img 
          src="https://placehold.co/600x400/6366f1/f1f1f1?text=Your+Art+Here&font=playfair+display" 
          alt="Abstract art" 
          className="w-full h-auto rounded-sm"
        />
      </div>
    </div>
  </div>
);

// --- Main Newsletter Subscription Component ---
const NewsletterSubscription = ({ variant = 'default' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const { isAuthenticated, user } = useAuth();

  // --- BUG FIX ---
  // Replaced `useState` initializer with `useEffect` to correctly
  // pre-fill the form when the `user` object becomes available.
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/subscribers/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      // --- BUG FIX ---
      // Added check for `response.ok` to catch server errors
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred. Please try again.');
      }

      setMessage(data.message);
      setMessageType('success');
      
      // Clear form only if user wasn't pre-filled
      if (!isAuthenticated) {
        setFormData({ name: '', email: '' });
      }

    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // --- Re-themed 'footer' variant ---
  if (variant === 'footer') {
    return (
      <div className="bg-gray-800 rounded-lg !p-6">
        <h3 className="font-playfair text-white text-2xl font-bold !mb-3">
          Stay Inspired
        </h3>
        <p className="text-gray-300 text-sm !mb-4">
          Get the latest artwork, artist stories, and exclusive offers delivered to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="!space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full !px-3 !py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full !px-3 !py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full !py-2 !px-4 rounded-lg font-medium text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" /> : 'Subscribe'}
          </button>
        </form>

        {message && (
          <div className={`!mt-3 !p-2 rounded text-sm ${
            messageType === 'success' 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <p className="text-gray-400 text-xs !mt-3">
          By subscribing, you agree to our Privacy Policy.
        </p>
      </div>
    );
  }

  // --- Re-themed 'inline' variant ---
  if (variant === 'inline') {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg !p-6">
        <div className="flex items-start !space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
              <svg className="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.58,2.5c-1.03-0.51-2.2-0.7-3.41-0.7c-2.43,0-4.68,1.2-6.24,3.15L3.29,11.59c-0.39,0.39-0.39,1.02,0,1.41l7.07,7.07c0.39,0.39,1.02,0.39,1.41,0l6.64-6.64C19.83,11.99,21,10.05,21,7.91c0-1.18-0.19-2.31-0.68-3.36L19.58,2.5z M18.17,11.17l-5.66,5.66l-5.66-5.66l5.66-5.66C13.23,4.79,14.3,4.3,15.5,4.3c0.91,0,1.75,0.26,2.46,0.71L18.17,11.17z M2.92,19.08L6.7,15.3l1.41,1.41l-3.77,3.77c-0.39,0.39-1.02,0.39-1.41,0C2.53,20.1,2.53,19.47,2.92,19.08z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-playfair text-xl font-bold text-indigo-900 !mb-1">
              Never Miss New Art
            </h3>
            <p className="text-gray-700 !mb-4">
              Join our newsletter for exclusive artwork previews and special offers.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 !space-y-2 sm:!space-y-0 sm:flex sm:!space-x-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full !px-3 !py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full !px-3 !py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white !py-2 !px-6 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center whitespace-nowGrap"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Subscribe'}
              </button>
            </form>

            {message && (
              <div className={`!mt-3 !p-2 rounded text-sm ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- NEW 'default' variant ---
  // This is now a feature component with the frame and animations
  return (
    <>
      <StyleInjector />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Floating Icons in Background */}
        <FloatingArtIcons />

        <div className="relative z-10 grid md:grid-cols-2 items-center">
          
          {/* Left Side: Image Frame */}
          <div className="!p-8 lg:!p-12 bg-gray-50/50 backdrop-blur-sm md:border-r border-gray-100">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-gray-900 !mb-3">
              Become an Insider
            </h2>
            <p className="text-gray-600 !mb-6 lg:!mb-8">
              Get exclusive access to new collections, artist interviews, and private sales.
            </p>
            <ArtFrame />
          </div>

          {/* Right Side: Form */}
          <div className="!p-8 lg:!p-12">
            <h3 className="font-playfair text-2xl font-bold text-gray-900 !mb-4">
              Join Our Art Community
            </h3>
            
            <form onSubmit={handleSubmit} className="!space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700 !mb-1 !block">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700 !mb-1 !block">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Your email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-semibold !py-3 !px-4 rounded-lg hover:from-yellow-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" className="!mr-2" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </form>

            {message && (
              <div className={`!mt-4 !p-3 rounded-lg text-sm ${
                messageType === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <p className="text-gray-500 text-xs text-center !mt-5">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsletterSubscription;


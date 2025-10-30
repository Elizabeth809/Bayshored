import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { CLIENT_BASE_URL } from './clientApiUrl';

const NewsletterSubscription = ({ variant = 'default' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const { isAuthenticated, user } = useAuth();

  // Pre-fill form if user is authenticated
  useState(() => {
    if (isAuthenticated && user) {
      setFormData({
        name: user.name,
        email: user.email
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

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setFormData({ name: '', email: '' });
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to subscribe. Please try again.');
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

  // Different variants for different placements
  if (variant === 'footer') {
    return (
      <div className="bg-gray-900 rounded-lg !p-6">
        <h3 className="text-white text-lg font-semibold !mb-3">
          Stay Updated with Art
        </h3>
        <p className="text-gray-300 text-sm !mb-4">
          Get the latest artwork collections, artist stories, and exclusive offers delivered to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="!space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full !px-3 !py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full !px-3 !py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white !py-2 !px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" /> : 'Subscribe'}
          </button>
        </form>

        {message && (
          <div className={`!mt-3 !p-2 rounded text-sm ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <p className="text-gray-400 text-xs !mt-3">
          By subscribing, you agree to our Privacy Policy and consent to receive art updates.
        </p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg !p-6">
        <div className="flex items-start !space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">✉️</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 !mb-2">
              Never Miss New Art
            </h3>
            <p className="text-gray-600 !mb-4">
              Join our newsletter for exclusive artwork previews, artist interviews, and special offers.
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
                  className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white !py-2 !px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center whitespace-nowrap"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Subscribe'}
              </button>
            </form>

            {message && (
              <div className={`!mt-3 !p-2 rounded text-sm ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant (for sidebar, popup, etc.)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
      <div className="text-center !mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center !mx-auto !mb-3">
          <span className="text-blue-600 text-2xl">🎨</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 !mb-2">
          Join Our Art Community
        </h3>
        <p className="text-gray-600">
          Get curated art insights, new collection alerts, and exclusive subscriber benefits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="!space-y-3">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Your full name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Your email address"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white !py-3 !px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="small" className="!mr-2" />
              Subscribing...
            </>
          ) : (
            'Subscribe to Newsletter'
          )}
        </button>
      </form>

      {message && (
        <div className={`!mt-3 !p-3 rounded text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <p className="text-gray-500 text-xs text-center !mt-4">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsletterSubscription;
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NewsletterSubscription from '../components/others/NewsletterSubscription';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 !mb-6">
          Discover Amazing Art
        </h1>
        <p className="text-xl text-gray-600 !mb-8 max-w-2xl !mx-auto">
          Explore our curated collection of beautiful artworks from talented artists around the world.
        </p>
        <div className="!space-x-4">
          <Link
            to="/store"
            className="bg-blue-600 text-white !px-8 !py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Shop Now
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="border border-blue-600 text-blue-600 !px-8 !py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition duration-200"
            >
              Join Now
            </Link>
          )}
        </div>
      </div>
      <NewsletterSubscription />
    </div>
  );
};

export default Home;

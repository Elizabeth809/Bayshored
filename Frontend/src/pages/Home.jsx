import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MERN Art</h1>
            </div>
            <div className="flex items-center !space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700">Welcome, {user?.name}</span>
                  <Link
                    to="/profile"
                    className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900 !px-3 !py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-20">
        <div className="text-center">
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
      </div>
    </div>
  );
};

export default Home;
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900">
            MERN <span className="text-blue-600">Art</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center !space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              Home
            </Link>
            <Link
              to="/store"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              Store
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              Contact
            </Link>
            <Link
              to="/cart"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              Cart
            </Link>
            <Link
              to="/wishlist"
              className="text-gray-700 hover:text-blue-600 transition duration-200 font-medium"
            >
              Wishlist
            </Link>

            {isAuthenticated ? (
              <>
                <span className="text-gray-700 font-medium">
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white !px-4 !py-2 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium"
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
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-sm">
          <div className="!px-4 !py-4 !space-y-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              Home
            </Link>
            <Link
              to="/store"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              Store
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              Contact
            </Link>
            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              Contact
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 font-medium"
            >
              Wishlist
            </Link>

            {isAuthenticated ? (
              <>
                <span className="block text-gray-700 font-medium">
                  Hi, {user?.name}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left bg-red-500 text-white !px-4 !py-2 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block bg-blue-600 text-white !px-4 !py-2 rounded-lg text-center hover:bg-blue-700 transition duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

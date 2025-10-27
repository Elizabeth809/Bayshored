import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom hook (no changes)
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const Header = () => {
  const { isAuthenticated, user, logout, cartCount, wishlistCount } = useAuth();
  
  // --- START OF FIX ---
  // cartItemsCount is now a number directly from the context
  const { cartItemsCount } = useCart();
  // We no longer need this line: const cartCount = getCartItemsCount();
  // --- END OF FIX ---
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const navigate = useNavigate();
  const avatarMenuRef = useRef(null);

  useClickOutside(avatarMenuRef, () => setIsAvatarMenuOpen(false));

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [navigate]);

  const handleLogout = async () => {
    setIsAvatarMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/', end: true },
    { name: 'Store', href: '/store', end: false },
    { name: 'Gallery', href: '/virtual-gallery', end: false },
    { name: 'Artists', href: '/artists', end: false },
    { name: 'About', href: '/about', end: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
          {/* Logo - Left (no changes) */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center !space-x-2 group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <motion.div 
                  className="absolute inset-0 border-2 border-blue-200 rounded-xl"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  ArtGallery
                </span>
                <span className="text-xs text-gray-500 -!mt-1">Premium Artworks</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links - Center (Desktop) (no changes) */}
          <div className="hidden lg:flex lg:items-center lg:!space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                end={link.end}
                className={({ isActive }) =>
                  `relative !py-2 font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{link.name}</span>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        layoutId="activeNav"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Icons & Avatar - Right */}
          <div className="flex items-center !space-x-4 lg:space-x-6">
            
            {/* Wishlist Icon (no changes) */}
            <Link
              to="/wishlist"
              className="relative !p-2 text-gray-600 hover:text-red-500 transition-all duration-200 hover:scale-110 group"
              aria-label="Wishlist"
            >
              <Heart 
                size={22} 
                className="group-hover:fill-red-500 group-hover:stroke-red-500 transition-all duration-200" 
              />
              {wishlistCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg"
                >
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </motion.span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative !p-2 text-gray-600 hover:text-blue-600 transition-all duration-200 hover:scale-110 group"
              aria-label="Cart"
            >
              <ShoppingCart 
                size={22} 
                className="group-hover:stroke-blue-600 transition-all duration-200" 
              />
              {/* Now using cartCount from AuthContext */}
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </Link>

            {/* Avatar Dropdown or Auth Buttons (no changes) */}
            <div className="hidden lg:block">
              {isAuthenticated ? (
                <div className="relative" ref={avatarMenuRef}>
                  <button
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className="flex items-center !space-x-2 p-1 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                    aria-label="User menu"
                  >
                    <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-semibold shadow-lg">
                      {user?.name ? user.name[0].toUpperCase() : <User size={16} />}
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform duration-200 ${
                        isAvatarMenuOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  <AvatarDropdown
                    isOpen={isAvatarMenuOpen}
                    user={user}
                    onLogout={handleLogout}
                    onClose={() => setIsAvatarMenuOpen(false)}
                  />
                </div>
              ) : (
                <div className="flex items-center !space-x-3">
                  <Link
                    to="/login"
                    className="!px-4 !py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="!px-6 !py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-blue-200"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button (no changes) */}
            <button
              className="lg:hidden !p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="animate-spin-in" />
              ) : (
                <Menu size={24} className="animate-spin-in" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navLinks={navLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        cartCount={cartItemsCount} // Pass the number here
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
};

// Avatar Dropdown Component (no changes)
const AvatarDropdown = ({ isOpen, user, onLogout, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-md"
      >
        <div className="!p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center !space-x-4">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-xl shadow-lg">
              {user?.name ? user.name[0].toUpperCase() : <User size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-lg truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate !mt-1">{user?.email}</p>
              <p className="text-xs text-blue-600 font-medium !mt-2">Premium Member</p>
            </div>
          </div>
        </div>
        <div className="!p-2">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
          >
            <User size={18} className="!mr-3 text-gray-400 group-hover:text-blue-600" />
            <span className="font-medium">My Profile</span>
          </Link>
          
          <Link
            to="/orders"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
          >
            <Package size={18} className="!mr-3 text-gray-400 group-hover:text-blue-600" />
            <span className="font-medium">My Orders</span>
          </Link>
          
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
          >
            <Settings size={18} className="!mr-3 text-gray-400 group-hover:text-blue-600" />
            <span className="font-medium">Account Settings</span>
          </Link>
        </div>
        <div className="border-t border-gray-100 !p-2">
          <button
            onClick={onLogout}
            className="flex items-center w-full !px-4 !py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          >
            <LogOut size={18} className="!mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Mobile Menu Component
const MobileMenu = ({ 
  isOpen, 
  navLinks, 
  isAuthenticated, 
  user, 
  cartCount, // This prop now receives the number directly
  wishlistCount, 
  onLogout, 
  onClose 
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="lg:hidden bg-white border-t border-gray-100 shadow-2xl"
      >
        <div className="!px-4 !py-6 !space-y-1">
          
          {/* Navigation Links (no changes) */}
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center !px-4 !py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          
          {/* Auth Section */}
          <div className="border-t border-gray-100 !pt-6 !space-y-4">
            {isAuthenticated ? (
              <>
                <div className="!px-4 !py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500 !mt-1">{user?.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 !px-4">
                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="flex items-center justify-center !p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <ShoppingCart size={18} className="!mr-2" />
                    {/* --- START OF FIX --- */}
                    {/* Use cartCount prop directly */}
                    Cart {cartCount > 0 && `(${cartCount})`}
                    {/* --- END OF FIX --- */}
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={onClose}
                    className="flex items-center justify-center !p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors group"
                  >
                    <Heart size={18} className="!mr-2" />
                    Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                  </Link>
                </div>
                
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center !px-4 !py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <User size={20} className="!mr-3 text-gray-400" />
                  My Profile
                </Link>
                
                <Link
                  to="/orders"
                  onClick={onClose}
                  className="flex items-center !px-4 !py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Package size={20} className="!mr-3 text-gray-400" />
                  My Orders
                </Link>
                
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center w-full !px-4 !py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={20} className="!mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center justify-center !px-4 !py-3 text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex items-center justify-center !px-4 !py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Header;
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext'; // Use this for cart count
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
  // Use `wishlistCount` from auth, but `cartItemsCount` from useCart
  const { isAuthenticated, user, logout, wishlistCount } = useAuth();
  const { cartItemsCount } = useCart(); // This is the source of truth for cart
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const navigate = useNavigate();
  const avatarMenuRef = useRef(null);

  useClickOutside(avatarMenuRef, () => setIsAvatarMenuOpen(false));

  // Close menus on navigation
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    if (isAvatarMenuOpen) {
      setIsAvatarMenuOpen(false);
    }
  }, [navigate]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsAvatarMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/', end: true },
    { name: 'Store', href: '/store', end: false },
    { name: 'Virtual Gallery', href: '/virtual-gallery', end: false },
    { name: 'Artists', href: '/artists', end: false },
    { name: 'About', href: '/about', end: false },
    { name: 'Contact', href: '/contact', end: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-neutral-200 shadow-sm font-playfair">
        <nav className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo - Left */}
            <div className="flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center !space-x-2 group"
                title="ArtGallery Home"
              >
                {/*  */}
                <span className="font-parisienne text-4xl font-bold text-gray-700 group-hover:opacity-80 transition-opacity">
                  ArtGallery
                </span>
              </Link>
            </div>

            {/* Navigation Links - Center (Desktop) */}
            <div className="hidden lg:flex lg:items-center lg:!space-x-10">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.href}
                  end={link.end}
                  className={({ isActive }) =>
                    `relative !py-2 text-base font-medium transition-all duration-200 ${
                      isActive 
                        ? 'text-gray-800' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{link.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700 rounded-full"
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
            <div className="flex items-center !space-x-4">
              
              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="relative !p-2 text-gray-600 hover:text-red-500 transition-all duration-200 hover:scale-110 group"
                aria-label="Wishlist"
              >
                <Heart 
                  size={24} 
                  className="group-hover:fill-red-100 transition-all duration-200" 
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
                className="relative !p-2 text-gray-600 hover:text-gray-700 transition-all duration-200 hover:scale-110 group"
                aria-label="Cart"
              >
                <ShoppingCart 
                  size={24} 
                  className="transition-all duration-200" 
                />
                {/* Use cartItemsCount from useCart */}
                {cartItemsCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gray-700 text-white text-xs font-bold rounded-full shadow-lg"
                  >
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </motion.span>
                )}
              </Link>

              {/* Avatar Dropdown or Auth Buttons (Desktop) */}
              <div className="hidden lg:block !p-4">
                {isAuthenticated ? (
                  <div className="relative" ref={avatarMenuRef}>
                    <button
                      onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                      className="flex items-center !space-x-2 !p-1 rounded-full hover:bg-neutral-100 transition-all duration-200 border border-transparent hover:border-neutral-200 cursor-pointer"
                      aria-label="User menu"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-700 text-white rounded-full font-semibold shadow-lg cursor-pointer text-lg !p-4">
                        {user?.name ? user.name[0].toUpperCase() : <User size={18} />}
                      </div>
                      <ChevronDown 
                        size={18} 
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
                      className="!px-4 !py-2 text-base font-medium text-gray-700 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="!px-6 !py-2 text-base font-medium text-white bg-gray-700 rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-gray-100 cursor-pointer"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden !p-2 text-gray-700 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle mobile menu"
              >
                <Menu size={26} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Panel */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navLinks={navLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        cartCount={cartItemsCount} // Pass the number from useCart
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

// Avatar Dropdown Component (Re-themed)
const AvatarDropdown = ({ isOpen, user, onLogout, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden"
      >
        <div className="!p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center !space-x-4">
            <div className="flex items-center justify-center w-14 h-14 bg-gray-700 text-white rounded-2xl font-semibold text-xl shadow-lg">
              {user?.name ? user.name[0].toUpperCase() : <User size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-lg truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate !mt-1">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="!p-2">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
          >
            <User size={18} className="!mr-3 text-gray-400 group-hover:text-gray-700" />
            <span className="font-medium">My Profile</span>
          </Link>
          
          <Link
            to="/orders"
            onClick={onClose}
            className="flex items-center w-full !px-4 !py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
          >
            <Package size={18} className="!mr-3 text-gray-400 group-hover:text-gray-700" />
            <span className="font-medium">My Orders</span>
          </Link>
        </div>
        <div className="border-t border-neutral-100 !p-2">
          <button
            onClick={onLogout}
            className="flex items-center w-full !px-4 !py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <LogOut size={18} className="!mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Mobile Menu Component (Redesigned as a Slide-in Panel)
const MobileMenu = ({ 
  isOpen, 
  navLinks, 
  isAuthenticated, 
  user, 
  cartCount, 
  wishlistCount, 
  onLogout, 
  onClose 
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />
        
        {/* Panel */}
        <motion.div
          className="fixed inset-y-0 right-0 w-80 max-w-[calc(100%-4rem)] bg-white z-50 lg:hidden flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between !p-6 border-b border-neutral-200">
            <span className="font-parisienne text-2xl font-bold text-gray-700">Menu</span>
            <button
              onClick={onClose}
              className="!p-2 text-gray-600 hover:text-gray-900 hover:bg-neutral-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto !p-6 !space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center !px-4 !py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gray-50 text-gray-700' 
                      : 'text-gray-700 hover:bg-neutral-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>
          
          {/* Auth & Actions Section */}
          <div className="!p-6 border-t border-neutral-200 !space-y-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center !space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-700 text-white rounded-full font-semibold text-lg shadow-md">
                    {user?.name ? user.name[0].toUpperCase() : <User size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 !p-3 bg-neutral-100 text-gray-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                  >
                    <User size={18} /> Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 !p-3 bg-neutral-100 text-gray-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                  >
                    <Package size={18} /> Orders
                  </Link>
                </div>
                
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center justify-center w-full !px-4 !py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <LogOut size={20} className="mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center justify-center w-full !px-4 !py-3 text-gray-700 hover:bg-neutral-50 rounded-xl border border-neutral-200 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex items-center justify-center w-full !px-4 !py-3 text-white bg-gray-700 rounded-xl hover:bg-gray-800 transition-all shadow-lg font-medium"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default Header;
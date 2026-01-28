import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Search,
  Download,
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  Navigation,
  RefreshCw,
  Shield,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Box,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
  PackageCheck,
  Timer,
  MapPinned,
  Plane,
  Home as HomeIcon,
  Activity,
  Zap,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronRight,
  Building2,
  PackageOpen,
  Route,
  Globe,
  Star,
  WifiOff,
  Wifi,
  Flower2,
  Leaf,
  Sprout,
  Trees,
  Bird
} from 'lucide-react';

// ===========================================
// HELPER FUNCTIONS
// ===========================================

const formatPrice = (price) => {
  if (isNaN(price) || price === null || price === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatTime = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const formatLocation = (location) => {
  if (!location) return null;

  if (typeof location === 'string') return location;

  if (typeof location === 'object') {
    const { city, stateOrProvinceCode, countryCode } = location;
    return [city, stateOrProvinceCode, countryCode]
      .filter(Boolean)
      .join(', ');
  }

  return null;
};

const copyToClipboard = async (text, onSuccess) => {
  try {
    await navigator.clipboard.writeText(text);
    if (onSuccess) onSuccess();
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('Failed to copy:', e);
    }
    document.body.removeChild(textArea);
  }
};

const getRelativeTime = (date) => {
  if (!date) return '';
  try {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(date);
  } catch {
    return '';
  }
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ===========================================
// CUSTOM HOOKS
// ===========================================

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

const useTrackingData = (orderId, trackingNumber, token, initialData = null) => {
  const [tracking, setTracking] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isCached, setIsCached] = useState(!!initialData);
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchTracking = useCallback(async (forceRefresh = false) => {
    if (!trackingNumber || !orderId) return;

    if (!forceRefresh && lastFetch && Date.now() - lastFetch < 30000) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/${orderId}/tracking-status`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setTracking(data.data);
        setIsCached(data.data.isCached || false);
        setLastFetch(Date.now());
        retryCountRef.current = 0;
      } else if (data.data?.error) {
        setError(data.data.error);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Tracking fetch error:', err);

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => fetchTracking(forceRefresh), delay);
      } else {
        setError('Unable to fetch tracking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, trackingNumber, token, lastFetch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    tracking,
    loading,
    error,
    fetchTracking,
    lastFetch,
    isCached
  };
};

// ===========================================
// CSS ANIMATIONS
// ===========================================

const animationStyles = `
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-3deg); }
  }
  
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes leaf-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(5deg); }
    50% { transform: translateY(-20px) rotate(0deg); }
    75% { transform: translateY(-10px) rotate(-5deg); }
  }
  
  @keyframes bird-fly {
    0% { transform: translateX(-100px) translateY(0px); }
    25% { transform: translateX(25vw) translateY(-20px); }
    50% { transform: translateX(50vw) translateY(10px); }
    75% { transform: translateX(75vw) translateY(-15px); }
    100% { transform: translateX(100vw) translateY(0px); }
  }
  
  @keyframes pulse-soft {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.9; }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes truck-move {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  
  @keyframes skeleton-loading {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  
  .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
  .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
  .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
  .animate-leaf-float { animation: leaf-float 10s ease-in-out infinite; }
  .animate-bird-fly { animation: bird-fly 30s linear infinite; }
  .animate-pulse-soft { animation: pulse-soft 4s ease-in-out infinite; }
  .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
  .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
  .animate-truck-move { animation: truck-move 8s linear infinite; }
  .animate-shimmer { 
    animation: shimmer 2s linear infinite; 
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%; 
  }
  .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
  .animate-ripple { animation: ripple 1.5s ease-out infinite; }
  
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }
  
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }

  @media (max-width: 768px) {
    .animate-bird-fly { animation-duration: 45s; }
  }
  
  @media (max-width: 640px) {
    .animate-float-slow,
    .animate-float-medium,
    .animate-float-fast,
    .animate-leaf-float {
      animation-duration: 12s;
    }
  }
`;

// ===========================================
// SKELETON COMPONENTS
// ===========================================

const OrderCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton h-6 w-32 rounded-lg"></div>
          <div className="skeleton h-6 w-20 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="skeleton h-5 w-24 rounded"></div>
          <div className="skeleton h-5 w-20 rounded"></div>
          <div className="skeleton h-5 w-16 rounded"></div>
          <div className="skeleton h-5 w-28 rounded"></div>
        </div>
      </div>
      <div className="skeleton h-10 w-32 rounded-xl"></div>
    </div>
    <div className="mt-5 p-4 skeleton rounded-xl h-20"></div>
    <div className="mt-5 pt-4 border-t border-gray-200 flex space-x-3 overflow-x-auto">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton w-16 h-16 rounded-xl flex-shrink-0"></div>
      ))}
    </div>
  </div>
);

const TrackingDetailSkeleton = () => (
  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-green-200 overflow-hidden">
    <div className="skeleton h-32 sm:h-48 w-full"></div>
    <div className="p-4 sm:p-8 space-y-6">
      <div className="skeleton h-16 sm:h-24 rounded-2xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 sm:h-24 rounded-2xl"></div>
        ))}
      </div>
      <div className="skeleton h-48 sm:h-64 rounded-2xl"></div>
    </div>
  </div>
);

// ===========================================
// MAIN ORDERS COMPONENT
// ===========================================

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const [refreshing, setRefreshing] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
    return () => {
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy]);

  const fetchOrders = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/my-orders?page=${page}&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(search) ||
        order.fedex?.trackingNumber?.toLowerCase().includes(search) ||
        order.items?.some(item =>
          item.name?.toLowerCase().includes(search)
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-high': return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'price-low': return (a.totalAmount || 0) - (b.totalAmount || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredOrders(filtered);
  };

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      ready_to_ship: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      shipped: 'bg-green-100 text-green-800 border border-green-200',
      out_for_delivery: 'bg-orange-100 text-orange-800 border border-orange-200',
      delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      returned: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      ready_to_ship: <Box className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      out_for_delivery: <Navigation className="w-4 h-4" />,
      delivered: <PackageCheck className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      returned: <RefreshCw className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const stats = useMemo(() => ({
    total: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    inTransit: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
    processing: orders.filter(o => ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.orderStatus)).length
  }), [orders]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600"></div>
            <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden">
      {/* Animated Nature Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating Flowers */}
        <div className="absolute top-10 left-5 sm:left-10 text-green-300/20 animate-float-slow">
          <Flower2 className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>
        <div className="absolute top-20 right-5 sm:right-10 text-emerald-300/15 animate-float-medium">
          <Flower2 className="w-10 h-10 sm:w-14 sm:h-14 rotate-45" />
        </div>
        <div className="absolute bottom-32 left-10 sm:left-1/4 text-amber-300/20 animate-float-fast">
          <Sprout className="w-8 h-8 sm:w-12 sm:h-12" />
        </div>
        <div className="absolute bottom-20 right-20 text-green-400/10 animate-leaf-float">
          <Leaf className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>
        <div className="absolute top-1/3 left-1/4 text-emerald-400/10 animate-float-slow">
          <Trees className="w-14 h-14 sm:w-20 sm:h-20" />
        </div>
        
        {/* Flying Bird */}
        <div className="absolute top-20 text-blue-400/10 animate-bird-fly">
          <Bird className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        
        {/* Subtle Nature Patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 border-2 border-emerald-300/20 rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 border-2 border-green-300/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-amber-300/10 rounded-full"></div>
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center space-x-2 sticky top-0 z-50">
          <WifiOff size={16} />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-all duration-300"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 sm:h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-800 flex items-center space-x-2">
                  <span>My Orders</span>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 animate-pulse" />
                </h1>
                <p className="text-gray-600 text-sm flex items-center space-x-1">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span>Real-time tracking available</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                      <span>Showing cached data</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing || !isOnline}
                className="group flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 text-gray-600 hover:text-emerald-600 border border-gray-200 rounded-lg sm:rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh orders"
              >
                <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-base">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link
                to="/store"
                className="group bg-emerald-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <span className="text-sm sm:text-base">Continue Shopping</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 z-10">
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            token={token}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            isOnline={isOnline}
          />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-slide-up">
              <StatsCard
                title="Total Orders"
                value={stats.total}
                icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
                color="emerald"
                delay="stagger-1"
              />
              <StatsCard
                title="Total Spent"
                value={formatPrice(stats.totalSpent)}
                icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
                color="green"
                delay="stagger-2"
              />
              <StatsCard
                title="Delivered"
                value={stats.delivered}
                icon={<PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                color="teal"
                delay="stagger-3"
              />
              <StatsCard
                title="In Transit"
                value={stats.inTransit}
                icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6" />}
                color="cyan"
                delay="stagger-4"
              />
              <StatsCard
                title="Processing"
                value={stats.processing}
                icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
                color="amber"
                delay="stagger-5"
              />
            </div>

            {/* Filters */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 animate-slide-up stagger-2">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search orders, tracking #..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                      className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-64 lg:w-72 transition-all duration-300 hover:border-emerald-300 text-sm sm:text-base"
                      aria-label="Search orders"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-4">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white transition-all duration-300 hover:border-emerald-300 cursor-pointer text-sm sm:text-base w-full"
                        aria-label="Filter by status"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white transition-all duration-300 hover:border-emerald-300 cursor-pointer text-sm sm:text-base w-full"
                        aria-label="Sort orders"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="price-low">Price: Low to High</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4 pt-4 sm:pt-0 border-t border-gray-100 sm:border-none">
                  <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    {filteredOrders.length} of {orders.length} orders
                  </span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 sm:p-2 transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                      aria-label="List view"
                    >
                      <List size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 sm:p-2 transition-all ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={16} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map(i => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
                {filteredOrders.map((order, index) => (
                  <div
                    key={order._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => setSelectedOrder(order)}
                      token={token}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      viewMode={viewMode}
                      isOnline={isOnline}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 w-full sm:w-auto justify-center"
                  aria-label="Previous page"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) {
                        pageNum = page - 2 + i;
                      }
                      if (pageNum > totalPages) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${page === pageNum
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600'
                          }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 w-full sm:w-auto justify-center"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// STATS CARD
// ===========================================

const StatsCard = ({ title, value, icon, color, delay }) => {
  const colorClasses = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`group bg-white border ${colors.border} rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-all duration-500 hover:-translate-y-0.5 sm:hover:-translate-y-1 ${delay}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.bg} rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
          <div className={colors.text}>{icon}</div>
        </div>
      </div>
      <div className={`h-0.5 sm:h-1 ${colors.bg} rounded-full mt-2 sm:mt-3 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
    </div>
  );
};

// ===========================================
// EMPTY STATE
// ===========================================

const EmptyState = ({ searchTerm, statusFilter }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200 p-8 sm:p-16 text-center animate-slide-up">
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
      <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse-soft"></div>
      <div className="absolute inset-4 bg-emerald-200 rounded-full flex items-center justify-center">
        <Package className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600 animate-bounce-subtle" />
      </div>
    </div>
    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No orders found</h3>
    <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto px-4">
      {searchTerm || statusFilter !== 'all'
        ? 'Try adjusting your search or filters to find what you\'re looking for'
        : 'Start shopping to see your orders here. We\'ve got amazing artworks waiting for you!'
      }
    </p>
    <Link
      to="/store"
      className="group inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
    >
      <span className="text-sm sm:text-base">Explore Artworks</span>
      <ArrowRight size={16} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>
);

// ===========================================
// ORDER CARD WITH SMART TRACKING
// ===========================================

const OrderCard = ({ order, onClick, token, getStatusColor, getStatusIcon, viewMode, isOnline }) => {
  const [copiedTracking, setCopiedTracking] = useState(false);

  const hasTrackingNumber = !!order.fedex?.trackingNumber;
  const isTrackable = hasTrackingNumber &&
    ['shipped', 'out_for_delivery'].includes(order.orderStatus);

  const initialTrackingData = order.fedex?.currentStatus ? {
    currentStatus: order.fedex.currentStatus,
    isDelivered: order.orderStatus === 'delivered',
    estimatedDelivery: order.fedex.estimatedDeliveryTimeWindow,
    isCached: true
  } : null;

  const { tracking, loading: loadingTracking, fetchTracking, isCached } = useTrackingData(
    order._id,
    order.fedex?.trackingNumber,
    token,
    initialTrackingData
  );

  useEffect(() => {
    if (isTrackable && isOnline && !tracking) {
      const delay = Math.random() * 2000;
      const timeoutId = setTimeout(() => fetchTracking(), delay);
      return () => clearTimeout(timeoutId);
    }
  }, [isTrackable, isOnline]);

  const handleCopyTracking = (e) => {
    e.stopPropagation();
    copyToClipboard(order.fedex?.trackingNumber, () => {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    });
  };

  const getAddressCity = () => {
    const addr = order.shippingAddress;
    if (!addr) return 'N/A';
    return `${addr.city || ''}, ${addr.stateCode || addr.state || ''}`.replace(/^, |, $/g, '') || 'N/A';
  };

  const displayStatus = tracking?.currentStatus || order.fedex?.currentStatus;
  const isDelivered = tracking?.isDelivered || order.orderStatus === 'delivered';

  return (
    <div
      className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Order ${order.orderNumber}, ${order.orderStatus}`}
    >
      {['shipped', 'out_for_delivery'].includes(order.orderStatus) && (
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-green-500 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Order #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(order.orderStatus)} transition-all duration-300 group-hover:scale-105`}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-1 capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200">
                  <Truck size={10} className="sm:w-3 sm:h-3 mr-1" />
                  FedEx
                </span>
              )}
              {isCached && tracking && (
                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                  <Clock size={10} className="sm:w-3 sm:h-3 mr-1" />
                  Cached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center space-x-2 group/item">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span>{order.items?.length || 0} item(s)</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span className="truncate">{getAddressCity()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group/btn flex items-center space-x-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md mt-3 lg:mt-0 w-full lg:w-auto justify-center"
            aria-label="View order details"
          >
            <Eye size={14} className="sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">View Details</span>
            <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-0.5 sm:group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* FedEx Tracking Section */}
        {hasTrackingNumber && (
          <div className="mt-4 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl relative overflow-hidden">
            {['shipped', 'out_for_delivery'].includes(order.orderStatus) && !isDelivered && (
              <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden opacity-10">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 animate-truck-move" />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 relative z-10">
              {/* Tracking Info */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${isDelivered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100'
                  }`}>
                  {loadingTracking ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 animate-spin" />
                  ) : isDelivered ? (
                    <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-emerald-900 font-bold text-sm sm:text-base truncate">
                      {order.fedex.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1 rounded-md hover:bg-emerald-200 transition-colors flex-shrink-0"
                      aria-label="Copy tracking number"
                    >
                      {copiedTracking ? (
                        <Check size={14} className="sm:w-4 sm:h-4 text-green-600" />
                      ) : (
                        <Copy size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
                      )}
                    </button>
                  </div>

                  {/* Live Status */}
                  {displayStatus ? (
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-1">
                      {!isCached && isOnline && (
                        <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-green-500"></span>
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-medium text-emerald-800 truncate">
                        {displayStatus.description || 'Tracking available'}
                      </span>
                      {displayStatus.location && (
                        <span className="text-xs sm:text-sm text-emerald-600 truncate">• {formatLocation(displayStatus.location)}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-emerald-600">
                      {order.fedex.serviceName || 'FedEx Shipping'}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap mt-2 sm:mt-0">
                {tracking?.estimatedDelivery?.ends && !isDelivered && (
                  <div className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded-md sm:rounded-lg border border-emerald-200">
                    <Timer size={12} className="sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">Est. {formatDate(tracking.estimatedDelivery.ends)}</span>
                  </div>
                )}

                {isDelivered && (
                  <div className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-600 text-white rounded-md sm:rounded-lg">
                    <PackageCheck size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">Delivered</span>
                  </div>
                )}

                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 border border-emerald-300 rounded-md sm:rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                  aria-label="Track on FedEx website"
                >
                  <span>FedEx.com</span>
                  <ExternalLink size={10} className="sm:w-3 sm:h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Preview */}
        <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {order.items?.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden group/img hover:ring-1 hover:ring-emerald-300 transition-all"
              >
                <img
                  src={item.image || '/placeholder-image.jpg'}
                  alt={item.name || 'Product image'}
                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  loading="lazy"
                />
              </div>
            ))}
            {(order.items?.length || 0) > 4 && (
              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm text-emerald-700 font-bold">
                +{order.items.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// ORDER DETAIL WITH FULL FEDEX TRACKING
// ===========================================

const OrderDetail = ({ order, onBack, token, getStatusColor, getStatusIcon, isOnline }) => {
  const [tracking, setTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  const autoRefreshRef = useRef(null);
  const abortControllerRef = useRef(null);

  const hasTrackingNumber = !!order.fedex?.trackingNumber;
  const isTrackable = hasTrackingNumber &&
    !['delivered', 'cancelled', 'returned'].includes(order.orderStatus);

  const fetchTracking = useCallback(async (showLoading = true) => {
    if (!order.fedex?.trackingNumber || !isOnline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (showLoading) setLoadingTracking(true);
    setTrackingError(null);

    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/track/${order._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.tracking) {
        setTracking(data.data.tracking);
        setIsMockData(data.data.isMockData || data.data.tracking.isMockData || false);
        setLastRefresh(new Date());
      } else if (data.data?.error) {
        setTrackingError(data.data.error);
        if (order.fedex?.currentStatus) {
          setTracking({
            currentStatus: order.fedex.currentStatus,
            events: order.fedex.trackingHistory || [],
            estimatedDelivery: order.fedex.estimatedDeliveryTimeWindow,
            isDelivered: order.orderStatus === 'delivered'
          });
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Tracking fetch error:', error);
      setTrackingError('Unable to fetch tracking information. Please try again.');

      if (order.fedex?.currentStatus) {
        setTracking({
          currentStatus: order.fedex.currentStatus,
          events: order.fedex.trackingHistory || [],
          estimatedDelivery: order.fedex.estimatedDeliveryTimeWindow,
          isDelivered: order.orderStatus === 'delivered'
        });
      }
    } finally {
      setLoadingTracking(false);
    }
  }, [order._id, order.fedex, token, isOnline]);

  useEffect(() => {
    if (hasTrackingNumber) {
      fetchTracking();
    }

    if (isTrackable && autoRefresh && isOnline) {
      autoRefreshRef.current = setInterval(() => {
        fetchTracking(false);
      }, 120000);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [order._id, autoRefresh, isTrackable, isOnline, hasTrackingNumber, fetchTracking]);

  const handleCopyTracking = () => {
    copyToClipboard(order.fedex?.trackingNumber, () => {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    });
  };

  const addr = order.shippingAddress || {};
  const events = tracking?.events || order.fedex?.trackingHistory || [];

  const getProgressPercentage = () => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.orderStatus);
    if (currentIndex === -1) return 0;
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm sm:text-base"
        aria-label="Back to orders list"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 lg:p-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-gray-600 text-sm sm:text-base flex items-center space-x-2 mt-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Placed on {formatDateTime(order.createdAt)}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
              <span className={`inline-flex items-center space-x-1 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-100 text-emerald-700 text-xs sm:text-sm rounded-full border border-emerald-200 font-medium">
                  <Truck size={12} className="sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                  FedEx Tracked
                </span>
              )}
              {!isOnline && (
                <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-100 text-amber-700 text-xs sm:text-sm rounded-full border border-amber-200 font-medium">
                  <WifiOff size={12} className="sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                  Offline
                </span>
              )}
              {isMockData && (
                <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-full border border-blue-200 font-medium">
                  <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                  Demo Data
                </span>
              )}
            </div>
          </div>
          <div className="text-left lg:text-right mt-4 lg:mt-0">
            <p className="text-sm text-gray-500 mb-1">Order Total</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700">
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Live FedEx Tracking Section */}
      {hasTrackingNumber && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-slide-up stagger-1">
          {/* Tracking Header */}
          <div className="relative bg-emerald-700 p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Floating Truck */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10">
              <Truck className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 text-white animate-float-fast" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
              <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/20 backdrop-blur rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  {isTrackable && isOnline && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border border-white"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center space-x-1 sm:space-x-2 flex-wrap">
                    <span>FedEx Tracking</span>
                    {tracking?.isDelivered && (
                      <span className="bg-white/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-sm">✓ Delivered</span>
                    )}
                    {isMockData && (
                      <span className="bg-blue-500/50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-sm">Demo</span>
                    )}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                    <span className="font-mono text-white/90 text-base sm:text-lg lg:text-xl tracking-wider">
                      {order.fedex.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Copy tracking number"
                    >
                      {copiedTracking ? (
                        <Check size={14} className="sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 text-green-300" />
                      ) : (
                        <Copy size={14} className="sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 text-white/80" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 md:mt-0">
                <button
                  onClick={() => fetchTracking(true)}
                  disabled={loadingTracking || !isOnline}
                  className="group flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-3 bg-white text-emerald-600 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                  aria-label="Refresh tracking status"
                >
                  {loadingTracking ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="text-sm sm:text-base">Updating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="text-sm sm:text-base">Refresh</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-3 bg-white/20 backdrop-blur text-white rounded-lg sm:rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold w-full md:w-auto justify-center"
                  aria-label="Track on FedEx website (opens in new tab)"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">FedEx.com</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Loading State */}
            {loadingTracking && !tracking && (
              <TrackingDetailSkeleton />
            )}

            {/* Current Status */}
            {tracking?.currentStatus && (
              <div className="mb-6 p-4 sm:p-6 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-emerald-200 rounded-full blur-2xl opacity-20"></div>

                <div className="relative flex items-start space-x-3 sm:space-x-4 lg:space-x-5">
                  <div className="relative mt-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full animate-pulse-soft"></div>
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ripple"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">
                      {tracking.currentStatus.description}
                    </h3>
                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 text-xs sm:text-sm text-emerald-700">
                      {tracking.currentStatus.location && (
                        <span className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-emerald-200">
                          <MapPinned size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
                          <span className="font-medium">{formatLocation(tracking.currentStatus.location)}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-emerald-200">
                        <Clock size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
                        <span>{getRelativeTime(tracking.currentStatus.timestamp)}</span>
                      </span>
                    </div>
                  </div>

                  {tracking.isDelivered && (
                    <div className="bg-emerald-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-lg sm:rounded-xl font-semibold flex items-center space-x-1 sm:space-x-2 shadow-sm mt-2 sm:mt-0">
                      <PackageCheck size={16} className="sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Delivered</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Error */}
            {trackingError && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl flex items-start space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 text-sm sm:text-base">Tracking Update</p>
                  <p className="text-xs sm:text-sm text-amber-600 mt-0.5 sm:mt-1">{trackingError}</p>
                  {isOnline && (
                    <button
                      onClick={() => fetchTracking(true)}
                      className="mt-1 text-xs sm:text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Shipping Progress</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600">{getProgressPercentage()}% Complete</span>
              </div>
              <div className="h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                  role="progressbar"
                  aria-valuenow={getProgressPercentage()}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="absolute inset-0 animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <InfoCard
                icon={<Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Service Type"
                value={tracking?.shipmentDetails?.serviceDescription ||
                  order.fedex.serviceName ||
                  order.fedex.serviceType?.replace(/_/g, ' ') ||
                  'FedEx'}
                color="emerald"
              />

              <InfoCard
                icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Current Status"
                value={tracking?.currentStatus?.description || order.orderStatus?.replace(/_/g, ' ')}
                color="green"
              />

              <InfoCard
                icon={<Timer className="w-4 h-4 sm:w-5 sm:h-5" />}
                label={tracking?.isDelivered ? 'Delivered On' : 'Estimated Delivery'}
                value={tracking?.isDelivered
                  ? formatDate(tracking.deliveryDetails?.actualDeliveryTimestamp)
                  : tracking?.estimatedDelivery?.ends
                    ? formatDate(tracking.estimatedDelivery.ends)
                    : order.fedex.estimatedDeliveryDate
                      ? formatDate(order.fedex.estimatedDeliveryDate)
                      : 'Pending'
                }
                color="teal"
              />
            </div>

            {/* Delivery Confirmation */}
            {tracking?.isDelivered && tracking.deliveryDetails && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-emerald-800 text-base sm:text-lg">Delivery Confirmation</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-emerald-100">
                    <span className="text-xs sm:text-sm text-emerald-600 flex items-center space-x-1">
                      <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Delivered At</span>
                    </span>
                    <p className="font-bold text-emerald-900 text-sm sm:text-base mt-1">
                      {formatDateTime(tracking.deliveryDetails.actualDeliveryTimestamp)}
                    </p>
                  </div>
                  {tracking.deliveryDetails.deliveryLocation && (
                    <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-emerald-100">
                      <span className="text-xs sm:text-sm text-emerald-600 flex items-center space-x-1">
                        <HomeIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>Location</span>
                      </span>
                      <p className="font-bold text-emerald-900 text-sm sm:text-base mt-1">{formatLocation(tracking.deliveryDetails.deliveryLocation)}</p>
                    </div>
                  )}
                  {tracking.deliveryDetails.signedBy && (
                    <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-emerald-100">
                      <span className="text-xs sm:text-sm text-emerald-600 flex items-center space-x-1">
                        <Shield size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>Signed By</span>
                      </span>
                      <p className="font-bold text-emerald-900 text-sm sm:text-base mt-1">{tracking.deliveryDetails.signedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Events Timeline */}
            {events.length > 0 && (
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Route className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Package Journey</h3>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 bg-white px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    {events.length} updates
                  </span>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-emerald-300"></div>

                  <div className="space-y-0">
                    {(showAllEvents ? events : events.slice(0, 5)).map((event, index) => (
                      <TrackingEvent
                        key={index}
                        event={event}
                        isFirst={index === 0}
                        isLast={index === events.length - 1}
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                {events.length > 5 && (
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="mt-4 sm:mt-6 flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-semibold mx-auto px-4 py-2 sm:px-6 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-emerald-200 hover:border-emerald-300 transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
                    aria-expanded={showAllEvents}
                  >
                    {showAllEvents ? (
                      <>
                        <ChevronUp size={16} className="sm:w-4.5 sm:h-4.5" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="sm:w-4.5 sm:h-4.5" />
                        <span>Show All {events.length} Events</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Auto-refresh toggle */}
            {isTrackable && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                  <Activity size={14} className="sm:w-4 sm:h-4" />
                  <span>Last updated: {lastRefresh ? getRelativeTime(lastRefresh) : 'Just now'}</span>
                  {!isOnline && <span className="text-amber-600">(Offline)</span>}
                </div>
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only"
                      disabled={!isOnline}
                      aria-label="Toggle auto-refresh"
                    />
                    <div className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${autoRefresh && isOnline ? 'bg-emerald-600' : 'bg-gray-300'
                      } ${!isOnline ? 'opacity-50' : ''}`}>
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow transform transition-transform ${autoRefresh ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                    </div>
                  </div>
                  <span className={`text-xs sm:text-sm font-medium ${isOnline ? 'text-gray-700' : 'text-gray-400'}`}>
                    Auto-refresh every 2 min
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Progress (for non-shipped orders) */}
      {!hasTrackingNumber && !['cancelled', 'returned'].includes(order.orderStatus) && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 lg:p-8 animate-slide-up stagger-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <span>Order Progress</span>
          </h2>
          <OrderProgress status={order.orderStatus} />
        </div>
      )}

      {/* Grid: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 lg:p-8 animate-slide-up stagger-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Order Items</span>
              <span className="text-xs sm:text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {order.items?.length || 0} items
              </span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={item._id || index}
                  className="group flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all duration-300"
                >
                  <div className="w-full sm:w-20 lg:w-24 h-40 sm:h-20 lg:h-24 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name || 'Product image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate group-hover:text-emerald-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.author && <p className="text-gray-600 text-sm">by {item.author}</p>}
                    {item.medium && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center space-x-1">
                        <Star size={10} className="sm:w-3 sm:h-3 text-amber-400" />
                        <span>{item.medium}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <p className="font-bold text-lg sm:text-xl text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                    <p className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md sm:rounded-lg mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 animate-slide-up stagger-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Order Summary</span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Subtotal</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Shipping</span>
                <span className={`font-semibold text-sm sm:text-base ${order.shippingCost === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="flex items-center space-x-1 text-sm sm:text-base">
                    <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>Discount</span>
                  </span>
                  <span className="font-bold text-sm sm:text-base">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-gray-200 pt-3 sm:pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 animate-slide-up stagger-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Shipping Address</span>
            </h2>
            <div className="space-y-2 sm:space-y-3 text-gray-600 text-sm sm:text-base">
              {addr.recipientName && (
                <p className="font-bold text-gray-900 text-base sm:text-lg">{addr.recipientName}</p>
              )}
              <div className="space-y-0.5 sm:space-y-1">
                <p>{addr.streetLine1 || addr.street || addr.flatNo}</p>
                {(addr.streetLine2 || addr.apartment) && <p>{addr.streetLine2 || addr.apartment}</p>}
                <p>{addr.city}, {addr.stateCode || addr.state} {addr.zipCode}</p>
                <p className="font-medium">United States</p>
              </div>

              {(addr.phoneNumber || addr.phoneNo) && (
                <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-100 flex items-center space-x-2">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  <span className="text-sm">{formatPhoneNumber(addr.phoneNumber || addr.phoneNo)}</span>
                </div>
              )}

              {addr.addressVerified && (
                <div className="flex items-center space-x-2 text-emerald-600 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 bg-emerald-50 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Address verified by FedEx</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-6 animate-slide-up stagger-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>Payment</span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Method</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base flex items-center space-x-1 sm:space-x-2">
                  <DollarSign size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
                  <span>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Status</span>
                <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                  {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-emerald-700 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 text-white animate-slide-up stagger-5">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg">Need Help?</h3>
            </div>
            <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
              Questions about your order? We're here to help 24/7.
            </p>
            <Link
              to="/contact"
              className="group inline-flex items-center space-x-1 sm:space-x-2 bg-white text-emerald-600 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm sm:text-base w-full justify-center"
            >
              <span>Contact Support</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// INFO CARD COMPONENT
// ===========================================

const InfoCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600'
  };

  return (
    <div className={`p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl border ${colorClasses[color]} transition-all hover:shadow-sm`}>
      <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
        {icon}
        <p className="text-xs sm:text-sm font-medium">{label}</p>
      </div>
      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg capitalize truncate">{value || 'N/A'}</p>
    </div>
  );
};

// ===========================================
// TRACKING EVENT COMPONENT
// ===========================================

const TrackingEvent = ({ event, isFirst, isLast, index }) => {
  const eventDate = event.timestamp || event.date;
  const eventDescription = event.eventDescription || event.description || 'Status update';
  const location = (() => {
    if (!event.location) return null;

    if (typeof event.location === 'string') {
      return event.location;
    }

    if (typeof event.location === 'object') {
      const { city, stateOrProvinceCode, countryCode } = event.location;
      return [city, stateOrProvinceCode, countryCode]
        .filter(Boolean)
        .join(', ');
    }

    return null;
  })();

  return (
    <div
      className="relative flex items-start space-x-3 sm:space-x-4 pl-2 sm:pl-3 animate-slide-in-right pb-4 sm:pb-6"
      style={{ animationDelay: `${Math.min(index * 0.1, 1)}s` }}
    >
      {/* Timeline dot */}
      <div className="relative z-10 mt-1 sm:mt-1.5">
        <div className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center ${isFirst
            ? 'bg-emerald-600 ring-2 sm:ring-3 ring-emerald-100 shadow-sm'
            : 'bg-emerald-200'
          }`}>
          {isFirst && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className={`bg-white rounded-lg sm:rounded-xl border ${isFirst ? 'border-emerald-200 shadow-sm' : 'border-gray-100'
          } hover:shadow-sm hover:border-emerald-200 transition-all duration-300 p-3 sm:p-4`}>
          <p className={`font-semibold text-sm sm:text-base ${isFirst ? 'text-emerald-900' : 'text-gray-900'}`}>
            {eventDescription}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 mt-2 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center space-x-1.5 bg-gray-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg">
              <Calendar size={12} className="sm:w-3.5 sm:h-3.5 text-gray-400" />
              <span>{formatDate(eventDate)}</span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline">{formatTime(eventDate)}</span>
            </span>
            {location && (
              <span className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg">
                <MapPinned size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="font-medium truncate max-w-[150px] sm:max-w-none">{location}</span>
              </span>
            )}
          </div>
          {event.exceptionDescription && (
            <div className="mt-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-amber-800 flex items-start space-x-2">
              <AlertTriangle size={14} className="sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{event.exceptionDescription}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// ORDER PROGRESS COMPONENT
// ===========================================

const OrderProgress = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Clock },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck }
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="relative" role="progressbar" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={steps.length - 1}>
      {/* Progress Bar */}
      <div className="absolute top-6 sm:top-8 left-0 right-0 h-1.5 sm:h-2 bg-gray-100 rounded-full mx-6 sm:mx-8 lg:mx-10">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        >
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = status === step.key || (step.key === 'processing' && status === 'ready_to_ship');
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center group">
              <div
                className={`relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-500 ${isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-2 ring-emerald-200 scale-110' : 'group-hover:scale-105'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <Icon size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                {isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-emerald-500 border border-white"></span>
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold text-center mt-2 max-w-[70px] sm:max-w-[80px] transition-colors truncate ${isCompleted ? 'text-emerald-600' : 'text-gray-500'
                }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
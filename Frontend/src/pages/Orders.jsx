import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Search,
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
  AlertTriangle,
  PackageCheck,
  Timer,
  MapPinned,
  Plane,
  Home as HomeIcon,
  Activity,
  Filter,
  ChevronRight,
  Route,
  Globe,
  WifiOff,
  Wifi
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
    return [city, stateOrProvinceCode, countryCode].filter(Boolean).join(', ');
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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

// ===========================================
// SKELETON COMPONENTS
// ===========================================

const OrderCardSkeleton = () => (
  <div className="border-2 border-gray-100 p-6">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 bg-gray-100 animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="h-12 w-32 bg-gray-100 animate-pulse"></div>
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
  const [refreshing, setRefreshing] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

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
        { headers: { 'Authorization': `Bearer ${token}` } }
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
        order.items?.some(item => item.name?.toLowerCase().includes(search))
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

  const stats = useMemo(() => ({
    total: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    inTransit: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
    processing: orders.filter(o => ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.orderStatus)).length
  }), [orders]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-gray-900 text-white py-3 px-4 text-center text-sm flex items-center justify-center space-x-2">
          <WifiOff size={16} />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-8 gap-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-300 cursor-pointer"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">My Orders</h1>
                <p className="text-gray-500 text-sm mt-1 flex items-center space-x-2">
                  {isOnline ? (
                    <>
                      <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                      <span>Real-time tracking</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>Cached data</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing || !isOnline}
                className="group flex items-center space-x-2 px-5 py-3 border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link
                to="/store"
                className="group flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            token={token}
            isOnline={isOnline}
          />
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatsCard title="Total Orders" value={stats.total} icon={<Package size={20} />} />
              <StatsCard title="Total Spent" value={formatPrice(stats.totalSpent)} icon={<DollarSign size={20} />} />
              <StatsCard title="Delivered" value={stats.delivered} icon={<PackageCheck size={20} />} />
              <StatsCard title="In Transit" value={stats.inTransit} icon={<Truck size={20} />} />
              <StatsCard title="Processing" value={stats.processing} icon={<Clock size={20} />} />
            </div>

            {/* Filters */}
            <div className="border-2 border-gray-100 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors duration-300" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none w-full sm:w-72 transition-colors duration-300"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-12 pr-10 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none appearance-none bg-white cursor-pointer transition-colors duration-300 w-full sm:w-auto"
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
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-4 pr-10 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none appearance-none bg-white cursor-pointer transition-colors duration-300 w-full sm:w-auto"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{filteredOrders.length}</span> of{' '}
                  <span className="font-medium text-gray-900">{orders.length}</span> orders
                </div>
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <OrderCardSkeleton key={i} />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                    token={token}
                    isOnline={isOnline}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 pt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center space-x-2 px-5 py-3 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors duration-300 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && page > 3) {
                      pageNum = page - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`w-12 h-12 font-medium transition-all duration-300 cursor-pointer ${
                          page === pageNum
                            ? 'bg-gray-900 text-white'
                            : 'border-2 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center space-x-2 px-5 py-3 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-900 transition-colors duration-300 cursor-pointer"
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

const StatsCard = ({ title, value, icon }) => (
  <div className="group border-2 border-gray-100 p-5 hover:border-gray-900 transition-all duration-300 cursor-default">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-light text-gray-900 mt-2">{value}</p>
      </div>
      <div className="w-12 h-12 border border-gray-200 flex items-center justify-center group-hover:border-gray-900 group-hover:bg-gray-900 transition-all duration-300">
        <div className="text-gray-400 group-hover:text-white transition-colors duration-300">{icon}</div>
      </div>
    </div>
  </div>
);

// ===========================================
// EMPTY STATE
// ===========================================

const EmptyState = ({ searchTerm, statusFilter }) => (
  <div className="border-2 border-dashed border-gray-200 py-20 text-center">
    <div className="w-20 h-20 border-2 border-gray-200 flex items-center justify-center mx-auto mb-8">
      <Package className="w-10 h-10 text-gray-300" />
    </div>
    <h3 className="text-xl font-light text-gray-900 mb-3">No orders found</h3>
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      {searchTerm || statusFilter !== 'all'
        ? 'Try adjusting your search or filters'
        : 'Start shopping to see your orders here'
      }
    </p>
    <Link
      to="/store"
      className="group inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
    >
      <span>Explore Artworks</span>
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
    </Link>
  </div>
);

// ===========================================
// ORDER CARD
// ===========================================

const OrderCard = ({ order, onClick, token, isOnline, index }) => {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const hasTrackingNumber = !!order.fedex?.trackingNumber;

  const handleCopyTracking = (e) => {
    e.stopPropagation();
    copyToClipboard(order.fedex?.trackingNumber, () => {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    });
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'border-gray-300 text-gray-600',
      confirmed: 'border-gray-900 text-gray-900',
      processing: 'border-gray-600 text-gray-600',
      ready_to_ship: 'border-gray-600 text-gray-600',
      shipped: 'border-gray-900 text-gray-900 bg-gray-900 text-white',
      out_for_delivery: 'border-gray-900 text-gray-900 bg-gray-900 text-white',
      delivered: 'border-gray-900 bg-gray-900 text-white',
      cancelled: 'border-gray-400 text-gray-400',
      returned: 'border-gray-400 text-gray-400'
    };
    return styles[status] || 'border-gray-300 text-gray-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={14} />,
      confirmed: <CheckCircle size={14} />,
      processing: <Package size={14} />,
      ready_to_ship: <Box size={14} />,
      shipped: <Truck size={14} />,
      out_for_delivery: <Navigation size={14} />,
      delivered: <PackageCheck size={14} />,
      cancelled: <XCircle size={14} />,
      returned: <RefreshCw size={14} />
    };
    return icons[status] || <Clock size={14} />;
  };

  return (
    <div
      onClick={onClick}
      className="group border-2 border-gray-100 hover:border-gray-900 transition-all duration-300 cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Progress Indicator for Active Orders */}
      {['shipped', 'out_for_delivery'].includes(order.orderStatus) && (
        <div className="h-1 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-600 transition-colors duration-300">
                #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider border ${getStatusStyle(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span>{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 text-gray-600">
                  <Truck size={12} className="mr-1" />
                  FedEx
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                <Calendar size={14} />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign size={14} className="text-gray-400" />
                <span className="font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Package size={14} />
                <span>{order.items?.length || 0} items</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <MapPin size={14} />
                <span className="truncate">
                  {order.shippingAddress?.city}, {order.shippingAddress?.stateCode || order.shippingAddress?.state}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group/btn flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
          >
            <Eye size={16} />
            <span>View Details</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* Tracking Section */}
        {hasTrackingNumber && (
          <div className="border-t border-gray-100 pt-5 mt-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 flex items-center justify-center border-2 ${
                  order.orderStatus === 'delivered' 
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-200'
                }`}>
                  {order.orderStatus === 'delivered' ? (
                    <PackageCheck size={20} />
                  ) : (
                    <Truck size={20} className="text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-900 font-medium">
                      {order.fedex.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1.5 border border-gray-200 hover:border-gray-900 transition-colors duration-300 cursor-pointer"
                    >
                      {copiedTracking ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.fedex.serviceName || 'FedEx Shipping'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {order.fedex.estimatedDeliveryDate && order.orderStatus !== 'delivered' && (
                  <div className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-sm">
                    <Timer size={14} />
                    <span>Est. {formatDate(order.fedex.estimatedDeliveryDate)}</span>
                  </div>
                )}
                {order.orderStatus === 'delivered' && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white text-sm">
                    <PackageCheck size={14} />
                    <span>Delivered</span>
                  </div>
                )}
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 hover:border-gray-900 transition-colors duration-300 text-sm cursor-pointer"
                >
                  <span>FedEx.com</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Preview */}
        <div className="border-t border-gray-100 pt-5 mt-5">
          <div className="flex space-x-3 overflow-x-auto">
            {order.items?.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex-shrink-0 w-16 h-16 border border-gray-200 overflow-hidden group-hover:border-gray-400 transition-colors duration-300">
                <img
                  src={item.image || '/placeholder-image.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                />
              </div>
            ))}
            {(order.items?.length || 0) > 5 && (
              <div className="flex-shrink-0 w-16 h-16 border border-gray-200 flex items-center justify-center text-sm text-gray-500 font-medium">
                +{order.items.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// ORDER DETAIL
// ===========================================

const OrderDetail = ({ order, onBack, token, isOnline }) => {
  const [tracking, setTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const hasTrackingNumber = !!order.fedex?.trackingNumber;

  const fetchTracking = useCallback(async () => {
    if (!order.fedex?.trackingNumber || !isOnline) return;

    setLoadingTracking(true);
    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/track/${order._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success && data.data?.tracking) {
        setTracking(data.data.tracking);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      setLoadingTracking(false);
    }
  }, [order._id, order.fedex, token, isOnline]);

  useEffect(() => {
    if (hasTrackingNumber) fetchTracking();
  }, [hasTrackingNumber, fetchTracking]);

  // Auto-poll tracking while order is in transit
  useEffect(() => {
    if (!hasTrackingNumber || !isOnline) return;

    const inTransitStatuses = ['shipped', 'out_for_delivery'];
    let intervalId = null;

    if (inTransitStatuses.includes(order.orderStatus)) {
      // Poll every 60 seconds
      intervalId = setInterval(() => {
        fetchTracking();
      }, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasTrackingNumber, isOnline, order.orderStatus, fetchTracking]);

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
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-300 cursor-pointer"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className="border-2 border-gray-900 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gray-900 flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-gray-500 text-sm flex items-center space-x-2 mt-1">
                  <Calendar size={14} />
                  <span>Placed on {formatDateTime(order.createdAt)}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.orderStatus} />
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-900">
                  <Truck size={12} className="mr-1.5" />
                  FedEx Tracked
                </span>
              )}
              {!isOnline && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-400 text-gray-500">
                  <WifiOff size={12} className="mr-1.5" />
                  Offline
                </span>
              )}
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Total</p>
            <p className="text-4xl font-light text-gray-900">{formatPrice(order.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Tracking Section */}
      {hasTrackingNumber && (
        <div className="border-2 border-gray-100">
          {/* Tracking Header */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-medium flex items-center space-x-2">
                    <span>FedEx Tracking</span>
                    {tracking?.isDelivered && (
                      <span className="text-xs px-2 py-0.5 border border-white/30">✓ Delivered</span>
                    )}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-white/90">{order.fedex.trackingNumber}</span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1 hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                    >
                      {copiedTracking ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchTracking}
                  disabled={loadingTracking || !isOnline}
                  className="group flex items-center space-x-2 px-5 py-2.5 bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform duration-500 ${loadingTracking ? 'animate-spin' : ''}`} />
                  <span>{loadingTracking ? 'Updating...' : 'Refresh'}</span>
                </button>
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-5 py-2.5 border border-white/30 hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                >
                  <Globe size={16} />
                  <span>FedEx.com</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Status */}
            {tracking?.currentStatus && (
              <div className="p-6 border-2 border-gray-900">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
                    <div className="absolute inset-0 bg-gray-900 rounded-full animate-ping opacity-30"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg mb-2">
                      {tracking.currentStatus.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {tracking.currentStatus.location && (
                        <span className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-200">
                          <MapPinned size={14} />
                          <span>{formatLocation(tracking.currentStatus.location)}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-200">
                        <Clock size={14} />
                        <span>{getRelativeTime(tracking.currentStatus.timestamp)}</span>
                      </span>
                    </div>
                  </div>

                  {tracking.isDelivered && (
                    <div className="px-4 py-2 bg-gray-900 text-white flex items-center space-x-2">
                      <PackageCheck size={18} />
                      <span>Delivered</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Shipping Progress</span>
                <span className="text-sm font-medium text-gray-900">{getProgressPercentage()}%</span>
              </div>
              <div className="h-2 bg-gray-100">
                <div
                  className="h-full bg-gray-900 transition-all duration-1000"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard
                icon={<Plane size={18} />}
                label="Service Type"
                value={order.fedex.serviceName || 'FedEx'}
              />
              <InfoCard
                icon={<Activity size={18} />}
                label="Status"
                value={tracking?.currentStatus?.description || order.orderStatus?.replace(/_/g, ' ')}
              />
              <InfoCard
                icon={<Timer size={18} />}
                label={tracking?.isDelivered ? 'Delivered On' : 'Estimated'}
                value={tracking?.isDelivered
                  ? formatDate(tracking.deliveryDetails?.actualDeliveryTimestamp)
                  : formatDate(tracking?.estimatedDelivery?.ends || order.fedex.estimatedDeliveryDate)
                }
              />
            </div>

            {/* Delivery Confirmation */}
            {tracking?.isDelivered && tracking.deliveryDetails && (
              <div className="p-6 bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-900 flex items-center justify-center">
                    <PackageCheck size={20} className="text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900">Delivery Confirmation</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Delivered At</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formatDateTime(tracking.deliveryDetails.actualDeliveryTimestamp)}
                    </p>
                  </div>
                  {tracking.deliveryDetails.deliveryLocation && (
                    <div className="p-4 bg-white border border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Location</span>
                      <p className="font-medium text-gray-900 mt-1">
                        {formatLocation(tracking.deliveryDetails.deliveryLocation)}
                      </p>
                    </div>
                  )}
                  {tracking.deliveryDetails.signedBy && (
                    <div className="p-4 bg-white border border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Signed By</span>
                      <p className="font-medium text-gray-900 mt-1">{tracking.deliveryDetails.signedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Timeline */}
            {events.length > 0 && (
              <div className="border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 border border-gray-200 flex items-center justify-center">
                      <Route size={18} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Package Journey</h3>
                  </div>
                  <span className="text-sm text-gray-500">{events.length} updates</span>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200"></div>

                  <div className="space-y-0">
                    {(showAllEvents ? events : events.slice(0, 5)).map((event, index) => (
                      <TrackingEvent key={index} event={event} isFirst={index === 0} index={index} />
                    ))}
                  </div>
                </div>

                {events.length > 5 && (
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="mt-6 flex items-center space-x-2 text-gray-700 hover:text-gray-900 mx-auto px-6 py-3 border border-gray-200 hover:border-gray-900 transition-colors duration-300 cursor-pointer"
                  >
                    {showAllEvents ? (
                      <>
                        <ChevronUp size={16} />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        <span>Show All {events.length} Events</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Last Updated */}
            {lastRefresh && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                <Activity size={14} />
                <span>Last updated: {getRelativeTime(lastRefresh)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Progress for Non-Tracked Orders */}
      {!hasTrackingNumber && !['cancelled', 'returned'].includes(order.orderStatus) && (
        <div className="border-2 border-gray-100 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-8">Order Progress</h2>
          <OrderProgress status={order.orderStatus} />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="border-2 border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
              <Package size={18} />
              <span>Order Items</span>
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({order.items?.length || 0} items)
              </span>
            </h2>

            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={item._id || index}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-100 hover:border-gray-900 transition-colors duration-300"
                >
                  <div className="w-full sm:w-24 h-48 sm:h-24 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors duration-300">
                      {item.name}
                    </h3>
                    {item.author && <p className="text-sm text-gray-500">by {item.author}</p>}
                    {item.medium && <p className="text-xs text-gray-400 mt-1">{item.medium}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-medium text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="border-2 border-gray-100 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
              Order Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={order.shippingCost === 0 ? 'font-medium text-gray-900' : 'font-medium text-gray-900'}>
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-gray-900">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-4 border-t-2 border-dashed border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-light text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-2 border-gray-100 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6 flex items-center space-x-2">
              <MapPin size={14} />
              <span>Shipping Address</span>
            </h2>
            <div className="space-y-2 text-gray-700">
              {addr.recipientName && (
                <p className="font-medium text-gray-900">{addr.recipientName}</p>
              )}
              <p>{addr.streetLine1 || addr.street}</p>
              {(addr.streetLine2 || addr.apartment) && <p>{addr.streetLine2 || addr.apartment}</p>}
              <p>{addr.city}, {addr.stateCode || addr.state} {addr.zipCode}</p>
              <p className="font-medium">United States</p>

              {(addr.phoneNumber || addr.phoneNo) && (
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center space-x-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span>{formatPhoneNumber(addr.phoneNumber || addr.phoneNo)}</span>
                </div>
              )}

              {addr.addressVerified && (
                <div className="flex items-center space-x-2 text-sm pt-4 mt-4 border-t border-gray-100">
                  <Shield size={14} />
                  <span>Address verified by FedEx</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="border-2 border-gray-100 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6 flex items-center space-x-2">
              <Shield size={14} />
              <span>Payment</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Method</span>
                <span className="font-medium text-gray-900">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                  order.paymentStatus === 'paid'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 text-gray-600'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <h3 className="font-medium">Need Help?</h3>
            </div>
            <p className="text-white/70 text-sm mb-6">
              Questions about your order? We're here to help.
            </p>
            <Link
              to="/contact"
              className="group flex items-center justify-center space-x-2 w-full py-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// STATUS BADGE
// ===========================================

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    const filled = ['shipped', 'out_for_delivery', 'delivered'];
    if (filled.includes(status)) {
      return 'bg-gray-900 text-white border-gray-900';
    }
    if (status === 'cancelled' || status === 'returned') {
      return 'border-gray-400 text-gray-400';
    }
    return 'border-gray-900 text-gray-900';
  };

  const getIcon = () => {
    const icons = {
      pending: <Clock size={14} />,
      confirmed: <CheckCircle size={14} />,
      processing: <Package size={14} />,
      ready_to_ship: <Box size={14} />,
      shipped: <Truck size={14} />,
      out_for_delivery: <Navigation size={14} />,
      delivered: <PackageCheck size={14} />,
      cancelled: <XCircle size={14} />,
      returned: <RefreshCw size={14} />
    };
    return icons[status] || <Clock size={14} />;
  };

  return (
    <span className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wider border-2 ${getStyle()}`}>
      {getIcon()}
      <span>{status?.replace(/_/g, ' ')}</span>
    </span>
  );
};

// ===========================================
// INFO CARD
// ===========================================

const InfoCard = ({ icon, label, value }) => (
  <div className="p-5 border border-gray-200 hover:border-gray-900 transition-colors duration-300 group">
    <div className="flex items-center space-x-2 mb-2 text-gray-500 group-hover:text-gray-900 transition-colors duration-300">
      {icon}
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-medium text-gray-900 capitalize">{value || 'N/A'}</p>
  </div>
);

// ===========================================
// TRACKING EVENT
// ===========================================

const TrackingEvent = ({ event, isFirst, index }) => {
  const eventDate = event.timestamp || event.date;
  const eventDescription = event.eventDescription || event.description || 'Status update';
  const location = formatLocation(event.location);

  return (
    <div
      className="relative flex items-start space-x-4 pl-3 pb-6"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative z-10 mt-1">
        <div className={`w-4 h-4 ${isFirst ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
      </div>

      <div className={`flex-1 p-4 border ${isFirst ? 'border-gray-900' : 'border-gray-200'} hover:border-gray-900 transition-colors duration-300`}>
        <p className={`font-medium ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>
          {eventDescription}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
          <span className="flex items-center space-x-1.5">
            <Calendar size={12} />
            <span>{formatDate(eventDate)}</span>
            <span>•</span>
            <span>{formatTime(eventDate)}</span>
          </span>
          {location && (
            <span className="flex items-center space-x-1.5">
              <MapPinned size={12} />
              <span>{location}</span>
            </span>
          )}
        </div>
        {event.exceptionDescription && (
          <div className="mt-3 p-3 border border-gray-200 bg-gray-50 text-sm text-gray-700 flex items-start space-x-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{event.exceptionDescription}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// ORDER PROGRESS
// ===========================================

const OrderProgress = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Clock },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck }
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-200 mx-10">
        <div
          className="h-full bg-gray-900 transition-all duration-1000"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = status === step.key || (step.key === 'processing' && status === 'ready_to_ship');
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`relative w-14 h-14 flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-gray-200' : ''}`}
              >
                <Icon size={20} />
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 border-2 border-white"></span>
                )}
              </div>
              <span className={`text-xs font-medium text-center mt-3 max-w-[80px] ${
                isCompleted ? 'text-gray-900' : 'text-gray-400'
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
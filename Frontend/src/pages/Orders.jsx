import { useState, useEffect, useCallback, useRef } from 'react';
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
  CircleDot,
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
  Star
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
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const copyToClipboard = async (text, onSuccess) => {
  try {
    await navigator.clipboard.writeText(text);
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const getRelativeTime = (date) => {
  if (!date) return '';
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
};

// ===========================================
// CSS ANIMATIONS (Add to your global CSS or Tailwind config)
// ===========================================

const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.4); }
    50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.8); }
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
  
  @keyframes progress-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
  
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
  .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
  .animate-truck-move { animation: truck-move 8s linear infinite; }
  .animate-progress-pulse { animation: progress-pulse 1.5s ease-in-out infinite; }
  .animate-shimmer { animation: shimmer 2s linear infinite; background-size: 200% 100%; }
  .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
  .animate-ripple { animation: ripple 1.5s ease-out infinite; }
  
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }
`;

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
  
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Inject animation styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy]);

  const fetchOrders = async () => {
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
        case 'price-high': return b.totalAmount - a.totalAmount;
        case 'price-low': return a.totalAmount - b.totalAmount;
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-violet-100 text-violet-800 border-violet-200',
      ready_to_ship: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      shipped: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      returned: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Calculate stats
  const stats = {
    total: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    inTransit: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
    processing: orders.filter(o => ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.orderStatus)).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600"></div>
            <Truck className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float stagger-2"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float stagger-3"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-lg shadow-sm border-b border-emerald-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-all duration-300"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent flex items-center space-x-2">
                  <span>My Orders</span>
                  <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                </h1>
                <p className="text-gray-600 flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>Track your shipments in real-time with FedEx</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOrders}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-emerald-600 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Refresh</span>
              </button>
              <Link
                to="/store"
                className="group bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 font-medium shadow-lg shadow-emerald-200 flex items-center space-x-2"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedOrder ? (
          <OrderDetail 
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            token={token}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-up">
              <StatsCard 
                title="Total Orders" 
                value={stats.total} 
                icon={<Package className="w-6 h-6" />} 
                color="emerald"
                delay="stagger-1"
              />
              <StatsCard 
                title="Total Spent" 
                value={formatPrice(stats.totalSpent)} 
                icon={<DollarSign className="w-6 h-6" />} 
                color="green"
                delay="stagger-2"
              />
              <StatsCard 
                title="Delivered" 
                value={stats.delivered} 
                icon={<PackageCheck className="w-6 h-6" />} 
                color="teal"
                delay="stagger-3"
              />
              <StatsCard 
                title="In Transit" 
                value={stats.inTransit} 
                icon={<Truck className="w-6 h-6" />} 
                color="cyan"
                delay="stagger-4"
              />
              <StatsCard 
                title="Processing" 
                value={stats.processing} 
                icon={<Clock className="w-6 h-6" />} 
                color="amber"
                delay="stagger-5"
              />
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-6 animate-slide-up stagger-2">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search orders, tracking #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full lg:w-72 transition-all duration-300 hover:border-emerald-300"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white transition-all duration-300 hover:border-emerald-300 cursor-pointer"
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
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white transition-all duration-300 hover:border-emerald-300 cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {filteredOrders.length} of {orders.length} orders
                  </span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LayoutGrid size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                {filteredOrders.map((order, index) => (
                  <div 
                    key={order._id} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => setSelectedOrder(order)}
                      token={token}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-300 ${
                        page === i + 1 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300"
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
    emerald: 'from-emerald-500 to-green-500 bg-emerald-100 text-emerald-600',
    green: 'from-green-500 to-teal-500 bg-green-100 text-green-600',
    teal: 'from-teal-500 to-cyan-500 bg-teal-100 text-teal-600',
    cyan: 'from-cyan-500 to-blue-500 bg-cyan-100 text-cyan-600',
    amber: 'from-amber-500 to-orange-500 bg-amber-100 text-amber-600'
  };

  const colors = colorClasses[color] || colorClasses.emerald;
  const [fromTo, bgIcon, textIcon] = colors.split(' ');

  return (
    <div className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-xl hover:shadow-${color}-100/50 transition-all duration-500 hover:-translate-y-1 ${delay}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-14 h-14 ${bgIcon} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={textIcon}>{icon}</div>
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${fromTo} rounded-full mt-4 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
    </div>
  );
};

// ===========================================
// EMPTY STATE
// ===========================================

const EmptyState = ({ searchTerm, statusFilter }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-16 text-center animate-slide-up">
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse"></div>
      <div className="absolute inset-4 bg-emerald-200 rounded-full flex items-center justify-center">
        <Package className="w-12 h-12 text-emerald-600 animate-bounce-subtle" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">No orders found</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      {searchTerm || statusFilter !== 'all' 
        ? 'Try adjusting your search or filters to find what you\'re looking for' 
        : 'Start shopping to see your orders here. We\'ve got amazing artworks waiting for you!'
      }
    </p>
    <Link
      to="/store"
      className="group inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 font-medium shadow-lg shadow-emerald-200"
    >
      <span>Explore Artworks</span>
      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>
);

// ===========================================
// ORDER CARD WITH LIVE TRACKING
// ===========================================

const OrderCard = ({ order, onClick, token, getStatusColor, getStatusIcon, viewMode }) => {
  const [tracking, setTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const hasTrackingNumber = !!order.fedex?.trackingNumber;
  const isTrackable = hasTrackingNumber && 
    ['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus);

  // Auto-fetch tracking on mount if trackable
  useEffect(() => {
    if (isTrackable && !tracking) {
      fetchTracking();
    }
  }, [isTrackable]);

  const fetchTracking = async () => {
    if (!order.fedex?.trackingNumber) return;
    
    setLoadingTracking(true);
    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/${order._id}/tracking-status`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setTracking(data.data);
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

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
    return `${addr.city || ''}, ${addr.stateCode || addr.state || ''}`;
  };

  return (
    <div 
      className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Status Bar Animation for In-Transit */}
      {['shipped', 'out_for_delivery'].includes(order.orderStatus) && (
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Order #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)} transition-all duration-300 group-hover:scale-105`}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-1 capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200">
                  <Truck size={12} className="mr-1" />
                  FedEx
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 group/item">
                <Calendar className="w-4 h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <DollarSign className="w-4 h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <Package className="w-4 h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span>{order.items?.length || 0} item(s)</span>
              </div>
              <div className="flex items-center space-x-2 group/item">
                <MapPin className="w-4 h-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                <span>{getAddressCity()}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group/btn flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg shadow-emerald-200 hover:shadow-emerald-300"
          >
            <Eye size={16} />
            <span>View Details</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* FedEx Tracking Section */}
        {hasTrackingNumber && (
          <div className="mt-5 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl relative overflow-hidden">
            {/* Animated truck for in-transit */}
            {['shipped', 'out_for_delivery'].includes(order.orderStatus) && (
              <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden opacity-20">
                <Truck className="w-6 h-6 text-emerald-600 animate-truck-move" />
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
              {/* Tracking Info */}
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  tracking?.isDelivered 
                    ? 'bg-green-500 text-white' 
                    : 'bg-emerald-100'
                }`}>
                  {loadingTracking ? (
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  ) : tracking?.isDelivered ? (
                    <PackageCheck className="w-6 h-6" />
                  ) : (
                    <Truck className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-emerald-900 font-bold text-lg">
                      {order.fedex.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      {copiedTracking ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-emerald-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Live Status from FedEx */}
                  {tracking?.currentStatus ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium text-emerald-800">{tracking.currentStatus.description}</span>
                      {tracking.currentStatus.location && (
                        <span className="text-sm text-emerald-600">• {tracking.currentStatus.location}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600">
                      {order.fedex.serviceName || 'FedEx Shipping'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-4 text-sm">
                {tracking?.estimatedDelivery?.ends && !tracking.isDelivered && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-200">
                    <Timer size={14} className="text-emerald-600" />
                    <span className="text-emerald-800 font-medium">Est. {formatDate(tracking.estimatedDelivery.ends)}</span>
                  </div>
                )}
                
                {tracking?.isDelivered && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500 text-white rounded-lg">
                    <PackageCheck size={14} />
                    <span className="font-medium">Delivered</span>
                  </div>
                )}
                
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <span>Track on FedEx</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Preview */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {order.items?.slice(0, 4).map((item, index) => (
              <div 
                key={index} 
                className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-xl overflow-hidden group/img hover:ring-2 hover:ring-emerald-300 transition-all"
              >
                <img
                  src={item.image || '/placeholder-image.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                />
              </div>
            ))}
            {order.items?.length > 4 && (
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center text-sm text-emerald-700 font-bold">
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
// ORDER DETAIL WITH LIVE FEDEX TRACKING
// ===========================================

const OrderDetail = ({ order, onBack, token, getStatusColor, getStatusIcon }) => {
  const [tracking, setTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  const autoRefreshRef = useRef(null);

  const hasTrackingNumber = !!order.fedex?.trackingNumber;
  const isTrackable = hasTrackingNumber && 
    !['delivered', 'cancelled', 'returned'].includes(order.orderStatus);

  // Fetch tracking on mount and set up auto-refresh
  useEffect(() => {
    if (hasTrackingNumber) {
      fetchTracking();
    }

    // Set up auto-refresh every 2 minutes for in-transit orders
    if (isTrackable && autoRefresh) {
      autoRefreshRef.current = setInterval(fetchTracking, 120000);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [order._id, autoRefresh]);

  const fetchTracking = async () => {
    if (!order.fedex?.trackingNumber) return;
    
    setLoadingTracking(true);
    setTrackingError(null);
    
    try {
      const response = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/track/${order._id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      
      if (data.success && data.data.tracking) {
        setTracking(data.data.tracking);
        setLastRefresh(new Date());
      } else if (data.data?.error) {
        setTrackingError(data.data.error);
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
      setTrackingError('Unable to fetch tracking information');
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleCopyTracking = () => {
    copyToClipboard(order.fedex?.trackingNumber, () => {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    });
  };

  // Get address fields
  const addr = order.shippingAddress || {};

  // Tracking events
  const events = tracking?.events || [];

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.orderStatus);
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Placed on {formatDateTime(order.createdAt)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-full border border-emerald-200 font-medium">
                  <Truck size={14} className="mr-1.5" />
                  FedEx Tracked
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Order Total</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Live FedEx Tracking Section */}
      {hasTrackingNumber && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 overflow-hidden animate-slide-up stagger-1">
          {/* Tracking Header with Gradient */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-8 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,...')] animate-shimmer"></div>
            </div>
            
            {/* Floating Trucks Animation */}
            <div className="absolute top-4 right-4 opacity-20">
              <Truck className="w-24 h-24 text-white animate-float" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Truck className="w-9 h-9 text-white" />
                  </div>
                  {['shipped', 'out_for_delivery'].includes(order.orderStatus) && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span>Live FedEx Tracking</span>
                    {tracking?.isDelivered && (
                      <span className="bg-white/20 px-2 py-1 rounded-full text-sm">✓ Delivered</span>
                    )}
                  </h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="font-mono text-white/90 text-xl tracking-wider">
                      {order.fedex.trackingNumber}
                    </span>
                    <button 
                      onClick={handleCopyTracking} 
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {copiedTracking ? (
                        <Check size={18} className="text-green-300" />
                      ) : (
                        <Copy size={18} className="text-white/80" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchTracking}
                  disabled={loadingTracking}
                  className="group flex items-center space-x-2 px-6 py-3 bg-white text-emerald-600 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold shadow-lg disabled:opacity-70"
                >
                  {loadingTracking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Refresh Status</span>
                    </>
                  )}
                </button>
                
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold"
                >
                  <Globe className="w-5 h-5" />
                  <span>View on FedEx.com</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Current Status - Live from FedEx */}
            {tracking?.currentStatus && (
              <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
                
                <div className="relative flex items-start space-x-5">
                  <div className="relative">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse-glow"></div>
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ripple"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 text-xl mb-2">
                      {tracking.currentStatus.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-700">
                      {tracking.currentStatus.location && (
                        <span className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                          <MapPinned size={16} className="text-emerald-600" />
                          <span className="font-medium">{tracking.currentStatus.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                        <Clock size={16} className="text-emerald-600" />
                        <span>{getRelativeTime(tracking.currentStatus.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {tracking.isDelivered && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-green-200">
                      <PackageCheck size={20} />
                      <span>Delivered Successfully</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Error */}
            {trackingError && (
              <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start space-x-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Tracking Update</p>
                  <p className="text-sm text-amber-600 mt-1">{trackingError}</p>
                  <button 
                    onClick={fetchTracking}
                    className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    Try again →
                  </button>
                </div>
              </div>
            )}

            {/* Shipping Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Shipping Progress</span>
                <span className="text-sm font-bold text-emerald-600">{getProgressPercentage()}% Complete</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <InfoCard 
                icon={<Plane className="w-5 h-5" />}
                label="Service Type"
                value={tracking?.shipmentDetails?.serviceDescription || 
                       order.fedex.serviceName || 
                       order.fedex.serviceType?.replace(/_/g, ' ') || 
                       'FedEx'}
                color="emerald"
              />
              
              <InfoCard 
                icon={<Activity className="w-5 h-5" />}
                label="Current Status"
                value={tracking?.currentStatus?.description || order.orderStatus?.replace(/_/g, ' ')}
                color="green"
              />
              
              <InfoCard 
                icon={<Timer className="w-5 h-5" />}
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

            {/* Delivery Details if Delivered */}
            {tracking?.isDelivered && tracking.deliveryDetails && (
              <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <PackageCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-green-800 text-lg">Delivery Confirmation</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-green-100">
                    <span className="text-sm text-green-600 flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Delivered At</span>
                    </span>
                    <p className="font-bold text-green-900 mt-1">
                      {formatDateTime(tracking.deliveryDetails.actualDeliveryTimestamp)}
                    </p>
                  </div>
                  {tracking.deliveryDetails.deliveryLocation && (
                    <div className="bg-white p-4 rounded-xl border border-green-100">
                      <span className="text-sm text-green-600 flex items-center space-x-1">
                        <HomeIcon size={14} />
                        <span>Location</span>
                      </span>
                      <p className="font-bold text-green-900 mt-1">{tracking.deliveryDetails.deliveryLocation}</p>
                    </div>
                  )}
                  {tracking.deliveryDetails.signedBy && (
                    <div className="bg-white p-4 rounded-xl border border-green-100">
                      <span className="text-sm text-green-600 flex items-center space-x-1">
                        <Shield size={14} />
                        <span>Signed By</span>
                      </span>
                      <p className="font-bold text-green-900 mt-1">{tracking.deliveryDetails.signedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Events Timeline */}
            {events.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Route className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Package Journey</h3>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                    {events.length} updates
                  </span>
                </div>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-200"></div>
                  
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
                    className="mt-6 flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-semibold mx-auto px-6 py-3 bg-white rounded-xl border border-emerald-200 hover:border-emerald-300 transition-all"
                  >
                    {showAllEvents ? (
                      <>
                        <ChevronUp size={18} />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        <span>Show All {events.length} Events</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Auto-refresh toggle */}
            {isTrackable && (
              <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity size={16} />
                  <span>Last updated: {lastRefresh ? getRelativeTime(lastRefresh) : 'Just now'}</span>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Auto-refresh every 2 min</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Progress (for non-shipped orders) */}
      {!hasTrackingNumber && order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-8 animate-slide-up stagger-1">
          <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Order Progress</span>
          </h2>
          <OrderProgress status={order.orderStatus} />
        </div>
      )}

      {/* Grid: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-8 animate-slide-up stagger-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <PackageOpen className="w-5 h-5 text-emerald-600" />
              <span>Order Items</span>
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {order.items?.length || 0} items
              </span>
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div 
                  key={index} 
                  className="group flex items-center space-x-5 p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                    {item.author && <p className="text-gray-600">by {item.author}</p>}
                    {item.medium && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                        <Star size={12} className="text-amber-400" />
                        <span>{item.medium}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                    <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-6 animate-slide-up stagger-3">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Order Summary</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shipping</span>
                <span className={`font-semibold ${order.shippingCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center space-x-1">
                    <Zap size={14} />
                    <span>Discount</span>
                  </span>
                  <span className="font-bold">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-6 animate-slide-up stagger-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Shipping Address</span>
            </h2>
            <div className="space-y-3 text-gray-600">
              {addr.recipientName && (
                <p className="font-bold text-gray-900 text-lg">{addr.recipientName}</p>
              )}
              <div className="space-y-1">
                <p>{addr.streetLine1 || addr.street || addr.flatNo}</p>
                {(addr.streetLine2 || addr.apartment) && <p>{addr.streetLine2 || addr.apartment}</p>}
                <p>{addr.city}, {addr.stateCode || addr.state} {addr.zipCode}</p>
                <p className="font-medium">United States</p>
              </div>
              
              {(addr.phoneNumber || addr.phoneNo) && (
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{formatPhoneNumber(addr.phoneNumber || addr.phoneNo)}</span>
                </div>
              )}
              
              {addr.addressVerified && (
                <div className="flex items-center space-x-2 text-green-600 mt-4 pt-3 border-t border-gray-100 bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Address verified by FedEx</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 p-6 animate-slide-up stagger-5">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>Payment</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Method</span>
                <span className="font-semibold text-gray-900 flex items-center space-x-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <span>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-xl p-6 text-white animate-slide-up stagger-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Need Help?</h3>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Questions about your order? We're here to help 24/7.
            </p>
            <Link
              to="/contact"
              className="group inline-flex items-center space-x-2 bg-white text-emerald-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              <span>Contact Support</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
    <div className={`p-5 rounded-2xl border-2 ${colorClasses[color]} transition-all hover:shadow-lg`}>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="font-bold text-gray-900 text-lg capitalize">{value}</p>
    </div>
  );
};

// ===========================================
// TRACKING EVENT COMPONENT
// ===========================================

const TrackingEvent = ({ event, isFirst, isLast, index }) => {
  const eventDate = event.timestamp || event.date;
  const eventDescription = event.eventDescription || event.description;
  const location = event.location?.formatted || event.location?.city || 
    (typeof event.location === 'string' ? event.location : null);

  return (
    <div 
      className="relative flex items-start space-x-5 pl-3 animate-slide-in-right"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Timeline dot */}
      <div className="relative z-10 mt-1.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isFirst 
            ? 'bg-emerald-500 ring-4 ring-emerald-100 shadow-lg shadow-emerald-200' 
            : 'bg-emerald-200'
        }`}>
          {isFirst && <div className="w-2 h-2 bg-white rounded-full"></div>}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className={`bg-white rounded-2xl p-5 border-2 ${
          isFirst ? 'border-emerald-200 shadow-lg shadow-emerald-50' : 'border-gray-100'
        } hover:shadow-xl hover:border-emerald-200 transition-all duration-300`}>
          <p className={`font-semibold ${isFirst ? 'text-emerald-900 text-lg' : 'text-gray-900'}`}>
            {eventDescription}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
              <Calendar size={14} className="text-gray-400" />
              <span>{formatDate(eventDate)}</span>
              <span className="text-gray-300">•</span>
              <span>{formatTime(eventDate)}</span>
            </span>
            {location && (
              <span className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">
                <MapPinned size={14} />
                <span className="font-medium">{location}</span>
              </span>
            )}
          </div>
          {event.exceptionDescription && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start space-x-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{event.exceptionDescription}</span>
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
    { key: 'pending', label: 'Order Placed', icon: Package, color: 'amber' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'blue' },
    { key: 'processing', label: 'Processing', icon: Clock, color: 'violet' },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'emerald' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation, color: 'orange' },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck, color: 'green' }
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute top-8 left-0 right-0 h-2 bg-gray-100 rounded-full mx-10">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
        </div>
      </div>
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentIndex >= statusOrder.indexOf(step.key);
          const isCurrent = status === step.key;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex flex-col items-center group">
              <div 
                className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200' 
                    : 'bg-gray-100 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-emerald-200 scale-110' : 'group-hover:scale-105'}`}
              >
                <Icon size={24} className={isCurrent ? 'animate-bounce-subtle' : ''} />
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold text-center mt-3 max-w-[80px] transition-colors ${
                isCompleted ? 'text-emerald-600' : 'text-gray-500'
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
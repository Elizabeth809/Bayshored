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
  Home as HomeIcon
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
  
  const { token } = useAuth();
  const navigate = useNavigate();

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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      ready_to_ship: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-gray-600">Track your shipments in real-time with FedEx</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOrders}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>
              <Link
                to="/store"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatsCard title="Total Orders" value={stats.total} icon={<Package className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-100" />
              <StatsCard title="Total Spent" value={formatPrice(stats.totalSpent)} icon={<DollarSign className="w-6 h-6 text-green-600" />} bgColor="bg-green-100" />
              <StatsCard title="Delivered" value={stats.delivered} icon={<PackageCheck className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
              <StatsCard title="In Transit" value={stats.inTransit} icon={<Truck className="w-6 h-6 text-orange-600" />} bgColor="bg-orange-100" />
              <StatsCard title="Processing" value={stats.processing} icon={<Clock className="w-6 h-6 text-purple-600" />} bgColor="bg-purple-100" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search orders, tracking #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-72"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                </div>

                <span className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                    token={token}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
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

const StatsCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

// ===========================================
// EMPTY STATE
// ===========================================

const EmptyState = ({ searchTerm, statusFilter }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Package className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">No orders found</h3>
    <p className="text-gray-600 mb-6">
      {searchTerm || statusFilter !== 'all' 
        ? 'Try adjusting your search or filters' 
        : 'Start shopping to see your orders here'
      }
    </p>
    <Link
      to="/store"
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium inline-block"
    >
      Explore Artworks
    </Link>
  </div>
);

// ===========================================
// ORDER CARD WITH LIVE TRACKING
// ===========================================

const OrderCard = ({ order, onClick, token, getStatusColor, getStatusIcon }) => {
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

  // Determine display status from FedEx or order
  const displayStatus = tracking?.currentStatus?.description || 
    order.orderStatus?.replace(/_/g, ' ');

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Order #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-1 capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
              {hasTrackingNumber && (
                <span className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                  <Truck size={12} className="mr-1" />
                  FedEx
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>{order.items?.length || 0} item(s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{getAddressCity()}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Eye size={16} />
            <span>View Details</span>
          </button>
        </div>

        {/* FedEx Tracking Section */}
        {hasTrackingNumber && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Tracking Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  {loadingTracking ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : (
                    <Truck className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-900 font-bold">
                      {order.fedex.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {copiedTracking ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  {/* Live Status from FedEx */}
                  {tracking?.currentStatus ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-indigo-700">{tracking.currentStatus.description}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-indigo-600">
                      {order.fedex.serviceName || 'FedEx Shipping'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 text-sm">
                {tracking?.estimatedDelivery?.ends && !tracking.isDelivered && (
                  <span className="text-indigo-700 flex items-center space-x-1">
                    <Timer size={14} />
                    <span>Est. {formatDate(tracking.estimatedDelivery.ends)}</span>
                  </span>
                )}
                
                {tracking?.isDelivered && (
                  <span className="text-green-700 flex items-center space-x-1 font-medium">
                    <PackageCheck size={14} />
                    <span>Delivered</span>
                  </span>
                )}
                
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                >
                  <span>Track on FedEx</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Preview */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {order.items?.slice(0, 4).map((item, index) => (
              <div key={index} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.image || '/placeholder-image.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                />
              </div>
            ))}
            {order.items?.length > 4 && (
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 font-medium">
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
      } else if (data.data.error) {
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-1 capitalize">{order.orderStatus?.replace(/_/g, ' ')}</span>
              </span>
            </div>
            <p className="text-gray-600">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* FedEx Live Tracking Section */}
      {hasTrackingNumber && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Live FedEx Tracking</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-white/90 text-lg">
                      {order.fedex.trackingNumber}
                    </span>
                    <button onClick={handleCopyTracking} className="text-white/80 hover:text-white">
                      {copiedTracking ? <Check size={16} className="text-green-300" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchTracking}
                  disabled={loadingTracking}
                  className="flex items-center space-x-2 px-5 py-2 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 transition-colors font-medium disabled:opacity-70"
                >
                  {loadingTracking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                
                <a
                  href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-5 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>FedEx.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Current Status - Live from FedEx */}
            {tracking?.currentStatus && (
              <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full mt-1 animate-pulse"></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 text-lg">
                      {tracking.currentStatus.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-green-700">
                      {tracking.currentStatus.location && (
                        <span className="flex items-center space-x-1">
                          <MapPinned size={14} />
                          <span>{tracking.currentStatus.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{getRelativeTime(tracking.currentStatus.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {tracking.isDelivered && (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                      <PackageCheck size={18} />
                      <span>Delivered</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Error */}
            {trackingError && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Tracking Update</p>
                  <p className="text-sm text-yellow-600">{trackingError}</p>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Plane size={16} className="text-indigo-600" />
                  <p className="text-sm text-indigo-600">Service</p>
                </div>
                <p className="font-bold text-indigo-900">
                  {tracking?.shipmentDetails?.serviceDescription || 
                   order.fedex.serviceName || 
                   order.fedex.serviceType?.replace(/_/g, ' ') || 
                   'FedEx'}
                </p>
              </div>
              
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation size={16} className="text-indigo-600" />
                  <p className="text-sm text-indigo-600">Status</p>
                </div>
                <p className="font-bold text-indigo-900">
                  {tracking?.currentStatus?.description || order.orderStatus?.replace(/_/g, ' ')}
                </p>
              </div>
              
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer size={16} className="text-indigo-600" />
                  <p className="text-sm text-indigo-600">
                    {tracking?.isDelivered ? 'Delivered' : 'Estimated Delivery'}
                  </p>
                </div>
                <p className="font-bold text-indigo-900">
                  {tracking?.isDelivered 
                    ? formatDate(tracking.deliveryDetails?.actualDeliveryTimestamp)
                    : tracking?.estimatedDelivery?.ends 
                      ? formatDate(tracking.estimatedDelivery.ends)
                      : order.fedex.estimatedDeliveryDate 
                        ? formatDate(order.fedex.estimatedDeliveryDate)
                        : 'Pending'
                  }
                </p>
              </div>
            </div>

            {/* Delivery Details if Delivered */}
            {tracking?.isDelivered && tracking.deliveryDetails && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-green-800 mb-2">Delivery Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Delivered At:</span>
                    <p className="font-medium text-green-900">
                      {formatDateTime(tracking.deliveryDetails.actualDeliveryTimestamp)}
                    </p>
                  </div>
                  {tracking.deliveryDetails.deliveryLocation && (
                    <div>
                      <span className="text-green-600">Location:</span>
                      <p className="font-medium text-green-900">{tracking.deliveryDetails.deliveryLocation}</p>
                    </div>
                  )}
                  {tracking.deliveryDetails.signedBy && (
                    <div>
                      <span className="text-green-600">Signed By:</span>
                      <p className="font-medium text-green-900">{tracking.deliveryDetails.signedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Events Timeline */}
            {events.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Journey</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-200"></div>
                  
                  <div className="space-y-4">
                    {(showAllEvents ? events : events.slice(0, 5)).map((event, index) => (
                      <TrackingEvent 
                        key={index} 
                        event={event} 
                        isFirst={index === 0}
                        isLast={index === events.length - 1}
                      />
                    ))}
                  </div>
                </div>
                
                {events.length > 5 && (
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="mt-4 flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium ml-10"
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

            {/* Auto-refresh toggle */}
            {isTrackable && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Last updated: {tracking?.lastUpdated ? getRelativeTime(tracking.lastUpdated) : 'Just now'}
                </span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh every 2 min</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Progress (for non-FedEx tracking or additional visibility) */}
      {!hasTrackingNumber && order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          <OrderProgress status={order.orderStatus} />
        </div>
      )}

      {/* Grid: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.author && <p className="text-sm text-gray-600">by {item.author}</p>}
                    {item.medium && <p className="text-sm text-gray-500">{item.medium}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>Shipping Address</span>
            </h2>
            <div className="space-y-2 text-gray-600">
              {addr.recipientName && <p className="font-semibold text-gray-900">{addr.recipientName}</p>}
              <p>{addr.streetLine1 || addr.street || addr.flatNo}</p>
              {(addr.streetLine2 || addr.apartment) && <p>{addr.streetLine2 || addr.apartment}</p>}
              <p>{addr.city}, {addr.stateCode || addr.state} {addr.zipCode}</p>
              <p>United States</p>
              
              {(addr.phoneNumber || addr.phoneNo) && (
                <div className="pt-2 mt-2 border-t border-gray-200 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{formatPhoneNumber(addr.phoneNumber || addr.phoneNo)}</span>
                </div>
              )}
              
              {addr.addressVerified && (
                <div className="flex items-center space-x-2 text-green-600 mt-3 pt-2 border-t border-gray-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Address verified by FedEx</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium text-gray-900">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium capitalize ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Questions about your order? We're here to help.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>Contact Support</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// TRACKING EVENT COMPONENT
// ===========================================

const TrackingEvent = ({ event, isFirst, isLast }) => {
  const eventDate = event.timestamp || event.date;
  const eventDescription = event.eventDescription || event.description;
  const location = event.location?.formatted || event.location?.city || 
    (typeof event.location === 'string' ? event.location : null);

  return (
    <div className="relative flex items-start space-x-4 pl-2">
      {/* Timeline dot */}
      <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
        isFirst 
          ? 'bg-green-500 ring-4 ring-green-100' 
          : 'bg-indigo-400'
      }`}>
        {isFirst && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <p className={`font-medium ${isFirst ? 'text-green-800' : 'text-gray-900'}`}>
            {eventDescription}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{formatDateTime(eventDate)}</span>
            </span>
            {location && (
              <span className="flex items-center space-x-1">
                <MapPinned size={12} />
                <span>{location}</span>
              </span>
            )}
          </div>
          {event.exceptionDescription && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertTriangle size={12} className="inline mr-1" />
              {event.exceptionDescription}
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
      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>
      
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentIndex >= statusOrder.indexOf(step.key);
          const isCurrent = status === step.key;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-medium text-center mt-2 max-w-[70px] ${
                isCompleted ? 'text-blue-600' : 'text-gray-500'
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
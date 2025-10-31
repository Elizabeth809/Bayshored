import { useState, useEffect } from 'react';
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
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  MapPin
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-high':
          return b.totalAmount - a.totalAmount;
        case 'price-low':
          return a.totalAmount - b.totalAmount;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredOrders(filtered);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      processing: <Package className="w-5 h-5" />,
      shipped: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Clock className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusProgress = (status) => {
    const steps = {
      pending: 1,
      confirmed: 2,
      processing: 3,
      shipped: 4,
      delivered: 5,
      cancelled: 0
    };
    return steps[status] || 1;
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
        <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex items-center justify-between !py-6">
            <div className="flex items-center !space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center !space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-gray-600">Track and manage your artwork orders</p>
              </div>
            </div>
            <Link
              to="/store"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-6 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {selectedOrder ? (
          <OrderDetail 
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            formatPrice={formatPrice}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getStatusProgress={getStatusProgress}
          />
        ) : (
          <div className="!space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(orders.reduce((total, order) => total + order.totalAmount, 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.filter(order => order.orderStatus === 'delivered').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.filter(order => 
                        ['pending', 'confirmed', 'processing', 'shipped'].includes(order.orderStatus)
                      ).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between !space-y-4 lg:!space-y-0">
                <div className="flex flex-col sm:flex-row !space-y-4 sm:!space-y-0 sm:!space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search orders or artworks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="!pl-10 !pr-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-64"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="!px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="!px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center !mx-auto !mb-6">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 !mb-3">No orders found</h3>
                <p className="text-gray-600 !mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start shopping to see your orders here'
                  }
                </p>
                <Link
                  to="/store"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium inline-block"
                >
                  Explore Artworks
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onClick, formatPrice, formatDate, getStatusColor, getStatusIcon }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="!p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between !space-y-4 lg:!space-y-0">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex items-center !space-x-4 !mb-3">
              <h3 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h3>
              <span className={`inline-flex items-center !px-3 !py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="!ml-1 capitalize">{order.orderStatus}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center !space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Placed {formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center !space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex items-center !space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>{order.items.length} item(s)</span>
              </div>
              <div className="flex items-center !space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex !space-x-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center !space-x-2 !px-4 !py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Eye size={16} />
              <span>View Details</span>
            </button>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="!mt-4 !pt-4 border-t border-gray-200">
          <div className="flex !space-x-3 overflow-x-auto pb-2">
            {order.items.slice(0, 4).map((item, index) => (
              <div key={index} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {order.items.length > 4 && (
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

// Order Detail Component
const OrderDetail = ({ order, onBack, formatPrice, formatDate, getStatusColor, getStatusIcon, getStatusProgress }) => {
  const progress = getStatusProgress(order.orderStatus);
  
  return (
    <div className="!space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center !space-x-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft size={20} />
        <span>Back to Orders</span>
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between !space-y-4 lg:!space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(order.totalAmount)}
            </p>
            <span className={`inline-flex items-center !px-3 !py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
              {getStatusIcon(order.orderStatus)}
              <span className="!ml-1 capitalize">{order.orderStatus}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
        <h2 className="text-lg font-semibold text-gray-900 !mb-6">Order Progress</h2>
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(progress / 5) * 100}%` }}
            ></div>
          </div>
          
          {/* Steps */}
          {[
            { status: 'pending', label: 'Order Placed' },
            { status: 'confirmed', label: 'Confirmed' },
            { status: 'processing', label: 'Processing' },
            { status: 'shipped', label: 'Shipped' },
            { status: 'delivered', label: 'Delivered' }
          ].map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber <= progress;
            const isCurrent = stepNumber === progress;
            
            return (
              <div key={step.status} className="flex flex-col items-center !space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white' 
                    : isCurrent
                    ? 'bg-white border-blue-500 text-blue-500'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle size={16} /> : stepNumber}
                </div>
                <span className={`text-xs font-medium text-center ${
                  isCompleted ? 'text-blue-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 !space-y-6">
          {/* Shipping Updates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
            <h2 className="text-lg font-semibold text-gray-900 !mb-4">Shipping Updates</h2>
            <div className="!space-y-4">
              {order.shippingUpdates.map((update, index) => (
                <div key={index} className="flex items-start !space-x-4 !p-4 bg-gray-50 rounded-xl">
                  <div className="w-3 h-3 bg-blue-500 rounded-full !mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{update.message}</p>
                    <p className="text-sm text-gray-500 !mt-1">
                      {formatDate(update.timestamp)} at {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
            <h2 className="text-lg font-semibold text-gray-900 !mb-4">Order Items</h2>
            <div className="!space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center !space-x-4 !p-4 bg-gray-50 rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">by {item.author}</p>
                    <p className="text-sm text-gray-500">{item.medium}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.priceAtOrder * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="!space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
            <h2 className="text-lg font-semibold text-gray-900 !mb-4">Order Summary</h2>
            <div className="!space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">{formatPrice(order.shippingCost)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 !pt-3">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
            <h2 className="text-lg font-semibold text-gray-900 !mb-4">Shipping Address</h2>
            <div className="!space-y-2 text-gray-600">
              <p className="font-medium">{order.shippingAddress.flatNo}, {order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              <p>{order.shippingAddress.zipCode}, {order.shippingAddress.country}</p>
              <p className="!pt-2 border-t border-gray-200">📞 {order.shippingAddress.phoneNo}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
            <h2 className="text-lg font-semibold text-gray-900 !mb-4">Payment Information</h2>
            <div className="!space-y-2 text-gray-600">
              <p><strong>Method:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
              <p><strong>Status:</strong> 
                <span className={`!ml-2 capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus}
                </span>
              </p>
              {order.couponApplied && (
                <p><strong>Coupon:</strong> {order.couponApplied.code} applied</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
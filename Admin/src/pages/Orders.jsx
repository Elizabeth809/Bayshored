import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt_desc'
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/api/v1/orders/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const addShippingUpdate = async (orderId, message) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/orders/admin/${orderId}/shipping-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (data.success) {
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding shipping update:', error);
      alert('Failed to add shipping update');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/orders/admin/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${selectedOrder.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 !mt-1">Manage and track all customer orders</p>
        </div>
        {stats && (
          <div className="flex !space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
              <div className="text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Search</label>
            <input
              type="text"
              placeholder="Customer name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="totalAmount_desc">Highest Amount</option>
              <option value="totalAmount_asc">Lowest Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Items Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center !!py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.items.length} items</div>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.user?.name}</div>
                      <div className="text-sm text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center !py-12">
            <div className="text-gray-400 !mb-4">
              <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 !mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.orderNumber}`}
        size="large"
      >
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onUpdateStatus={updateOrderStatus}
            onAddShippingUpdate={addShippingUpdate}
            onDownloadInvoice={downloadInvoice}
            onClose={() => setSelectedOrder(null)}
            formatPrice={formatPrice}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        )}
      </Modal>
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal = ({ 
  order, 
  onUpdateStatus, 
  onAddShippingUpdate, 
  onDownloadInvoice, 
  onClose,
  formatPrice, 
  formatDate, 
  getStatusColor 
}) => {
  const [newStatus, setNewStatus] = useState(order.orderStatus);
  const [shippingUpdate, setShippingUpdate] = useState('');

  const handleStatusUpdate = () => {
    if (newStatus !== order.orderStatus) {
      onUpdateStatus(order._id, newStatus);
    }
  };

  const handleAddShippingUpdate = () => {
    if (shippingUpdate.trim()) {
      onAddShippingUpdate(order._id, shippingUpdate.trim());
      setShippingUpdate('');
    }
  };

  return (
    <div className="!space-y-6 max-h-96 overflow-y-auto">
      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Customer Information</h3>
          <div className="!space-y-2 text-sm">
            <p><strong>Name:</strong> {order.user?.name}</p>
            <p><strong>Email:</strong> {order.user?.email}</p>
            <p><strong>Phone:</strong> {order.user?.phoneNumber}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Order Information</h3>
          <div className="!space-y-2 text-sm">
            <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
            <p><strong>Status:</strong> 
              <span className={`!ml-2 inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </p>
            <p><strong>Payment:</strong> {order.paymentStatus}</p>
            {order.couponApplied && (
              <p><strong>Coupon:</strong> {order.couponApplied.code} (-{formatPrice(order.discountAmount)})</p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 !mb-3">Shipping Address</h3>
        <div className="bg-gray-50 rounded-lg !p-4 text-sm">
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
          <p>Phone: {order.shippingAddress.phoneNo}</p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 !mb-3">Order Items</h3>
        <div className="!space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center !space-x-4 !p-3 bg-gray-50 rounded-lg">
              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">by {item.author} • {item.medium}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Total */}
      <div className="border-t border-gray-200 !pt-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Amount:</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Status Update */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 !mb-3">Update Order Status</h3>
        <div className="flex !space-x-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={newStatus === order.orderStatus}
            className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>

      {/* Shipping Updates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 !mb-3">Shipping Updates</h3>
        <div className="!space-y-3 !mb-4">
          {order.shippingUpdates.map((update, index) => (
            <div key={index} className="flex items-start !space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full !mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-gray-900">{update.message}</p>
                <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex !space-x-3">
          <input
            type="text"
            placeholder="Add shipping update..."
            value={shippingUpdate}
            onChange={(e) => setShippingUpdate(e.target.value)}
            className="flex-1 !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddShippingUpdate}
            disabled={!shippingUpdate.trim()}
            className="bg-green-600 text-white !px-4 !py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between !pt-4 border-t border-gray-200">
        <button
          onClick={onDownloadInvoice}
          className="bg-gray-600 text-white !px-4 !py-2 rounded-lg hover:bg-gray-700"
        >
          Download Invoice
        </button>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Orders;
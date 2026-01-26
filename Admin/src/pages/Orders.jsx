// admin/pages/Orders.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';
import {
  AlertTriangle,
  Truck,
  Package,
  Calendar,
  MapPin,
  CheckCircle,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Clock,
  RefreshCw
} from 'lucide-react';

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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ship order modal
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState(null);

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

      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/all?${params}`, {
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
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${orderId}/status`, {
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
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${orderId}/shipping-update`, {
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

  const handleOpenDeleteModal = (orderId) => {
    setOrderToDelete(orderId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setOrderToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${orderToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderToDelete) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } finally {
      setIsDeleting(false);
      handleCloseDeleteModal();
    }
  };

  // Ship order handlers
  const handleOpenShipModal = (order) => {
    setOrderToShip(order);
    setIsShipModalOpen(true);
  };

  const handleCloseShipModal = () => {
    setOrderToShip(null);
    setIsShipModalOpen(false);
  };

  const handleShipSuccess = () => {
    fetchOrders();
    if (selectedOrder) {
      // Refresh selected order details
      fetchOrderDetails(selectedOrder._id);
    }
    handleCloseShipModal();
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${orderId}/invoice`, {
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
      ready_to_ship: 'bg-cyan-100 text-cyan-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders with FedEx</p>
        </div>
        {stats && (
          <div className="flex space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
              <div className="text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatPrice(stats.totalFailedAmount)}</div>
              <div className="text-gray-600">Failed Payments</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Customer name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="totalAmount_desc">Highest Amount</option>
              <option value="totalAmount_asc">Lowest Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} items
                        {order.fedex?.trackingNumber && (
                          <span className="ml-2 text-blue-600">
                            <Truck size={14} className="inline mr-1" />
                            Tracked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.user?.name}</div>
                      <div className="text-sm text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.replace(/_/g, ' ').charAt(0).toUpperCase() + order.orderStatus.replace(/_/g, ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>

                      {/* Ship button */}
                      {!order.fedex?.trackingNumber && 
                       order.paymentStatus === 'paid' &&
                       !['cancelled', 'returned'].includes(order.orderStatus) && (
                        <button
                          onClick={() => handleOpenShipModal(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Ship
                        </button>
                      )}

                      {/* Delete button */}
                      {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && 
                       order.paymentMethod !== 'COD' && (
                        <button
                          onClick={() => handleOpenDeleteModal(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
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
            onDeleteOrder={handleOpenDeleteModal}
            onShipOrder={handleOpenShipModal}
            onClose={() => setSelectedOrder(null)}
            formatPrice={formatPrice}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            getPaymentStatusColor={getPaymentStatusColor}
            token={token}
          />
        )}
      </Modal>

      {/* Ship Order Modal */}
      <Modal
        isOpen={isShipModalOpen}
        onClose={handleCloseShipModal}
        title="Create FedEx Shipment"
        size="medium"
      >
        {orderToShip && (
          <ShipOrderModal
            order={orderToShip}
            onSuccess={handleShipSuccess}
            onClose={handleCloseShipModal}
            token={token}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirm Deletion"
        size="small"
      >
        <div className="p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete Abandoned Order?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this order? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingSpinner size="small" /> : 'Delete'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Ship Order Modal Component
const ShipOrderModal = ({ order, onSuccess, onClose, token }) => {
  const [shipping, setShipping] = useState(false);
  const [serviceType, setServiceType] = useState('FEDEX_GROUND');
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [schedulePickup, setSchedulePickup] = useState(false);
  const [pickupDate, setPickupDate] = useState('');

  // Set default pickup date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleShip = async () => {
    setShipping(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/admin/${order._id}/create-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceType,
          signatureRequired,
          schedulePickup,
          pickupDate: schedulePickup ? pickupDate : null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Order shipped!\nTracking: ${data.data.tracking.trackingNumber}`);
        onSuccess();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Ship error:', error);
      alert('Failed to create shipment');
    } finally {
      setShipping(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Order Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Order #{order.orderNumber}</h3>
        <p className="text-sm text-gray-600">Customer: {order.user?.name}</p>
        <p className="text-sm text-gray-600">Items: {order.items.length}</p>
        <p className="text-sm text-gray-600">Total: ${order.totalAmount}</p>
      </div>

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          FedEx Service
        </label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="FEDEX_GROUND">FedEx Ground (1-5 days)</option>
          <option value="GROUND_HOME_DELIVERY">Home Delivery (1-5 days)</option>
          <option value="FEDEX_EXPRESS_SAVER">Express Saver (3 days)</option>
          <option value="FEDEX_2_DAY">FedEx 2Day</option>
          <option value="STANDARD_OVERNIGHT">Standard Overnight</option>
          <option value="PRIORITY_OVERNIGHT">Priority Overnight</option>
        </select>
      </div>

      {/* Signature Required */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="signature"
          checked={signatureRequired}
          onChange={(e) => setSignatureRequired(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded"
        />
        <label htmlFor="signature" className="ml-2 text-sm text-gray-700">
          Signature Required
        </label>
      </div>

      {/* Schedule Pickup */}
      <div className="border-t pt-4">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="pickup"
            checked={schedulePickup}
            onChange={(e) => setSchedulePickup(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="pickup" className="ml-2 text-sm font-medium text-gray-700">
            Schedule FedEx Pickup
          </label>
        </div>

        {schedulePickup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              FedEx will pickup the package from your warehouse
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t">
        <button
          onClick={handleShip}
          disabled={shipping}
          className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {shipping ? (
            <>
              <LoadingSpinner size="small" />
              <span>Creating Shipment...</span>
            </>
          ) : (
            <>
              <Truck size={18} />
              <span>Create Shipment</span>
            </>
          )}
        </button>
        <button
          onClick={onClose}
          disabled={shipping}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Order Detail Modal Component (Continued in next part due to length...)
// Part of admin/pages/Orders.jsx (continued)

const OrderDetailModal = ({
  order,
  onUpdateStatus,
  onAddShippingUpdate,
  onDownloadInvoice,
  onDeleteOrder,
  onShipOrder,
  onClose,
  formatPrice,
  formatDate,
  getStatusColor,
  getPaymentStatusColor,
  token
}) => {
  const [newStatus, setNewStatus] = useState(order.orderStatus);
  const [shippingUpdate, setShippingUpdate] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    if (order.fedex?.trackingNumber) {
      fetchTracking();
    }
  }, [order._id]);

  const fetchTracking = async () => {
    setLoadingTracking(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/orders/track/${order._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data.tracking) {
        setTracking(data.data.tracking);
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

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

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(order.fedex.trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleCancelShipment = async () => {
    if (!confirm('Cancel this FedEx shipment?')) return;

    try {
      const response = await fetch(
        `${ADMIN_BASE_URL}/api/v1/orders/admin/${order._id}/cancel-shipment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('Shipment cancelled successfully');
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Cancel shipment error:', error);
      alert('Failed to cancel shipment');
    }
  };

  const downloadLabel = () => {
    if (order.fedex?.labelUrl) {
      window.open(order.fedex.labelUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-6">
      {/* FedEx Tracking Section (if shipped) */}
      {order.fedex?.trackingNumber && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900">FedEx Shipment Created</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-green-800 font-bold">
                    {order.fedex.trackingNumber}
                  </span>
                  <button
                    onClick={handleCopyTracking}
                    className="text-green-600 hover:text-green-800"
                  >
                    {copiedTracking ? (
                      <Check size={16} className="text-green-700" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchTracking}
                disabled={loadingTracking}
                className="flex items-center space-x-1 px-3 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 text-sm"
              >
                <RefreshCw size={14} className={loadingTracking ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              
              {order.fedex.labelUrl && (
                <button
                  onClick={downloadLabel}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 text-sm"
                >
                  <Printer size={14} />
                  <span>Label</span>
                </button>
              )}

              <a
                href={`https://www.fedex.com/fedextrack/?trknbr=${order.fedex.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <span>Track on FedEx</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Current Status */}
          {tracking?.currentStatus && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1 animate-pulse"></div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 text-lg">
                    {tracking.currentStatus.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-green-700">
                    {tracking.currentStatus.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{tracking.currentStatus.location}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDate(tracking.currentStatus.timestamp)}</span>
                    </span>
                  </div>
                </div>
                {tracking.isDelivered && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-lg flex items-center space-x-1">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Delivered</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Info */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Service</p>
              <p className="font-semibold text-green-900 text-sm">
                {order.fedex.serviceName || order.fedex.serviceType}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Est. Delivery</p>
              <p className="font-semibold text-green-900 text-sm">
                {tracking?.estimatedDelivery?.ends 
                  ? formatDate(tracking.estimatedDelivery.ends)
                  : order.fedex.estimatedDeliveryDate
                    ? formatDate(order.fedex.estimatedDeliveryDate)
                    : 'Pending'
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Cost</p>
              <p className="font-semibold text-green-900 text-sm">
                {order.fedex.shippingCost?.totalNetCharge 
                  ? formatPrice(order.fedex.shippingCost.totalNetCharge)
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {/* Pickup Info */}
          {order.fedex.pickupConfirmationNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Pickup Scheduled: {formatDate(order.fedex.pickupDate)}
                </span>
                <span className="text-sm text-blue-700">
                  (Confirmation: {order.fedex.pickupConfirmationNumber})
                </span>
              </div>
            </div>
          )}

          {/* Tracking Events */}
          {tracking?.events && tracking.events.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Shipment Journey</h4>
              <div className="space-y-3">
                {(showAllEvents ? tracking.events : tracking.events.slice(0, 5)).map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.eventDescription}</p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <span>{formatDate(event.timestamp)}</span>
                        {event.location?.formatted && (
                          <span className="flex items-center space-x-1">
                            <MapPin size={10} />
                            <span>{event.location.formatted}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {tracking.events.length > 5 && (
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="text-sm text-green-600 hover:text-green-800 mt-3"
                >
                  {showAllEvents ? 'Show Less' : `Show All ${tracking.events.length} Events`}
                </button>
              )}
            </div>
          )}

          {/* Cancel Shipment */}
          {!tracking?.isDelivered && (
            <button
              onClick={handleCancelShipment}
              className="mt-4 text-sm text-red-600 hover:text-red-800"
            >
              Cancel Shipment
            </button>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {order.user?.name}</p>
            <p><strong>Email:</strong> {order.user?.email}</p>
            <p><strong>Phone:</strong> {order.user?.phoneNumber}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
            <p>
              <strong>Status:</strong>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </p>
            <p>
              <strong>Payment:</strong>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </p>
            {order.couponApplied && (
              <p><strong>Coupon:</strong> {order.couponApplied.code} (-{formatPrice(order.discountAmount)})</p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <p className="font-medium">{order.shippingAddress.recipientName}</p>
          <p>{order.shippingAddress.streetLine1 || order.shippingAddress.street}</p>
          {(order.shippingAddress.streetLine2 || order.shippingAddress.apartment) && (
            <p>{order.shippingAddress.streetLine2 || order.shippingAddress.apartment}</p>
          )}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.stateCode || order.shippingAddress.state}{' '}
            {order.shippingAddress.zipCode}
          </p>
          <p>United States</p>
          <p className="mt-2">Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phoneNo}</p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
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
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(order.subtotal || order.totalAmount)}</span>
          </div>
          {order.shippingCost > 0 && (
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
          <span>Total Amount:</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Status Update */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Order Status</h3>
        <div className="flex space-x-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready_to_ship">Ready to Ship</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={newStatus === order.orderStatus}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>

      {/* Shipping Updates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Updates</h3>
        <div className="space-y-3 mb-4">
          {order.shippingUpdates && order.shippingUpdates.length > 0 ? (
            order.shippingUpdates.map((update, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-gray-900">{update.message}</p>
                  <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No shipping updates yet</p>
          )}
        </div>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Add shipping update..."
            value={shippingUpdate}
            onChange={(e) => setShippingUpdate(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddShippingUpdate}
            disabled={!shippingUpdate.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={() => onDownloadInvoice(order._id)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Printer size={16} />
            <span>Invoice</span>
          </button>

          {/* Ship button */}
          {!order.fedex?.trackingNumber &&
           order.paymentStatus === 'paid' &&
           !['cancelled', 'returned'].includes(order.orderStatus) && (
            <button
              onClick={() => {
                onClose();
                onShipOrder(order);
              }}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Truck size={16} />
              <span>Ship Order</span>
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          {/* Delete button */}
          {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') &&
           order.paymentMethod !== 'COD' && (
            <button
              onClick={() => {
                onClose();
                onDeleteOrder(order._id);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Delete Order
            </button>
          )}
          
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
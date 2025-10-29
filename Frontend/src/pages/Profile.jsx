import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

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

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Header */}
        <div className="!mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 !mt-2">Welcome back, {user?.name}!</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -!mb-px">
              <button
                onClick={() => setActiveTab('orders')}
                className={`!py-4 !px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`!py-4 !px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'addresses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Addresses
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`!py-4 !px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="!p-6">
            {loading ? (
              <div className="flex justify-center !py-8">
                <LoadingSpinner size="large" />
              </div>
            ) : activeTab === 'orders' ? (
              <OrdersTab 
                orders={orders} 
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            ) : activeTab === 'addresses' ? (
              <AddressesTab 
                addresses={addresses}
                fetchAddresses={fetchAddresses}
                token={token}
              />
            ) : (
              <SettingsTab user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, selectedOrder, setSelectedOrder, formatPrice, formatDate, getStatusColor }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center !py-12">
        <div className="text-gray-400 mb-4">
          <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 !mb-2">No orders yet</h3>
        <p className="text-gray-500">Your order history will appear here</p>
      </div>
    );
  }

  return (
    <div className="!space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
      
      {selectedOrder ? (
        <OrderDetail 
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      ) : (
        <div className="!space-y-4">
          {orders.map(order => (
            <div 
              key={order._id} 
              className="bg-gray-50 rounded-lg !p-6 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between items-start !mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Items:</strong> {order.items.length} artwork(s)</p>
                  <p><strong>Payment:</strong> {order.paymentStatus}</p>
                </div>
                <div>
                  <p><strong>Shipping:</strong> {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  {order.couponApplied && (
                    <p><strong>Coupon:</strong> {order.couponApplied.code} applied</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Order Detail Component
const OrderDetail = ({ order, onBack, formatPrice, formatDate, getStatusColor }) => {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-800 !mb-6"
      >
        <svg className="w-4 h-4 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Orders
      </button>

      <div className="bg-white rounded-lg border border-gray-200 !p-6">
        {/* Order Header */}
        <div className="flex justify-between items-start !mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
            <span className={`inline-flex items-center !px-3 !py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Shipping Updates */}
        <div className="!mb-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Shipping Updates</h3>
          <div className="!space-y-3">
            {order.shippingUpdates.map((update, index) => (
              <div key={index} className="flex items-start !space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full !mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-gray-900">{update.message}</p>
                  <p className="text-sm text-gray-500">{formatDate(update.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="!mb-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center !space-x-4 !p-4 bg-gray-50 rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">by {item.author} • {item.medium}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(item.priceAtOrder)}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 !pt-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Order Summary</h3>
          <div className="!space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 !pt-2">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-t border-gray-200 !pt-6 !mt-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-3">Shipping Address</h3>
          <div className="text-gray-600">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p>Phone: {order.shippingAddress.phoneNo}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Addresses Tab Component
const AddressesTab = ({ addresses, fetchAddresses, token }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    flatNo: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingAddress 
        ? `${CLIENT_BASE_URL}/api/v1/user/addresses/${editingAddress._id}`
        : `${CLIENT_BASE_URL}/api/v1/user/addresses`;
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses();
        setShowAddForm(false);
        setEditingAddress(null);
        setFormData({
          flatNo: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          phoneNo: ''
        });
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      flatNo: address.flatNo,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phoneNo: address.phoneNo
    });
    setShowAddForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAddress(null);
            setFormData({
              flatNo: '',
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'India',
              phoneNo: ''
            });
          }}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Address
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-4">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Flat/House No</label>
              <input
                type="text"
                required
                value={formData.flatNo}
                onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Street</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">ZIP Code</label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phoneNo}
                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex !space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAddress ? 'Update Address' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                }}
                className="bg-gray-200 text-gray-700 !px-6 !py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map(address => (
          <div key={address._id} className="bg-gray-50 rounded-lg !p-6">
            <div className="!mb-4">
              <p className="font-semibold text-gray-900">{address.flatNo}, {address.street}</p>
              <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
              <p className="text-gray-600">{address.country}</p>
              <p className="text-gray-600">Phone: {address.phoneNo}</p>
            </div>
            <div className="flex !space-x-2">
              <button
                onClick={() => handleEdit(address)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(address._id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showAddForm && (
        <div className="text-center !py-12">
          <div className="text-gray-400 mb-4">
            <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 !mb-2">No addresses saved</h3>
          <p className="text-gray-500">Add your first address to get started</p>
        </div>
      )}
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ user }) => {
  return (
    <div className="!space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
      
      <div className="bg-white border border-gray-200 rounded-lg !p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 !mb-4">Personal Information</h3>
            <div className="!space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="!mt-1 text-gray-900">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <p className="!mt-1 text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <p className="!mt-1 text-gray-900">{user?.phoneNumber}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 !mb-4">Account Security</h3>
            <div className="!space-y-3">
              <button className="w-full text-left !p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Change Password
              </button>
              <button className="w-full text-left !p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left !p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Privacy Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
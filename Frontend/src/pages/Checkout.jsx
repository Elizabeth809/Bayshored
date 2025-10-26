import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    flatNo: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNo: ''
  });

  const { token, updateCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
        if (data.data.length > 0) {
          setSelectedAddress(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/orders/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode,
          subtotal: cart?.total || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.data);
      } else {
        alert(data.message);
        setCouponCode('');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewAddress = async () => {
    // Validate all required fields
    const { flatNo, street, city, state, zipCode, phoneNo } = newAddress;
    if (!flatNo || !street || !city || !state || !zipCode || !phoneNo) {
      alert('Please fill all address fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();

      if (data.success) {
        // Add new address to list and select it
        const addedAddress = data.data;
        setAddresses(prev => [...prev, addedAddress]);
        setSelectedAddress(addedAddress._id);
        setShowNewAddress(false);
        alert('Address added successfully!');
      } else {
        alert(data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };


  const handlePlaceOrder = async () => {
    if (!selectedAddress && !showNewAddress) {
      alert('Please select a shipping address');
      return;
    }

    if (showNewAddress && (!newAddress.flatNo || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode || !newAddress.phoneNo)) {
      alert('Please fill all address fields');
      return;
    }

    setPlacingOrder(true);
    try {
      const shippingAddress = showNewAddress
        ? newAddress
        : addresses.find(addr => addr._id === selectedAddress);

      const orderData = {
        shippingAddress,
        couponCode: appliedCoupon?.coupon?.code || '',
        paymentMethod: 'card',
        notes: ''
      };

      const response = await fetch('http://localhost:5000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        updateCartCount(0);
        navigate('/profile', {
          state: {
            message: 'Order placed successfully! Check your email for the invoice.',
            orderId: data.data._id
          }
        });
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const shippingCost = cart && cart.total > 200 ? 0 : 15;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = cart ? cart.total + shippingCost - discountAmount : 0;

  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 !mb-4">Your cart is empty</h1>
          <p className="text-gray-600 !mb-8">Add some items to proceed to checkout</p>
          <button
            onClick={() => navigate('/store')}
            className="bg-blue-600 text-white !px-6 !py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        <h1 className="text-3xl font-bold text-gray-900 !mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="!space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
              <h2 className="text-xl font-semibold text-gray-900 !mb-4">Shipping Address</h2>

              {!showNewAddress ? (
                <>
                  {addresses.length > 0 && (
                    <div className="!space-y-3 !mb-4">
                      {addresses.map(address => (
                        <label key={address._id} className="flex items-start !space-x-3 !p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="address"
                            value={address._id}
                            checked={selectedAddress === address._id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="!mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{address.flatNo}, {address.street}</p>
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                            <p className="text-gray-600">{address.country}</p>
                            <p className="text-gray-600">Phone: {address.phoneNo}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add New Address
                  </button>
                </>
              ) : (
                <div className="!space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">Flat/House No</label>
                      <input
                        type="text"
                        required
                        value={newAddress.flatNo}
                        onChange={(e) => setNewAddress({ ...newAddress, flatNo: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">Street</label>
                      <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phoneNo}
                        onChange={(e) => setNewAddress({ ...newAddress, phoneNo: e.target.value })}
                        className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex !space-x-3">
                    <button
                      onClick={() => setShowNewAddress(false)}
                      className="bg-gray-200 text-gray-700 !px-4 !py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    {/* <button
                      onClick={() => setShowNewAddress(false)}
                      className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Use This Address
                    </button> */}
                    <button
                      onClick={handleSaveNewAddress}
                      className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Use This Address
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* Coupon Code */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
              <h2 className="text-xl font-semibold text-gray-900 !mb-4">Coupon Code</h2>
              <div className="flex !space-x-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!appliedCoupon}
                />
                <button
                  onClick={applyCoupon}
                  disabled={loading || !couponCode.trim() || !!appliedCoupon}
                  className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Applying...' : appliedCoupon ? 'Applied' : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <div className="!mt-3 !p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Coupon {appliedCoupon.coupon.code} applied successfully!
                  </p>
                  <p className="text-green-700 text-sm">
                    Discount: {formatPrice(appliedCoupon.discountAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="!space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 !mb-4">Order Summary</h2>

              {/* Order Items */}
              <div className="!space-y-4 !mb-6">
                {cart.items.map(item => (
                  <div key={item._id} className="flex items-center !space-x-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="!space-y-2 border-t border-gray-200 !pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost > 0 ? formatPrice(shippingCost) : 'Free'}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 !pt-2">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || (!selectedAddress && !showNewAddress)}
                className="w-full bg-blue-600 text-white !py-4 !px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg !mt-6"
              >
                {placingOrder ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="!mr-2" />
                    Placing Order...
                  </div>
                ) : (
                  `Place Order • ${formatPrice(finalTotal)}`
                )}
              </button>

              <div className="!mt-4 text-sm text-gray-600 !space-y-1">
                <p>🔒 Secure checkout</p>
                <p>↩️ 30-day return policy</p>
                <p>🛡️ Certificate of authenticity included</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
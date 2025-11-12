import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  CreditCard,
  Truck,
  Shield,
  ArrowLeft,
  MapPin,
  Plus,
  Check,
  X,
  Gift,
  Lock,
  RotateCcw,
  Star
} from 'lucide-react';
import { usePayment } from '../context/PaymentContext';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [newAddress, setNewAddress] = useState({
    flatNo: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNo: ''
  });

  const { token, updateCartCount, user } = useAuth();
  const navigate = useNavigate();

  // Load applied coupon from localStorage on component mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const parsedCoupon = JSON.parse(savedCoupon);
        setAppliedCoupon(parsedCoupon);
        setCouponCode(parsedCoupon.coupon.code);
      } catch (error) {
        console.error('Error parsing saved coupon:', error);
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  // Save applied coupon to localStorage whenever it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
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
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
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
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/apply-coupon`, {
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

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    localStorage.removeItem('appliedCoupon');
  };

  const handleSaveNewAddress = async () => {
    const { flatNo, street, city, state, zipCode, phoneNo } = newAddress;
    if (!flatNo || !street || !city || !state || !zipCode || !phoneNo) {
      alert('Please fill all address fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();

      if (data.success) {
        const newAddresses = data.data;
        setAddresses(newAddresses);

        // Find and select the newly added address
        const addedAddress = newAddresses.find(addr =>
          addr.flatNo === newAddress.flatNo &&
          addr.street === newAddress.street &&
          addr.phoneNo === newAddress.phoneNo
        );

        if (addedAddress) {
          setSelectedAddress(addedAddress._id);
        }

        setShowNewAddress(false);
        setNewAddress({
          flatNo: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          phoneNo: ''
        });
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

  const { initiatePayment, loading: paymentLoading, paymentError } = usePayment();

  // Replace the existing handlePlaceOrder function
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
        paymentMethod: 'razorpay', // Change to razorpay
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
        // Update cart count
        updateCartCount(0);

        // Initiate payment instead of redirecting
        await initiatePayment(data.data);
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

  // const handlePlaceOrder = async () => {
  //   // Validate address selection
  //   if (!selectedAddress && !showNewAddress) {
  //     alert('Please select a shipping address');
  //     return;
  //   }

  //   // Validate new address if showing form
  //   if (showNewAddress) {
  //     const { flatNo, street, city, state, zipCode, phoneNo } = newAddress;
  //     if (!flatNo || !street || !city || !state || !zipCode || !phoneNo) {
  //       alert('Please fill all address fields');
  //       return;
  //     }
  //   }

  //   // Validate payment method
  //   if (!paymentMethod) {
  //     alert('Please select a payment method');
  //     return;
  //   }

  //   setPlacingOrder(true);
  //   try {
  //     let shippingAddress;

  //     if (showNewAddress) {
  //       // Use the new address from form
  //       shippingAddress = newAddress;
  //     } else {
  //       // Find the selected address from saved addresses
  //       const selectedAddr = addresses.find(addr => addr._id === selectedAddress);
  //       if (!selectedAddr) {
  //         alert('Selected address not found');
  //         return;
  //       }
  //       shippingAddress = selectedAddr;
  //     }

  //     const orderData = {
  //       shippingAddress,
  //       couponCode: appliedCoupon?.coupon?.code || '',
  //       paymentMethod: paymentMethod,
  //       notes: ''
  //     };

  //     const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(orderData)
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       // Clear applied coupon after successful order
  //       localStorage.removeItem('appliedCoupon');
  //       setAppliedCoupon(null);
  //       setCouponCode('');

  //       updateCartCount(0);
  //       navigate('/profile', {
  //         state: {
  //           message: 'Order placed successfully! Check your email for the invoice.',
  //           orderId: data.data._id
  //         }
  //       });
  //     } else {
  //       alert(data.message || 'Failed to place order');
  //     }
  //   } catch (error) {
  //     console.error('Error placing order:', error);
  //     alert('Failed to place order');
  //   } finally {
  //     setPlacingOrder(false);
  //   }
  // };

  const formatPrice = (price) => {
    if (isNaN(price) || price === null || price === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Calculate current price for products
  const getCurrentPrice = (product) => {
    if (!product) return 0;

    if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return product.discountPrice;
    }
    return product.mrpPrice || 0;
  };

  // Calculate shipping cost
  const shippingCost = cart && cart.total > 200 ? 0 : 15;

  // Calculate discount amount properly for both percentage and fixed coupons
  const calculateDiscountAmount = () => {
    if (!appliedCoupon || !cart) return 0;

    const subtotal = cart.total;
    const coupon = appliedCoupon.coupon;

    if (coupon.discountType === 'percentage') {
      // For percentage coupons, use the discountAmount from the backend response
      return appliedCoupon.discountAmount;
    } else {
      // For fixed amount coupons
      return Math.min(coupon.discountValue, subtotal);
    }
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = cart ? Math.max(0, cart.total + shippingCost - discountAmount) : 0;

  if (!cart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl !p-12 max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center !mx-auto !mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 !mb-4">Your cart is empty</h1>
          <p className="text-gray-600 !mb-8">Add some amazing artworks to proceed to checkout</p>
          <button
            onClick={() => navigate('/store')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex items-center justify-between !py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center !space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Checkout
              </h1>
              <p className="text-sm text-gray-600">Complete your purchase securely</p>
            </div>
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="!space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex items-center justify-between !mb-2">
                <div className="flex items-center !space-x-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="font-semibold text-gray-900">Shipping</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 !mx-4">
                  <div className="h-full bg-blue-600 rounded-full w-1/2"></div>
                </div>
                <div className="flex items-center !space-x-2">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="font-semibold text-gray-600">Payment</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex items-center !space-x-3 !mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 !p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{user?.email}</p>
                </div>
                {user?.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{user?.phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex items-center !space-x-3 !mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
              </div>

              {!showNewAddress ? (
                <>
                  {addresses.length > 0 ? (
                    <div className="!space-y-3 !mb-4">
                      {addresses.map(address => (
                        <label
                          key={address._id}
                          className={`flex items-start !space-x-4 !p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddress === address._id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address._id}
                            checked={selectedAddress === address._id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="!mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between !mb-2">
                              <p className="font-semibold text-gray-900">{address.flatNo}, {address.street}</p>
                              {selectedAddress === address._id && (
                                <Check className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                            <p className="text-gray-600">{address.country}</p>
                            <p className="text-gray-600 text-sm">📞 {address.phoneNo}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center !py-8 !px-4 bg-gray-50 rounded-xl !mb-4">
                      <MapPin className="w-12 h-12 text-gray-400 !mx-auto !mb-3" />
                      <p className="text-gray-500">No saved addresses found</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="w-full flex items-center justify-center !space-x-2 !py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-600 font-medium"
                  >
                    <Plus size={20} />
                    <span>Add New Address</span>
                  </button>
                </>
              ) : (
                <div className="!space-y-4 bg-gray-50 rounded-xl !p-4">
                  <h3 className="font-semibold text-gray-900">Add New Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        Flat/House No *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.flatNo}
                        onChange={(e) => setNewAddress({ ...newAddress, flatNo: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter flat/house number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        Street *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phoneNo}
                        onChange={(e) => setNewAddress({ ...newAddress, phoneNo: e.target.value })}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="flex !space-x-3 !pt-2">
                    <button
                      onClick={() => {
                        setShowNewAddress(false);
                        setNewAddress({
                          flatNo: '',
                          street: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: 'India',
                          phoneNo: ''
                        });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 !px-6 !py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNewAddress}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white !px-6 !py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save & Use Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex items-center !space-x-3 !mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="!space-y-3">
                <label className={`flex items-center !space-x-4 !p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Pay securely with your card</p>
                  </div>
                  {paymentMethod === 'card' && <Check className="w-5 h-5 text-green-500" />}
                </label>

                <label className={`flex items-center !space-x-4 !p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <Truck className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                  {paymentMethod === 'cod' && <Check className="w-5 h-5 text-green-500" />}
                </label>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 !p-6">
              <div className="flex items-center !space-x-3 !mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Coupon Code</h2>
              </div>
              <div className="flex !space-x-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 !px-4 !py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={removeCoupon}
                    className="bg-red-600 text-white !px-6 !py-3 rounded-xl hover:bg-red-700 transition-all font-medium flex items-center !space-x-2"
                  >
                    <X size={18} />
                    <span>Remove</span>
                  </button>
                ) : (
                  <button
                    onClick={applyCoupon}
                    disabled={loading || !couponCode.trim()}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white !px-6 !py-3 rounded-xl hover:from-orange-700 hover:to-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {loading ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <div className="!mt-4 !p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between !mb-2">
                    <p className="text-green-800 font-bold text-lg">
                      🎉 Coupon Applied!
                    </p>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-green-700">
                    <strong>{appliedCoupon.coupon.code}</strong> - {appliedCoupon.coupon.discountType === 'percentage'
                      ? `${appliedCoupon.coupon.discountValue}% OFF`
                      : `${formatPrice(appliedCoupon.coupon.discountValue)} OFF`}
                  </p>
                  <p className="text-green-700 font-semibold">
                    You saved {formatPrice(appliedCoupon.discountAmount)}!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="!space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 !p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 !mb-6 border-b border-gray-200 !pb-4">Order Summary</h2>

              {/* Order Items */}
              <div className="!space-y-4 !mb-6 max-h-80 overflow-y-auto custom-scrollbar">
                {cart.items.map(item => {
                  const currentPrice = getCurrentPrice(item.product);
                  const itemTotal = currentPrice * item.quantity;
                  const mainImage = item.product.images?.[0] || item.product.image || '/placeholder-image.jpg';

                  return (
                    <div key={item._id} className="flex items-center !space-x-4 !p-3 bg-gray-50 rounded-xl">
                      <img
                        src={mainImage}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-gray-600 text-xs">by {item.product.author?.name}</p>
                        <div className="flex items-center justify-between !mt-1">
                          <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                          {item.product.discountPrice && item.product.discountPrice < item.product.mrpPrice && (
                            <span className="text-xs bg-red-100 text-red-800 !px-2 !py-1 rounded-full font-bold">
                              {Math.round(((item.product.mrpPrice - item.product.discountPrice) / item.product.mrpPrice) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="!space-y-3 border-t border-gray-200 !pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {shippingCost > 0 ? formatPrice(shippingCost) : 'Free'}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount</span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 !pt-3">
                  <span>Total</span>
                  <span className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Method Note */}
              {paymentMethod === 'cod' && (
                <div className="!mt-4 !p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center !space-x-2 !mb-2">
                    <Truck className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-semibold">Cash on Delivery</p>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    You'll pay {formatPrice(finalTotal)} when you receive your artwork.
                  </p>
                </div>
              )}

              {/* Security Badges */}
              <div className="flex items-center justify-center !space-x-6 !mt-6 !pt-4 border-t border-gray-200">
                <div className="flex items-center !space-x-2 text-gray-600">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Secure</span>
                </div>
                <div className="flex items-center !space-x-2 text-gray-600">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Encrypted</span>
                </div>
                <div className="flex items-center !space-x-2 text-gray-600">
                  <RotateCcw className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">30-Day Returns</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || paymentLoading || (!selectedAddress && !showNewAddress)}
                className="w-full bg-blue-600 text-white !py-4 !px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg mt-6"
              >
                {placingOrder || paymentLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="!mr-2" />
                    {placingOrder ? 'Creating Order...' : 'Processing Payment...'}
                  </div>
                ) : (
                  `Pay Now • ${formatPrice(finalTotal)}`
                )}
              </button>

              {/* Add payment error display */}
              {paymentError && (
                <div className="!mt-4 !p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{paymentError}</p>
                </div>
              )}

              <div className="!mt-4 text-center">
                <p className="text-xs text-gray-500">
                  By completing your purchase, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Checkout;
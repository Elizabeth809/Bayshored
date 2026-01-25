import { useState, useEffect, useCallback } from 'react';
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
  Star,
  Clock,
  Package,
  Navigation,
  Home,
  AlertCircle,
  Building,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { usePayment } from '../context/PaymentContext';

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

// Helper function to format price in USD
const formatPrice = (price) => {
  if (isNaN(price) || price === null || price === undefined) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
};

// Format phone number for display
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Get state name from code
const getStateName = (code) => {
  const state = US_STATES.find(s => s.code === code);
  return state ? state.name : code;
};

const Checkout = () => {
  // Cart and address state
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  // Address form state
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    stateCode: '',
    zipCode: '',
    phoneNumber: '',
    isResidential: true
  });
  
  // FedEx integration state
  const [addressValidation, setAddressValidation] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('ground');
  const [fedexAvailable, setFedexAvailable] = useState(false);
  
  // FedEx locations
  const [showFedExLocations, setShowFedExLocations] = useState(false);
  const [fedExLocations, setFedExLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const { token, updateCartCount, user } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading, paymentError } = usePayment();

  // Load saved coupon from localStorage
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const parsedCoupon = JSON.parse(savedCoupon);
        setAppliedCoupon(parsedCoupon);
        setCouponCode(parsedCoupon.coupon?.code || '');
      } catch (error) {
        console.error('Error parsing saved coupon:', error);
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initializeCheckout = async () => {
      setLoading(true);
      await Promise.all([fetchCart(), fetchAddresses()]);
      setLoading(false);
    };
    initializeCheckout();
  }, []);

  // Save coupon to localStorage when applied
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  // Fetch cart data
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

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Filter for US addresses only
        const usAddresses = data.data.filter(addr => 
          addr.countryCode === 'US' || !addr.countryCode
        );
        setAddresses(usAddresses);
        
        // Auto-select default or first address
        if (usAddresses.length > 0) {
          const defaultAddr = usAddresses.find(addr => addr.isDefault) || usAddresses[0];
          setSelectedAddressId(defaultAddr._id);
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  // Handle address selection change
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addr = addresses.find(a => a._id === selectedAddressId);
      if (addr) {
        setSelectedAddress(addr);
        validateAndFetchRates(addr);
      }
    }
  }, [selectedAddressId]);

  // Validate address and fetch shipping rates
  const validateAndFetchRates = async (address) => {
    if (!address) return;

    setValidatingAddress(true);
    setAddressValidation(null);
    setShippingOptions([]);

    try {
      // Prepare address for validation
      const addressForValidation = {
        streetLine1: address.streetLine1 || address.street,
        streetLine2: address.streetLine2 || address.apartment || '',
        city: address.city,
        stateCode: address.stateCode || address.state,
        zipCode: address.zipCode,
        isResidential: address.isResidential !== false
      };

      // Validate address with FedEx
      const validationResponse = await fetch(
        `${CLIENT_BASE_URL}/api/v1/orders/validate-address`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ shippingAddress: addressForValidation })
        }
      );

      const validationData = await validationResponse.json();
      
      if (validationData.success) {
        setAddressValidation(validationData.data);
      } else {
        setAddressValidation({
          isValid: false,
          requiresManualVerification: true,
          messages: [validationData.message || 'Address validation failed']
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        isValid: false,
        requiresManualVerification: true,
        warning: 'Address validation service unavailable'
      });
    } finally {
      setValidatingAddress(false);
    }

    // Fetch shipping rates regardless of validation result
    await fetchShippingRates(address);
  };

  // Fetch shipping rates from FedEx
  const fetchShippingRates = async (address) => {
    if (!address || !cart) return;

    setFetchingRates(true);
    
    try {
      const shippingAddress = {
        streetLine1: address.streetLine1 || address.street,
        streetLine2: address.streetLine2 || address.apartment || '',
        city: address.city,
        stateCode: address.stateCode || address.state,
        zipCode: address.zipCode,
        isResidential: address.isResidential !== false
      };

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/shipping-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shippingAddress })
      });

      const data = await response.json();
      
      if (data.success && data.data?.rates?.length > 0) {
        const rates = data.data.rates;
        setShippingOptions(rates);
        setFedexAvailable(data.data.fedexAvailable !== false);
        
        // Auto-select first/cheapest option or ground shipping
        const groundOption = rates.find(r => 
          r.id === 'ground' || 
          r.serviceType === 'FEDEX_GROUND' || 
          r.serviceType === 'FEDEX_HOME_DELIVERY'
        );
        
        if (groundOption) {
          setSelectedShippingOption(groundOption);
          setShippingMethod('ground');
        } else if (rates.length > 0) {
          setSelectedShippingOption(rates[0]);
          setShippingMethod(rates[0].id || 'standard');
        }
      } else {
        // Set fallback rates
        const fallbackRates = getFallbackShippingRates();
        setShippingOptions(fallbackRates);
        setFedexAvailable(false);
        setSelectedShippingOption(fallbackRates[0]);
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      const fallbackRates = getFallbackShippingRates();
      setShippingOptions(fallbackRates);
      setFedexAvailable(false);
      setSelectedShippingOption(fallbackRates[0]);
    } finally {
      setFetchingRates(false);
    }
  };

  // Fallback shipping rates
  const getFallbackShippingRates = () => {
    const subtotal = cart?.total || 0;
    return [
      {
        id: 'standard',
        serviceType: 'STANDARD',
        name: 'Standard Shipping',
        price: subtotal >= 500 ? 0 : 25,
        currency: 'USD',
        transitDays: '5-7',
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        fedexService: false
      },
      {
        id: 'express',
        serviceType: 'EXPRESS',
        name: 'Express Shipping',
        price: 45,
        currency: 'USD',
        transitDays: '2-3',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        fedexService: false
      },
      {
        id: 'overnight',
        serviceType: 'OVERNIGHT',
        name: 'Overnight Shipping',
        price: 75,
        currency: 'USD',
        transitDays: '1',
        deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        fedexService: false
      }
    ];
  };

  // Find nearby FedEx locations
  const findFedExLocations = async () => {
    if (!selectedAddress) return;

    setLoadingLocations(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/fedex-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: {
            street: selectedAddress.streetLine1 || selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.stateCode || selectedAddress.state,
            zipCode: selectedAddress.zipCode
          },
          radius: 25
        })
      });

      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        setFedExLocations(data.data);
        setShowFedExLocations(true);
      } else {
        alert('No FedEx locations found nearby');
      }
    } catch (error) {
      console.error('Error finding FedEx locations:', error);
      alert('Failed to find FedEx locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: cart?.total || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.data);
      } else {
        alert(data.message || 'Invalid coupon code');
        setCouponCode('');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    localStorage.removeItem('appliedCoupon');
  };

  // Save new address
  const handleSaveNewAddress = async () => {
    const { recipientName, streetLine1, city, stateCode, zipCode, phoneNumber } = newAddress;
    
    // Validate required fields
    if (!streetLine1 || !city || !stateCode || !zipCode || !phoneNumber) {
      alert('Please fill all required address fields');
      return;
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      alert('Please enter a valid US ZIP code (e.g., 90210 or 90210-1234)');
      return;
    }

    // Validate state code
    if (!US_STATES.find(s => s.code === stateCode)) {
      alert('Please select a valid US state');
      return;
    }

    // Validate phone number (basic)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setValidatingAddress(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAddress,
          countryCode: 'US',
          phoneNumber: cleanedPhone
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedAddresses = data.data;
        setAddresses(updatedAddresses);

        // Find and select the new address
        const addedAddress = updatedAddresses.find(addr =>
          addr.streetLine1 === newAddress.streetLine1 &&
          addr.zipCode === newAddress.zipCode
        );

        if (addedAddress) {
          setSelectedAddressId(addedAddress._id);
          setSelectedAddress(addedAddress);
        }

        setShowNewAddress(false);
        resetNewAddress();
      } else {
        alert(data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    } finally {
      setValidatingAddress(false);
    }
  };

  // Reset new address form
  const resetNewAddress = () => {
    setNewAddress({
      recipientName: '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      stateCode: '',
      zipCode: '',
      phoneNumber: '',
      isResidential: true
    });
  };

  // Calculate shipping cost
  const getShippingCost = () => {
    if (selectedShippingOption) {
      return selectedShippingOption.price || 
             selectedShippingOption.totalCharge?.amount || 
             0;
    }
    
    // Fallback
    if (cart && cart.total >= 500) return 0;
    return 25;
  };

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!appliedCoupon || !cart) return 0;
    return appliedCoupon.discountAmount || 0;
  };

  // Calculate totals
  const subtotal = cart?.total || 0;
  const shippingCost = getShippingCost();
  const discountAmount = getDiscountAmount();
  const finalTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  // Get current price for product
  const getCurrentPrice = (product) => {
    if (!product) return 0;
    if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return product.discountPrice;
    }
    return product.mrpPrice || 0;
  };

  // Place order
  const handlePlaceOrder = async () => {
    // Validate address selection
    if (!selectedAddress && !showNewAddress) {
      alert('Please select a shipping address');
      return;
    }

    // Validate new address if showing form
    if (showNewAddress) {
      const { streetLine1, city, stateCode, zipCode, phoneNumber } = newAddress;
      if (!streetLine1 || !city || !stateCode || !zipCode || !phoneNumber) {
        alert('Please fill all required address fields');
        return;
      }
    }

    // Warn about unverified address (but don't block)
    if (addressValidation && !addressValidation.isValid && addressValidation.requiresManualVerification) {
      const warningMessage = addressValidation.warning || 
                            addressValidation.messages?.[0] || 
                            'Address could not be verified. Delivery may be delayed.';
      if (!confirm(`Warning: ${warningMessage}\n\nDo you want to continue with this address?`)) {
        return;
      }
    }

    setPlacingOrder(true);
    try {
      // Prepare shipping address
      let shippingAddress;
      if (showNewAddress) {
        shippingAddress = {
          recipientName: newAddress.recipientName || user?.name,
          streetLine1: newAddress.streetLine1,
          streetLine2: newAddress.streetLine2,
          city: newAddress.city,
          stateCode: newAddress.stateCode,
          zipCode: newAddress.zipCode,
          phoneNumber: newAddress.phoneNumber.replace(/\D/g, ''),
          email: user?.email,
          isResidential: newAddress.isResidential
        };
      } else {
        shippingAddress = {
          recipientName: selectedAddress.recipientName || user?.name,
          streetLine1: selectedAddress.streetLine1 || selectedAddress.street,
          streetLine2: selectedAddress.streetLine2 || selectedAddress.apartment || '',
          city: selectedAddress.city,
          stateCode: selectedAddress.stateCode || selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: (selectedAddress.phoneNumber || selectedAddress.phoneNo || '').replace(/\D/g, ''),
          email: user?.email,
          isResidential: selectedAddress.isResidential !== false
        };
      }

      // Map shipping method
      const shippingMethodMap = {
        'ground': 'ground',
        'standard': 'express_saver',
        'express': '2_day',
        'overnight': 'overnight',
        'FEDEX_GROUND': 'ground',
        'FEDEX_HOME_DELIVERY': 'home_delivery',
        'FEDEX_EXPRESS_SAVER': 'express_saver',
        'FEDEX_2_DAY': '2_day',
        'STANDARD_OVERNIGHT': 'overnight'
      };

      const orderData = {
        shippingAddress,
        couponCode: appliedCoupon?.coupon?.code || '',
        paymentMethod: paymentMethod === 'cod' ? 'COD' : 'card',
        shippingMethod: shippingMethodMap[selectedShippingOption?.serviceType || shippingMethod] || 'ground',
        signatureRequired,
        notes: orderNotes
      };

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        // Clear cart count
        updateCartCount(0);

        // Clear coupon
        localStorage.removeItem('appliedCoupon');
        setAppliedCoupon(null);
        setCouponCode('');

        // Handle payment
        if (paymentMethod === 'cod') {
          // Redirect to order confirmation for COD
          navigate(`/order-confirmation/${data.data._id}`);
        } else {
          // Initiate payment
          await initiatePayment(data.data);
        }
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Format address for display
  const formatAddressDisplay = (address) => {
    const parts = [];
    if (address.streetLine2 || address.apartment) {
      parts.push(address.streetLine2 || address.apartment);
    }
    if (address.streetLine1 || address.street) {
      parts.push(address.streetLine1 || address.street);
    }
    if (address.city) parts.push(address.city);
    if (address.stateCode || address.state) {
      parts.push(address.stateCode || address.state);
    }
    if (address.zipCode) parts.push(address.zipCode);
    return parts.join(', ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl !p-12 max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some amazing artworks to proceed to checkout</p>
          <button
            onClick={() => navigate('/store')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium shadow-lg"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Secure Checkout
              </h1>
              <p className="text-sm text-gray-600">FedEx Shipping • US Delivery</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="font-semibold text-gray-900">Shipping</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className="h-full bg-blue-600 rounded-full w-1/2"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="font-semibold text-gray-600">Payment</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
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
                    <p className="font-semibold text-gray-900">
                      {formatPhoneNumber(user.phoneNumber)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>
                {selectedAddress && (
                  <button
                    onClick={findFedExLocations}
                    disabled={loadingLocations}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                  >
                    {loadingLocations ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Navigation size={16} />
                    )}
                    <span>Find FedEx Locations</span>
                  </button>
                )}
              </div>

              {!showNewAddress ? (
                <>
                  {addresses.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {addresses.map(address => (
                        <div key={address._id}>
                          <label
                            className={`flex items-start space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedAddressId === address._id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={address._id}
                              checked={selectedAddressId === address._id}
                              onChange={(e) => setSelectedAddressId(e.target.value)}
                              className="mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {address.isResidential !== false ? (
                                    <Home className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <Building className="w-4 h-4 text-gray-500" />
                                  )}
                                  <span className="font-semibold text-gray-900">
                                    {address.isResidential !== false ? 'Residential' : 'Business'}
                                  </span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                {selectedAddressId === address._id && (
                                  <Check className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                              <p className="text-gray-700">
                                {address.recipientName || user?.name}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {formatAddressDisplay(address)}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                📞 {formatPhoneNumber(address.phoneNumber || address.phoneNo)}
                              </p>
                            </div>
                          </label>

                          {/* Address Validation Status */}
                          {selectedAddressId === address._id && (
                            <div className="mt-2">
                              {validatingAddress ? (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-center space-x-2">
                                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                  <span className="text-blue-700">Validating address with FedEx...</span>
                                </div>
                              ) : addressValidation ? (
                                <div className={`p-3 rounded-lg text-sm flex items-start space-x-2 ${
                                  addressValidation.isValid
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-yellow-50 border border-yellow-200'
                                }`}>
                                  {addressValidation.isValid ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                      <div>
                                        <p className="text-green-700 font-medium">Address Verified by FedEx</p>
                                        {addressValidation.classification && (
                                          <p className="text-green-600 text-xs mt-1">
                                            Classification: {addressValidation.classification}
                                          </p>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                      <div>
                                        <p className="text-yellow-700 font-medium">Address Verification Warning</p>
                                        <p className="text-yellow-600 text-xs mt-1">
                                          {addressValidation.warning || 
                                           addressValidation.messages?.[0] || 
                                           'Address could not be fully verified. Delivery may be delayed.'}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-xl mb-4">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No saved addresses found</p>
                      <p className="text-gray-400 text-sm mt-1">Add a new US shipping address below</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-600 font-medium"
                  >
                    <Plus size={20} />
                    <span>Add New Address</span>
                  </button>
                </>
              ) : (
                /* New Address Form */
                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add New US Shipping Address</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recipient Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAddress.recipientName}
                        onChange={(e) => setNewAddress({...newAddress, recipientName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder={user?.name || "Full Name"}
                      />
                    </div>

                    {/* Street Address Line 1 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.streetLine1}
                        onChange={(e) => setNewAddress({...newAddress, streetLine1: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="123 Main Street"
                      />
                    </div>

                    {/* Street Address Line 2 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment, Suite, Unit (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAddress.streetLine2}
                        onChange={(e) => setNewAddress({...newAddress, streetLine2: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Apt 4B, Suite 100, etc."
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Los Angeles"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        required
                        value={newAddress.stateCode}
                        onChange={(e) => setNewAddress({...newAddress, stateCode: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>
                            {state.code} - {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ZIP Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.zipCode}
                        onChange={(e) => {
                          // Allow only digits and dash
                          const value = e.target.value.replace(/[^\d-]/g, '');
                          setNewAddress({...newAddress, zipCode: value});
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="90210"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 12345 or 12345-6789</p>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phoneNumber}
                        onChange={(e) => setNewAddress({...newAddress, phoneNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    {/* Address Type */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type
                      </label>
                      <div className="flex space-x-4">
                        <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          newAddress.isResidential
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <input
                            type="radio"
                            name="addressType"
                            checked={newAddress.isResidential}
                            onChange={() => setNewAddress({...newAddress, isResidential: true})}
                            className="sr-only"
                          />
                          <Home className="w-5 h-5" />
                          <span className="font-medium">Residential</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          !newAddress.isResidential
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <input
                            type="radio"
                            name="addressType"
                            checked={!newAddress.isResidential}
                            onChange={() => setNewAddress({...newAddress, isResidential: false})}
                            className="sr-only"
                          />
                          <Building className="w-5 h-5" />
                          <span className="font-medium">Business</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setShowNewAddress(false);
                        resetNewAddress();
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNewAddress}
                      disabled={validatingAddress}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {validatingAddress ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Save & Use Address</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Method Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Method</h2>
                  {fedexAvailable && (
                    <p className="text-sm text-green-600 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>FedEx rates available</span>
                    </p>
                  )}
                </div>
              </div>

              {fetchingRates ? (
                <div className="flex items-center justify-center py-8 space-x-2 text-blue-600">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Fetching shipping rates...</span>
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="space-y-3">
                  {shippingOptions.map((option, index) => {
                    const isSelected = selectedShippingOption?.id === option.id || 
                                      selectedShippingOption?.serviceType === option.serviceType;
                    const price = option.price || option.totalCharge?.amount || 0;
                    
                    return (
                      <label
                        key={option.id || option.serviceType || index}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedShippingOption(option);
                              setShippingMethod(option.id || option.serviceType);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900">
                                {option.name || option.serviceName}
                              </p>
                              {option.fedexService && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                  FedEx
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {option.transitDays ? `${option.transitDays} business day${option.transitDays !== '1' ? 's' : ''}` : 'Standard delivery'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {price === 0 ? 'FREE' : formatPrice(price)}
                          </p>
                          {option.deliveryDate && (
                            <p className="text-sm text-gray-600">
                              Est. {new Date(option.deliveryDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Select an address to see shipping options</p>
                </div>
              )}

              {/* Signature Required Option */}
              {shippingOptions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signatureRequired}
                      onChange={(e) => setSignatureRequired(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Require Signature</p>
                      <p className="text-sm text-gray-600">
                        Someone must be present to sign for delivery
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* FedEx Info */}
              {fedexAvailable && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="text-sm text-purple-700">
                      <p className="font-medium">FedEx Shipping Benefits</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Real-time tracking updates</li>
                        <li>• Full insurance coverage</li>
                        <li>• Delivery notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'card'
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

                <label className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'cod'
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
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                  {paymentMethod === 'cod' && <Check className="w-5 h-5 text-green-500" />}
                </label>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Coupon Code</h2>
              </div>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all uppercase"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-medium flex items-center space-x-2"
                  >
                    <X size={18} />
                    <span>Remove</span>
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>
              
              {appliedCoupon && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-800 font-bold text-lg">🎉 Coupon Applied!</p>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-green-700">
                    <strong>{appliedCoupon.coupon.code}</strong> - {
                      appliedCoupon.coupon.discountType === 'percentage'
                        ? `${appliedCoupon.coupon.discountValue}% OFF`
                        : `${formatPrice(appliedCoupon.coupon.discountValue)} OFF`
                    }
                  </p>
                  <p className="text-green-700 font-semibold">
                    You saved {formatPrice(appliedCoupon.discountAmount)}!
                  </p>
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Notes (Optional)</h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any special instructions for your order..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{orderNotes.length}/500 characters</p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">
                Order Summary
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto custom-scrollbar">
                {cart.items.map(item => {
                  const currentPrice = getCurrentPrice(item.product);
                  const itemTotal = currentPrice * item.quantity;
                  const mainImage = item.product.images?.[0] || item.product.image || '/placeholder-image.jpg';

                  return (
                    <div key={item._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                      <img
                        src={mainImage}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {item.product.name}
                        </p>
                        {item.product.author?.name && (
                          <p className="text-gray-600 text-xs">by {item.product.author.name}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                          {item.product.discountPrice && item.product.discountPrice < item.product.mrpPrice && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
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
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Shipping
                    {selectedShippingOption && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({selectedShippingOption.name || selectedShippingOption.serviceName})
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount ({appliedCoupon.coupon.code})</span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* FedEx Shipping Info */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 font-semibold">
                    {fedexAvailable ? 'FedEx Shipping' : 'Standard Shipping'}
                  </p>
                </div>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Real-time tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Insurance coverage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Delivery to all 50 US states</span>
                  </li>
                </ul>
              </div>

              {/* COD Warning */}
              {paymentMethod === 'cod' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-semibold">Cash on Delivery</p>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Pay {formatPrice(finalTotal)} when you receive your order.
                  </p>
                </div>
              )}

              {/* Security Badges */}
              <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Secure</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Encrypted</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <RotateCcw className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">30-Day Returns</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder || 
                  paymentLoading || 
                  (!selectedAddress && !showNewAddress) ||
                  !shippingOptions.length
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-semibold text-lg mt-6 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {placingOrder || paymentLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{placingOrder ? 'Creating Order...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>
                      {paymentMethod === 'cod' ? 'Place Order' : `Pay Now • ${formatPrice(finalTotal)}`}
                    </span>
                  </>
                )}
              </button>

              {paymentError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </div>
              )}

              <p className="mt-4 text-center text-xs text-gray-500">
                By completing your purchase, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FedEx Locations Modal */}
      {showFedExLocations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Nearby FedEx Locations</h2>
                    <p className="text-sm text-gray-600">{fedExLocations.length} locations found</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFedExLocations(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {fedExLocations.length > 0 ? (
                  fedExLocations.map((location, index) => (
                    <div
                      key={location.locationId || index}
                      className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {location.name || 'FedEx Location'}
                          </h3>
                          {location.address && (
                            <>
                              <p className="text-gray-600 text-sm mt-1">
                                {location.address.streetLines?.[0] || location.address.street}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {location.address.city}, {location.address.state || location.address.stateOrProvinceCode} {location.address.zipCode || location.address.postalCode}
                              </p>
                            </>
                          )}
                          {location.phone && (
                            <p className="text-gray-600 text-sm mt-1">📞 {location.phone}</p>
                          )}
                        </div>
                        {location.distance && (
                          <div className="text-right">
                            <span className="text-sm font-medium text-purple-600">
                              {location.distance.value} {location.distance.units}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No FedEx locations found nearby</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFedExLocations(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
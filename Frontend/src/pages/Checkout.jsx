import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Clock,
  Package,
  Navigation,
  Home,
  AlertCircle,
  Building,
  CheckCircle,
  Info,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Mail,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Scale,
  Ruler
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

// US Sales Tax Rates
// const STATE_TAX_RATES = {
//   'AL': 4.0, 'AK': 0.0, 'AZ': 5.6, 'AR': 6.5,
//   'CA': 7.25, 'CO': 2.9, 'CT': 6.35, 'DE': 0.0,
//   'FL': 6.0, 'GA': 4.0, 'HI': 4.0, 'ID': 6.0,
//   'IL': 6.25, 'IN': 7.0, 'IA': 6.0, 'KS': 6.5,
//   'KY': 6.0, 'LA': 4.45, 'ME': 5.5, 'MD': 6.0,
//   'MA': 6.25, 'MI': 6.0, 'MN': 6.875, 'MS': 7.0,
//   'MO': 4.225, 'MT': 0.0, 'NE': 5.5, 'NV': 6.85,
//   'NH': 0.0, 'NJ': 6.625, 'NM': 5.125, 'NY': 4.0,
//   'NC': 4.75, 'ND': 5.0, 'OH': 5.75, 'OK': 4.5,
//   'OR': 0.0, 'PA': 6.0, 'RI': 7.0, 'SC': 6.0,
//   'SD': 4.5, 'TN': 7.0, 'TX': 6.25, 'UT': 6.1,
//   'VT': 6.0, 'VA': 5.3, 'WA': 6.5, 'WV': 6.0,
//   'WI': 5.0, 'WY': 4.0, 'DC': 6.0
// };

const formatPrice = (price) => {
  if (isNaN(price) || price === null || price === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Helper to validate US ZIP code
const isValidUSZip = (zip) => {
  return /^\d{5}(-\d{4})?$/.test(zip);
};

// Helper to validate US phone number
const isValidUSPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
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
  const [addressValidation, setAddressValidation] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('ground');
  const [fedexAvailable, setFedexAvailable] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [taxEstimate, setTaxEstimate] = useState({ amount: 0, rate: 0 });
  const [addressErrors, setAddressErrors] = useState({});
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [packageDetails, setPackageDetails] = useState(null);
  const [shippingCacheKey, setShippingCacheKey] = useState('');

  const { token, updateCartCount, user } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading, paymentError } = usePayment();

  // Load saved coupon
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const parsedCoupon = JSON.parse(savedCoupon);
        setAppliedCoupon(parsedCoupon);
        setCouponCode(parsedCoupon.coupon?.code || '');
      } catch (error) {
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  // Initialize checkout
  useEffect(() => {
    const initializeCheckout = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCart(), fetchAddresses()]);
      } catch (error) {
        console.error('Checkout initialization failed:', error);
        alert('Failed to load checkout. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    initializeCheckout();
  }, []);

  // Save coupon to localStorage
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  // Calculate tax when address changes
  // useEffect(() => {
  //   if (selectedAddress && cart?.total) {
  //     const stateCode = selectedAddress.stateCode || selectedAddress.state;
  //     const taxRate = STATE_TAX_RATES[stateCode] || 8.0;
  //     const taxAmount = (cart.total * taxRate) / 100;
  //     setTaxEstimate({
  //       amount: Math.round(taxAmount * 100) / 100,
  //       rate: taxRate
  //     });
  //   }
  // }, [selectedAddress, cart]);

  // Fetch cart
  const fetchCart = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      if (data.success) {
        setCart(data.data);
      } else {
        throw new Error(data.message || 'Cart fetch failed');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      alert('Failed to load cart. Please try again.');
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      if (data.success && data.data) {
        const usAddresses = data.data.filter(addr => addr.countryCode === 'US' || !addr.countryCode);
        setAddresses(usAddresses);
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

  // When address selection changes
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addr = addresses.find(a => a._id === selectedAddressId);
      if (addr) {
        setSelectedAddress(addr);
        setShowAddressWarning(false);
        validateAndFetchRates(addr);
      }
    }
  }, [selectedAddressId]);

  // Fetch FedEx shipping rates
  const fetchShippingRates = useCallback(async (address, validationData = null) => {
    if (!address || !cart) return;

    setFetchingRates(true);
    setShippingOptions([]);
    setPackageDetails(null);

    try {
      // Prepare cart items with complete product data
      const cartItems = cart.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        // productData: {
        //   name: item.product.name,
        //   mrpPrice: item.product.mrpPrice,
        //   discountPrice: item.product.discountPrice,
        //   // dimensions: item.product.dimensions,
        //   medium: item.product.medium,
        //   // shipping: item.product.shipping || null,
        //   // weightInLbs: item.product.weightInLbs || null,
        //   offer: item.product.offer || null,
        //   images: item.product.images,
        //   author: item.product.author,
        //   sku: item.product.sku,
        //   category: item.product.category
        // }
      }));

      const shippingAddress = {
        streetLine1: address.streetLine1 || address.street,
        streetLine2: address.streetLine2 || address.apartment || '',
        city: address.city,
        stateCode: address.stateCode || address.state,
        zipCode: address.zipCode,
        isResidential: address.isResidential !== false
      };

      const requestBody = {
        shippingAddress,
        cartItems
      };

      console.log('Fetching shipping rates with:', {
        address: shippingAddress.city + ', ' + shippingAddress.stateCode,
        itemCount: cartItems.length,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/shipping-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Shipping service error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.rates?.length > 0) {
        const { rates, packageDetails, fedexAvailable, isEstimated, isCached } = data.data;
        
        setShippingOptions(rates);
        setFedexAvailable(fedexAvailable !== false);
        setPackageDetails(packageDetails);
        
        if (packageDetails) {
          console.log('Package details from backend:', {
            weight: `${packageDetails.weight.value} ${packageDetails.weight.units}`,
            dimensions: `${packageDetails.dimensions.length}" × ${packageDetails.dimensions.width}" × ${packageDetails.dimensions.height}"`,
            insuredValue: packageDetails.insuredValue ? `$${packageDetails.insuredValue.amount}` : 'Not specified'
          });
        }
        
        // Select appropriate shipping method
        let selectedRate = rates[0];
        
        // Prefer ground shipping for cost savings
        const groundRate = rates.find(r => 
          r.serviceType === 'FEDEX_GROUND' || 
          r.serviceType === 'GROUND_HOME_DELIVERY'
        );
        if (groundRate) selectedRate = groundRate;
        
        setSelectedShippingOption(selectedRate);
        setShippingMethod(selectedRate.serviceType || 'ground');
        
        if (isCached) {
          console.log('Using cached shipping rates');
        }
        
        return { rates, fedexAvailable, isEstimated, packageDetails };
      } else {
        throw new Error('No shipping rates available');
      }
    } catch (error) {
      console.error('Shipping rate fetch failed:', error);
      // Show error but continue with checkout
      setShippingOptions([]);
      setFedexAvailable(false);
      return null;
    } finally {
      setFetchingRates(false);
    }
  }, [cart, token]);

  // Validate address with FedEx and fetch shipping rates
  const validateAndFetchRates = async (address) => {
    if (!address) return;
    
    setValidatingAddress(true);
    setAddressValidation(null);
    setShippingOptions([]);
    setShowAddressWarning(false);

    try {
      // Build address for validation
      const addressForValidation = {
        streetLine1: address.streetLine1 || address.street,
        streetLine2: address.streetLine2 || address.apartment || '',
        city: address.city,
        stateCode: address.stateCode || address.state,
        zipCode: address.zipCode,
        isResidential: address.isResidential !== false
      };

      // Validate address with FedEx
      const validationResponse = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/validate-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shippingAddress: addressForValidation })
      });

      if (!validationResponse.ok) {
        throw new Error('Validation service unavailable');
      }

      const validationData = await validationResponse.json();
      
      if (validationData.success) {
        setAddressValidation(validationData.data);
        
        // If address is invalid and requires manual verification, show warning
        if (!validationData.data.isValid && validationData.data.requiresManualVerification) {
          setShowAddressWarning(true);
        }
        
        // Fetch shipping rates
        await fetchShippingRates(address, validationData.data);
      } else {
        setAddressValidation({
          isValid: false,
          requiresManualVerification: true,
          messages: [validationData.message || 'Address validation failed'],
          warning: 'Address could not be verified'
        });
        setShowAddressWarning(true);
        await fetchShippingRates(address);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        isValid: false,
        requiresManualVerification: true,
        warning: 'Address validation service temporarily unavailable',
        fallback: true
      });
      setShowAddressWarning(true);
      await fetchShippingRates(address);
    } finally {
      setValidatingAddress(false);
    }
  };

  // Package Info Display Component
  const PackageInfoDisplay = () => {
    if (!packageDetails) return null;
    
    const { weight, dimensions, insuredValue } = packageDetails;
    
    return (
      <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Package size={16} className="text-gray-600" />
            <p className="text-sm font-medium text-gray-900">Package Details</p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Scale size={12} />
              <span>{weight.value} {weight.units}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Ruler size={12} />
              <span>{dimensions.length}" × {dimensions.width}" × {dimensions.height}"</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Total Weight</p>
            <p className="font-medium">{weight.value} {weight.units}</p>
          </div>
          <div>
            <p className="text-gray-500">Dimensions</p>
            <p className="font-medium">{dimensions.length}" × {dimensions.width}" × {dimensions.height}"</p>
          </div>
          {insuredValue && (
            <div className="col-span-2">
              <p className="text-gray-500">Insured Value</p>
              <p className="font-medium">{formatPrice(insuredValue.amount)}</p>
            </div>
          )}
        </div>
        
        {cart?.items && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Items in package:</p>
            <div className="space-y-1">
              {cart.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">{item.product.name}</span>
                  <span className="text-gray-500">Qty: {item.quantity}</span>
                </div>
              ))}
              {cart.items.length > 3 && (
                <p className="text-xs text-gray-400">+{cart.items.length - 3} more items</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
          code: couponCode.trim().toUpperCase(), 
          subtotal: cart?.total || 0 
        })
      });

      if (!response.ok) {
        throw new Error('Coupon service unavailable');
      }

      const data = await response.json();
      if (data.success) {
        setAppliedCoupon(data.data);
      } else {
        alert(data.message || 'Invalid or expired coupon code');
        setCouponCode('');
      }
    } catch (error) {
      console.error('Coupon application error:', error);
      alert('Failed to apply coupon. Please try again.');
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

  // Validate new address form
  const validateNewAddress = () => {
    const errors = {};
    const { streetLine1, city, stateCode, zipCode, phoneNumber } = newAddress;

    if (!streetLine1.trim()) errors.streetLine1 = 'Street address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!stateCode) errors.stateCode = 'State is required';
    
    if (!zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!isValidUSZip(zipCode)) {
      errors.zipCode = 'Invalid ZIP code format (use 12345 or 12345-6789)';
    }
    
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!isValidUSPhone(phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number (10 digits required)';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new address
  const handleSaveNewAddress = async () => {
    if (!validateNewAddress()) {
      return;
    }

    setValidatingAddress(true);

    try {
      const cleanedPhone = newAddress.phoneNumber.replace(/\D/g, '');
      
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...newAddress, 
          countryCode: 'US', 
          phoneNumber: cleanedPhone,
          recipientName: newAddress.recipientName || user?.name || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      const data = await response.json();
      if (data.success) {
        const updatedAddresses = data.data;
        setAddresses(updatedAddresses);
        
        // Select the new address
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
        setAddressErrors({});
      } else {
        alert(data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Address save error:', error);
      alert('Failed to save address. Please try again.');
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
    setAddressErrors({});
  };

  // Calculate shipping cost
  const getShippingCost = () => {
    if (selectedShippingOption) {
      return selectedShippingOption.price || selectedShippingOption.totalCharge?.amount || 0;
    }
    if (cart && cart.total >= 500) return 0;
    return 12;
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
  const taxAmount = taxEstimate.amount;
  const finalTotal = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount);

  // Get current product price
  const getCurrentPrice = (product) => {
    if (!product) return 0;
    if (product.offer?.isActive && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return product.discountPrice;
    }
    return product.mrpPrice || 0;
  };

  // Validate order before placement
  const validateOrder = () => {
    if (!selectedAddress && !showNewAddress) {
      alert('Please select a shipping address');
      return false;
    }

    if (showNewAddress) {
      if (!validateNewAddress()) {
        alert('Please fix address errors before proceeding');
        return false;
      }
    }

    // Check if address was validated
    if (addressValidation && !addressValidation.isValid && addressValidation.requiresManualVerification) {
      if (!showAddressWarning) {
        setShowAddressWarning(true);
        return false;
      }
    }

    if (!shippingOptions.length) {
      alert('Shipping options are not available. Please try again.');
      return false;
    }

    return true;
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateOrder()) {
      return;
    }

    setPlacingOrder(true);

    try {
      let shippingAddress;
      if (showNewAddress) {
        const cleanedPhone = newAddress.phoneNumber.replace(/\D/g, '');
        shippingAddress = {
          recipientName: newAddress.recipientName || user?.name || '',
          streetLine1: newAddress.streetLine1,
          streetLine2: newAddress.streetLine2 || '',
          city: newAddress.city,
          stateCode: newAddress.stateCode,
          zipCode: newAddress.zipCode,
          phoneNumber: cleanedPhone,
          email: user?.email || '',
          isResidential: newAddress.isResidential
        };
      } else {
        const cleanedPhone = (selectedAddress.phoneNumber || selectedAddress.phoneNo || '').replace(/\D/g, '');
        shippingAddress = {
          recipientName: selectedAddress.recipientName || user?.name || '',
          streetLine1: selectedAddress.streetLine1 || selectedAddress.street,
          streetLine2: selectedAddress.streetLine2 || selectedAddress.apartment || '',
          city: selectedAddress.city,
          stateCode: selectedAddress.stateCode || selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: cleanedPhone,
          email: user?.email || '',
          isResidential: selectedAddress.isResidential !== false
        };
      }

      // Map shipping method
      const shippingMethodMap = {
        'ground': 'ground',
        'FEDEX_GROUND': 'ground',
        'GROUND_HOME_DELIVERY': 'home_delivery',
        'FEDEX_EXPRESS_SAVER': 'express_saver',
        'FEDEX_2_DAY': '2_day',
        'STANDARD_OVERNIGHT': 'overnight',
        'PRIORITY_OVERNIGHT': 'overnight'
      };

      const orderData = {
        shippingAddress,
        couponCode: appliedCoupon?.coupon?.code || '',
        paymentMethod: 'card',
        shippingMethod: shippingMethodMap[selectedShippingOption?.serviceType] || 'ground',
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Order creation failed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Clear cart and coupon
        updateCartCount(0);
        localStorage.removeItem('appliedCoupon');
        setAppliedCoupon(null);
        setCouponCode('');

        // Initiate payment
        await initiatePayment(data.data);
      } else {
        throw new Error(data.message || 'Order creation failed');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Format address for display
  const formatAddressDisplay = (address) => {
    const parts = [];
    if (address.streetLine2 || address.apartment) parts.push(address.streetLine2 || address.apartment);
    if (address.streetLine1 || address.street) parts.push(address.streetLine1 || address.street);
    if (address.city) parts.push(address.city);
    if (address.stateCode || address.state) parts.push(address.stateCode || address.state);
    if (address.zipCode) parts.push(address.zipCode);
    return parts.join(', ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-6 text-gray-500">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 border-2 border-gray-200 flex items-center justify-center mx-auto mb-8">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some items to your cart to proceed</p>
          <button
            onClick={() => navigate('/store')}
            className="group inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-300 cursor-pointer"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-light text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-500">Secure payment</p>
            </div>

            <div className="flex items-center space-x-2 text-gray-400">
              <Lock size={16} />
              <span className="text-sm">SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 1, label: 'Shipping', icon: MapPin },
              { step: 2, label: 'Delivery', icon: Truck },
              { step: 3, label: 'Payment', icon: CreditCard }
            ].map((item, index) => {
              const Icon = item.icon;
              const isActive = activeStep >= item.step;
              const isCompleted = activeStep > item.step;

              return (
                <div key={item.step} className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-gray-900 text-white' : 'border-2 border-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <span className={`font-medium hidden sm:inline ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-12 sm:w-20 h-0.5 mx-4 ${activeStep > item.step ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Customer</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
                    <p className="font-medium text-gray-900">{user?.name || 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium text-gray-900">{user?.email || 'No email'}</p>
                  </div>
                  {user?.phoneNumber && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{formatPhoneNumber(user.phoneNumber)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">US Only</span>
                </div>
              </div>

              <div className="p-6">
                {!showNewAddress ? (
                  <>
                    {addresses.length > 0 ? (
                      <div className="space-y-4">
                        {addresses.map(address => (
                          <div key={address._id}>
                            <label
                              className={`block p-5 border-2 cursor-pointer transition-all duration-300 ${
                                selectedAddressId === address._id
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <input
                                  type="radio"
                                  name="address"
                                  value={address._id}
                                  checked={selectedAddressId === address._id}
                                  onChange={(e) => setSelectedAddressId(e.target.value)}
                                  className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {address.isResidential !== false ? (
                                      <Home size={14} className="text-gray-400" />
                                    ) : (
                                      <Building size={14} className="text-gray-400" />
                                    )}
                                    <span className="font-medium text-gray-900">
                                      {address.isResidential !== false ? 'Home' : 'Business'}
                                    </span>
                                    {address.isDefault && (
                                      <span className="text-xs px-2 py-0.5 border border-gray-900 text-gray-900">Default</span>
                                    )}
                                  </div>
                                  <p className="text-gray-700">{address.recipientName || user?.name || 'No name'}</p>
                                  <p className="text-gray-600 text-sm">{formatAddressDisplay(address)}</p>
                                  <p className="text-gray-500 text-sm mt-1">
                                    {formatPhoneNumber(address.phoneNumber || address.phoneNo)}
                                  </p>
                                </div>
                                {selectedAddressId === address._id && (
                                  <Check size={20} className="text-gray-900" />
                                )}
                              </div>
                            </label>

                            {/* Validation Status */}
                            {selectedAddressId === address._id && (
                              <div className="mt-3">
                                {validatingAddress ? (
                                  <div className="p-4 border border-gray-200 bg-gray-50 flex items-center space-x-3">
                                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent animate-spin"></div>
                                    <span className="text-sm text-gray-600">Validating address...</span>
                                  </div>
                                ) : addressValidation ? (
                                  <div className={`p-4 border flex items-start space-x-3 ${
                                    addressValidation.isValid
                                      ? 'border-gray-900 bg-gray-50'
                                      : 'border-gray-300 bg-gray-50'
                                  }`}>
                                    {addressValidation.isValid ? (
                                      <>
                                        <CheckCircle size={18} className="text-gray-900 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-medium text-gray-900">Address Verified</p>
                                          {addressValidation.classification && (
                                            <p className="text-sm text-gray-600 mt-0.5">
                                              {addressValidation.classification} • 
                                              {addressValidation.isResidential ? ' Residential' : ' Business'}
                                            </p>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-medium text-gray-700">Verification Required</p>
                                          <p className="text-sm text-gray-500 mt-0.5">
                                            {addressValidation.warning || addressValidation.messages?.[0] || 'Could not verify address'}
                                          </p>
                                          {addressValidation.requiresManualVerification && (
                                            <p className="text-xs text-gray-400 mt-1">
                                              You may proceed, but verify accuracy
                                            </p>
                                          )}
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
                      <div className="text-center py-12 border-2 border-dashed border-gray-200">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No saved addresses</p>
                        <p className="text-sm text-gray-400">Add a US shipping address</p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowNewAddress(true)}
                      className="w-full mt-6 flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-gray-300 hover:border-gray-900 text-gray-600 hover:text-gray-900 transition-all duration-300 cursor-pointer"
                    >
                      <Plus size={18} />
                      <span>Add New Address</span>
                    </button>
                  </>
                ) : (
                  /* New Address Form */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">New Address</h3>
                      <button
                        onClick={() => { setShowNewAddress(false); resetNewAddress(); }}
                        className="text-gray-400 hover:text-gray-900 transition-colors duration-300 cursor-pointer"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Recipient Name
                        </label>
                        <input
                          type="text"
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-300"
                          placeholder={user?.name || "Your Name"}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.streetLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, streetLine1: e.target.value })}
                          className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors duration-300 ${
                            addressErrors.streetLine1 ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'
                          }`}
                          placeholder="123 Main Street"
                        />
                        {addressErrors.streetLine1 && (
                          <p className="text-xs text-red-500 mt-1">{addressErrors.streetLine1}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Apt, Suite, Unit
                        </label>
                        <input
                          type="text"
                          value={newAddress.streetLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, streetLine2: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-300"
                          placeholder="Apt 4B"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors duration-300 ${
                            addressErrors.city ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'
                          }`}
                          placeholder="Los Angeles"
                        />
                        {addressErrors.city && (
                          <p className="text-xs text-red-500 mt-1">{addressErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          State *
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={newAddress.stateCode}
                            onChange={(e) => setNewAddress({ ...newAddress, stateCode: e.target.value })}
                            className={`w-full px-4 py-3 border-2 focus:outline-none appearance-none bg-white cursor-pointer transition-colors duration-300 ${
                              addressErrors.stateCode ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'
                            }`}
                          >
                            <option value="">Select State</option>
                            {US_STATES.map(state => (
                              <option key={state.code} value={state.code}>{state.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        {addressErrors.stateCode && (
                          <p className="text-xs text-red-500 mt-1">{addressErrors.stateCode}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.zipCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d-]/g, '');
                            setNewAddress({ ...newAddress, zipCode: value });
                          }}
                          className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors duration-300 ${
                            addressErrors.zipCode ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'
                          }`}
                          placeholder="90210"
                          maxLength={10}
                        />
                        {addressErrors.zipCode && (
                          <p className="text-xs text-red-500 mt-1">{addressErrors.zipCode}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newAddress.phoneNumber}
                          onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                          className={`w-full px-4 py-3 border-2 focus:outline-none transition-colors duration-300 ${
                            addressErrors.phoneNumber ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'
                          }`}
                          placeholder="(555) 123-4567"
                        />
                        {addressErrors.phoneNumber && (
                          <p className="text-xs text-red-500 mt-1">{addressErrors.phoneNumber}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">
                          Address Type
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setNewAddress({ ...newAddress, isResidential: true })}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 border-2 transition-all duration-300 cursor-pointer ${
                              newAddress.isResidential
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <Home size={18} />
                            <span>Residential</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewAddress({ ...newAddress, isResidential: false })}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 border-2 transition-all duration-300 cursor-pointer ${
                              !newAddress.isResidential
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <Building size={18} />
                            <span>Business</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        onClick={() => { setShowNewAddress(false); resetNewAddress(); }}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all duration-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewAddress}
                        disabled={validatingAddress}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingAddress ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            <span>Save Address</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Address Warning Modal */}
                {showAddressWarning && addressValidation && !addressValidation.isValid && (
                  <div className="mt-6 p-4 border border-gray-300 bg-yellow-50">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800">Address Verification Warning</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {addressValidation.warning || addressValidation.messages?.[0] || 
                           'We could not verify this address with FedEx. Please verify the information is correct.'}
                        </p>
                        <div className="flex space-x-3 mt-3">
                          <button
                            onClick={() => setShowAddressWarning(false)}
                            className="text-sm text-yellow-800 hover:text-yellow-900 underline cursor-pointer"
                          >
                            Edit Address
                          </button>
                          <button
                            onClick={() => {
                              setShowAddressWarning(false);
                              if (showNewAddress) {
                                handleSaveNewAddress();
                              }
                            }}
                            className="text-sm px-3 py-1 bg-yellow-600 text-white hover:bg-yellow-700 cursor-pointer"
                          >
                            Continue Anyway
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center">
                      <Truck size={18} />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900">Delivery Method</h2>
                  </div>
                  {fedexAvailable ? (
                    <span className="text-xs px-3 py-1 bg-gray-900 text-white">FedEx</span>
                  ) : (
                    <span className="text-xs px-3 py-1 bg-gray-200 text-gray-700">Estimated</span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Package Info Display */}
                <PackageInfoDisplay />

                {fetchingRates ? (
                  <div className="flex items-center justify-center py-12 space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent animate-spin"></div>
                    <span className="text-gray-600">Calculating shipping options...</span>
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-3">
                    {shippingOptions.map((option, index) => {
                      const isSelected = selectedShippingOption?.id === option.id ||
                        selectedShippingOption?.serviceType === option.serviceType;
                      const price = option.price || option.totalCharge?.amount || 0;
                      const isFree = price === 0;
                      const isFedEx = option.fedexService;

                      return (
                        <label
                          key={option.id || option.serviceType || index}
                          className={`flex items-center justify-between p-5 border-2 cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-400'
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
                              className="cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{option.name || option.serviceName}</p>
                                {isFedEx && (
                                  <span className="text-xs px-2 py-0.5 border border-gray-300 text-gray-600">FedEx</span>
                                )}
                                {option.isEstimated && (
                                  <span className="text-xs px-2 py-0.5 border border-gray-300 text-gray-600">Estimated</span>
                                )}
                                {isFree && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800">FREE</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {option.transitDays ? `${option.transitDays} business days` : 'Standard delivery'}
                                {option.deliveryDate && (
                                  <span className="ml-2">
                                    • Est. {new Date(option.deliveryDate).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                )}
                              </p>
                              {option.details && (
                                <p className="text-xs text-gray-400 mt-0.5">{option.details}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${isFree ? 'text-green-600' : 'text-gray-900'}`}>
                              {isFree ? 'FREE' : formatPrice(price)}
                            </p>
                            {!isFree && option.originalPrice && option.originalPrice > price && (
                              <p className="text-sm text-gray-400 line-through">
                                {formatPrice(option.originalPrice)}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select an address to see shipping options</p>
                  </div>
                )}

                {/* Signature Required */}
                {shippingOptions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <label className="flex items-center space-x-4 cursor-pointer group">
                      <div
                        onClick={() => setSignatureRequired(!signatureRequired)}
                        className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                          signatureRequired
                            ? 'bg-gray-900 border-gray-900'
                            : 'border-gray-300 group-hover:border-gray-900'
                        }`}
                      >
                        {signatureRequired && <Check size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Require Signature</p>
                        <p className="text-sm text-gray-500">Someone must sign for delivery (Recommended for high-value orders)</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <label
                  className={`flex items-center justify-between p-5 border-2 cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'card'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="cursor-pointer"
                    />
                    <div className="flex items-center space-x-3">
                      <CreditCard size={20} className="text-gray-700" />
                      <div>
                        <p className="font-medium text-gray-900">Credit/Debit Card</p>
                        <p className="text-sm text-gray-500">Pay securely with your card</p>
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <Check size={20} className="text-gray-900" />}
                </label>

                <div className="p-4 border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    <Info size={14} className="inline mr-1" />
                    Secure card payment processed via Stripe. Your payment information is encrypted.
                  </p>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center">
                    <Gift size={18} />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Promo Code</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-300 uppercase"
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button
                      onClick={handleRemoveCoupon}
                      className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="mt-4 p-4 border-2 border-gray-900 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center space-x-2">
                          <CheckCircle size={16} />
                          <span>{appliedCoupon.coupon.code}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {appliedCoupon.coupon.discountType === 'percentage'
                            ? `${appliedCoupon.coupon.discountValue}% OFF`
                            : `${formatPrice(appliedCoupon.coupon.discountValue)} OFF`
                          }
                        </p>
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        -{formatPrice(appliedCoupon.discountAmount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Order Notes (Optional)</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions, gift messages, or delivery notes..."
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-300 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-2 text-right">{orderNotes.length}/500</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 shadow-lg sticky top-32">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              </div>

              {/* Items */}
              <div className="p-6 border-b border-gray-100 max-h-80 overflow-y-auto">
                <div className="space-y-4">
                  {cart.items.map(item => {
                    const currentPrice = getCurrentPrice(item.product);
                    const itemTotal = currentPrice * item.quantity;
                    const mainImage = item.product.images?.[0] || item.product.image || '/placeholder-image.jpg';
                    const hasDiscount = item.product.discountPrice && item.product.discountPrice < item.product.mrpPrice;

                    return (
                      <div key={item._id} className="flex space-x-4">
                        <div className="w-20 h-20 border border-gray-200 flex-shrink-0 overflow-hidden">
                          <img
                            src={mainImage}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                          {item.product.author?.name && (
                            <p className="text-xs text-gray-500">by {item.product.author.name}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatPrice(itemTotal)}</p>
                              {hasDiscount && (
                                <p className="text-xs text-gray-400 line-through">
                                  {formatPrice(item.product.mrpPrice * item.quantity)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                  </span>
                </div>

                {/* TAX */}
                {/* <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax</span>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">{formatPrice(taxAmount)}</span>
                    {selectedAddress && (
                      <p className="text-xs text-gray-400">
                        {STATE_TAX_RATES[selectedAddress.stateCode || selectedAddress.state] || 8.0}% • {selectedAddress.stateCode || selectedAddress.state}
                      </p>
                    )}
                  </div>
                </div> */}

                {appliedCoupon && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-gray-900">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total</span>
                    <span className="text-2xl font-light text-gray-900">{formatPrice(finalTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    Includes {formatPrice(taxAmount)} estimated tax
                  </p>
                </div>

                {/* Security Features */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Shield size={20} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Secure</span>
                    </div>
                    <div>
                      <Lock size={20} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Encrypted</span>
                    </div>
                    <div>
                      <RotateCcw size={20} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">30-Day Returns</span>
                    </div>
                  </div>
                </div>

                {/* Address Warning */}
                {showAddressWarning && (
                  <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        Address could not be verified. Please verify your address information is correct.
                      </p>
                    </div>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    paymentLoading ||
                    (!selectedAddress && !showNewAddress) ||
                    !shippingOptions.length ||
                    (addressValidation && !addressValidation.isValid && !showAddressWarning)
                  }
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:text-white font-medium text-lg mt-4"
                >
                  {placingOrder || paymentLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
                      <span>{placingOrder ? 'Creating Order...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>{`Pay ${formatPrice(finalTotal)}`}</span>
                    </>
                  )}
                </button>

                {paymentError && (
                  <div className="mt-4 p-4 border border-red-200 bg-red-50">
                    <div className="flex items-start space-x-2">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{paymentError}</p>
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-4">
                  By placing your order, you agree to our Terms of Service. 
                  <br />
                  <span className="text-gray-500">Tax calculation based on shipping state. Final tax may vary.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
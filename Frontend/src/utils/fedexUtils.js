// Utility functions for FedEx integration (US Version)
export const formatFedExServiceName = (serviceType) => {
  const serviceNames = {
    'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
    'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
    'FEDEX_2_DAY': 'FedEx 2Day',
    'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
    'FEDEX_GROUND': 'FedEx Ground',
    'FEDEX_HOME_DELIVERY': 'FedEx Home Delivery',
    'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
    'INTERNATIONAL_ECONOMY': 'FedEx International Economy'
  };
  
  return serviceNames[serviceType] || serviceType.replace(/_/g, ' ');
};

export const calculateEstimatedDelivery = (transitTime) => {
  const today = new Date();
  
  if (transitTime.includes('1')) {
    today.setDate(today.getDate() + 1);
  } else if (transitTime.includes('2')) {
    today.setDate(today.getDate() + 2);
  } else if (transitTime.includes('3')) {
    today.setDate(today.getDate() + 3);
  } else {
    today.setDate(today.getDate() + 5);
  }
  
  // Skip weekends
  while (today.getDay() === 0 || today.getDay() === 6) {
    today.setDate(today.getDate() + 1);
  }
  
  return today;
};

export const formatAddressForValidation = (address) => {
  return {
    streetLines: [address.street.trim()],
    apartment: address.apartment || address.flatNo || '',
    city: address.city,
    state: address.state,
    postalCode: address.zipCode,
    countryCode: 'US', // Fixed for US
    type: address.type || 'residential'
  };
};

export const getFedExLocationHours = (operationalHours) => {
  if (!operationalHours) return 'Hours not available';
  
  const days = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THU': 'Thursday',
    'FRI': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday'
  };
  
  return operationalHours.map(hour => {
    const day = days[hour.day] || hour.day;
    return `${day}: ${hour.openingTime || 'Closed'} - ${hour.closingTime || 'Closed'}`;
  }).join('\n');
};

// Helper for US address validation
export const validateUSAddressFormat = (address) => {
  const errors = [];
  
  if (!address.street?.trim()) {
    errors.push('Street address is required');
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!address.state?.trim()) {
    errors.push('State is required');
  }
  
  if (!address.zipCode?.trim()) {
    errors.push('ZIP code is required');
  }
  
  // US ZIP code validation (5 digits, optionally with 4-digit extension)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (address.zipCode && !zipRegex.test(address.zipCode)) {
    errors.push('Invalid ZIP code format (should be 5 digits, optionally with 4-digit extension)');
  }
  
  // US state validation (2-letter code)
  const stateRegex = /^[A-Z]{2}$/;
  if (address.state && !stateRegex.test(address.state.toUpperCase())) {
    errors.push('State should be a 2-letter code (e.g., CA, NY, TX)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format price for USD
export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};
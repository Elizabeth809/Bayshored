const fedexConfig = {
  // Sandbox credentials
  sandbox: {
    clientId: process.env.FEDEX_SANDBOX_CLIENT_ID || '',
    clientSecret: process.env.FEDEX_SANDBOX_CLIENT_SECRET || '',
    accountNumber: process.env.FEDEX_SANDBOX_ACCOUNT_NUMBER || '',
    apiUrl: 'https://apis-sandbox.fedex.com'
  },
  
  // Production credentials
  production: {
    clientId: process.env.FEDEX_PROD_CLIENT_ID || '',
    clientSecret: process.env.FEDEX_PROD_CLIENT_SECRET || '',
    accountNumber: process.env.FEDEX_PROD_ACCOUNT_NUMBER || '',
    apiUrl: 'https://apis.fedex.com'
  },
  
  // Environment determination
  environment: process.env.FEDEX_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'),
  
  // US Warehouse locations
  warehouses: {
    PRIMARY: {
      name: 'Main Warehouse',
      contact: {
        personName: process.env.WAREHOUSE_CONTACT_NAME || 'Shipping Department',
        phoneNumber: process.env.WAREHOUSE_PHONE || '9012600000',
        companyName: process.env.COMPANY_NAME || 'Art Gallery Inc.',
        emailAddress: process.env.WAREHOUSE_EMAIL || 'shipping@artgallery.com'
      },
      address: {
        streetLines: [process.env.WAREHOUSE_STREET || '10 FedEx Pkwy'],
        city: process.env.WAREHOUSE_CITY || 'Collierville',
        stateOrProvinceCode: process.env.WAREHOUSE_STATE || 'TN',
        postalCode: process.env.WAREHOUSE_ZIP || '38017',
        countryCode: 'US',
        residential: false
      }
    },
    WEST: {
      name: 'West Coast Warehouse',
      contact: {
        personName: 'Shipping Department',
        phoneNumber: '3105551234',
        companyName: 'Art Gallery Inc.',
        emailAddress: 'shipping-west@artgallery.com'
      },
      address: {
        streetLines: ['1234 Art Avenue'],
        city: 'Los Angeles',
        stateOrProvinceCode: 'CA',
        postalCode: '90001',
        countryCode: 'US',
        residential: false
      }
    }
  },
  
  // US State classifications for warehouse selection
  stateRegions: {
    EAST: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'DC', 'OH', 'MI', 'IN', 'KY', 'TN', 'AL', 'MS'],
    WEST: ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'AK', 'HI'],
    CENTRAL: ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'OK', 'TX', 'AR', 'LA']
  },
  
  // FedEx service types
  serviceTypes: {
    FEDEX_GROUND: {
      code: 'FEDEX_GROUND',
      name: 'FedEx Ground',
      transitDays: '1-5',
      description: 'Cost-effective ground shipping'
    },
    GROUND_HOME_DELIVERY: {
      code: 'GROUND_HOME_DELIVERY',
      name: 'FedEx Home Delivery',
      transitDays: '1-5',
      description: 'Residential ground delivery'
    },
    FEDEX_EXPRESS_SAVER: {
      code: 'FEDEX_EXPRESS_SAVER',
      name: 'FedEx Express Saver',
      transitDays: '3',
      description: '3 business day delivery'
    },
    FEDEX_2_DAY: {
      code: 'FEDEX_2_DAY',
      name: 'FedEx 2Day',
      transitDays: '2',
      description: '2 business day delivery'
    },
    STANDARD_OVERNIGHT: {
      code: 'STANDARD_OVERNIGHT',
      name: 'FedEx Standard Overnight',
      transitDays: '1',
      description: 'Next business day by 3:00 PM'
    },
    PRIORITY_OVERNIGHT: {
      code: 'PRIORITY_OVERNIGHT',
      name: 'FedEx Priority Overnight',
      transitDays: '1',
      description: 'Next business day by 10:30 AM'
    }
  },
  
  // Shipping method to service type mapping
  shippingMethodToService: {
    'ground': 'FEDEX_GROUND',
    'home_delivery': 'GROUND_HOME_DELIVERY',
    'express_saver': 'FEDEX_EXPRESS_SAVER',
    '2_day': 'FEDEX_2_DAY',
    'overnight': 'STANDARD_OVERNIGHT',
    'priority_overnight': 'PRIORITY_OVERNIGHT'
  },
  
  // Default currency
  defaultCurrency: 'USD'
};

// Helper function to get current environment config
fedexConfig.getConfig = function() {
  return this[this.environment];
};

// Helper to get base URL
fedexConfig.getBaseUrl = function() {
  return this.getConfig().apiUrl;
};

// Helper to get credentials
fedexConfig.getCredentials = function() {
  const config = this.getConfig();
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    accountNumber: config.accountNumber
  };
};

// Helper to get warehouse based on destination state
fedexConfig.getWarehouse = function(destinationState = '') {
  const state = (destinationState || '').toUpperCase();
  
  if (this.stateRegions.WEST.includes(state)) {
    return this.warehouses.WEST;
  }
  
  // Default to PRIMARY for East and Central states
  return this.warehouses.PRIMARY;
};

// Helper to get service type from shipping method
fedexConfig.getServiceType = function(shippingMethod, isResidential = true) {
  let serviceType = this.shippingMethodToService[shippingMethod] || 'FEDEX_GROUND';
  
  // Use HOME_DELIVERY for residential ground shipments
  if (serviceType === 'FEDEX_GROUND' && isResidential) {
    serviceType = 'GROUND_HOME_DELIVERY';
  }
  
  return serviceType;
};

// Validate configuration
fedexConfig.validateConfig = function() {
  const config = this.getConfig();
  const errors = [];
  
  if (!config.clientId) errors.push('FedEx Client ID is not configured');
  if (!config.clientSecret) errors.push('FedEx Client Secret is not configured');
  if (!config.accountNumber) errors.push('FedEx Account Number is not configured');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default fedexConfig;
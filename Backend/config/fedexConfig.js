const fedexConfig = {
  // Sandbox credentials
  sandbox: {
    // Main API credentials (Rate, Ship, Address)
    clientId: process.env.FEDEX_SANDBOX_CLIENT_ID || '',
    clientSecret: process.env.FEDEX_SANDBOX_CLIENT_SECRET || '',
    accountNumber: process.env.FEDEX_SANDBOX_ACCOUNT_NUMBER || '',
    
    // Track API credentials (separate project)
    trackClientId: process.env.FEDEX_SANDBOX_TRACK_CLIENT_ID || '',
    trackClientSecret: process.env.FEDEX_SANDBOX_TRACK_CLIENT_SECRET || '',
    
    apiUrl: 'https://apis-sandbox.fedex.com'
  },
  
  // Production credentials
  production: {
    // Main API credentials (Rate, Ship, Address)
    clientId: process.env.FEDEX_PROD_CLIENT_ID || '',
    clientSecret: process.env.FEDEX_PROD_CLIENT_SECRET || '',
    accountNumber: process.env.FEDEX_PROD_ACCOUNT_NUMBER || '',
    
    // Track API credentials (may be same or different in production)
    trackClientId: process.env.FEDEX_PROD_TRACK_CLIENT_ID || process.env.FEDEX_PROD_CLIENT_ID || '',
    trackClientSecret: process.env.FEDEX_PROD_TRACK_CLIENT_SECRET || process.env.FEDEX_PROD_CLIENT_SECRET || '',
    
    apiUrl: 'https://apis.fedex.com'
  },
  
  // Environment determination
  environment: process.env.FEDEX_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'),
  
  // Check if we're in production
  isProduction: function() {
    return this.environment === 'production';
  },
  
  // Check if we're in sandbox
  isSandbox: function() {
    return this.environment === 'sandbox';
  },
  
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
        personName: process.env.WAREHOUSE_WEST_CONTACT_NAME || 'Shipping Department',
        phoneNumber: process.env.WAREHOUSE_WEST_PHONE || '3105551234',
        companyName: process.env.COMPANY_NAME || 'Art Gallery Inc.',
        emailAddress: process.env.WAREHOUSE_WEST_EMAIL || 'shipping-west@artgallery.com'
      },
      address: {
        streetLines: [process.env.WAREHOUSE_WEST_STREET || '1234 Art Avenue'],
        city: process.env.WAREHOUSE_WEST_CITY || 'Los Angeles',
        stateOrProvinceCode: process.env.WAREHOUSE_WEST_STATE || 'CA',
        postalCode: process.env.WAREHOUSE_WEST_ZIP || '90001',
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
      description: 'Cost-effective ground shipping',
      priority: 1
    },
    GROUND_HOME_DELIVERY: {
      code: 'GROUND_HOME_DELIVERY',
      name: 'FedEx Home Delivery',
      transitDays: '1-5',
      description: 'Residential ground delivery',
      priority: 2
    },
    FEDEX_EXPRESS_SAVER: {
      code: 'FEDEX_EXPRESS_SAVER',
      name: 'FedEx Express Saver',
      transitDays: '3',
      description: '3 business day delivery',
      priority: 3
    },
    FEDEX_2_DAY: {
      code: 'FEDEX_2_DAY',
      name: 'FedEx 2Day',
      transitDays: '2',
      description: '2 business day delivery',
      priority: 4
    },
    FEDEX_2_DAY_AM: {
      code: 'FEDEX_2_DAY_AM',
      name: 'FedEx 2Day A.M.',
      transitDays: '2',
      description: '2 business day delivery by 10:30 AM',
      priority: 5
    },
    STANDARD_OVERNIGHT: {
      code: 'STANDARD_OVERNIGHT',
      name: 'FedEx Standard Overnight',
      transitDays: '1',
      description: 'Next business day by 3:00 PM',
      priority: 6
    },
    PRIORITY_OVERNIGHT: {
      code: 'PRIORITY_OVERNIGHT',
      name: 'FedEx Priority Overnight',
      transitDays: '1',
      description: 'Next business day by 10:30 AM',
      priority: 7
    },
    FIRST_OVERNIGHT: {
      code: 'FIRST_OVERNIGHT',
      name: 'FedEx First Overnight',
      transitDays: '1',
      description: 'Next business day by 8:00 AM',
      priority: 8
    }
  },
  
  // Shipping method to service type mapping
  shippingMethodToService: {
    'ground': 'FEDEX_GROUND',
    'home_delivery': 'GROUND_HOME_DELIVERY',
    'express_saver': 'FEDEX_EXPRESS_SAVER',
    '2_day': 'FEDEX_2_DAY',
    '2_day_am': 'FEDEX_2_DAY_AM',
    'overnight': 'STANDARD_OVERNIGHT',
    'priority_overnight': 'PRIORITY_OVERNIGHT',
    'first_overnight': 'FIRST_OVERNIGHT'
  },
  
  // Default currency
  defaultCurrency: 'USD',
  
  // Free shipping threshold
  freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 500
};

// Helper function to get current environment config
fedexConfig.getConfig = function() {
  const env = this.environment;
  const config = this[env];
  
  if (!config) {
    console.error(`[FedEx Config] Invalid environment: ${env}, falling back to sandbox`);
    return this.sandbox;
  }
  
  return config;
};

// Helper to get base URL
fedexConfig.getBaseUrl = function() {
  return this.getConfig().apiUrl;
};

// Helper to get MAIN API credentials (Rate, Ship, Address)
fedexConfig.getCredentials = function() {
  const config = this.getConfig();
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    accountNumber: config.accountNumber
  };
};

// Helper to get TRACK API credentials (may be different project)
fedexConfig.getTrackCredentials = function() {
  const config = this.getConfig();
  
  // Use track-specific credentials if available, otherwise fall back to main
  const trackClientId = config.trackClientId || config.clientId;
  const trackClientSecret = config.trackClientSecret || config.clientSecret;
  
  return {
    clientId: trackClientId,
    clientSecret: trackClientSecret,
    accountNumber: config.accountNumber
  };
};

// Check if separate track credentials are configured
fedexConfig.hasSeperateTrackCredentials = function() {
  const config = this.getConfig();
  return !!(config.trackClientId && config.trackClientSecret);
};

// Helper to get warehouse based on destination state
fedexConfig.getWarehouse = function(destinationState = '') {
  const state = (destinationState || '').toUpperCase().trim();
  
  if (this.stateRegions.WEST.includes(state)) {
    return this.warehouses.WEST;
  }
  
  return this.warehouses.PRIMARY;
};

// Helper to get service type from shipping method
fedexConfig.getServiceType = function(shippingMethod, isResidential = true) {
  let serviceType = this.shippingMethodToService[shippingMethod] || 'FEDEX_GROUND';
  
  if (serviceType === 'FEDEX_GROUND' && isResidential) {
    serviceType = 'GROUND_HOME_DELIVERY';
  }
  
  return serviceType;
};

// Helper to get service info
fedexConfig.getServiceInfo = function(serviceType) {
  return this.serviceTypes[serviceType] || {
    code: serviceType,
    name: serviceType.replace(/_/g, ' '),
    transitDays: '3-5',
    description: 'FedEx Shipping'
  };
};

// Validate configuration
fedexConfig.validateConfig = function() {
  const config = this.getConfig();
  const errors = [];
  const warnings = [];
  
  // Check main API credentials
  if (!config.clientId) {
    errors.push('FedEx Client ID is not configured');
  }
  if (!config.clientSecret) {
    errors.push('FedEx Client Secret is not configured');
  }
  if (!config.accountNumber) {
    errors.push('FedEx Account Number is not configured');
  }
  
  // Check track API credentials
  if (!config.trackClientId && !config.clientId) {
    warnings.push('FedEx Track API credentials not configured - tracking may not work');
  }
  
  // Check if using separate track credentials
  if (config.trackClientId && config.trackClientId !== config.clientId) {
    console.log('[FedEx Config] Using separate credentials for Track API');
  }
  
  // Warnings for production
  if (this.isProduction()) {
    if (config.clientId && config.clientId.includes('sandbox')) {
      warnings.push('Client ID appears to be a sandbox credential');
    }
    if (!process.env.WAREHOUSE_STREET) {
      warnings.push('Using default warehouse address - configure for production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    environment: this.environment,
    isProduction: this.isProduction(),
    hasSeperateTrackCredentials: this.hasSeperateTrackCredentials()
  };
};

// Log configuration status
fedexConfig.logStatus = function() {
  const validation = this.validateConfig();
  console.log('[FedEx Config] ================================');
  console.log('[FedEx Config] Environment:', this.environment);
  console.log('[FedEx Config] Base URL:', this.getBaseUrl());
  console.log('[FedEx Config] Valid:', validation.isValid);
  console.log('[FedEx Config] Separate Track Credentials:', validation.hasSeperateTrackCredentials);
  
  if (validation.errors.length > 0) {
    console.error('[FedEx Config] Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn('[FedEx Config] Warnings:', validation.warnings);
  }
  console.log('[FedEx Config] ================================');
};

export default fedexConfig;
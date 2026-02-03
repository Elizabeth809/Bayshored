import dotenv from 'dotenv';

dotenv.config();

const stripeConfig = {
  // API Keys - MUST be set in environment
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Currency - Should match your shop's default currency
  currency: (process.env.STRIPE_CURRENCY || 'USD').toUpperCase(),
  
  // Payment Methods
  paymentMethods: ['card', 'apple_pay', 'google_pay'],
  
  // Business Information
  business: {
    name: process.env.COMPANY_NAME || 'Art Gallery Inc.',
    address: {
      line1: process.env.WAREHOUSE_STREET || '1717 N Bayshore Dr',
      city: process.env.WAREHOUSE_CITY || 'Miami',
      state: process.env.WAREHOUSE_STATE || 'FL',
      postal_code: process.env.WAREHOUSE_ZIP || '33132',
      country: 'US'
    },
    email: process.env.WAREHOUSE_EMAIL || 'orders@artgallery.com',
    phone: process.env.WAREHOUSE_PHONE || '5551234567'
  },

  // Stripe Connect (if using marketplace model)
  connect: {
    enabled: false,
    platformAccountId: process.env.STRIPE_PLATFORM_ACCOUNT_ID || ''
  },

  // Tax Calculation (using Stripe Tax API)
  tax: {
    enabled: process.env.STRIPE_TAX_ENABLED !== 'false',
    automatic: true,
    taxCode: 'txcd_99999999' // Digital Goods tax code
  },

  // Shipping Options
  shippingOptions: {
    enabled: true,
    defaultRate: {
      fixed: {
        currency: 'USD',
        amount: 1500 // $15.00
      }
    }
  },

  // Webhook Events to handle
  webhookEvents: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'charge.succeeded',
    'charge.failed',
    'charge.dispute.created',
    'checkout.session.completed',
    'checkout.session.expired',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
  ],

  // Test card numbers for development
  testCards: {
    success: '4242424242424242',
    fail: '4000000000000002',
    requireAuth: '4000002500003155',
    threeDSecure: '4000002760003184',
    declinedRateLimit: '4000000000000069'
  },

  // Validation
  validateConfig() {
    const errors = [];
    const warnings = [];
    
    if (!this.secretKey) {
      errors.push('STRIPE_SECRET_KEY is not configured');
    } else if (!this.secretKey.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY appears invalid (should start with sk_)');
    }
    
    if (!this.publishableKey) {
      errors.push('STRIPE_PUBLISHABLE_KEY is not configured');
    } else if (!this.publishableKey.startsWith('pk_')) {
      errors.push('STRIPE_PUBLISHABLE_KEY appears invalid (should start with pk_)');
    }
    
    if (!this.webhookSecret) {
      warnings.push('STRIPE_WEBHOOK_SECRET is not configured - webhooks will not work');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isTestMode: this.isTestMode()
    };
  },

  // Helper methods
  isTestMode() {
    return this.secretKey.includes('test') || this.secretKey.startsWith('sk_test');
  },

  isLiveMode() {
    return this.secretKey.startsWith('sk_live');
  },

  getMetadata(orderData) {
    return {
      order_id: orderData.orderNumber,
      user_id: orderData.userId,
      source: 'artgallery_website',
      version: '1.0'
    };
  },

  // Amount conversion helpers
  formatAmountForDisplay(amount) {
    return (Math.round(amount) / 100).toFixed(2);
  },

  formatAmountForStripe(amount) {
    return Math.round(amount * 100);
  }
};

export default stripeConfig;
import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import fedexService from '../services/fedexService.js';

const router = express.Router();

// US States validation list
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Helper function to validate US ZIP code
const isValidUSZipCode = (zipCode) => {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};

// Helper function to validate US phone number
const isValidUSPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Helper function to normalize address data from request
const normalizeAddressData = (body) => {
  return {
    label: body.label || '',
    streetLine1: body.streetLine1 || body.street || '',
    streetLine2: body.streetLine2 || body.apartment || body.flatNo || '',
    city: body.city || '',
    stateCode: (body.stateCode || body.state || '').toUpperCase().trim(),
    zipCode: (body.zipCode || '').trim(),
    countryCode: 'US', // US only
    phoneNumber: cleanPhoneNumber(body.phoneNumber || body.phoneNo || ''),
    isResidential: body.isResidential !== false,
    isDefault: body.isDefault || false,
    // FedEx validation fields
    fedexValidated: body.fedexValidated || false,
    fedexClassification: body.fedexClassification || null,
    normalizedAddress: body.normalizedAddress || null
  };
};

// All routes are protected
router.use(isAuthenticated);

// =============================================
// GET USER ADDRESSES
// =============================================

// @desc    Get user addresses
// @route   GET /api/v1/user/addresses
// @access  Private
router.get('/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      count: user.addresses?.length || 0,
      data: user.addresses || []
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching addresses',
      error: error.message
    });
  }
});

// @desc    Get single address by ID
// @route   GET /api/v1/user/addresses/:addressId
// @access  Private
router.get('/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching address',
      error: error.message
    });
  }
});

// =============================================
// ADD NEW ADDRESS
// =============================================

// @desc    Add new address
// @route   POST /api/v1/user/addresses
// @access  Private
router.post('/addresses', async (req, res) => {
  try {
    // Normalize address data from request
    const addressData = normalizeAddressData(req.body);

    // Validate required fields
    const requiredFields = ['streetLine1', 'city', 'stateCode', 'zipCode', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate US state code
    if (!US_STATES.includes(addressData.stateCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US state code. Please use a valid 2-letter state code (e.g., CA, NY, TX)'
      });
    }

    // Validate ZIP code format
    if (!isValidUSZipCode(addressData.zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US ZIP code. Please use format: 12345 or 12345-6789'
      });
    }

    // Validate phone number
    if (!isValidUSPhone(addressData.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit US phone number'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If this is the first address or marked as default, set it as default
    if (user.addresses.length === 0 || addressData.isDefault) {
      // Remove default from other addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    // Optional: Validate address with FedEx if requested
    if (req.body.validateWithFedex) {
      try {
        const validationResult = await fedexService.validateAddress({
          streetLine1: addressData.streetLine1,
          streetLine2: addressData.streetLine2,
          city: addressData.city,
          stateCode: addressData.stateCode,
          zipCode: addressData.zipCode,
          isResidential: addressData.isResidential
        });

        addressData.fedexValidated = validationResult.isValid;
        addressData.fedexClassification = validationResult.classification || null;
        
        if (validationResult.normalizedAddress) {
          addressData.normalizedAddress = validationResult.normalizedAddress;
        }
      } catch (validationError) {
        console.warn('FedEx validation failed:', validationError.message);
        // Don't block address creation if validation fails
        addressData.fedexValidated = false;
      }
    }

    // Add the new address
    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding address',
      error: error.message
    });
  }
});

// =============================================
// UPDATE ADDRESS
// =============================================

// @desc    Update address
// @route   PUT /api/v1/user/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Normalize address data from request
    const addressData = normalizeAddressData(req.body);

    // Validate required fields
    const requiredFields = ['streetLine1', 'city', 'stateCode', 'zipCode', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate US state code
    if (!US_STATES.includes(addressData.stateCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US state code'
      });
    }

    // Validate ZIP code format
    if (!isValidUSZipCode(addressData.zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US ZIP code format'
      });
    }

    // Validate phone number
    if (!isValidUSPhone(addressData.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number'
      });
    }

    // Handle default address
    if (addressData.isDefault && !address.isDefault) {
      // Remove default from other addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    address.label = addressData.label;
    address.streetLine1 = addressData.streetLine1;
    address.streetLine2 = addressData.streetLine2;
    address.city = addressData.city;
    address.stateCode = addressData.stateCode;
    address.zipCode = addressData.zipCode;
    address.countryCode = 'US';
    address.phoneNumber = addressData.phoneNumber;
    address.isResidential = addressData.isResidential;
    address.isDefault = addressData.isDefault;

    // Update FedEx validation fields if provided
    if (req.body.fedexValidated !== undefined) {
      address.fedexValidated = addressData.fedexValidated;
    }
    if (req.body.fedexClassification !== undefined) {
      address.fedexClassification = addressData.fedexClassification;
    }
    if (req.body.normalizedAddress !== undefined) {
      address.normalizedAddress = addressData.normalizedAddress;
    }

    // Optional: Re-validate with FedEx if address changed significantly
    if (req.body.validateWithFedex) {
      try {
        const validationResult = await fedexService.validateAddress({
          streetLine1: addressData.streetLine1,
          streetLine2: addressData.streetLine2,
          city: addressData.city,
          stateCode: addressData.stateCode,
          zipCode: addressData.zipCode,
          isResidential: addressData.isResidential
        });

        address.fedexValidated = validationResult.isValid;
        address.fedexClassification = validationResult.classification || null;
        
        if (validationResult.normalizedAddress) {
          address.normalizedAddress = validationResult.normalizedAddress;
        }
      } catch (validationError) {
        console.warn('FedEx validation failed:', validationError.message);
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating address',
      error: error.message
    });
  }
});

// =============================================
// DELETE ADDRESS
// =============================================

// @desc    Delete address
// @route   DELETE /api/v1/user/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;

    // Remove the address
    user.addresses.pull({ _id: req.params.addressId });

    // If deleted address was default and there are remaining addresses,
    // set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting address',
      error: error.message
    });
  }
});

// =============================================
// SET DEFAULT ADDRESS
// =============================================

// @desc    Set address as default
// @route   PUT /api/v1/user/addresses/:addressId/default
// @access  Private
router.put('/addresses/:addressId/default', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove default from all addresses
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the selected address as default
    address.isDefault = true;

    await user.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting default address',
      error: error.message
    });
  }
});

// =============================================
// VALIDATE ADDRESS WITH FEDEX
// =============================================

// @desc    Validate address with FedEx
// @route   POST /api/v1/user/addresses/:addressId/validate
// @access  Private
router.post('/addresses/:addressId/validate', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Validate address with FedEx
    const validationResult = await fedexService.validateAddress({
      streetLine1: address.streetLine1,
      streetLine2: address.streetLine2,
      city: address.city,
      stateCode: address.stateCode,
      zipCode: address.zipCode,
      isResidential: address.isResidential
    });

    // Update address with validation results
    address.fedexValidated = validationResult.isValid;
    address.fedexClassification = validationResult.classification || null;
    
    if (validationResult.normalizedAddress) {
      address.normalizedAddress = validationResult.normalizedAddress;
    }

    await user.save();

    res.json({
      success: true,
      message: validationResult.isValid 
        ? 'Address validated successfully' 
        : 'Address validation completed with warnings',
      data: {
        address,
        validation: validationResult
      }
    });
  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating address',
      error: error.message
    });
  }
});

// =============================================
// VALIDATE ADDRESS (WITHOUT SAVING)
// =============================================

// @desc    Validate an address with FedEx without saving
// @route   POST /api/v1/user/addresses/validate
// @access  Private
router.post('/addresses/validate', async (req, res) => {
  try {
    const addressData = normalizeAddressData(req.body);

    // Validate required fields
    const requiredFields = ['streetLine1', 'city', 'stateCode', 'zipCode'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate US state code
    if (!US_STATES.includes(addressData.stateCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US state code',
        data: {
          isValid: false,
          error: 'Invalid state code'
        }
      });
    }

    // Validate ZIP code format
    if (!isValidUSZipCode(addressData.zipCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid US ZIP code format',
        data: {
          isValid: false,
          error: 'Invalid ZIP code format'
        }
      });
    }

    // Validate with FedEx
    const validationResult = await fedexService.validateAddress({
      streetLine1: addressData.streetLine1,
      streetLine2: addressData.streetLine2,
      city: addressData.city,
      stateCode: addressData.stateCode,
      zipCode: addressData.zipCode,
      isResidential: addressData.isResidential
    });

    res.json({
      success: true,
      message: validationResult.isValid 
        ? 'Address validated successfully' 
        : 'Address requires verification',
      data: validationResult
    });
  } catch (error) {
    console.error('Validate address error:', error);
    
    // Return success with validation warning instead of error
    res.json({
      success: true,
      message: 'Address validation skipped',
      data: {
        isValid: false,
        requiresManualVerification: true,
        warning: error.message
      }
    });
  }
});

// =============================================
// GET USER PROFILE
// =============================================

// @desc    Get user profile
// @route   GET /api/v1/user/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('wishlist', 'name images mrpPrice discountPrice');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message
    });
  }
});

// =============================================
// UPDATE USER PROFILE
// =============================================

// @desc    Update user profile
// @route   PUT /api/v1/user/profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Check if phone is being changed and if it's already taken
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
});

// =============================================
// GET DEFAULT ADDRESS
// =============================================

// @desc    Get user's default address
// @route   GET /api/v1/user/addresses/default
// @access  Private
router.get('/addresses/default', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find default address or first address
    const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: 'No addresses found'
      });
    }

    res.json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    console.error('Get default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching default address',
      error: error.message
    });
  }
});

// =============================================
// BULK VALIDATE ADDRESSES
// =============================================

// @desc    Validate all user addresses with FedEx
// @route   POST /api/v1/user/addresses/validate-all
// @access  Private
router.post('/addresses/validate-all', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.addresses || user.addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No addresses to validate'
      });
    }

    const validationResults = [];

    for (const address of user.addresses) {
      try {
        const validationResult = await fedexService.validateAddress({
          streetLine1: address.streetLine1,
          streetLine2: address.streetLine2,
          city: address.city,
          stateCode: address.stateCode,
          zipCode: address.zipCode,
          isResidential: address.isResidential
        });

        address.fedexValidated = validationResult.isValid;
        address.fedexClassification = validationResult.classification || null;
        
        if (validationResult.normalizedAddress) {
          address.normalizedAddress = validationResult.normalizedAddress;
        }

        validationResults.push({
          addressId: address._id,
          isValid: validationResult.isValid,
          classification: validationResult.classification,
          messages: validationResult.messages
        });
      } catch (validationError) {
        console.warn(`Validation failed for address ${address._id}:`, validationError.message);
        validationResults.push({
          addressId: address._id,
          isValid: false,
          error: validationError.message
        });
      }
    }

    await user.save();

    const validCount = validationResults.filter(r => r.isValid).length;

    res.json({
      success: true,
      message: `Validated ${validCount} of ${user.addresses.length} addresses`,
      data: {
        addresses: user.addresses,
        validationResults
      }
    });
  } catch (error) {
    console.error('Bulk validate addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating addresses',
      error: error.message
    });
  }
});

export default router;
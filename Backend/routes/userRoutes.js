import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);

// @desc    Get user addresses
// @route   GET /api/v1/user/addresses
// @access  Private
router.get('/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    res.json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching addresses'
    });
  }
});

// @desc    Add new address
// @route   POST /api/v1/user/addresses
// @access  Private
router.post('/addresses', async (req, res) => {
  try {
    const { flatNo, street, city, state, zipCode, country, phoneNo } = req.body;

    const user = await User.findById(req.user.id);
    
    user.addresses.push({
      flatNo,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      phoneNo
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding address'
    });
  }
});

// @desc    Update address
// @route   PUT /api/v1/user/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', async (req, res) => {
  try {
    const { flatNo, street, city, state, zipCode, country, phoneNo } = req.body;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.flatNo = flatNo;
    address.street = street;
    address.city = city;
    address.state = state;
    address.zipCode = zipCode;
    address.country = country || 'India';
    address.phoneNo = phoneNo;

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating address'
    });
  }
});

// @desc    Delete address
// @route   DELETE /api/v1/user/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.pull({ _id: req.params.addressId });
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
      message: 'Server error while deleting address'
    });
  }
});

export default router;
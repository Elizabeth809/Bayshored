import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import fedexService from '../services/fedexService.js';
import mongoose from 'mongoose';

// @desc    Validate shipping address
// @route   POST /api/v1/fedex/validate-address
// @access  Private
export const validateAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, countryCode, flatNo } = req.body;

    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Street, city, state, and zip code are required'
      });
    }

    const addressData = {
      streetLines: [`${flatNo || ''} ${street}`.trim()],
      city,
      state,
      postalCode: zipCode,
      countryCode: countryCode || 'IN',
      residential: true // Assuming residential delivery for art
    };

    const validationResult = await fedexService.validateAddress(addressData);

    res.json({
      success: validationResult.success,
      message: validationResult.isValid ? 'Address validated successfully' : 'Address validation failed',
      data: validationResult
    });

  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during address validation',
      error: error.message
    });
  }
};

// @desc    Get shipping rates for order
// @route   POST /api/v1/fedex/shipping-rates
// @access  Private
export const getShippingRates = async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      packages,
      currency = 'INR'
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !packages || packages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and packages are required'
      });
    }

    const rateRequest = {
      origin: {
        streetLines: [origin.street],
        city: origin.city,
        state: origin.state,
        postalCode: origin.zipCode,
        countryCode: origin.countryCode || 'IN'
      },
      destination: {
        streetLines: [`${destination.flatNo || ''} ${destination.street}`.trim()],
        city: destination.city,
        state: destination.state,
        postalCode: destination.zipCode,
        countryCode: destination.countryCode || 'IN',
        residential: true
      },
      packages: packages.map(pkg => ({
        weight: {
          value: pkg.weight || 5,
          units: pkg.weightUnits || 'KG'
        },
        dimensions: {
          length: pkg.length || 30,
          width: pkg.width || 30,
          height: pkg.height || 30,
          units: pkg.dimensionUnits || 'CM'
        },
        insuredValue: {
          amount: pkg.insuredValue || pkg.weight * 100,
          currency: currency
        }
      })),
      currency: currency
    };

    const ratesResult = await fedexService.getShippingRates(rateRequest);

    // Format rates for frontend
    const formattedRates = ratesResult.rates.map(rate => ({
      serviceType: rate.serviceType,
      serviceName: rate.serviceName,
      totalNetCharge: rate.ratedShipmentDetails?.[0]?.totalNetCharge || {},
      totalNetFedExCharge: rate.ratedShipmentDetails?.[0]?.totalNetFedExCharge || {},
      deliveryDayOfWeek: rate.deliveryDayOfWeek,
      commit: rate.commit,
      deliveryTimestamp: rate.deliveryTimestamp,
      transitTime: rate.transitTime
    }));

    res.json({
      success: ratesResult.success,
      message: ratesResult.success ? 'Shipping rates retrieved' : 'Failed to get shipping rates',
      data: {
        rates: formattedRates,
        alerts: ratesResult.alerts,
        origin: rateRequest.origin,
        destination: rateRequest.destination
      }
    });

  } catch (error) {
    console.error('Shipping rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shipping rates',
      error: error.message
    });
  }
};

// @desc    Create FedEx shipment for order
// @route   POST /api/v1/fedex/create-shipment/:orderId
// @access  Private/Admin
export const createShipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { serviceType, packagingType, pickupType, insuranceAmount } = req.body;

    // Fetch order with user info
    const order = await Order.findById(orderId)
      .populate('user', 'name email phoneNumber')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is ready for shipping
    if (order.orderStatus !== 'confirmed' && order.orderStatus !== 'processing') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Order must be confirmed or processing to create shipment'
      });
    }

    // Check if shipment already exists
    if (order.fedex?.trackingNumber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Shipment already exists for this order'
      });
    }

    // Calculate package weight and dimensions based on products
    const totalWeight = order.items.reduce((sum, item) => {
      // Estimate weight: small painting = 2kg, medium = 5kg, large = 10kg
      const itemWeight = item.medium?.toLowerCase().includes('large') ? 10 :
                         item.medium?.toLowerCase().includes('medium') ? 5 : 2;
      return sum + (itemWeight * item.quantity);
    }, 0);

    // Prepare shipment data
    const shipmentData = {
      orderNumber: order.orderNumber,
      shipper: {
        contact: {
          personName: 'Art Gallery Manager',
          phoneNumber: '+911234567890',
          companyName: 'Art Gallery'
        },
        address: {
          streetLines: ['123 Art Street'],
          city: 'Mumbai',
          state: 'MH',
          postalCode: '400001',
          countryCode: 'IN'
        }
      },
      recipient: {
        contact: {
          personName: order.user.name,
          phoneNumber: order.shippingAddress.phoneNo,
          emailAddress: order.user.email
        },
        address: {
          streetLines: [`${order.shippingAddress.flatNo} ${order.shippingAddress.street}`],
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.zipCode,
          countryCode: 'IN',
          residential: true
        }
      },
      serviceType: serviceType || 'STANDARD_OVERNIGHT',
      packagingType: packagingType || 'YOUR_PACKAGING',
      pickupType: pickupType || 'USE_SCHEDULED_PICKUP',
      totalWeight: {
        value: Math.max(totalWeight, 1), // Minimum 1kg
        units: 'KG'
      },
      totalInsuredValue: {
        amount: insuranceAmount || order.totalAmount * 100, // Insure for order value
        currency: 'INR'
      },
      packages: [{
        weight: {
          value: Math.max(totalWeight, 1),
          units: 'KG'
        },
        dimensions: {
          length: 60,
          width: 60,
          height: 10,
          units: 'CM'
        },
        itemDescription: `Artwork - ${order.items.length} items`
      }]
    };

    // Create FedEx shipment
    const shipmentResult = await fedexService.createShipment(shipmentData);

    if (!shipmentResult.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: 'Failed to create shipment',
        error: shipmentResult.error
      });
    }

    // Update order with shipment details
    order.fedex = {
      trackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      shipmentId: shipmentResult.shipmentDetails?.shipmentId,
      serviceType: shipmentData.serviceType,
      dimensions: shipmentData.packages[0].dimensions,
      weight: shipmentData.packages[0].weight,
      insuranceAmount: shipmentData.totalInsuredValue,
      shippingCost: shipmentResult.shipmentDetails?.completedShipmentDetail?.shipmentRating?.totalNetCharge || {
        amount: order.shippingCost,
        currency: 'INR'
      },
      lastTrackingUpdate: new Date()
    };

    // Update order status to shipped
    order.orderStatus = 'shipped';
    
    // Add shipping update
    order.shippingUpdates.push({
      message: `Shipment created with FedEx. Tracking number: ${shipmentResult.trackingNumber}`,
      timestamp: new Date(),
      status: 'shipped',
      location: 'Shipper'
    });

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send email notification with tracking info
    try {
      // You would implement your email sending logic here
      console.log(`Shipment created for order ${order.orderNumber}. Tracking: ${shipmentResult.trackingNumber}`);
    } catch (emailError) {
      console.error('Error sending shipment email:', emailError);
    }

    res.json({
      success: true,
      message: 'Shipment created successfully',
      data: {
        order: order,
        shipment: shipmentResult,
        trackingNumber: shipmentResult.trackingNumber,
        labelUrl: shipmentResult.labelUrl
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating shipment',
      error: error.message
    });
  }
};

// @desc    Track FedEx shipment
// @route   GET /api/v1/fedex/track/:trackingNumber
// @access  Private
export const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    const trackingResult = await fedexService.trackShipment(trackingNumber);

    if (!trackingResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to track shipment',
        error: trackingResult.error
      });
    }

    // Update order tracking history if order found
    if (trackingResult.trackingInfo) {
      const order = await Order.findOne({ 'fedex.trackingNumber': trackingNumber });
      
      if (order && trackingResult.scans && trackingResult.scans.length > 0) {
        const latestScan = trackingResult.scans[0];
        
        // Add new tracking updates
        const newScans = trackingResult.scans.filter(scan => {
          return !order.fedex.trackingHistory.some(
            history => history.timestamp.getTime() === new Date(scan.date).getTime()
          );
        });

        newScans.forEach(scan => {
          order.fedex.trackingHistory.push({
            timestamp: new Date(scan.date),
            status: scan.derivedStatus || scan.status,
            location: scan.scanLocation?.city || scan.scanLocation?.stateOrProvinceCode || 'Unknown',
            description: scan.eventDescription || scan.status,
            fedexStatus: scan.derivedStatusCode || scan.statusCode
          });
        });

        // Update last tracking update
        order.fedex.lastTrackingUpdate = new Date();
        
        // Update estimated delivery
        if (trackingResult.estimatedDelivery) {
          order.fedex.estimatedDelivery = new Date(trackingResult.estimatedDelivery?.begins || trackingResult.estimatedDelivery?.ends);
        }

        // Update order status based on tracking
        const latestStatus = trackingResult.status?.statusByLocale || trackingResult.trackingInfo?.latestStatusDetail?.description;
        if (latestStatus?.toLowerCase().includes('delivered')) {
          order.orderStatus = 'delivered';
          order.fedex.actualDelivery = new Date();
          
          order.shippingUpdates.push({
            message: 'Package has been delivered',
            timestamp: new Date(),
            status: 'delivered'
          });
        } else if (latestStatus?.toLowerCase().includes('out for delivery')) {
          order.shippingUpdates.push({
            message: 'Package is out for delivery',
            timestamp: new Date(),
            status: 'out_for_delivery'
          });
        }

        await order.save();
      }
    }

    res.json({
      success: true,
      message: 'Tracking information retrieved',
      data: trackingResult
    });

  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking shipment',
      error: error.message
    });
  }
};

// @desc    Search for FedEx locations
// @route   POST /api/v1/fedex/locations
// @access  Public
export const searchLocations = async (req, res) => {
  try {
    const { address, radius = 50, locationTypes = ['FEDEX_OFFICE'] } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const searchParams = {
      streetLines: [address.street],
      city: address.city,
      state: address.state,
      postalCode: address.zipCode,
      countryCode: address.countryCode || 'IN',
      radius: radius,
      locationTypes: locationTypes,
      services: ['FEDEX_EXPRESS', 'FEDEX_GROUND']
    };

    const locationResult = await fedexService.searchLocations(searchParams);

    // Format locations for frontend
    const formattedLocations = locationResult.locations.map(location => ({
      id: location.locationId,
      name: location.locationContactAndAddress?.locationContact?.companyName || 'FedEx Location',
      address: location.locationContactAndAddress?.address,
      contact: location.locationContactAndAddress?.locationContact,
      services: location.servicesOffered,
      hours: location.operationalHours,
      distance: location.distance?.value,
      distanceUnits: location.distance?.units
    }));

    res.json({
      success: locationResult.success,
      message: locationResult.success ? 'Locations found' : 'No locations found',
      count: locationResult.count,
      data: formattedLocations
    });

  } catch (error) {
    console.error('Search locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching locations',
      error: error.message
    });
  }
};

// @desc    Schedule pickup for shipment
// @route   POST /api/v1/fedex/schedule-pickup/:orderId
// @access  Private/Admin
export const schedulePickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pickupDate, readyTime, closeTime, packageDetails } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Shipment must be created before scheduling pickup'
      });
    }

    // Check if pickup already scheduled
    if (order.fedex?.pickupConfirmation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup already scheduled for this order'
      });
    }

    const pickupData = {
      contact: {
        personName: 'Art Gallery Manager',
        phoneNumber: '+911234567890',
        companyName: 'Art Gallery'
      },
      address: {
        streetLines: ['123 Art Street'],
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        countryCode: 'IN'
      },
      pickupDate: pickupDate || new Date().toISOString().split('T')[0],
      readyTime: readyTime || '10:00:00',
      closeTime: closeTime || '17:00:00',
      pickupRequestType: 'SAME_DAY',
      packageDetails: packageDetails || [{
        count: 1,
        weight: order.fedex.weight,
        dimensions: order.fedex.dimensions
      }]
    };

    const pickupResult = await fedexService.createPickupRequest(pickupData);

    if (!pickupResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule pickup',
        error: pickupResult.error
      });
    }

    // Update order with pickup confirmation
    order.fedex.pickupConfirmation = pickupResult.confirmationNumber;
    await order.save();

    // Add shipping update
    order.shippingUpdates.push({
      message: `Pickup scheduled. Confirmation: ${pickupResult.confirmationNumber}`,
      timestamp: new Date(),
      status: 'pickup_scheduled'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Pickup scheduled successfully',
      data: pickupResult
    });

  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scheduling pickup',
      error: error.message
    });
  }
};

// @desc    Cancel pickup
// @route   DELETE /api/v1/fedex/cancel-pickup/:orderId
// @access  Private/Admin
export const cancelPickup = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.pickupConfirmation) {
      return res.status(400).json({
        success: false,
        message: 'No pickup scheduled for this order'
      });
    }

    const cancelResult = await fedexService.cancelPickup(order.fedex.pickupConfirmation);

    if (!cancelResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel pickup',
        error: cancelResult.error
      });
    }

    // Remove pickup confirmation
    order.fedex.pickupConfirmation = null;
    
    // Add shipping update
    order.shippingUpdates.push({
      message: 'Pickup cancelled',
      timestamp: new Date(),
      status: 'pickup_cancelled'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Pickup cancelled successfully',
      data: cancelResult
    });

  } catch (error) {
    console.error('Cancel pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling pickup',
      error: error.message
    });
  }
};

// @desc    Get shipment label
// @route   GET /api/v1/fedex/shipment-label/:orderId
// @access  Private/Admin
export const getShipmentLabel = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.fedex?.labelUrl) {
      return res.status(404).json({
        success: false,
        message: 'No shipment label available'
      });
    }

    // Redirect to FedEx label URL
    // Note: FedEx label URLs are typically temporary and require authentication
    // You might need to download and serve the PDF yourself
    res.json({
      success: true,
      message: 'Label URL retrieved',
      data: {
        labelUrl: order.fedex.labelUrl,
        trackingNumber: order.fedex.trackingNumber
      }
    });

  } catch (error) {
    console.error('Get shipment label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting shipment label',
      error: error.message
    });
  }
};

// @desc    Get all shipments for admin
// @route   GET /api/v1/fedex/shipments
// @access  Private/Admin
export const getAllShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

    const filter = {
      'fedex.trackingNumber': { $exists: true }
    };

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const shipments = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Get tracking info for each shipment
    const shipmentsWithTracking = await Promise.all(
      shipments.map(async (shipment) => {
        let trackingInfo = null;
        if (shipment.fedex?.trackingNumber) {
          try {
            const trackingResult = await fedexService.trackShipment(shipment.fedex.trackingNumber);
            if (trackingResult.success) {
              trackingInfo = {
                status: trackingResult.status,
                lastUpdate: trackingResult.scans?.[0],
                estimatedDelivery: trackingResult.estimatedDelivery
              };
            }
          } catch (error) {
            console.error(`Error tracking shipment ${shipment.fedex.trackingNumber}:`, error);
          }
        }

        return {
          ...shipment.toObject(),
          trackingInfo
        };
      })
    );

    res.json({
      success: true,
      count: shipments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: shipmentsWithTracking
    });

  } catch (error) {
    console.error('Get all shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shipments',
      error: error.message
    });
  }
};
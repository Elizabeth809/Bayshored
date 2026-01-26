import axios from 'axios';
import fedexConfig from '../config/fedexConfig.js';

class FedExService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    // Get current config
    get config() {
        return fedexConfig.getConfig();
    }

    // Get base URL
    get baseURL() {
        return fedexConfig.getBaseUrl();
    }

    // ===========================================
    // AUTHENTICATION
    // ===========================================

    async getAccessToken(forceRefresh = false) {
        try {
            // Return cached token if still valid
            if (!forceRefresh && this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }

            const { clientId, clientSecret } = fedexConfig.getCredentials();

            if (!clientId || !clientSecret) {
                throw new Error('FedEx credentials are not configured');
            }

            console.log(`[FedEx] Requesting new access token from ${this.baseURL}`);

            const response = await axios.post(
                `${this.baseURL}/oauth/token`,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 30000
                }
            );

            this.accessToken = response.data.access_token;
            // Set expiry with 5 minute buffer
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);

            console.log('[FedEx] Access token obtained successfully');
            return this.accessToken;
        } catch (error) {
            console.error('[FedEx] Token Error:', error.response?.data || error.message);
            this.accessToken = null;
            this.tokenExpiry = null;
            throw new Error(`Failed to get FedEx access token: ${error.response?.data?.error_description || error.message}`);
        }
    }

    // Make authenticated request with retry logic
    async makeRequest(endpoint, data, method = 'POST', retryCount = 0) {
        try {
            const token = await this.getAccessToken();

            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-locale': 'en_US'
                },
                data,
                timeout: 60000
            });

            return response.data;
        } catch (error) {
            const statusCode = error.response?.status;
            const errorData = error.response?.data;

            // Log detailed error information
            console.error('[FedEx] API Error:', {
                endpoint,
                status: statusCode,
                error: JSON.stringify(errorData, null, 2)
            });

            // Handle token expiration
            if (statusCode === 401 && retryCount < 1) {
                console.log('[FedEx] Token expired, refreshing...');
                await this.getAccessToken(true);
                return this.makeRequest(endpoint, data, method, retryCount + 1);
            }

            // Handle rate limiting
            if (statusCode === 429 && retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`[FedEx] Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(endpoint, data, method, retryCount + 1);
            }

            throw error;
        }
    }

    // ===========================================
    // ENHANCED TRACKING WITH STATUS MAPPING
    // ===========================================

    async trackShipment(trackingNumber) {
        try {
            const payload = {
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber
                        }
                    }
                ]
            };

            console.log('[FedEx] Tracking shipment:', trackingNumber);

            const result = await this.makeRequest('/track/v1/trackingnumbers', payload);

            if (result.output?.completeTrackResults?.length > 0) {
                const trackResult = result.output.completeTrackResults[0]?.trackResults?.[0];

                if (!trackResult || trackResult.error) {
                    return {
                        success: false,
                        error: trackResult?.error?.message || 'Tracking information not found'
                    };
                }

                const latestStatus = trackResult.latestStatusDetail;
                const scanEvents = trackResult.scanEvents || [];

                // Parse and normalize the tracking data
                const parsedData = this.parseTrackingResponse(trackResult);

                return {
                    success: true,
                    trackingNumber,
                    ...parsedData,
                    rawResponse: trackResult
                };
            }

            return {
                success: false,
                error: 'No tracking information found'
            };
        } catch (error) {
            console.error('[FedEx] Tracking Error:', error.message);

            // For sandbox/testing, return mock data
            if (fedexConfig.environment === 'sandbox') {
                return this.getMockTrackingData(trackingNumber);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Parse FedEx tracking response into normalized format
    parseTrackingResponse(trackResult) {
        const latestStatus = trackResult.latestStatusDetail || {};
        const scanEvents = trackResult.scanEvents || [];

        // Map FedEx status code to our order status
        const orderStatus = this.mapFedExStatusToOrderStatus(latestStatus.code);

        // Parse current status
        const currentStatus = {
            code: latestStatus.code,
            derivedCode: latestStatus.derivedCode,
            description: latestStatus.description || this.getStatusDescription(latestStatus.code),
            statusByLocale: latestStatus.statusByLocale,
            location: this.formatLocation(latestStatus.scanLocation),
            timestamp: latestStatus.date || new Date().toISOString(),
            ancillaryDetails: latestStatus.ancillaryDetails
        };

        // Parse delivery information
        const deliveryDetails = {
            actualDeliveryTimestamp: trackResult.actualDeliveryDetail?.actualDeliveryTimestamp,
            deliveryLocation: trackResult.actualDeliveryDetail?.deliveryLocationType,
            signedBy: trackResult.actualDeliveryDetail?.signedByName,
            deliveryAttempts: trackResult.numberOfDeliveryAttempts
        };

        // Parse estimated delivery
        const estimatedDelivery = trackResult.estimatedDeliveryTimeWindow ? {
            begins: trackResult.estimatedDeliveryTimeWindow.window?.begins,
            ends: trackResult.estimatedDeliveryTimeWindow.window?.ends,
            type: trackResult.estimatedDeliveryTimeWindow.type,
            description: trackResult.estimatedDeliveryTimeWindow.description
        } : null;

        // Parse all scan events
        const events = scanEvents.map(scan => ({
            timestamp: scan.date,
            eventType: scan.eventType,
            eventDescription: scan.eventDescription || this.getEventDescription(scan.eventType),
            derivedStatus: scan.derivedStatus,
            derivedStatusCode: scan.derivedStatusCode,
            exceptionCode: scan.exceptionCode,
            exceptionDescription: scan.exceptionDescription,
            location: {
                city: scan.scanLocation?.city,
                state: scan.scanLocation?.stateOrProvinceCode,
                postalCode: scan.scanLocation?.postalCode,
                country: scan.scanLocation?.countryCode,
                residential: scan.scanLocation?.residential,
                formatted: this.formatLocation(scan.scanLocation)
            },
            isDeliveryAttempt: scan.eventType === 'DL' || scan.derivedStatus === 'Delivered'
        }));

        // Get shipment details
        const shipmentDetails = {
            serviceType: trackResult.serviceType,
            serviceDescription: trackResult.serviceDetail?.description,
            packaging: trackResult.packageDetails?.packagingDescription?.description,
            weight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0],
            dimensions: trackResult.packageDetails?.weightAndDimensions?.dimensions?.[0],
            specialHandling: trackResult.specialHandlings
        };

        // Shipper and recipient info
        const shipperInfo = trackResult.shipperInformation ? {
            name: trackResult.shipperInformation.contact?.companyName,
            city: trackResult.shipperInformation.address?.city,
            state: trackResult.shipperInformation.address?.stateOrProvinceCode,
            country: trackResult.shipperInformation.address?.countryCode
        } : null;

        const recipientInfo = trackResult.recipientInformation ? {
            name: trackResult.recipientInformation.contact?.companyName || trackResult.recipientInformation.contact?.personName,
            city: trackResult.recipientInformation.address?.city,
            state: trackResult.recipientInformation.address?.stateOrProvinceCode,
            country: trackResult.recipientInformation.address?.countryCode
        } : null;

        return {
            currentStatus,
            mappedOrderStatus: orderStatus,
            events,
            estimatedDelivery,
            deliveryDetails,
            shipmentDetails,
            shipperInfo,
            recipientInfo,
            isDelivered: orderStatus === 'delivered',
            isInTransit: ['shipped', 'out_for_delivery'].includes(orderStatus),
            hasException: latestStatus.code === 'DE' || events.some(e => e.exceptionCode)
        };
    }

    // Map FedEx status codes to order status
    mapFedExStatusToOrderStatus(fedexCode) {
        const statusMap = {
            // Picked up / In Transit
            'PU': 'shipped',           // Picked up
            'OC': 'shipped',           // Order created
            'IT': 'shipped',           // In transit
            'IX': 'shipped',           // In transit (exception)
            'DP': 'shipped',           // Departed facility
            'AR': 'shipped',           // Arrived at facility
            'AD': 'shipped',           // At delivery
            'OF': 'shipped',           // At FedEx origin facility
            'FD': 'shipped',           // At FedEx destination facility

            // Out for Delivery
            'OD': 'out_for_delivery',  // Out for delivery

            // Delivered
            'DL': 'delivered',         // Delivered

            // Exceptions/Issues
            'DE': 'shipped',           // Delivery exception
            'CA': 'cancelled',         // Cancelled
            'RS': 'returned',          // Return to shipper
            'HL': 'shipped',           // Hold at location
            'SE': 'shipped',           // Shipment exception

            // Default
            'default': 'shipped'
        };

        return statusMap[fedexCode] || statusMap['default'];
    }

    // Get human-readable status description
    getStatusDescription(code) {
        const descriptions = {
            'PU': 'Package picked up',
            'OC': 'Shipment information sent to FedEx',
            'IT': 'In transit',
            'IX': 'In transit - potential delay',
            'DP': 'Departed FedEx location',
            'AR': 'Arrived at FedEx location',
            'AD': 'At local FedEx facility',
            'OF': 'At FedEx origin facility',
            'FD': 'At FedEx destination facility',
            'OD': 'On FedEx vehicle for delivery',
            'DL': 'Delivered',
            'DE': 'Delivery exception',
            'CA': 'Shipment cancelled',
            'RS': 'Returning to shipper',
            'HL': 'Held at FedEx location',
            'SE': 'Shipment exception'
        };

        return descriptions[code] || 'Status update';
    }

    // Get event description
    getEventDescription(eventType) {
        const descriptions = {
            'PU': 'Picked up',
            'OC': 'Shipment information received',
            'IT': 'In transit to destination',
            'DP': 'Departed facility',
            'AR': 'Arrived at facility',
            'OD': 'Out for delivery',
            'DL': 'Delivered',
            'DE': 'Delivery exception occurred'
        };

        return descriptions[eventType] || eventType;
    }

    // Format location for display
    formatLocation(location) {
        if (!location) return null;

        if (typeof location === 'string') return location;

        const parts = [];
        if (location.city) parts.push(location.city);
        if (location.stateOrProvinceCode) parts.push(location.stateOrProvinceCode);
        if (location.countryCode && location.countryCode !== 'US') parts.push(location.countryCode);

        return parts.join(', ') || null;
    }

    // Mock tracking data for sandbox testing
    getMockTrackingData(trackingNumber) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        // Generate realistic mock events
        const mockEvents = [
            {
                timestamp: now.toISOString(),
                eventType: 'OD',
                eventDescription: 'On FedEx vehicle for delivery',
                derivedStatus: 'Out for Delivery',
                location: {
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US',
                    formatted: 'Los Angeles, CA'
                }
            },
            {
                timestamp: yesterday.toISOString(),
                eventType: 'AR',
                eventDescription: 'Arrived at FedEx location',
                derivedStatus: 'In Transit',
                location: {
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US',
                    formatted: 'Los Angeles, CA'
                }
            },
            {
                timestamp: yesterday.toISOString(),
                eventType: 'DP',
                eventDescription: 'Departed FedEx location',
                derivedStatus: 'In Transit',
                location: {
                    city: 'Memphis',
                    state: 'TN',
                    postalCode: '38118',
                    country: 'US',
                    formatted: 'Memphis, TN'
                }
            },
            {
                timestamp: twoDaysAgo.toISOString(),
                eventType: 'AR',
                eventDescription: 'Arrived at FedEx hub',
                derivedStatus: 'In Transit',
                location: {
                    city: 'Memphis',
                    state: 'TN',
                    postalCode: '38118',
                    country: 'US',
                    formatted: 'Memphis, TN'
                }
            },
            {
                timestamp: twoDaysAgo.toISOString(),
                eventType: 'DP',
                eventDescription: 'Departed FedEx location',
                derivedStatus: 'In Transit',
                location: {
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                    formatted: 'New York, NY'
                }
            },
            {
                timestamp: threeDaysAgo.toISOString(),
                eventType: 'PU',
                eventDescription: 'Picked up',
                derivedStatus: 'Picked Up',
                location: {
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                    formatted: 'New York, NY'
                }
            },
            {
                timestamp: threeDaysAgo.toISOString(),
                eventType: 'OC',
                eventDescription: 'Shipment information sent to FedEx',
                derivedStatus: 'Label Created',
                location: {
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                    formatted: 'New York, NY'
                }
            }
        ];

        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return {
            success: true,
            trackingNumber,
            currentStatus: {
                code: 'OD',
                derivedCode: 'OD',
                description: 'On FedEx vehicle for delivery',
                location: 'Los Angeles, CA',
                timestamp: now.toISOString()
            },
            mappedOrderStatus: 'out_for_delivery',
            events: mockEvents,
            estimatedDelivery: {
                begins: tomorrow.toISOString(),
                ends: tomorrow.toISOString(),
                description: 'Delivery by end of day'
            },
            deliveryDetails: {
                actualDeliveryTimestamp: null,
                deliveryLocation: null,
                signedBy: null,
                deliveryAttempts: 0
            },
            shipmentDetails: {
                serviceType: 'FEDEX_GROUND',
                serviceDescription: 'FedEx Ground',
                packaging: 'Your Packaging'
            },
            isDelivered: false,
            isInTransit: true,
            hasException: false,
            isMockData: true
        };
    }

    // services/fedexService.js

    // Add this method to your FedExService class

    async schedulePickup(pickupRequest) {
        try {
            const {
                pickupDate,
                readyTime = '09:00',
                closeTime = '17:00',
                location,
                packageDetails,
                trackingNumbers = []
            } = pickupRequest;

            // FedEx Pickup API payload
            const payload = {
                associatedAccountNumber: {
                    value: this.config.accountNumber
                },
                originDetail: {
                    pickupLocation: {
                        contact: {
                            personName: location.contact.personName,
                            phoneNumber: location.contact.phoneNumber,
                            companyName: location.contact.companyName
                        },
                        address: {
                            streetLines: location.address.streetLines,
                            city: location.address.city,
                            stateOrProvinceCode: location.address.stateOrProvinceCode,
                            postalCode: location.address.postalCode,
                            countryCode: location.address.countryCode || 'US'
                        }
                    },
                    readyDateTimestamp: `${pickupDate}T${readyTime}:00`,
                    customerCloseTime: closeTime,
                    pickupDateType: 'SAME_DAY'
                },
                packageDetails: {
                    packageCount: packageDetails.packageCount || 1,
                    totalWeight: {
                        units: packageDetails.totalWeight?.units || 'LB',
                        value: packageDetails.totalWeight?.value || 5
                    }
                },
                carrierCode: 'FDXG',
                accountAddressOfRecord: {
                    streetLines: location.address.streetLines,
                    city: location.address.city,
                    stateOrProvinceCode: location.address.stateOrProvinceCode,
                    postalCode: location.address.postalCode,
                    countryCode: 'US'
                }
            };

            console.log('[FedEx] Scheduling pickup:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/pickup/v1/pickups', payload);

            if (result.output) {
                return {
                    success: true,
                    confirmationNumber: result.output.pickupConfirmationCode,
                    location: result.output.location,
                    pickupDate: pickupDate,
                    message: 'Pickup scheduled successfully'
                };
            }

            return {
                success: false,
                error: 'Failed to schedule pickup'
            };
        } catch (error) {
            console.error('[FedEx] Pickup Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // ADDRESS VALIDATION - FIXED PAYLOAD
    // ===========================================

    async validateAddress(addressData) {
        try {
            // Build street lines properly
            const streetLines = [];

            if (addressData.streetLine1 || addressData.street) {
                streetLines.push((addressData.streetLine1 || addressData.street).trim());
            }

            if (addressData.streetLine2 || addressData.apartment) {
                const line2 = (addressData.streetLine2 || addressData.apartment).trim();
                if (line2) {
                    streetLines.push(line2);
                }
            }

            // If streetLines array was passed directly
            if (addressData.streetLines && Array.isArray(addressData.streetLines)) {
                streetLines.length = 0;
                streetLines.push(...addressData.streetLines.filter(Boolean));
            }

            if (streetLines.length === 0) {
                return {
                    success: false,
                    isValid: false,
                    error: 'Street address is required',
                    requiresManualVerification: true
                };
            }

            // FedEx Address Validation API v1 - Correct payload structure
            const payload = {
                addressesToValidate: [
                    {
                        address: {
                            streetLines: streetLines,
                            city: (addressData.city || '').trim(),
                            stateOrProvinceCode: (addressData.stateCode || addressData.state || '').toUpperCase().trim(),
                            postalCode: (addressData.zipCode || addressData.postalCode || '').trim(),
                            countryCode: 'US'
                        }
                    }
                ]
            };

            console.log('[FedEx] Validating address:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/address/v1/addresses/resolve', payload);

            // Parse the response
            if (result.output?.resolvedAddresses?.length > 0) {
                const resolved = result.output.resolvedAddresses[0];
                const attributes = resolved.attributes || {};

                // Check for validation issues
                const customerMessages = resolved.customerMessages || [];
                const hasErrors = customerMessages.some(msg =>
                    msg.code === 'UNABLE.TO.MATCH' ||
                    msg.code === 'INVALID.STATE.CODE' ||
                    msg.code === 'INVALID.POSTAL.CODE' ||
                    msg.code === 'MISSING.APARTMENT.NUMBER'
                );

                // Determine classification
                let classification = 'UNKNOWN';
                if (attributes.Residential === 'true') {
                    classification = 'RESIDENTIAL';
                } else if (attributes.Business === 'true') {
                    classification = 'BUSINESS';
                }

                const isValid = !hasErrors && resolved.state !== 'INVALID';

                return {
                    success: true,
                    isValid,
                    classification,
                    isResidential: classification === 'RESIDENTIAL',
                    isBusiness: classification === 'BUSINESS',
                    normalizedAddress: resolved.effectiveAddress ? {
                        streetLines: resolved.effectiveAddress.streetLines,
                        city: resolved.effectiveAddress.city,
                        stateCode: resolved.effectiveAddress.stateOrProvinceCode,
                        zipCode: resolved.effectiveAddress.postalCode,
                        countryCode: 'US'
                    } : null,
                    messages: customerMessages.map(msg => msg.message || msg.code),
                    requiresManualVerification: !isValid,
                    attributes,
                    rawResponse: resolved
                };
            }

            return {
                success: true,
                isValid: false,
                error: 'No matching addresses found',
                requiresManualVerification: true,
                messages: ['Address could not be validated']
            };
        } catch (error) {
            console.error('[FedEx] Address Validation Error:', error.message);

            // Extract detailed error message
            let errorMessage = 'Address validation service unavailable';
            const errorData = error.response?.data;

            if (errorData?.errors?.length > 0) {
                errorMessage = errorData.errors.map(e => e.message).join(', ');
                console.error('[FedEx] Validation Error Details:', JSON.stringify(errorData.errors, null, 2));
            }

            return {
                success: false,
                isValid: false,
                error: errorMessage,
                requiresManualVerification: true,
                messages: [errorMessage]
            };
        }
    }

    // ===========================================
    // SHIPPING RATES - FIXED PRICE EXTRACTION
    // ===========================================

    async getShippingRates(rateRequest) {
        try {
            const { destination, packages, preferredServices = null } = rateRequest;

            // Get appropriate warehouse
            const warehouse = fedexConfig.getWarehouse(destination.stateCode || destination.state);

            // Build destination street lines
            const destStreetLines = [];
            if (destination.streetLine1 || destination.street) {
                destStreetLines.push((destination.streetLine1 || destination.street).trim());
            }
            if (destination.streetLine2 || destination.apartment) {
                const line2 = (destination.streetLine2 || destination.apartment).trim();
                if (line2) destStreetLines.push(line2);
            }
            if (destination.streetLines && Array.isArray(destination.streetLines)) {
                destStreetLines.length = 0;
                destStreetLines.push(...destination.streetLines.filter(Boolean));
            }

            if (destStreetLines.length === 0) {
                destStreetLines.push('Address');
            }

            // Calculate total insured value
            const totalInsuredValue = packages.reduce((sum, pkg) => {
                return sum + (pkg.insuredValue?.amount || pkg.insuredValue || 100);
            }, 0);

            // FedEx Rate API v1 - Correct payload structure
            const payload = {
                accountNumber: {
                    value: this.config.accountNumber
                },
                rateRequestControlParameters: {
                    returnTransitTimes: true,
                    servicesNeededOnRateFailure: true,
                    variableOptions: 'FREIGHT_GUARANTEE',
                    rateSortOrder: 'SERVICENAMETRADITIONAL'
                },
                requestedShipment: {
                    shipper: {
                        address: {
                            streetLines: warehouse.address.streetLines,
                            city: warehouse.address.city,
                            stateOrProvinceCode: warehouse.address.stateOrProvinceCode,
                            postalCode: warehouse.address.postalCode,
                            countryCode: 'US'
                        }
                    },
                    recipient: {
                        address: {
                            streetLines: destStreetLines,
                            city: (destination.city || '').trim(),
                            stateOrProvinceCode: (destination.stateCode || destination.state || '').toUpperCase().trim(),
                            postalCode: (destination.zipCode || destination.postalCode || '').trim(),
                            countryCode: 'US',
                            residential: destination.isResidential !== false
                        }
                    },
                    pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
                    rateRequestType: ['LIST', 'ACCOUNT'],
                    requestedPackageLineItems: packages.map((pkg, index) => ({
                        subPackagingType: 'BOX',
                        groupPackageCount: 1,
                        weight: {
                            value: pkg.weight?.value || pkg.weight || 5,
                            units: pkg.weight?.units || 'LB'
                        },
                        dimensions: {
                            length: Math.ceil(pkg.dimensions?.length || pkg.length || 12),
                            width: Math.ceil(pkg.dimensions?.width || pkg.width || 12),
                            height: Math.ceil(pkg.dimensions?.height || pkg.height || 6),
                            units: pkg.dimensions?.units || 'IN'
                        }
                    }))
                }
            };

            console.log('[FedEx] Getting rates:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/rate/v1/rates/quotes', payload);

            // Log the full response for debugging
            console.log('[FedEx] Rate Response:', JSON.stringify(result, null, 2));

            if (result.output?.rateReplyDetails?.length > 0) {
                const rates = result.output.rateReplyDetails.map(rate => {
                    // Extract the price from various possible locations in the response
                    let totalAmount = 0;
                    let currency = 'USD';
                    let baseCharge = 0;
                    let surcharges = 0;
                    let discounts = 0;

                    // Check ratedShipmentDetails array - can have LIST and ACCOUNT rates
                    if (rate.ratedShipmentDetails && rate.ratedShipmentDetails.length > 0) {
                        // Prefer ACCOUNT rates over LIST rates if available
                        const accountRate = rate.ratedShipmentDetails.find(
                            rsd => rsd.rateType === 'ACCOUNT' || rsd.rateType === 'PAYOR_ACCOUNT_PACKAGE'
                        );
                        const listRate = rate.ratedShipmentDetails.find(
                            rsd => rsd.rateType === 'LIST' || rsd.rateType === 'PAYOR_LIST_PACKAGE'
                        );

                        const ratedDetails = accountRate || listRate || rate.ratedShipmentDetails[0];

                        // Try multiple paths to get the total charge
                        if (ratedDetails) {
                            // Path 1: totalNetCharge
                            if (ratedDetails.totalNetCharge) {
                                totalAmount = parseFloat(ratedDetails.totalNetCharge.amount) || 0;
                                currency = ratedDetails.totalNetCharge.currency || 'USD';
                            }
                            // Path 2: totalNetFedExCharge
                            else if (ratedDetails.totalNetFedExCharge) {
                                totalAmount = parseFloat(ratedDetails.totalNetFedExCharge.amount) || 0;
                                currency = ratedDetails.totalNetFedExCharge.currency || 'USD';
                            }
                            // Path 3: shipmentRateDetail
                            else if (ratedDetails.shipmentRateDetail) {
                                const shipmentRate = ratedDetails.shipmentRateDetail;
                                if (shipmentRate.totalNetCharge) {
                                    totalAmount = parseFloat(shipmentRate.totalNetCharge.amount) || 0;
                                    currency = shipmentRate.totalNetCharge.currency || 'USD';
                                } else if (shipmentRate.totalNetFedExCharge) {
                                    totalAmount = parseFloat(shipmentRate.totalNetFedExCharge.amount) || 0;
                                    currency = shipmentRate.totalNetFedExCharge.currency || 'USD';
                                }

                                // Extract breakdown
                                if (shipmentRate.totalBaseCharge) {
                                    baseCharge = parseFloat(shipmentRate.totalBaseCharge.amount) || 0;
                                }
                                if (shipmentRate.totalSurcharges) {
                                    surcharges = parseFloat(shipmentRate.totalSurcharges.amount) || 0;
                                }
                                if (shipmentRate.totalDiscounts) {
                                    discounts = parseFloat(shipmentRate.totalDiscounts.amount) || 0;
                                }
                            }
                            // Path 4: Check totalBillingWeight for any charge info
                            else if (ratedDetails.totalBillingWeight) {
                                console.log('[FedEx] Rate details structure:', JSON.stringify(ratedDetails, null, 2));
                            }

                            // Path 5: ratedPackages
                            if (totalAmount === 0 && ratedDetails.ratedPackages && ratedDetails.ratedPackages.length > 0) {
                                ratedDetails.ratedPackages.forEach(pkg => {
                                    if (pkg.packageRateDetail?.netCharge) {
                                        totalAmount += parseFloat(pkg.packageRateDetail.netCharge.amount) || 0;
                                    } else if (pkg.packageRateDetail?.netFedExCharge) {
                                        totalAmount += parseFloat(pkg.packageRateDetail.netFedExCharge.amount) || 0;
                                    }
                                });
                            }
                        }
                    }

                    // If still no amount found, log for debugging
                    if (totalAmount === 0) {
                        console.log('[FedEx] Could not extract price for service:', rate.serviceType);
                        console.log('[FedEx] Full rate object:', JSON.stringify(rate, null, 2));
                    }

                    // Parse delivery date
                    let deliveryDate = null;
                    let transitDays = null;

                    if (rate.commit) {
                        // Parse transit days - handle object format
                        if (rate.commit.transitDays) {
                            if (typeof rate.commit.transitDays === 'object') {
                                // FedEx format: { minimumTransitTime: 'ONE_DAY', description: '1 Business Day' }
                                const transitMap = {
                                    'ONE_DAY': 1,
                                    'TWO_DAYS': 2,
                                    'THREE_DAYS': 3,
                                    'FOUR_DAYS': 4,
                                    'FIVE_DAYS': 5,
                                    'SIX_DAYS': 6,
                                    'SEVEN_DAYS': 7
                                };

                                if (rate.commit.transitDays.minimumTransitTime) {
                                    transitDays = transitMap[rate.commit.transitDays.minimumTransitTime] || null;
                                }

                                if (!transitDays && rate.commit.transitDays.value) {
                                    transitDays = rate.commit.transitDays.value;
                                }
                            } else if (typeof rate.commit.transitDays === 'number') {
                                transitDays = rate.commit.transitDays;
                            } else if (typeof rate.commit.transitDays === 'string') {
                                transitDays = parseInt(rate.commit.transitDays, 10) || null;
                            }
                        }

                        // Parse delivery date
                        if (rate.commit.dateDetail?.dayFormat) {
                            deliveryDate = rate.commit.dateDetail.dayFormat;
                        }
                    }

                    // Also check operationalDetail for delivery info
                    if (!deliveryDate && rate.operationalDetail?.deliveryDate) {
                        deliveryDate = rate.operationalDetail.deliveryDate;
                    }

                    return {
                        serviceType: rate.serviceType,
                        serviceName: rate.serviceName || this.getServiceName(rate.serviceType),
                        packagingType: rate.packagingType,
                        deliveryTimestamp: deliveryDate,
                        transitDays: transitDays, // Now a number or null
                        price: totalAmount,
                        totalCharge: {
                            amount: totalAmount,
                            currency: currency
                        },
                        baseCharge: baseCharge,
                        surcharges: surcharges,
                        discounts: discounts,
                        fedexService: true
                    };
                });

                // Filter out rates with 0 price (might be errors)
                const validRates = rates.filter(rate => rate.price > 0);

                // If all rates are 0, return all rates anyway but log warning
                if (validRates.length === 0 && rates.length > 0) {
                    console.warn('[FedEx] WARNING: All rates returned with $0 price. This might be a sandbox limitation or API issue.');

                    // Generate estimated rates based on service type for sandbox
                    const estimatedRates = rates.map(rate => {
                        const estimatedPrices = {
                            'FIRST_OVERNIGHT': 75.00,
                            'PRIORITY_OVERNIGHT': 55.00,
                            'STANDARD_OVERNIGHT': 45.00,
                            'FEDEX_2_DAY_AM': 35.00,
                            'FEDEX_2_DAY': 28.00,
                            'FEDEX_EXPRESS_SAVER': 22.00,
                            'GROUND_HOME_DELIVERY': 15.00,
                            'FEDEX_GROUND': 12.00,
                            'FEDEX_HOME_DELIVERY': 15.00
                        };

                        const estimatedPrice = estimatedPrices[rate.serviceType] || 25.00;

                        return {
                            ...rate,
                            price: estimatedPrice,
                            totalCharge: {
                                amount: estimatedPrice,
                                currency: 'USD'
                            },
                            isEstimated: true // Flag to indicate this is an estimated rate
                        };
                    });

                    // Sort by price
                    estimatedRates.sort((a, b) => a.price - b.price);

                    return {
                        success: true,
                        rates: estimatedRates,
                        currency: 'USD',
                        fromWarehouse: warehouse.name,
                        alerts: result.output.alerts || [],
                        isEstimated: true,
                        message: 'Rates are estimated. Actual rates may vary.'
                    };
                }

                // Sort by price
                validRates.sort((a, b) => a.price - b.price);

                return {
                    success: true,
                    rates: validRates.length > 0 ? validRates : rates,
                    currency: 'USD',
                    fromWarehouse: warehouse.name,
                    alerts: result.output.alerts || []
                };
            }

            return {
                success: false,
                error: 'No rates available for this shipment',
                rates: [],
                alerts: result.output?.alerts || []
            };
        } catch (error) {
            console.error('[FedEx] Rate Error:', error.message);

            // Extract detailed error
            const errorData = error.response?.data;
            if (errorData?.errors?.length > 0) {
                console.error('[FedEx] Rate Error Details:', JSON.stringify(errorData.errors, null, 2));
            }

            return {
                success: false,
                error: error.message,
                rates: []
            };
        }
    }

    // ===========================================
    // LOCATION SEARCH - FIXED PAYLOAD
    // ===========================================

    async searchLocations(searchParams) {
        try {
            // Build street lines
            const streetLines = [];
            if (searchParams.street) {
                streetLines.push(searchParams.street.trim());
            }
            if (searchParams.streetLines && Array.isArray(searchParams.streetLines)) {
                streetLines.length = 0;
                streetLines.push(...searchParams.streetLines.filter(Boolean));
            }

            // FedEx Location API v1 - Correct payload structure
            const payload = {
                locationsSummaryRequestControlParameters: {
                    maxResults: searchParams.limit || 10,
                    distance: {
                        value: searchParams.radius || 25,
                        units: 'MI'  // FIXED: was 'unit', should be 'units'
                    }
                },
                locationSearchCriterion: 'ADDRESS',
                location: {
                    address: {
                        city: (searchParams.city || '').trim(),
                        stateOrProvinceCode: (searchParams.state || '').toUpperCase().trim(),
                        postalCode: (searchParams.zipCode || '').trim(),
                        countryCode: 'US'
                    }
                },
                locationTypes: searchParams.locationTypes || [
                    'FEDEX_OFFICE',
                    'FEDEX_SHIP_CENTER'
                ],
                locationAttrTypes: [
                    'ACCEPTS_CASH',
                    'ALREADY_OPEN',
                    'CLEARANCE_SERVICES',
                    'COPY_AND_PRINT_SERVICES',
                    'DANGEROUS_GOODS_SERVICES',
                    'DIRECT_MAIL_SERVICES',
                    'DOMESTIC_SHIPPING_SERVICES',
                    'DROP_BOX',
                    'INTERNATIONAL_SHIPPING_SERVICES',
                    'LOCATION_IS_IN_AIRPORT',
                    'NOTARY_SERVICES',
                    'OBSERVES_DAY_LIGHT_SAVING_TIMES',
                    'OPEN_TWENTY_FOUR_HOURS',
                    'PACKAGING_SUPPLIES',
                    'PACK_AND_SHIP',
                    'PASSPORT_PHOTO_SERVICES',
                    'RETURNS_SERVICES',
                    'SIGNS_AND_BANNERS_SERVICE',
                    'SONY_PICTURE_KIOSK'
                ]
            };

            console.log('[FedEx] Searching locations:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/location/v1/locations', payload);

            if (result.output?.locationDetailList?.length > 0) {
                return {
                    success: true,
                    count: result.output.matchedAddressCount || result.output.locationDetailList.length,
                    locations: result.output.locationDetailList.map(loc => ({
                        locationId: loc.locationId,
                        locationType: loc.locationType,
                        name: loc.locationName || loc.locationType,
                        address: {
                            streetLines: loc.locationContactAndAddress?.address?.streetLines,
                            city: loc.locationContactAndAddress?.address?.city,
                            state: loc.locationContactAndAddress?.address?.stateOrProvinceCode,
                            zipCode: loc.locationContactAndAddress?.address?.postalCode,
                            countryCode: loc.locationContactAndAddress?.address?.countryCode
                        },
                        phone: loc.locationContactAndAddress?.contact?.phoneNumber,
                        distance: loc.distance ? {
                            value: loc.distance.value,
                            units: loc.distance.units
                        } : null,
                        operatingHours: loc.normalHours,
                        storeHours: loc.storeHours,
                        services: loc.carrierDetailList?.map(c => c.serviceCategory) || []
                    }))
                };
            }

            return {
                success: true,
                count: 0,
                locations: [],
                message: 'No FedEx locations found nearby'
            };
        } catch (error) {
            console.error('[FedEx] Location Search Error:', error.message);

            // Extract detailed error
            const errorData = error.response?.data;
            if (errorData?.errors?.length > 0) {
                console.error('[FedEx] Location Error Details:', JSON.stringify(errorData.errors, null, 2));
            }

            return {
                success: false,
                error: error.message,
                locations: []
            };
        }
    }

    // ===========================================
    // TRACK SHIPMENT - FIXED PAYLOAD
    // ===========================================

    async trackShipment(trackingNumber) {
        try {
            const payload = {
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber
                        }
                    }
                ]
            };

            console.log('[FedEx] Tracking shipment:', trackingNumber);

            const result = await this.makeRequest('/track/v1/trackingnumbers', payload);

            if (result.output?.completeTrackResults?.length > 0) {
                const trackResult = result.output.completeTrackResults[0]?.trackResults?.[0];

                if (!trackResult || trackResult.error) {
                    return {
                        success: false,
                        error: trackResult?.error?.message || 'Tracking information not found'
                    };
                }

                const latestStatus = trackResult.latestStatusDetail;
                const scanEvents = trackResult.scanEvents || [];

                return {
                    success: true,
                    trackingNumber,
                    currentStatus: {
                        code: latestStatus?.code,
                        description: latestStatus?.description,
                        derivedCode: latestStatus?.derivedCode,
                        location: this.formatLocation(latestStatus?.scanLocation),
                        timestamp: latestStatus?.date
                    },
                    estimatedDelivery: trackResult.estimatedDeliveryTimeWindow ? {
                        begins: trackResult.estimatedDeliveryTimeWindow.window?.begins,
                        ends: trackResult.estimatedDeliveryTimeWindow.window?.ends,
                        type: trackResult.estimatedDeliveryTimeWindow.type
                    } : null,
                    actualDelivery: trackResult.actualDeliveryDetail ? {
                        timestamp: trackResult.actualDeliveryDetail.actualDeliveryTimestamp,
                        location: trackResult.actualDeliveryDetail.deliveryLocationType
                    } : null,
                    shipmentDetails: {
                        weight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0],
                        dimensions: trackResult.packageDetails?.weightAndDimensions?.dimensions?.[0],
                        packaging: trackResult.packageDetails?.packagingDescription?.description
                    },
                    scanEvents: scanEvents.map(scan => ({
                        timestamp: scan.date,
                        eventType: scan.eventType,
                        eventDescription: scan.eventDescription,
                        location: this.formatLocation(scan.scanLocation),
                        derivedStatus: scan.derivedStatus,
                        exceptionDescription: scan.exceptionDescription
                    })),
                    serviceType: trackResult.serviceType,
                    serviceName: trackResult.serviceDetail?.description
                };
            }

            return {
                success: false,
                error: 'No tracking information found'
            };
        } catch (error) {
            console.error('[FedEx] Tracking Error:', error.message);

            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // CREATE SHIPMENT - FIXED PAYLOAD
    // ===========================================

    async createShipment(shipmentData) {
        try {
            const {
                orderNumber,
                recipient,
                packages,
                serviceType = 'FEDEX_GROUND',
                signatureRequired = false,
                insuranceAmount = null
            } = shipmentData;

            // Get warehouse
            const warehouse = fedexConfig.getWarehouse(recipient.address.stateCode);

            // Build recipient street lines
            const recipientStreetLines = [];
            if (recipient.address.streetLine1) {
                recipientStreetLines.push(recipient.address.streetLine1.trim());
            }
            if (recipient.address.streetLine2) {
                recipientStreetLines.push(recipient.address.streetLine2.trim());
            }
            if (recipientStreetLines.length === 0) {
                recipientStreetLines.push('Address');
            }

            // FedEx Ship API v1 - Correct payload
            const payload = {
                labelResponseOptions: 'URL_ONLY',
                accountNumber: {
                    value: this.config.accountNumber
                },
                requestedShipment: {
                    shipper: {
                        contact: {
                            personName: warehouse.contact.personName,
                            phoneNumber: warehouse.contact.phoneNumber,
                            companyName: warehouse.contact.companyName,
                            emailAddress: warehouse.contact.emailAddress
                        },
                        address: {
                            streetLines: warehouse.address.streetLines,
                            city: warehouse.address.city,
                            stateOrProvinceCode: warehouse.address.stateOrProvinceCode,
                            postalCode: warehouse.address.postalCode,
                            countryCode: 'US',
                            residential: false
                        }
                    },
                    recipients: [
                        {
                            contact: {
                                personName: recipient.contact.personName || 'Customer',
                                phoneNumber: (recipient.contact.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '0000000000',
                                emailAddress: recipient.contact.emailAddress,
                                companyName: recipient.contact.companyName || ''
                            },
                            address: {
                                streetLines: recipientStreetLines,
                                city: (recipient.address.city || '').trim(),
                                stateOrProvinceCode: (recipient.address.stateCode || '').toUpperCase().trim(),
                                postalCode: (recipient.address.zipCode || '').trim(),
                                countryCode: 'US',
                                residential: recipient.address.isResidential !== false
                            }
                        }
                    ],
                    pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
                    serviceType: serviceType,
                    packagingType: 'YOUR_PACKAGING',
                    shippingChargesPayment: {
                        paymentType: 'SENDER',
                        payor: {
                            responsibleParty: {
                                accountNumber: {
                                    value: this.config.accountNumber
                                }
                            }
                        }
                    },
                    labelSpecification: {
                        labelFormatType: 'COMMON2D',
                        imageType: 'PDF',
                        labelStockType: 'PAPER_85X11_TOP_HALF_LABEL'
                    },
                    requestedPackageLineItems: packages.map((pkg, index) => {
                        const packageItem = {
                            sequenceNumber: index + 1,
                            weight: {
                                value: pkg.weight?.value || pkg.weight || 5,
                                units: pkg.weight?.units || 'LB'
                            },
                            dimensions: {
                                length: Math.ceil(pkg.dimensions?.length || 12),
                                width: Math.ceil(pkg.dimensions?.width || 12),
                                height: Math.ceil(pkg.dimensions?.height || 6),
                                units: 'IN'
                            },
                            customerReferences: [
                                {
                                    customerReferenceType: 'INVOICE_NUMBER',
                                    value: orderNumber || `ORD${Date.now()}`
                                }
                            ]
                        };

                        // Add declared value for insurance
                        if (insuranceAmount && insuranceAmount > 0) {
                            packageItem.declaredValue = {
                                amount: insuranceAmount,
                                currency: 'USD'
                            };
                        }

                        return packageItem;
                    })
                }
            };

            // Add signature option if required
            if (signatureRequired) {
                payload.requestedShipment.shipmentSpecialServices = {
                    specialServiceTypes: ['SIGNATURE_OPTION'],
                    signatureOptionType: 'DIRECT'
                };
            }

            console.log('[FedEx] Creating shipment:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/ship/v1/shipments', payload);

            if (result.output?.transactionShipments?.length > 0) {
                const shipment = result.output.transactionShipments[0];
                const packageDetails = shipment.completedShipmentDetail?.completedPackageDetails?.[0];

                return {
                    success: true,
                    trackingNumber: shipment.masterTrackingNumber,
                    labelUrl: packageDetails?.label?.url,
                    labelData: packageDetails?.label?.encodedLabel,
                    shipmentId: shipment.jobId,
                    serviceType: shipment.serviceType,
                    serviceName: this.getServiceName(shipment.serviceType),
                    totalCharge: shipment.completedShipmentDetail?.shipmentRating?.shipmentRateDetails?.[0]?.totalNetCharge,
                    estimatedDeliveryDate: shipment.completedShipmentDetail?.operationalDetail?.deliveryDate,
                    rawResponse: shipment
                };
            }

            return {
                success: false,
                error: 'Failed to create shipment',
                alerts: result.output?.alerts || []
            };
        } catch (error) {
            console.error('[FedEx] Create Shipment Error:', error.message);

            let errorMessage = 'Failed to create shipment';
            const errorData = error.response?.data;
            if (errorData?.errors?.length > 0) {
                errorMessage = errorData.errors.map(e => e.message).join(', ');
                console.error('[FedEx] Shipment Error Details:', JSON.stringify(errorData.errors, null, 2));
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // ===========================================
    // CANCEL SHIPMENT
    // ===========================================

    async cancelShipment(trackingNumber) {
        try {
            const payload = {
                accountNumber: {
                    value: this.config.accountNumber
                },
                trackingNumber: trackingNumber,
                deletionControl: 'DELETE_ALL_PACKAGES'
            };

            console.log('[FedEx] Cancelling shipment:', trackingNumber);

            const result = await this.makeRequest('/ship/v1/shipments/cancel', payload, 'PUT');

            return {
                success: true,
                message: 'Shipment cancelled successfully',
                cancelConfirmation: result.output?.cancelledShipment
            };
        } catch (error) {
            console.error('[FedEx] Cancel Shipment Error:', error.message);

            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // SERVICE AVAILABILITY
    // ===========================================

    async getServiceAvailability(origin, destination) {
        try {
            const payload = {
                requestedShipment: {
                    shipper: {
                        address: {
                            postalCode: origin.zipCode || origin.postalCode,
                            countryCode: 'US'
                        }
                    },
                    recipients: [
                        {
                            address: {
                                postalCode: destination.zipCode || destination.postalCode,
                                countryCode: 'US'
                            }
                        }
                    ]
                },
                carrierCodes: ['FDXE', 'FDXG']
            };

            console.log('[FedEx] Checking service availability');

            const result = await this.makeRequest('/availability/v1/packageandserviceoptions', payload);

            if (result.output?.packageOptions?.length > 0) {
                return {
                    success: true,
                    services: result.output.packageOptions.map(opt => ({
                        serviceType: opt.serviceType,
                        serviceName: opt.serviceType,
                        packaging: opt.packagingType
                    }))
                };
            }

            return {
                success: false,
                services: []
            };
        } catch (error) {
            console.error('[FedEx] Service Availability Error:', error.message);
            return {
                success: false,
                error: error.message,
                services: []
            };
        }
    }

    // ===========================================
    // HELPER METHODS
    // ===========================================

    formatLocation(location) {
        if (!location) return null;

        if (typeof location === 'string') return location;

        const parts = [];
        if (location.city) parts.push(location.city);
        if (location.stateOrProvinceCode) parts.push(location.stateOrProvinceCode);
        if (location.postalCode) parts.push(location.postalCode);
        if (location.countryCode && location.countryCode !== 'US') parts.push(location.countryCode);

        return parts.join(', ') || null;
    }

    getServiceName(serviceType) {
        const serviceNames = {
            'FEDEX_GROUND': 'FedEx Ground',
            'GROUND_HOME_DELIVERY': 'FedEx Home Delivery',
            'FEDEX_HOME_DELIVERY': 'FedEx Home Delivery',
            'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
            'FEDEX_2_DAY': 'FedEx 2Day',
            'FEDEX_2_DAY_AM': 'FedEx 2Day A.M.',
            'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
            'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
            'FIRST_OVERNIGHT': 'FedEx First Overnight',
            'FEDEX_FREIGHT_ECONOMY': 'FedEx Freight Economy',
            'FEDEX_FREIGHT_PRIORITY': 'FedEx Freight Priority',
            'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
            'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
            'SMART_POST': 'FedEx SmartPost'
        };

        return serviceNames[serviceType] || serviceType?.replace(/_/g, ' ') || 'FedEx Service';
    }

    // ===========================================
    // TEST CONNECTION
    // ===========================================

    async testConnection() {
        try {
            const configValidation = fedexConfig.validateConfig();
            if (!configValidation.isValid) {
                return {
                    success: false,
                    message: 'Configuration errors',
                    errors: configValidation.errors,
                    environment: fedexConfig.environment
                };
            }

            await this.getAccessToken();

            // Test with a simple address validation
            const testResult = await this.validateAddress({
                streetLine1: '10 FedEx Pkwy',
                city: 'Collierville',
                stateCode: 'TN',
                zipCode: '38017'
            });

            return {
                success: true,
                message: 'FedEx API connection successful',
                environment: fedexConfig.environment,
                baseUrl: this.baseURL,
                testValidation: testResult.success ? 'Address validation working' : 'Address validation has issues (sandbox limitation)'
            };
        } catch (error) {
            return {
                success: false,
                message: 'FedEx API connection failed',
                error: error.message,
                environment: fedexConfig.environment
            };
        }
    }
}

// Export singleton instance
export default new FedExService();
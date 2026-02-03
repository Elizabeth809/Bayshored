import axios from 'axios';
import fedexConfig from '../config/fedexConfig.js';

class FedExService {
    constructor() {
        // Main API token (Rate, Ship, Address)
        this.accessToken = null;
        this.tokenExpiry = null;

        // Track API token (separate project)
        this.trackAccessToken = null;
        this.trackTokenExpiry = null;

        this.maxRetries = 3;
        this.retryDelay = 1000;

        // Log configuration on initialization
        if (process.env.NODE_ENV !== 'test') {
            fedexConfig.logStatus();
        }
    }

    // Get current config
    get config() {
        return fedexConfig.getConfig();
    }

    // Get base URL
    get baseURL() {
        return fedexConfig.getBaseUrl();
    }

    // Check if production
    get isProduction() {
        return fedexConfig.isProduction();
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

            console.log(`[FedEx] Requesting MAIN API access token (${fedexConfig.environment})`);

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
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);

            console.log('[FedEx] Main API access token obtained successfully');
            return this.accessToken;
        } catch (error) {
            console.error('[FedEx] Main API Token Error:', error.response?.data || error.message);
            this.accessToken = null;
            this.tokenExpiry = null;
            throw new Error(`Failed to get FedEx access token: ${error.response?.data?.error_description || error.message}`);
        }
    }

    // ===========================================
    // AUTHENTICATION - TRACK API (SEPARATE)
    // ===========================================

    async getTrackAccessToken(forceRefresh = false) {
        try {
            // Return cached token if still valid
            if (!forceRefresh && this.trackAccessToken && this.trackTokenExpiry && Date.now() < this.trackTokenExpiry) {
                return this.trackAccessToken;
            }

            // Get track-specific credentials
            const { clientId, clientSecret } = fedexConfig.getTrackCredentials();

            if (!clientId || !clientSecret) {
                throw new Error('FedEx Track API credentials are not configured');
            }

            console.log(`[FedEx] Requesting TRACK API access token (${fedexConfig.environment})`);

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

            this.trackAccessToken = response.data.access_token;
            this.trackTokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);

            console.log('[FedEx] Track API access token obtained successfully');
            return this.trackAccessToken;
        } catch (error) {
            console.error('[FedEx] Track API Token Error:', error.response?.data || error.message);
            this.trackAccessToken = null;
            this.trackTokenExpiry = null;
            throw new Error(`Failed to get FedEx Track API token: ${error.response?.data?.error_description || error.message}`);
        }
    }

    // ===========================================
    // MAKE REQUEST - MAIN API
    // ===========================================

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

            console.error('[FedEx] Main API Error:', {
                endpoint,
                status: statusCode,
                error: JSON.stringify(errorData, null, 2)
            });

            // Handle token expiration
            if (statusCode === 401 && retryCount < 1) {
                console.log('[FedEx] Main token expired, refreshing...');
                this.accessToken = null;
                this.tokenExpiry = null;
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
    // MAKE REQUEST - TRACK API (SEPARATE TOKEN)
    // ===========================================

    async makeTrackRequest(endpoint, data, method = 'POST', retryCount = 0) {
        try {
            // Use track-specific token
            const token = await this.getTrackAccessToken();

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

            console.error('[FedEx] Track API Error:', {
                endpoint,
                status: statusCode,
                error: JSON.stringify(errorData, null, 2)
            });

            // Handle token expiration
            if (statusCode === 401 && retryCount < 1) {
                console.log('[FedEx] Track token expired, refreshing...');
                this.trackAccessToken = null;
                this.trackTokenExpiry = null;
                await this.getTrackAccessToken(true);
                return this.makeTrackRequest(endpoint, data, method, retryCount + 1);
            }

            // Handle 403 - Permission denied
            if (statusCode === 403) {
                const errorCode = errorData?.errors?.[0]?.code;
                if (errorCode === 'FORBIDDEN.ERROR') {
                    console.warn('[FedEx] Track API permission denied - check credentials');
                    throw new Error('TRACK_API_NOT_AUTHORIZED');
                }
            }

            // Handle rate limiting
            if (statusCode === 429 && retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`[FedEx] Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeTrackRequest(endpoint, data, method, retryCount + 1);
            }

            throw error;
        }
    }

    // ===========================================
    // ADDRESS VALIDATION
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
                streetLines.push(...addressData.streetLines.filter(Boolean).map(s => s.trim()));
            }

            if (streetLines.length === 0) {
                return {
                    success: false,
                    isValid: false,
                    error: 'Street address is required',
                    requiresManualVerification: true
                };
            }

            // Validate required fields
            const city = (addressData.city || '').trim();
            const stateCode = (addressData.stateCode || addressData.state || '').toUpperCase().trim();
            const zipCode = (addressData.zipCode || addressData.postalCode || '').trim();

            if (!city || !stateCode || !zipCode) {
                return {
                    success: false,
                    isValid: false,
                    error: 'City, state, and ZIP code are required',
                    requiresManualVerification: true
                };
            }

            // Validate ZIP code format
            if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
                return {
                    success: false,
                    isValid: false,
                    error: 'Invalid ZIP code format',
                    requiresManualVerification: true
                };
            }

            // FedEx Address Validation API v1
            const payload = {
                addressesToValidate: [
                    {
                        address: {
                            streetLines: streetLines,
                            city: city,
                            stateOrProvinceCode: stateCode,
                            postalCode: zipCode,
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
                    msg.code === 'MISSING.APARTMENT.NUMBER' ||
                    msg.code === 'INVALID.CITY' ||
                    msg.code === 'INVALID.ADDRESS'
                );

                // Check state
                const isInvalid = resolved.state === 'INVALID' || resolved.state === 'UNABLE_TO_MATCH';

                // Determine classification
                let classification = 'UNKNOWN';
                if (attributes.Residential === 'true' || attributes.ResidentialDeliveryIndicator === 'Y') {
                    classification = 'RESIDENTIAL';
                } else if (attributes.Business === 'true' || attributes.ResidentialDeliveryIndicator === 'N') {
                    classification = 'BUSINESS';
                }

                const isValid = !hasErrors && !isInvalid;

                // Build normalized address
                let normalizedAddress = null;
                if (resolved.effectiveAddress) {
                    normalizedAddress = {
                        streetLines: resolved.effectiveAddress.streetLines || streetLines,
                        city: resolved.effectiveAddress.city || city,
                        stateCode: resolved.effectiveAddress.stateOrProvinceCode || stateCode,
                        zipCode: resolved.effectiveAddress.postalCode || zipCode,
                        countryCode: 'US'
                    };
                }

                return {
                    success: true,
                    isValid,
                    classification,
                    isResidential: classification === 'RESIDENTIAL',
                    isBusiness: classification === 'BUSINESS',
                    normalizedAddress,
                    messages: customerMessages.map(msg => msg.message || msg.code),
                    requiresManualVerification: !isValid,
                    attributes,
                    state: resolved.state,
                    rawResponse: this.isProduction ? undefined : resolved
                };
            }

            return {
                success: true,
                isValid: false,
                error: 'No matching addresses found',
                requiresManualVerification: true,
                messages: ['Address could not be validated by FedEx']
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
    // SHIPPING RATES
    // ===========================================

    async getShippingRates(rateRequest) {
        try {
            const { destination, packages, preferredServices = null } = rateRequest;

            // Validate destination
            if (!destination || !destination.zipCode) {
                return {
                    success: false,
                    error: 'Destination address with ZIP code is required',
                    rates: []
                };
            }

            // Get appropriate warehouse based on destination
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
                destStreetLines.push(...destination.streetLines.filter(Boolean).map(s => s.trim()));
            }

            // Ensure at least one street line
            if (destStreetLines.length === 0) {
                destStreetLines.push('Address');
            }

            // Validate packages
            if (!packages || packages.length === 0) {
                return {
                    success: false,
                    error: 'At least one package is required',
                    rates: []
                };
            }

            // Calculate total insured value (shipment-level)
            const totalInsuredValue = packages.reduce((sum, pkg) => {
                return sum + (pkg.insuredValue?.amount || pkg.insuredValue || 100);
            }, 0);

            // Build package line items with validation and smart splitting for heavy packages
            const requestedPackageLineItems = [];

            packages.forEach((pkg) => {
                const rawWeight = pkg.weight?.value || pkg.weight || 5;
                const length = Math.ceil(pkg.dimensions?.length || pkg.length || 12);
                const width = Math.ceil(pkg.dimensions?.width || pkg.width || 12);
                const height = Math.ceil(pkg.dimensions?.height || pkg.height || 6);
                const weightUnits = pkg.weight?.units || pkg.weight?.unit || 'LB';
                const dimUnits = pkg.dimensions?.units || pkg.dimensions?.unit || 'IN';

                // Enforce FedEx single-package weight limit recommendations by splitting large weights
                // We'll split into packages of ~50 lbs for better accuracy (configurable later)
                const maxPerPackage = 50; // lbs
                const totalWeight = Math.max(1, Math.min(150, rawWeight));
                const splitCount = totalWeight > maxPerPackage ? Math.ceil(totalWeight / maxPerPackage) : 1;

                for (let i = 0; i < splitCount; i++) {
                    const partWeight = Math.ceil(totalWeight / splitCount);
                    requestedPackageLineItems.push({
                        subPackagingType: 'BOX',
                        groupPackageCount: 1,
                        weight: {
                            value: Math.max(1, Math.min(150, partWeight)), // 1-150 lbs
                            units: weightUnits.toUpperCase()
                        },
                        dimensions: {
                            length: Math.max(1, Math.min(119, length)),
                            width: Math.max(1, Math.min(119, width)),
                            height: Math.max(1, Math.min(70, height)),
                            units: dimUnits.toUpperCase()
                        }
                    });
                }
            });

            // FedEx Rate API v1 payload
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
                    rateRequestType: ['ACCOUNT', 'LIST'],
                    // Provide shipment-level insured value
                    totalInsuredValue: {
                        amount: totalInsuredValue,
                        currency: 'USD'
                    },
                    requestedPackageLineItems
                }
            };

            console.log('[FedEx] Getting rates:', JSON.stringify(payload, null, 2));

            const result = await this.makeRequest('/rate/v1/rates/quotes', payload);

            if (result.output?.rateReplyDetails?.length > 0) {
                // Debug: log sanitized rate reply details in non-production for troubleshooting
                if (!this.isProduction) {
                    try {
                        const sanitized = result.output.rateReplyDetails.map(r => ({
                            serviceType: r.serviceType,
                            serviceName: r.serviceName,
                            ratedShipmentDetails: (r.ratedShipmentDetails || []).map(d => ({
                                rateType: d.rateType,
                                totalNetCharge: d.totalNetCharge,
                                totalNetFedExCharge: d.totalNetFedExCharge,
                                shipmentRateDetail: d.shipmentRateDetail ? {
                                    totalBaseCharge: d.shipmentRateDetail.totalBaseCharge,
                                    totalSurcharges: d.shipmentRateDetail.totalSurcharges,
                                    totalDiscounts: d.shipmentRateDetail.totalDiscounts,
                                    totalNetCharge: d.shipmentRateDetail.totalNetCharge
                                } : undefined
                            }))
                        }));
                        console.log('[FedEx] Rate reply (sanitized):', JSON.stringify(sanitized, null, 2));
                    } catch (e) {
                        console.warn('[FedEx] Failed to sanitize rate reply for logging');
                    }
                }
                const rates = result.output.rateReplyDetails.map(rate => {
                    // Extract price using multiple fallback paths
                    const priceInfo = this.extractPrice(rate);

                    // Parse transit days properly
                    const transitDays = this.parseTransitDays(rate.commit);

                    // Parse delivery date
                    const deliveryDate = this.parseDeliveryDate(rate);

                    return {
                        serviceType: rate.serviceType,
                        serviceName: rate.serviceName || this.getServiceName(rate.serviceType),
                        packagingType: rate.packagingType,
                        deliveryTimestamp: deliveryDate,
                        transitDays: transitDays,
                        price: priceInfo.total,
                        totalCharge: {
                            amount: priceInfo.total,
                            currency: priceInfo.currency
                        },
                        baseCharge: priceInfo.base,
                        surcharges: priceInfo.surcharges,
                        discounts: priceInfo.discounts,
                        fedexService: true,
                        rateType: priceInfo.rateType
                    };
                });

                // Filter out rates with 0 price
                let validRates = rates.filter(rate => rate.price > 0);

                // If sandbox and all rates are 0, generate estimated rates
                if (validRates.length === 0 && rates.length > 0) {
                    console.warn('[FedEx] All rates returned $0 - generating estimates');

                    if (!this.isProduction) {
                        // Sandbox: Generate estimated rates
                        validRates = this.generateEstimatedRates(rates, packages);
                    } else {
                        // Production: This is an error condition
                        console.error('[FedEx] PRODUCTION ERROR: No valid rates returned');
                        return {
                            success: false,
                            error: 'No rates available from FedEx. Please try again or contact support.',
                            rates: [],
                            alerts: result.output.alerts || []
                        };
                    }
                }

                // Sort by price
                validRates.sort((a, b) => a.price - b.price);

                return {
                    success: true,
                    rates: validRates,
                    currency: 'USD',
                    fromWarehouse: warehouse.name,
                    alerts: result.output.alerts || [],
                    isEstimated: validRates.some(r => r.isEstimated)
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

            const errorData = error.response?.data;
            if (errorData?.errors?.length > 0) {
                console.error('[FedEx] Rate Error Details:', JSON.stringify(errorData.errors, null, 2));
            }

            return {
                success: false,
                error: error.response?.data?.errors?.[0]?.message || error.message,
                rates: []
            };
        }
    }

    // Extract price from FedEx rate response
    extractPrice(rate) {
        let total = 0;
        let base = 0;
        let surcharges = 0;
        let discounts = 0;
        let currency = 'USD';
        let rateType = 'LIST';

        if (rate.ratedShipmentDetails && rate.ratedShipmentDetails.length > 0) {
            // Prefer ACCOUNT rates over LIST rates
            const accountRate = rate.ratedShipmentDetails.find(
                rsd => rsd.rateType === 'ACCOUNT' ||
                    rsd.rateType === 'PAYOR_ACCOUNT_PACKAGE' ||
                    rsd.rateType === 'PAYOR_ACCOUNT_SHIPMENT'
            );
            const listRate = rate.ratedShipmentDetails.find(
                rsd => rsd.rateType === 'LIST' ||
                    rsd.rateType === 'PAYOR_LIST_PACKAGE' ||
                    rsd.rateType === 'PAYOR_LIST_SHIPMENT'
            );

            const ratedDetails = accountRate || listRate || rate.ratedShipmentDetails[0];
            rateType = ratedDetails.rateType || 'LIST';

            if (ratedDetails) {
                // Try multiple paths to get charges

                // Path 1: Direct totalNetCharge
                if (ratedDetails.totalNetCharge?.amount) {
                    total = parseFloat(ratedDetails.totalNetCharge.amount);
                    currency = ratedDetails.totalNetCharge.currency || 'USD';
                }
                // Path 2: totalNetFedExCharge
                if (!total && ratedDetails.totalNetFedExCharge?.amount) {
                    total = parseFloat(ratedDetails.totalNetFedExCharge.amount);
                    currency = ratedDetails.totalNetFedExCharge.currency || 'USD';
                }

                // Path 3: shipmentRateDetail
                if (ratedDetails.shipmentRateDetail) {
                    const srd = ratedDetails.shipmentRateDetail;

                    if (srd.totalNetCharge?.amount) {
                        total = parseFloat(srd.totalNetCharge.amount);
                        currency = srd.totalNetCharge.currency || 'USD';
                    } else if (srd.totalNetFedExCharge?.amount) {
                        total = parseFloat(srd.totalNetFedExCharge.amount);
                        currency = srd.totalNetFedExCharge.currency || 'USD';
                    }

                    // Get breakdown
                    if (srd.totalBaseCharge?.amount) {
                        base = parseFloat(srd.totalBaseCharge.amount);
                    }
                    if (srd.totalSurcharges?.amount) {
                        surcharges = parseFloat(srd.totalSurcharges.amount);
                    }
                    if (srd.totalDiscounts?.amount) {
                        discounts = parseFloat(srd.totalDiscounts.amount);
                    }
                }

                // Path 4: Sum from ratedPackages
                if ((!total || total === 0) && ratedDetails.ratedPackages?.length > 0) {
                    ratedDetails.ratedPackages.forEach(pkg => {
                        const pkgNet = pkg.packageRateDetail?.netCharge?.amount || pkg.packageRateDetail?.netFedExCharge?.amount;
                        if (pkgNet) total += parseFloat(pkgNet);
                    });
                }

                // Final fallback: if we have breakdown values but no explicit total, compute it
                if ((!total || total === 0) && (base || surcharges || discounts)) {
                    total = (base || 0) + (surcharges || 0) - (discounts || 0);
                }
            }
        }

        return { total, base, surcharges, discounts, currency, rateType };
    }

    // Parse transit days from FedEx response
    parseTransitDays(commit) {
        if (!commit) return null;

        // Direct transit days number
        if (typeof commit.transitDays === 'number') {
            return commit.transitDays;
        }

        if (typeof commit.transitDays === 'string') {
            const parsed = parseInt(commit.transitDays, 10);
            if (!isNaN(parsed)) return parsed;
        }

        // Object format
        if (typeof commit.transitDays === 'object' && commit.transitDays) {
            // FedEx format: { minimumTransitTime: 'ONE_DAY', description: '1 Business Day' }
            const transitMap = {
                'ONE_DAY': 1,
                'TWO_DAYS': 2,
                'THREE_DAYS': 3,
                'FOUR_DAYS': 4,
                'FIVE_DAYS': 5,
                'SIX_DAYS': 6,
                'SEVEN_DAYS': 7,
                'EIGHT_DAYS': 8,
                'NINE_DAYS': 9,
                'TEN_DAYS': 10
            };

            if (commit.transitDays.minimumTransitTime) {
                const mapped = transitMap[commit.transitDays.minimumTransitTime];
                if (mapped) return mapped;
            }

            if (commit.transitDays.value) {
                const parsed = parseInt(commit.transitDays.value, 10);
                if (!isNaN(parsed)) return parsed;
            }
        }

        // Check transitTime directly
        if (commit.transitTime) {
            const transitMap = {
                'ONE_DAY': 1,
                'TWO_DAYS': 2,
                'THREE_DAYS': 3,
                'FOUR_DAYS': 4,
                'FIVE_DAYS': 5,
                'SIX_DAYS': 6,
                'SEVEN_DAYS': 7
            };
            const mapped = transitMap[commit.transitTime];
            if (mapped) return mapped;
        }

        return null;
    }

    // Parse delivery date from rate response
    parseDeliveryDate(rate) {
        // Check commit.dateDetail
        if (rate.commit?.dateDetail?.dayFormat) {
            return rate.commit.dateDetail.dayFormat;
        }

        // Check commit.commitDates
        if (rate.commit?.commitDates?.length > 0) {
            return rate.commit.commitDates[0];
        }

        // Check operationalDetail
        if (rate.operationalDetail?.deliveryDate) {
            return rate.operationalDetail.deliveryDate;
        }

        // Check operationalDetail.commitDate
        if (rate.operationalDetail?.commitDate) {
            return rate.operationalDetail.commitDate;
        }

        return null;
    }

    // Generate estimated rates for sandbox
    generateEstimatedRates(rates, packages) {
        // Calculate weight factor
        const totalWeight = packages.reduce((sum, pkg) => {
            return sum + (pkg.weight?.value || pkg.weight || 5);
        }, 0);

        const weightMultiplier = Math.max(1, totalWeight / 10);

        const estimatedPrices = {
            'FIRST_OVERNIGHT': 75.00 * weightMultiplier,
            'PRIORITY_OVERNIGHT': 55.00 * weightMultiplier,
            'STANDARD_OVERNIGHT': 45.00 * weightMultiplier,
            'FEDEX_2_DAY_AM': 35.00 * weightMultiplier,
            'FEDEX_2_DAY': 28.00 * weightMultiplier,
            'FEDEX_EXPRESS_SAVER': 22.00 * weightMultiplier,
            'GROUND_HOME_DELIVERY': 15.00 * weightMultiplier,
            'FEDEX_GROUND': 12.00 * weightMultiplier,
            'FEDEX_HOME_DELIVERY': 15.00 * weightMultiplier
        };

        return rates.map(rate => {
            const estimatedPrice = estimatedPrices[rate.serviceType] || (25.00 * weightMultiplier);

            return {
                ...rate,
                price: Math.round(estimatedPrice * 100) / 100,
                totalCharge: {
                    amount: Math.round(estimatedPrice * 100) / 100,
                    currency: 'USD'
                },
                isEstimated: true
            };
        });
    }

    // ===========================================
    // TRACK SHIPMENT
    // ===========================================

    async trackShipment(trackingNumber) {
        try {
            if (!trackingNumber) {
                return {
                    success: false,
                    error: 'Tracking number is required'
                };
            }

            const payload = {
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber.toString().trim()
                        }
                    }
                ]
            };

            console.log('[FedEx] Tracking shipment:', trackingNumber);

            // Use Track API specific request method
            const result = await this.makeTrackRequest('/track/v1/trackingnumbers', payload);

            if (result.output?.completeTrackResults?.length > 0) {
                const trackResult = result.output.completeTrackResults[0]?.trackResults?.[0];

                if (!trackResult) {
                    return this.handleTrackingNotFound(trackingNumber, 'No tracking results found');
                }

                if (trackResult.error) {
                    return this.handleTrackingNotFound(trackingNumber, trackResult.error.message);
                }

                return this.parseTrackingResponse(trackResult, trackingNumber);
            }

            return this.handleTrackingNotFound(trackingNumber, 'No tracking information found');

        } catch (error) {
            console.error('[FedEx] Tracking Error:', error.message);

            if (error.message === 'TRACK_API_NOT_AUTHORIZED') {
                return this.handleTrackingNotAuthorized(trackingNumber);
            }

            // In sandbox, return mock data for testing
            if (!this.isProduction) {
                console.log('[FedEx] Sandbox: Error occurred, returning mock tracking data');
                return this.getMockTrackingData(trackingNumber);
            }

            return {
                success: false,
                error: error.response?.data?.errors?.[0]?.message || error.message,
                trackingNumber
            };
        }
    }

    // Handle tracking not found
    handleTrackingNotFound(trackingNumber, errorMessage) {
        if (!this.isProduction) {
            console.log('[FedEx] Sandbox: Tracking not found, returning mock data');
            return this.getMockTrackingData(trackingNumber);
        }

        return {
            success: false,
            error: errorMessage || 'Tracking information not found',
            trackingNumber
        };
    }

    // Handle Track API not authorized
    handleTrackingNotAuthorized(trackingNumber) {
        if (!this.isProduction) {
            console.log('[FedEx] Sandbox: Track API not authorized, returning mock data');
            console.log('[FedEx] TIP: Make sure you are using the "Bayshore Track" project credentials!');
            return this.getMockTrackingData(trackingNumber);
        }

        return {
            success: false,
            error: 'Track API not authorized. Please contact support.',
            trackingNumber
        };
    }

    // Parse FedEx tracking response
    parseTrackingResponse(trackResult, trackingNumber) {
        const latestStatus = trackResult.latestStatusDetail || {};
        const scanEvents = trackResult.scanEvents || [];

        const mappedOrderStatus = this.mapFedExStatusToOrderStatus(latestStatus.code);

        const currentStatus = {
            code: latestStatus.code,
            derivedCode: latestStatus.derivedCode,
            description: latestStatus.description || this.getStatusDescription(latestStatus.code),
            statusByLocale: latestStatus.statusByLocale,
            location: this.formatLocation(latestStatus.scanLocation),
            timestamp: latestStatus.date || new Date().toISOString(),
            ancillaryDetails: latestStatus.ancillaryDetails
        };

        const deliveryDetails = {
            actualDeliveryTimestamp: trackResult.actualDeliveryDetail?.actualDeliveryTimestamp,
            deliveryLocation: trackResult.actualDeliveryDetail?.deliveryLocationType,
            signedBy: trackResult.actualDeliveryDetail?.signedByName,
            deliveryAttempts: trackResult.numberOfDeliveryAttempts
        };

        const estimatedDelivery = trackResult.estimatedDeliveryTimeWindow ? {
            begins: trackResult.estimatedDeliveryTimeWindow.window?.begins,
            ends: trackResult.estimatedDeliveryTimeWindow.window?.ends,
            type: trackResult.estimatedDeliveryTimeWindow.type,
            description: trackResult.estimatedDeliveryTimeWindow.description
        } : null;

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

        const shipmentDetails = {
            serviceType: trackResult.serviceType,
            serviceDescription: trackResult.serviceDetail?.description,
            packaging: trackResult.packageDetails?.packagingDescription?.description,
            weight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0],
            dimensions: trackResult.packageDetails?.weightAndDimensions?.dimensions?.[0],
            specialHandling: trackResult.specialHandlings
        };

        const shipperInfo = trackResult.shipperInformation ? {
            name: trackResult.shipperInformation.contact?.companyName,
            city: trackResult.shipperInformation.address?.city,
            state: trackResult.shipperInformation.address?.stateOrProvinceCode,
            country: trackResult.shipperInformation.address?.countryCode
        } : null;

        const recipientInfo = trackResult.recipientInformation ? {
            name: trackResult.recipientInformation.contact?.companyName ||
                trackResult.recipientInformation.contact?.personName,
            city: trackResult.recipientInformation.address?.city,
            state: trackResult.recipientInformation.address?.stateOrProvinceCode,
            country: trackResult.recipientInformation.address?.countryCode
        } : null;

        return {
            success: true,
            trackingNumber,
            currentStatus,
            mappedOrderStatus,
            events,
            estimatedDelivery,
            deliveryDetails,
            shipmentDetails,
            shipperInfo,
            recipientInfo,
            isDelivered: mappedOrderStatus === 'delivered',
            isInTransit: ['shipped', 'out_for_delivery'].includes(mappedOrderStatus),
            hasException: latestStatus.code === 'DE' || events.some(e => e.exceptionCode),
            isMockData: false
        };
    }

    // Map FedEx status codes to order status
    mapFedExStatusToOrderStatus(fedexCode) {
        const statusMap = {
            'PU': 'shipped',
            'OC': 'shipped',
            'IT': 'shipped',
            'IX': 'shipped',
            'DP': 'shipped',
            'AR': 'shipped',
            'AD': 'shipped',
            'OF': 'shipped',
            'FD': 'shipped',
            'CC': 'shipped',
            'CD': 'shipped',
            'ED': 'shipped',
            'LO': 'shipped',
            'TR': 'shipped',
            'PL': 'shipped',
            'PX': 'shipped',
            'AF': 'shipped',
            'CP': 'shipped',
            'OD': 'out_for_delivery',
            'DL': 'delivered',
            'DE': 'shipped',
            'CA': 'cancelled',
            'RS': 'returned',
            'HL': 'shipped',
            'SE': 'shipped',
            'default': 'shipped'
        };

        return statusMap[fedexCode] || statusMap['default'];
    }

    // Get status description
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
        if (location.postalCode) parts.push(location.postalCode);
        if (location.countryCode && location.countryCode !== 'US') parts.push(location.countryCode);

        return parts.join(', ') || null;
    }

    // Mock tracking data for sandbox testing
    getMockTrackingData(trackingNumber) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const mockEvents = [
            {
                timestamp: now.toISOString(),
                eventType: 'OD',
                eventDescription: 'On FedEx vehicle for delivery',
                derivedStatus: 'Out for Delivery',
                location: { city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'US', formatted: 'Los Angeles, CA' }
            },
            {
                timestamp: yesterday.toISOString(),
                eventType: 'AR',
                eventDescription: 'Arrived at FedEx location',
                derivedStatus: 'In Transit',
                location: { city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'US', formatted: 'Los Angeles, CA' }
            },
            {
                timestamp: yesterday.toISOString(),
                eventType: 'DP',
                eventDescription: 'Departed FedEx location',
                derivedStatus: 'In Transit',
                location: { city: 'Memphis', state: 'TN', postalCode: '38118', country: 'US', formatted: 'Memphis, TN' }
            },
            {
                timestamp: twoDaysAgo.toISOString(),
                eventType: 'AR',
                eventDescription: 'Arrived at FedEx hub',
                derivedStatus: 'In Transit',
                location: { city: 'Memphis', state: 'TN', postalCode: '38118', country: 'US', formatted: 'Memphis, TN' }
            },
            {
                timestamp: threeDaysAgo.toISOString(),
                eventType: 'PU',
                eventDescription: 'Picked up',
                derivedStatus: 'Picked Up',
                location: { city: 'New York', state: 'NY', postalCode: '10001', country: 'US', formatted: 'New York, NY' }
            },
            {
                timestamp: threeDaysAgo.toISOString(),
                eventType: 'OC',
                eventDescription: 'Shipment information sent to FedEx',
                derivedStatus: 'Label Created',
                location: { city: 'New York', state: 'NY', postalCode: '10001', country: 'US', formatted: 'New York, NY' }
            }
        ];

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

    // Handle tracking not found (sandbox vs production)
    handleTrackingNotFound(trackingNumber, errorMessage) {
        if (!this.isProduction) {
            console.log('[FedEx] Sandbox: Tracking not found, returning mock data');
            return this.getMockTrackingData(trackingNumber);
        }

        return {
            success: false,
            error: errorMessage || 'Tracking information not found',
            trackingNumber
        };
    }

    // Handle Track API not authorized (403)
    handleTrackingNotAuthorized(trackingNumber) {
        if (!this.isProduction) {
            console.log('[FedEx] Sandbox: Track API not authorized, returning mock data');
            console.log('[FedEx] TIP: Enable Track API in FedEx Developer Portal for your project');
            return this.getMockTrackingData(trackingNumber);
        }

        return {
            success: false,
            error: 'Track API not authorized. Please contact support.',
            trackingNumber
        };
    }

    // Parse FedEx tracking response
    parseTrackingResponse(trackResult, trackingNumber) {
        const latestStatus = trackResult.latestStatusDetail || {};
        const scanEvents = trackResult.scanEvents || [];

        // Map FedEx status to order status
        const mappedOrderStatus = this.mapFedExStatusToOrderStatus(latestStatus.code);

        // Current status
        const currentStatus = {
            code: latestStatus.code,
            derivedCode: latestStatus.derivedCode,
            description: latestStatus.description || this.getStatusDescription(latestStatus.code),
            statusByLocale: latestStatus.statusByLocale,
            location: this.formatLocation(latestStatus.scanLocation),
            timestamp: latestStatus.date || new Date().toISOString(),
            ancillaryDetails: latestStatus.ancillaryDetails
        };

        // Delivery details
        const deliveryDetails = {
            actualDeliveryTimestamp: trackResult.actualDeliveryDetail?.actualDeliveryTimestamp,
            deliveryLocation: trackResult.actualDeliveryDetail?.deliveryLocationType,
            signedBy: trackResult.actualDeliveryDetail?.signedByName,
            deliveryAttempts: trackResult.numberOfDeliveryAttempts
        };

        // Estimated delivery
        const estimatedDelivery = trackResult.estimatedDeliveryTimeWindow ? {
            begins: trackResult.estimatedDeliveryTimeWindow.window?.begins,
            ends: trackResult.estimatedDeliveryTimeWindow.window?.ends,
            type: trackResult.estimatedDeliveryTimeWindow.type,
            description: trackResult.estimatedDeliveryTimeWindow.description
        } : null;

        // Parse scan events
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

        // Shipment details
        const shipmentDetails = {
            serviceType: trackResult.serviceType,
            serviceDescription: trackResult.serviceDetail?.description,
            packaging: trackResult.packageDetails?.packagingDescription?.description,
            weight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0],
            dimensions: trackResult.packageDetails?.weightAndDimensions?.dimensions?.[0],
            specialHandling: trackResult.specialHandlings
        };

        // Shipper info
        const shipperInfo = trackResult.shipperInformation ? {
            name: trackResult.shipperInformation.contact?.companyName,
            city: trackResult.shipperInformation.address?.city,
            state: trackResult.shipperInformation.address?.stateOrProvinceCode,
            country: trackResult.shipperInformation.address?.countryCode
        } : null;

        // Recipient info
        const recipientInfo = trackResult.recipientInformation ? {
            name: trackResult.recipientInformation.contact?.companyName ||
                trackResult.recipientInformation.contact?.personName,
            city: trackResult.recipientInformation.address?.city,
            state: trackResult.recipientInformation.address?.stateOrProvinceCode,
            country: trackResult.recipientInformation.address?.countryCode
        } : null;

        return {
            success: true,
            trackingNumber,
            currentStatus,
            mappedOrderStatus,
            events,
            estimatedDelivery,
            deliveryDetails,
            shipmentDetails,
            shipperInfo,
            recipientInfo,
            isDelivered: mappedOrderStatus === 'delivered',
            isInTransit: ['shipped', 'out_for_delivery'].includes(mappedOrderStatus),
            hasException: latestStatus.code === 'DE' || events.some(e => e.exceptionCode),
            isMockData: false
        };
    }

    // Map FedEx status codes to order status
    mapFedExStatusToOrderStatus(fedexCode) {
        const statusMap = {
            'PU': 'shipped',
            'OC': 'shipped',
            'IT': 'shipped',
            'IX': 'shipped',
            'DP': 'shipped',
            'AR': 'shipped',
            'AD': 'shipped',
            'OF': 'shipped',
            'FD': 'shipped',
            'CC': 'shipped',
            'CD': 'shipped',
            'ED': 'shipped',
            'LO': 'shipped',
            'TR': 'shipped',
            'PL': 'shipped',
            'PX': 'shipped',
            'AF': 'shipped',
            'CP': 'shipped',
            'OD': 'out_for_delivery',
            'DL': 'delivered',
            'DE': 'shipped',
            'CA': 'cancelled',
            'RS': 'returned',
            'HL': 'shipped',
            'SE': 'shipped',
            'default': 'shipped'
        };

        return statusMap[fedexCode] || statusMap['default'];
    }

    // Get status description
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
            'SE': 'Shipment exception',
            'CC': 'Customs clearance',
            'CD': 'Clearance delay',
            'ED': 'Enroute to delivery',
            'LO': 'Left origin',
            'TR': 'Transfer',
            'PL': 'Plane landed',
            'PX': 'Picked up',
            'AF': 'At FedEx facility',
            'CP': 'Clearance in progress'
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
        if (location.postalCode) parts.push(location.postalCode);
        if (location.countryCode && location.countryCode !== 'US') parts.push(location.countryCode);

        return parts.join(', ') || null;
    }

    // Mock tracking data for sandbox testing
    getMockTrackingData(trackingNumber) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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
            isMockData: true // Important flag!
        };
    }

    // Parse FedEx tracking response
    parseTrackingResponse(trackResult, trackingNumber) {
        const latestStatus = trackResult.latestStatusDetail || {};
        const scanEvents = trackResult.scanEvents || [];

        // Map FedEx status to order status
        const mappedOrderStatus = this.mapFedExStatusToOrderStatus(latestStatus.code);

        // Current status
        const currentStatus = {
            code: latestStatus.code,
            derivedCode: latestStatus.derivedCode,
            description: latestStatus.description || this.getStatusDescription(latestStatus.code),
            statusByLocale: latestStatus.statusByLocale,
            location: this.formatLocation(latestStatus.scanLocation),
            timestamp: latestStatus.date || new Date().toISOString(),
            ancillaryDetails: latestStatus.ancillaryDetails
        };

        // Delivery details
        const deliveryDetails = {
            actualDeliveryTimestamp: trackResult.actualDeliveryDetail?.actualDeliveryTimestamp,
            deliveryLocation: trackResult.actualDeliveryDetail?.deliveryLocationType,
            signedBy: trackResult.actualDeliveryDetail?.signedByName,
            deliveryAttempts: trackResult.numberOfDeliveryAttempts
        };

        // Estimated delivery
        const estimatedDelivery = trackResult.estimatedDeliveryTimeWindow ? {
            begins: trackResult.estimatedDeliveryTimeWindow.window?.begins,
            ends: trackResult.estimatedDeliveryTimeWindow.window?.ends,
            type: trackResult.estimatedDeliveryTimeWindow.type,
            description: trackResult.estimatedDeliveryTimeWindow.description
        } : null;

        // Parse scan events
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

        // Shipment details
        const shipmentDetails = {
            serviceType: trackResult.serviceType,
            serviceDescription: trackResult.serviceDetail?.description,
            packaging: trackResult.packageDetails?.packagingDescription?.description,
            weight: trackResult.packageDetails?.weightAndDimensions?.weight?.[0],
            dimensions: trackResult.packageDetails?.weightAndDimensions?.dimensions?.[0],
            specialHandling: trackResult.specialHandlings
        };

        // Shipper info
        const shipperInfo = trackResult.shipperInformation ? {
            name: trackResult.shipperInformation.contact?.companyName,
            city: trackResult.shipperInformation.address?.city,
            state: trackResult.shipperInformation.address?.stateOrProvinceCode,
            country: trackResult.shipperInformation.address?.countryCode
        } : null;

        // Recipient info
        const recipientInfo = trackResult.recipientInformation ? {
            name: trackResult.recipientInformation.contact?.companyName ||
                trackResult.recipientInformation.contact?.personName,
            city: trackResult.recipientInformation.address?.city,
            state: trackResult.recipientInformation.address?.stateOrProvinceCode,
            country: trackResult.recipientInformation.address?.countryCode
        } : null;

        return {
            success: true,
            trackingNumber,
            currentStatus,
            mappedOrderStatus,
            events,
            estimatedDelivery,
            deliveryDetails,
            shipmentDetails,
            shipperInfo,
            recipientInfo,
            isDelivered: mappedOrderStatus === 'delivered',
            isInTransit: ['shipped', 'out_for_delivery'].includes(mappedOrderStatus),
            hasException: latestStatus.code === 'DE' || events.some(e => e.exceptionCode),
            isMockData: false
        };
    }

    // Map FedEx status codes to order status
    mapFedExStatusToOrderStatus(fedexCode) {
        const statusMap = {
            // Picked up / In Transit
            'PU': 'shipped',
            'OC': 'shipped',
            'IT': 'shipped',
            'IX': 'shipped',
            'DP': 'shipped',
            'AR': 'shipped',
            'AD': 'shipped',
            'OF': 'shipped',
            'FD': 'shipped',
            'CC': 'shipped',
            'CD': 'shipped',
            'ED': 'shipped',
            'LO': 'shipped',
            'TR': 'shipped',
            'PL': 'shipped',
            'PX': 'shipped',
            'AF': 'shipped',
            'CP': 'shipped',

            // Out for Delivery
            'OD': 'out_for_delivery',

            // Delivered
            'DL': 'delivered',

            // Exceptions/Issues
            'DE': 'shipped',
            'CA': 'cancelled',
            'RS': 'returned',
            'HL': 'shipped',
            'SE': 'shipped',

            // Default
            'default': 'shipped'
        };

        return statusMap[fedexCode] || statusMap['default'];
    }

    // Get status description
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
            'SE': 'Shipment exception',
            'CC': 'Customs clearance',
            'CD': 'Clearance delay',
            'ED': 'Enroute to delivery',
            'LO': 'Left origin',
            'TR': 'Transfer',
            'PL': 'Plane landed',
            'PX': 'Picked up',
            'AF': 'At FedEx facility',
            'CP': 'Clearance in progress'
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
        if (location.postalCode) parts.push(location.postalCode);
        if (location.countryCode && location.countryCode !== 'US') parts.push(location.countryCode);

        return parts.join(', ') || null;
    }

    // Mock tracking data for sandbox testing
    getMockTrackingData(trackingNumber) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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


    // ===========================================
    // CREATE SHIPMENT
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

            // Validate recipient
            if (!recipient || !recipient.address || !recipient.contact) {
                return {
                    success: false,
                    error: 'Recipient information is required'
                };
            }

            // Get warehouse
            const warehouse = fedexConfig.getWarehouse(recipient.address.stateCode);

            // Build recipient street lines
            const recipientStreetLines = [];
            if (recipient.address.streetLine1) {
                recipientStreetLines.push(recipient.address.streetLine1.trim());
            }
            if (recipient.address.streetLine2) {
                const line2 = recipient.address.streetLine2.trim();
                if (line2) recipientStreetLines.push(line2);
            }
            if (recipientStreetLines.length === 0) {
                return {
                    success: false,
                    error: 'Recipient street address is required'
                };
            }

            // Clean phone number
            const cleanPhone = (recipient.contact.phoneNumber || '').replace(/\D/g, '').slice(0, 10);
            if (cleanPhone.length < 10) {
                return {
                    success: false,
                    error: 'Valid 10-digit phone number is required'
                };
            }

            // Build package line items
            const requestedPackageLineItems = packages.map((pkg, index) => {
                const packageItem = {
                    sequenceNumber: index + 1,
                    weight: {
                        value: Math.max(1, Math.min(150, pkg.weight?.value || pkg.weight || 5)),
                        units: pkg.weight?.units || 'LB'
                    },
                    dimensions: {
                        length: Math.max(1, Math.ceil(pkg.dimensions?.length || 12)),
                        width: Math.max(1, Math.ceil(pkg.dimensions?.width || 12)),
                        height: Math.max(1, Math.ceil(pkg.dimensions?.height || 6)),
                        units: 'IN'
                    },
                    customerReferences: [
                        {
                            customerReferenceType: 'INVOICE_NUMBER',
                            value: (orderNumber || `ORD${Date.now()}`).substring(0, 30)
                        }
                    ]
                };

                // Add declared value for insurance
                if (insuranceAmount && insuranceAmount > 0) {
                    packageItem.declaredValue = {
                        amount: Math.round(insuranceAmount * 100) / 100,
                        currency: 'USD'
                    };
                }

                return packageItem;
            });

            // FedEx Ship API v1 payload
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
                                personName: (recipient.contact.personName || 'Customer').substring(0, 35),
                                phoneNumber: cleanPhone,
                                emailAddress: recipient.contact.emailAddress,
                                companyName: (recipient.contact.companyName || '').substring(0, 35)
                            },
                            address: {
                                streetLines: recipientStreetLines,
                                city: (recipient.address.city || '').trim().substring(0, 35),
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
                    requestedPackageLineItems
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
                    rawResponse: this.isProduction ? undefined : shipment
                };
            }

            return {
                success: false,
                error: 'Failed to create shipment - no response from FedEx',
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
            if (!trackingNumber) {
                return {
                    success: false,
                    error: 'Tracking number is required'
                };
            }

            const payload = {
                accountNumber: {
                    value: this.config.accountNumber
                },
                trackingNumber: trackingNumber.toString().trim(),
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
                error: error.response?.data?.errors?.[0]?.message || error.message
            };
        }
    }

    // ===========================================
    // SCHEDULE PICKUP
    // ===========================================

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

            if (!location || !location.address) {
                return {
                    success: false,
                    error: 'Pickup location is required'
                };
            }

            // FedEx Pickup API payload
            const payload = {
                associatedAccountNumber: {
                    value: this.config.accountNumber
                },
                originDetail: {
                    pickupLocation: {
                        contact: {
                            personName: location.contact?.personName || 'Shipping Department',
                            phoneNumber: (location.contact?.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '0000000000',
                            companyName: location.contact?.companyName || 'Art Gallery'
                        },
                        address: {
                            streetLines: location.address.streetLines || [location.address.streetLine1],
                            city: location.address.city,
                            stateOrProvinceCode: location.address.stateOrProvinceCode || location.address.stateCode,
                            postalCode: location.address.postalCode || location.address.zipCode,
                            countryCode: location.address.countryCode || 'US'
                        }
                    },
                    readyDateTimestamp: `${pickupDate}T${readyTime}:00`,
                    customerCloseTime: closeTime,
                    pickupDateType: 'SAME_DAY'
                },
                packageDetails: {
                    packageCount: packageDetails?.packageCount || 1,
                    totalWeight: {
                        units: packageDetails?.totalWeight?.units || 'LB',
                        value: packageDetails?.totalWeight?.value || 5
                    }
                },
                carrierCode: 'FDXG',
                accountAddressOfRecord: {
                    streetLines: location.address.streetLines || [location.address.streetLine1],
                    city: location.address.city,
                    stateOrProvinceCode: location.address.stateOrProvinceCode || location.address.stateCode,
                    postalCode: location.address.postalCode || location.address.zipCode,
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
                error: error.response?.data?.errors?.[0]?.message || error.message
            };
        }
    }

    // ===========================================
    // LOCATION SEARCH
    // ===========================================

    async searchLocations(searchParams) {
        try {
            if (!searchParams.zipCode) {
                return {
                    success: false,
                    error: 'ZIP code is required',
                    locations: []
                };
            }

            // FedEx Location API v1 payload
            const payload = {
                locationsSummaryRequestControlParameters: {
                    maxResults: searchParams.limit || 10,
                    distance: {
                        value: searchParams.radius || 25,
                        units: 'MI'
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
                    'DOMESTIC_SHIPPING_SERVICES',
                    'DROP_BOX',
                    'INTERNATIONAL_SHIPPING_SERVICES',
                    'PACKAGING_SUPPLIES',
                    'PACK_AND_SHIP',
                    'RETURNS_SERVICES'
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

            return {
                success: false,
                error: error.response?.data?.errors?.[0]?.message || error.message,
                locations: []
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

    async testConnection() {
        try {
            const configValidation = fedexConfig.validateConfig();

            if (!configValidation.isValid) {
                return {
                    success: false,
                    message: 'Configuration errors',
                    errors: configValidation.errors,
                    warnings: configValidation.warnings,
                    environment: fedexConfig.environment,
                    isProduction: this.isProduction
                };
            }

            // Test authentication
            await this.getAccessToken();

            return {
                success: true,
                message: 'FedEx API connection successful',
                environment: fedexConfig.environment,
                isProduction: this.isProduction,
                baseUrl: this.baseURL,
                warnings: configValidation.warnings
            };
        } catch (error) {
            return {
                success: false,
                message: 'FedEx API connection failed',
                error: error.message,
                environment: fedexConfig.environment,
                isProduction: this.isProduction
            };
        }
    }
}

// Export singleton instance
export default new FedExService();
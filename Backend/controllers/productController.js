// controllers/productController.js
import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";
import PriceInquiry from "../models/priceInquiryModel.js";
import { sendEmail } from "../utils/sendEmail.js";

// ============================================
// Helper Functions
// ============================================

const parseJSON = (value, defaultValue = {}) => {
  if (!value) return defaultValue;
  if (typeof value === 'object') return value;
  
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim().toLowerCase());
  
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(t => t.trim().toLowerCase()) : [];
  } catch {
    return tags.split(',').map(t => t.trim().toLowerCase());
  }
};

const parseBoolean = (value, defaultVal = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultVal;
};

const parseNumber = (value, defaultVal = 0) => {
  if (value === null || value === undefined || value === '') return defaultVal;
  const num = parseFloat(value);
  return isNaN(num) ? defaultVal : num;
};

const deleteCloudinaryImages = async (images) => {
  if (!images?.length) return;
  
  try {
    await Promise.all(
      images.map(url => {
        const publicId = url.split('/').pop().split('.')[0];
        return cloudinary.uploader.destroy(`mern_art/products/${publicId}`);
      })
    );
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Parse dimensions (US default: inches)
const parseDimensions = (dimensions) => {
  const d = parseJSON(dimensions, {});
  return {
    height: parseNumber(d.height, 1),
    width: parseNumber(d.width, 1),
    depth: parseNumber(d.depth, 0),
    unit: d.unit || 'in' // US default
  };
};

// Parse weight (US default: lbs)
const parseWeight = (weight) => {
  const w = parseJSON(weight, {});
  return {
    value: parseNumber(w.value, 1),
    unit: w.unit || 'lb' // US default
  };
};

// Parse package dimensions (US default: inches)
const parsePackageDimensions = (dims) => {
  const d = parseJSON(dims, {});
  return {
    length: parseNumber(d.length, 1),
    width: parseNumber(d.width, 1),
    height: parseNumber(d.height, 1),
    unit: d.unit || 'in' // US default
  };
};

// Parse shipping object
const parseShipping = (shipping, weight, packageDimensions, existingShipping = {}) => {
  if (shipping) {
    const s = parseJSON(shipping, {});
    return {
      weight: s.weight ? parseWeight(s.weight) : parseWeight(weight),
      packageDimensions: s.packageDimensions ? parsePackageDimensions(s.packageDimensions) : parsePackageDimensions(packageDimensions),
      isFragile: parseBoolean(s.isFragile, true),
      requiresSignature: parseBoolean(s.requiresSignature, true),
      insuranceRequired: parseBoolean(s.insuranceRequired, true),
      packagingType: s.packagingType || 'box',
      specialHandling: s.specialHandling || '',
      freeShipping: parseBoolean(s.freeShipping, false),
      freeShippingMinAmount: parseNumber(s.freeShippingMinAmount, 0),
      shippingClass: s.shippingClass || 'standard',
      originZipCode: s.originZipCode || ''
    };
  }
  
  return {
    weight: weight ? parseWeight(weight) : (existingShipping.weight || { value: 1, unit: 'lb' }),
    packageDimensions: packageDimensions ? parsePackageDimensions(packageDimensions) : (existingShipping.packageDimensions || { length: 1, width: 1, height: 1, unit: 'in' }),
    isFragile: existingShipping.isFragile ?? true,
    requiresSignature: existingShipping.requiresSignature ?? true,
    insuranceRequired: existingShipping.insuranceRequired ?? true,
    packagingType: existingShipping.packagingType || 'box',
    specialHandling: existingShipping.specialHandling || '',
    freeShipping: existingShipping.freeShipping ?? false,
    freeShippingMinAmount: existingShipping.freeShippingMinAmount || 0,
    shippingClass: existingShipping.shippingClass || 'standard',
    originZipCode: existingShipping.originZipCode || ''
  };
};

/**
 * Parse offer object
 */
const parseOffer = (offer) => {
  const parsed = parseJSON(offer, {});
  return {
    isActive: parseBoolean(parsed.isActive, false),
    discountPercentage: parseNumber(parsed.discountPercentage, 0),
    validFrom: parsed.validFrom ? new Date(parsed.validFrom) : null,
    validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null
  };
};

/**
 * Parse SEO object
 */
const parseSEO = (seo, metaTitle, metaDescription) => {
  const parsed = parseJSON(seo, {});
  return {
    metaTitle: parsed.metaTitle || metaTitle || '',
    metaDescription: parsed.metaDescription || metaDescription || '',
    metaKeywords: parsed.metaKeywords || []
  };
};

// ============================================
// CRUD Operations
// ============================================

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      mrpPrice,
      discountPrice,
      stock,
      category,
      author,
      dimensions,
      medium,
      style,
      subject,
      yearCreated,
      isOriginal,
      isFramed,
      frameDetails,
      certificateOfAuthenticity,
      metaTitle,
      metaDescription,
      seo,
      tags,
      featured,
      offer,
      askForPrice,
      // Shipping
      shipping,
      weight,
      packageDimensions,
      isFragile,
      requiresSignature,
      packagingType,
      specialHandling,
      freeShipping,
      shippingClass
    } = req.body;

    // Validate images
    if (!req.files?.length) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    if (req.files.length > 5) {
      await deleteCloudinaryImages(req.files.map(f => f.path));
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images allowed"
      });
    }

    const isAskForPrice = parseBoolean(askForPrice);

    // Build shipping object
    let shippingData;
    if (shipping) {
      shippingData = parseShipping(shipping);
    } else {
      shippingData = {
        weight: parseWeight(weight),
        packageDimensions: parsePackageDimensions(packageDimensions),
        isFragile: parseBoolean(isFragile, true),
        requiresSignature: parseBoolean(requiresSignature, true),
        insuranceRequired: true,
        packagingType: packagingType || 'box',
        specialHandling: specialHandling || '',
        freeShipping: parseBoolean(freeShipping, false),
        shippingClass: shippingClass || 'standard',
        originZipCode: ''
      };
    }

    // Build product data
    const productData = {
      name,
      description,
      shortDescription,
      stock: parseNumber(stock, 1),
      images: req.files.map(f => f.path),
      category,
      author,
      dimensions: parseDimensions(dimensions),
      medium,
      style,
      subject,
      yearCreated: yearCreated ? parseInt(yearCreated) : undefined,
      isOriginal: parseBoolean(isOriginal, true),
      isFramed: parseBoolean(isFramed, false),
      frameDetails,
      certificateOfAuthenticity: parseBoolean(certificateOfAuthenticity, false),
      seo: {
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        ...parseJSON(seo, {})
      },
      tags: parseTags(tags),
      featured: parseBoolean(featured),
      askForPrice: isAskForPrice,
      offer: parseJSON(offer, {}),
      shipping: shippingData
    };

    // Handle pricing
    if (isAskForPrice) {
      productData.mrpPrice = 0;
      productData.discountPrice = undefined;
    } else {
      const price = parseNumber(mrpPrice);
      if (price <= 0) {
        await deleteCloudinaryImages(req.files.map(f => f.path));
        return res.status(400).json({
          success: false,
          message: "Valid price is required"
        });
      }
      productData.mrpPrice = price;
      
      const discount = parseNumber(discountPrice);
      if (discount > 0 && discount < price) {
        productData.discountPrice = discount;
      }
    }

    const product = await Product.create(productData);
    
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'author', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (error) {
    console.error("Create product error:", error);

    if (req.files) {
      await deleteCloudinaryImages(req.files.map(f => f.path));
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// UPDATE PRODUCT
// ============================================

export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      mrpPrice,
      discountPrice,
      stock,
      category,
      author,
      dimensions,
      medium,
      style,
      subject,
      yearCreated,
      isOriginal,
      isFramed,
      frameDetails,
      certificateOfAuthenticity,
      metaTitle,
      metaDescription,
      seo,
      tags,
      featured,
      active,
      offer,
      askForPrice,
      shipping,
      weight,
      packageDimensions
    } = req.body;

    let product = await Product.findById(req.params.id);
    
    if (!product) {
      if (req.files) await deleteCloudinaryImages(req.files.map(f => f.path));
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const isAskForPrice = parseBoolean(askForPrice);

    const updateData = {
      name,
      description,
      shortDescription,
      stock: parseNumber(stock, product.stock),
      category,
      author,
      dimensions: dimensions ? parseDimensions(dimensions) : product.dimensions,
      medium,
      style,
      subject,
      yearCreated: yearCreated ? parseInt(yearCreated) : product.yearCreated,
      isOriginal: isOriginal !== undefined ? parseBoolean(isOriginal) : product.isOriginal,
      isFramed: isFramed !== undefined ? parseBoolean(isFramed) : product.isFramed,
      frameDetails: frameDetails !== undefined ? frameDetails : product.frameDetails,
      certificateOfAuthenticity: certificateOfAuthenticity !== undefined ? parseBoolean(certificateOfAuthenticity) : product.certificateOfAuthenticity,
      seo: seo || metaTitle || metaDescription ? {
        metaTitle: metaTitle || product.seo?.metaTitle || '',
        metaDescription: metaDescription || product.seo?.metaDescription || '',
        ...parseJSON(seo, {})
      } : product.seo,
      tags: tags ? parseTags(tags) : product.tags,
      featured: featured !== undefined ? parseBoolean(featured) : product.featured,
      active: active !== undefined ? parseBoolean(active) : product.active,
      askForPrice: isAskForPrice,
      offer: offer ? parseJSON(offer) : product.offer,
      shipping: parseShipping(shipping, weight, packageDimensions, product.shipping)
    };

    // Handle pricing
    if (isAskForPrice) {
      updateData.mrpPrice = 0;
      updateData.discountPrice = undefined;
      updateData.offer = { isActive: false, discountPercentage: 0 };
    } else {
      const price = parseNumber(mrpPrice, product.mrpPrice);
      if (price <= 0) {
        if (req.files) await deleteCloudinaryImages(req.files.map(f => f.path));
        return res.status(400).json({
          success: false,
          message: "Valid price is required"
        });
      }
      updateData.mrpPrice = price;

      if (discountPrice !== undefined && discountPrice !== '' && discountPrice !== null) {
        const discount = parseNumber(discountPrice);
        if (discount > 0 && discount < price) {
          updateData.discountPrice = discount;
        }
      } else if (discountPrice === '' || discountPrice === null) {
        updateData.discountPrice = undefined;
      }
    }

    // Handle images
    if (req.files?.length) {
      await deleteCloudinaryImages(product.images);
      updateData.images = req.files.map(f => f.path);
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('author', 'name');

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {
    console.error("Update product error:", error);

    if (req.files) await deleteCloudinaryImages(req.files.map(f => f.path));

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET ALL PRODUCTS
// ============================================

export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      author,
      featured,
      minPrice,
      maxPrice,
      search,
      tags,
      onSale,
      inStock,
      freeShipping,
      sortBy = "createdAt_desc",
      page = 1,
      limit = 12
    } = req.query;

    const filter = { active: true };

    // Category filter
    if (category) {
      const cats = category.split(',').map(c => c.trim());
      filter.category = cats.length > 1 ? { $in: cats } : cats[0];
    }

    // Author filter
    if (author) {
      const authors = author.split(',').map(a => a.trim());
      filter.author = authors.length > 1 ? { $in: authors } : authors[0];
    }

    // Boolean filters
    if (featured === 'true') filter.featured = true;
    if (freeShipping === 'true') filter['shipping.freeShipping'] = true;

    // Stock filter
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (inStock === 'false') filter.stock = 0;

    // Sale filter
    if (onSale === 'true') {
      filter['offer.isActive'] = true;
      filter.discountPrice = { $exists: true, $ne: null, $gt: 0 };
    }

    // Price filter
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      filter.$or = [
        { discountPrice: priceFilter },
        { mrpPrice: priceFilter }
      ];
    }

    // Search
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } },
        { medium: regex }
      ];
    }

    // Tags
    if (tags) {
      const tagArr = tags.split(',').map(t => new RegExp(t.trim(), 'i'));
      filter.tags = { $in: tagArr };
    }

    // Sort
    const sortOptions = {};
    switch (sortBy) {
      case 'price_asc': sortOptions.mrpPrice = 1; break;
      case 'price_desc': sortOptions.mrpPrice = -1; break;
      case 'name_asc': sortOptions.name = 1; break;
      case 'name_desc': sortOptions.name = -1; break;
      case 'createdAt_asc': sortOptions.createdAt = 1; break;
      case 'popular': sortOptions.soldCount = -1; break;
      default: sortOptions.createdAt = -1;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .populate('author', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: products
    });

  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET PRODUCT BY SLUG
// ============================================

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      active: true
    })
      .populate('category', 'name description')
      .populate('author', 'name bio profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET PRODUCT BY ID
// ============================================

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('author', 'name bio profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// DELETE PRODUCT
// ============================================

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await deleteCloudinaryImages(product.images);
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET FEATURED PRODUCTS
// ============================================

export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      featured: true,
      active: true
    })
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET PRODUCTS ON SALE
// ============================================

export const getProductsOnSale = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const products = await Product.find({
      'offer.isActive': true,
      active: true,
      discountPrice: { $exists: true, $ne: null, $gt: 0 }
    })
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ 'offer.discountPercentage': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET PRODUCTS BY TAG
// ============================================

export const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const filter = {
      tags: { $in: [new RegExp(tag, 'i')] },
      active: true
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET PRODUCT SHIPPING INFO (for FedEx)
// ============================================

export const getProductShippingInfo = async (req, res) => {
  try {
    const { quantity = 1 } = req.query;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const qty = parseInt(quantity);
    const fedexData = product.getFedExShippingData(qty);

    res.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        
        // Raw shipping data
        shipping: {
          weight: product.shipping.weight,
          packageDimensions: product.shipping.packageDimensions,
          isFragile: product.shipping.isFragile,
          requiresSignature: product.shipping.requiresSignature,
          packagingType: product.shipping.packagingType,
          freeShipping: product.shipping.freeShipping,
          shippingClass: product.shipping.shippingClass
        },
        
        // Calculated values
        weightInLbs: product.weightInLbs,
        dimensionalWeight: product.dimensionalWeight,
        billableWeight: product.billableWeight,
        
        // FedEx-ready data
        fedex: fedexData,
        
        // Price for insurance
        declaredValue: {
          amount: product.currentPrice || product.mrpPrice,
          currency: 'USD'
        }
      }
    });

  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET BULK SHIPPING INFO (for cart)
// ============================================

export const getBulkShippingInfo = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]

    if (!items?.length) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let totalWeightLbs = 0;
    let totalDimWeight = 0;
    let totalValue = 0;
    let hasFragile = false;
    let allFreeShipping = true;

    const itemsInfo = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const qty = item.quantity || 1;
      
      totalWeightLbs += product.weightInLbs * qty;
      totalDimWeight += product.dimensionalWeight.value * qty;
      totalValue += (product.currentPrice || product.mrpPrice) * qty;
      
      if (product.shipping?.isFragile) hasFragile = true;
      if (!product.shipping?.freeShipping) allFreeShipping = false;

      itemsInfo.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        weight: product.weightInLbs * qty,
        fedexData: product.getFedExShippingData(qty)
      });
    }

    const totalBillable = Math.max(totalWeightLbs, totalDimWeight);

    res.json({
      success: true,
      data: {
        items: itemsInfo,
        totals: {
          itemCount: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
          actualWeight: {
            value: Math.ceil(totalWeightLbs * 100) / 100,
            unit: 'lb'
          },
          dimensionalWeight: {
            value: Math.ceil(totalDimWeight * 100) / 100,
            unit: 'lb'
          },
          billableWeight: {
            value: Math.ceil(totalBillable * 100) / 100,
            unit: 'lb',
            isDimensional: totalDimWeight > totalWeightLbs
          },
          declaredValue: {
            amount: totalValue,
            currency: 'USD'
          }
        },
        hasFragileItems: hasFragile,
        allFreeShipping,
        requiresSignature: true // High-value items
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// UPDATE PRODUCT STOCK
// ============================================

export const updateProductStock = async (req, res) => {
  try {
    const { quantity, operation = 'decrease' } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await product.updateStock(quantity, operation);

    res.json({
      success: true,
      message: `Stock ${operation}d successfully`,
      data: {
        productId: product._id,
        sku: product.sku,
        newStock: product.stock,
        soldCount: product.soldCount
      }
    });

  } catch (error) {
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET LOW STOCK PRODUCTS
// ============================================

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findLowStock()
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// GET OUT OF STOCK PRODUCTS
// ============================================

export const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.findOutOfStock()
      .populate('category', 'name')
      .populate('author', 'name');

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get new arrival products
 * @route   GET /api/v1/products/new-arrivals
 * @access  Public
 */
export const getNewArrivals = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({
      isNewArrival: true,
      active: true
    })
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error("Get new arrivals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching new arrivals",
      error: error.message
    });
  }
};

/**
 * @desc    Get bestseller products
 * @route   GET /api/v1/products/bestsellers
 * @access  Public
 */
export const getBestsellers = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({
      active: true
    })
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ soldCount: -1, viewCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error("Get bestsellers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bestsellers",
      error: error.message
    });
  }
};


// =============================================================================================================

// ============================================
// PRICE INQUIRY - SUBMIT
// ============================================

export const submitPriceInquiry = async (req, res) => {
  try {
    const { fullName, email, phone, message, budget, purpose } = req.body;

    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('author', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!product.askForPrice) {
      return res.status(400).json({
        success: false,
        message: "Price inquiry not available for this product"
      });
    }

    const inquiry = await PriceInquiry.create({
      product: req.params.id,
      fullName,
      email,
      phone,
      message,
      budget,
      purpose
    });

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .section { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Price Inquiry</h2>
            </div>
            <div class="content">
              <div class="section">
                <h3>Customer Details</h3>
                <p><span class="label">Name:</span> ${fullName}</p>
                <p><span class="label">Email:</span> ${email}</p>
                <p><span class="label">Phone:</span> ${phone}</p>
                <p><span class="label">Budget:</span> ${budget || 'Not specified'}</p>
                <p><span class="label">Purpose:</span> ${purpose}</p>
                ${message ? `<p><span class="label">Message:</span> ${message}</p>` : ''}
              </div>
              <div class="section">
                <h3>Product Details</h3>
                <p><span class="label">Name:</span> ${product.name}</p>
                <p><span class="label">SKU:</span> ${product.sku}</p>
                <p><span class="label">Artist:</span> ${product.author.name}</p>
                <p><span class="label">Category:</span> ${product.category.name}</p>
                <p><span class="label">Dimensions:</span> ${product.formattedDimensions}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(adminEmail, `Price Inquiry - ${product.name}`, emailHtml);
    }

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully. We'll contact you soon!",
      data: { inquiryId: inquiry._id }
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// PRICE INQUIRY - GET ALL (Admin)
// ============================================

export const getPriceInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const [inquiries, total] = await Promise.all([
      PriceInquiry.find(filter)
        .populate('product', 'name images slug sku')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      PriceInquiry.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: inquiries.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: inquiries
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ============================================
// PRICE INQUIRY - UPDATE (Admin)
// ============================================

export const updatePriceInquiry = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const inquiry = await PriceInquiry.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true, runValidators: true }
    ).populate('product', 'name images slug sku');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found"
      });
    }

    res.json({
      success: true,
      message: "Inquiry updated",
      data: inquiry
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export default {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductBySlug,
  getProductById,
  deleteProduct,
  getFeaturedProducts,
  getProductsOnSale,
  getNewArrivals,
  getBestsellers,
  getProductsByTag,
  getProductShippingInfo,
  getBulkShippingInfo,
  updateProductStock,
  getLowStockProducts,
  getOutOfStockProducts,
  submitPriceInquiry,
  getPriceInquiries,
  updatePriceInquiry
};
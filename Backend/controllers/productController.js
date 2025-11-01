import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      mrpPrice,
      discountPrice,
      stock,
      category,
      author,
      dimensions,
      medium,
      metaTitle,
      metaDescription,
      tags,
      featured,
      offer,
    } = req.body;

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Maximum 5 images allowed
    if (req.files.length > 5) {
      // Delete uploaded images if more than 5
      await Promise.all(
        req.files.map((file) => cloudinary.uploader.destroy(file.filename))
      );
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images allowed per product",
      });
    }

    // Parse dimensions if it's a string
    let parsedDimensions = dimensions;
    if (typeof dimensions === "string") {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid dimensions format",
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(",").map((tag) => tag.trim().toLowerCase());
      }
    }

    // Parse offer if it's a string
    let parsedOffer = offer;
    if (typeof offer === "string") {
      try {
        parsedOffer = JSON.parse(offer);
      } catch (error) {
        parsedOffer = {};
      }
    }

    // Get image URLs from uploaded files
    const imageUrls = req.files.map((file) => file.path);

    // Create product
    const product = await Product.create({
      name,
      description,
      mrpPrice: parseFloat(mrpPrice),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      stock: parseInt(stock),
      images: imageUrls,
      category,
      author,
      dimensions: parsedDimensions,
      medium,
      metaTitle,
      metaDescription,
      tags: parsedTags,
      featured: featured === "true",
      offer: parsedOffer,
    });

    // Populate category and author details
    await product.populate("category", "name");
    await product.populate("author", "name");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    // Delete uploaded images from Cloudinary if product creation fails
    if (req.files) {
      try {
        await Promise.all(
          req.files.map((file) => cloudinary.uploader.destroy(file.filename))
        );
      } catch (cloudinaryError) {
        console.error(
          "Error deleting images from Cloudinary:",
          cloudinaryError
        );
      }
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating product",
      error: error.message,
    });
  }
};

// @desc    Get all products with filtering and sorting
// @route   GET /api/v1/products
// @access  Public
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
      sortBy = "createdAt_desc",
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    const filter = { active: true };

    // Handle category filter - support multiple categories
    if (category) {
      if (typeof category === "string" && category.includes(",")) {
        // Multiple categories provided as comma-separated string
        const categoryArray = category.split(",").map((cat) => cat.trim());
        filter.category = { $in: categoryArray };
      } else {
        // Single category
        filter.category = category;
      }
    }

    // Handle author filter - support multiple authors
    if (author) {
      if (typeof author === "string" && author.includes(",")) {
        // Multiple authors provided as comma-separated string
        const authorArray = author.split(",").map((auth) => auth.trim());
        filter.author = { $in: authorArray };
      } else {
        // Single author
        filter.author = author;
      }
    }

    if (featured) {
      filter.featured = featured === "true";
    }

    if (onSale === "true") {
      filter["offer.isActive"] = true;
      filter.discountPrice = { $exists: true, $ne: null };
    }

    // Price range filter - fix the field name
    if (minPrice || maxPrice) {
      // Use mrpPrice or discountPrice based on what's available
      filter.$or = [
        {
          $and: [
            { discountPrice: { $exists: true, $ne: null } },
            { discountPrice: {} },
          ],
        },
        { mrpPrice: {} },
      ];

      // Price range filter - improved version
      if (minPrice || maxPrice) {

        const priceFilter = {};

        if (minPrice) {
          priceFilter.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          priceFilter.$lte = parseFloat(maxPrice);
        }

        // Check both mrpPrice and discountPrice
        filter.$or = [
          { discountPrice: priceFilter },
          { mrpPrice: priceFilter },
        ];
      }
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $in: tagArray.map((tag) => new RegExp(tag, "i")) };
    }

    // Sort options - fix price sorting
    const sortOptions = {};
    switch (sortBy) {
      case "price_asc":
        // Sort by discount price if available, otherwise by mrpPrice
        sortOptions.discountPrice = 1;
        sortOptions.mrpPrice = 1;
        break;
      case "price_desc":
        sortOptions.discountPrice = -1;
        sortOptions.mrpPrice = -1;
        break;
      case "name_asc":
        sortOptions.name = 1;
        break;
      case "name_desc":
        sortOptions.name = -1;
        break;
      case "discount_desc":
        // Calculate discount percentage for sorting
        // This might need a virtual field or aggregation
        sortOptions.discountPrice = -1;
        break;
      case "createdAt_asc":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("author", "name bio profileImage")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages,
      currentPage: pageNum,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: error.message,
    });
  }
};

// @desc    Get single product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      active: true,
    })
      .populate("category", "name description")
      .populate("author", "name bio profileImage");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      mrpPrice,
      discountPrice,
      stock,
      category,
      author,
      dimensions,
      medium,
      metaTitle,
      metaDescription,
      tags,
      featured,
      active,
      offer,
    } = req.body;

    // Find existing product
    let product = await Product.findById(req.params.id);
    if (!product) {
      // Delete newly uploaded images if product not found
      if (req.files) {
        await Promise.all(
          req.files.map((file) => cloudinary.uploader.destroy(file.filename))
        );
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Parse dimensions if it's a string
    let parsedDimensions = dimensions;
    if (typeof dimensions === "string") {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid dimensions format",
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(",").map((tag) => tag.trim().toLowerCase());
      }
    }

    // Parse offer if it's a string
    let parsedOffer = offer;
    if (typeof offer === "string") {
      try {
        parsedOffer = JSON.parse(offer);
      } catch (error) {
        parsedOffer = product.offer;
      }
    }

    // Prepare update data
    const updateData = {
      name,
      description,
      mrpPrice: parseFloat(mrpPrice),
      stock: parseInt(stock),
      category,
      author,
      dimensions: parsedDimensions,
      medium,
      metaTitle,
      metaDescription,
      tags: parsedTags,
      featured: featured === "true",
      active: active === "true",
      offer: parsedOffer,
    };

    // Handle discountPrice carefully - only include if provided
    if (discountPrice && discountPrice !== '' && !isNaN(discountPrice)) {
      updateData.discountPrice = parseFloat(discountPrice);
    } else if (discountPrice === '' || discountPrice === null) {
      // Explicitly set to undefined to remove the field from update
      updateData.discountPrice = undefined;
    }

    // If new images are uploaded, update images array and delete old ones from Cloudinary
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        try {
          await Promise.all(
            product.images.map((imageUrl) => {
              const publicId = imageUrl.split("/").pop().split(".")[0];
              return cloudinary.uploader.destroy(
                `mern_art/products/${publicId}`
              );
            })
          );
        } catch (cloudinaryError) {
          console.error(
            "Error deleting old images from Cloudinary:",
            cloudinaryError
          );
        }
      }

      // Add new images
      const newImageUrls = req.files.map((file) => file.path);
      updateData.images = newImageUrls;
    }

    // Update product using findByIdAndUpdate
    product = await Product.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, // Use $set to update only provided fields
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("category", "name")
      .populate("author", "name");

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    // Delete newly uploaded images if update fails
    if (req.files) {
      try {
        await Promise.all(
          req.files.map((file) => cloudinary.uploader.destroy(file.filename))
        );
      } catch (cloudinaryError) {
        console.error(
          "Error deleting images from Cloudinary:",
          cloudinaryError
        );
      }
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating product",
      error: error.message,
    });
  }
};

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      featured: true,
      active: true,
    })
      .populate("category", "name")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching featured products",
      error: error.message,
    });
  }
};

// @desc    Get products on sale
// @route   GET /api/v1/products/on-sale
// @access  Public
export const getProductsOnSale = async (req, res) => {
  try {
    const products = await Product.find({
      "offer.isActive": true,
      active: true,
    })
      .populate("category", "name")
      .populate("author", "name")
      .sort({ "offer.discountPercentage": -1 })
      .limit(12);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products on sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products on sale",
      error: error.message,
    });
  }
};

// @desc    Get products by tags
// @route   GET /api/v1/products/tags/:tag
// @access  Public
export const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const products = await Product.find({
      tags: { $in: [new RegExp(tag, "i")] },
      active: true,
    })
      .populate("category", "name")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({
      tags: { $in: [new RegExp(tag, "i")] },
      active: true,
    });

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    console.error("Get products by tag error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products by tag",
      error: error.message,
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name description")
      .populate("author", "name bio profileImage");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete image from Cloudinary
    if (product.image) {
      try {
        const publicId = product.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`mern_art/products/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
      error: error.message,
    });
  }
};

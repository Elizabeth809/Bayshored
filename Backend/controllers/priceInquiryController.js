import PriceInquiry from "../models/priceInquiryModel.js";
import Product from "../models/productModel.js";
import { sendEmail } from "../utils/sendEmail.js";

// @desc    Get all price inquiries with filters
// @route   GET /api/v1/price-inquiries
// @access  Private/Admin
export const getPriceInquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt_desc',
      dateFrom,
      dateTo
    } = req.query;

    // Build filter object
    const filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'createdAt_asc':
        sortOptions.createdAt = 1;
        break;
      case 'createdAt_desc':
        sortOptions.createdAt = -1;
        break;
      case 'name_asc':
        sortOptions.fullName = 1;
        break;
      case 'name_desc':
        sortOptions.fullName = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const inquiries = await PriceInquiry.find(filter)
      .populate("product", "name images slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await PriceInquiry.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Get status counts for filters
    const statusCounts = await PriceInquiry.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      pending: 0,
      contacted: 0,
      resolved: 0,
      total: total
    };

    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      success: true,
      count: inquiries.length,
      total,
      totalPages,
      currentPage: pageNum,
      statusStats,
      data: inquiries,
    });
  } catch (error) {
    console.error("Get price inquiries error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching price inquiries",
      error: error.message,
    });
  }
};

// @desc    Get single price inquiry
// @route   GET /api/v1/price-inquiries/:id
// @access  Private/Admin
export const getPriceInquiry = async (req, res) => {
  try {
    const inquiry = await PriceInquiry.findById(req.params.id)
      .populate("product", "name images slug author dimensions medium")
      .populate("product.author", "name");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Get price inquiry error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching price inquiry",
      error: error.message,
    });
  }
};

// @desc    Update price inquiry status
// @route   PUT /api/v1/price-inquiries/:id
// @access  Private/Admin
export const updatePriceInquiry = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const inquiry = await PriceInquiry.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("product", "name images slug");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Price inquiry updated successfully",
      data: inquiry,
    });
  } catch (error) {
    console.error("Update price inquiry error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating price inquiry",
      error: error.message,
    });
  }
};

// @desc    Delete price inquiry
// @route   DELETE /api/v1/price-inquiries/:id
// @access  Private/Admin
export const deletePriceInquiry = async (req, res) => {
  try {
    const inquiry = await PriceInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    await PriceInquiry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Price inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Delete price inquiry error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting price inquiry",
      error: error.message,
    });
  }
};

// @desc    Send response to customer
// @route   POST /api/v1/price-inquiries/:id/respond
// @access  Private/Admin
export const respondToInquiry = async (req, res) => {
  try {
    const { subject, message } = req.body;

    const inquiry = await PriceInquiry.findById(req.params.id)
      .populate("product", "name");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Price inquiry not found",
      });
    }

    // Send email to customer
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .response { background: #fff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MERN Art Gallery</h1>
            <p>Response to Your Price Inquiry</p>
          </div>
          <div class="content">
            <h2>Hello ${inquiry.fullName},</h2>
            
            <div class="response">
              <h3>Re: ${inquiry.product.name}</h3>
              <p>${message}</p>
            </div>
            
            <p>If you have any further questions, please don't hesitate to contact us.</p>
            
            <div class="footer">
              <p>MERN Art Gallery<br>123 Art Street, Creative District<br>Email: ${process.env.ADMIN_EMAIL || 'admin@mernart.com'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(inquiry.email, subject, emailHtml);

    // Update inquiry status to contacted
    inquiry.status = 'contacted';
    await inquiry.save();

    res.json({
      success: true,
      message: "Response sent successfully",
    });
  } catch (error) {
    console.error("Respond to inquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending response",
      error: error.message,
    });
  }
};
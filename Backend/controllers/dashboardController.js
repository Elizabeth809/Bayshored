import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Author from "../models/authorModel.js";
import Coupon from "../models/couponModel.js";
import Subscriber from "../models/subscriberModel.js";

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Current date and date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // --- 💡 FIX 1: Filter object for $match (queries) ---
    const successfulOrderFilter = {
      $or: [
        { paymentStatus: "paid" },
        { 
          $and: [
            { paymentMethod: "COD" },
            { orderStatus: { $ne: "cancelled" } }
          ]
        }
      ]
    };

    // --- 💡 FIX 2: Expression for $cond (aggregations) ---
    const successfulOrderCond = {
      $or: [
        { $eq: ["$paymentStatus", "paid"] },
        { 
          $and: [
            { $eq: ["$paymentMethod", "COD"] },
            { $ne: ["$orderStatus", "cancelled"] }
          ]
        }
      ]
    };

    // Execute all aggregations in parallel
    const [
      totalStats,
      monthlySales,
      recentOrders,
      recentSubscribers,
      topProducts,
      userRegistrations,
      couponStats,
      subscriberStats,
    ] = await Promise.all([
      // Total Statistics
      Promise.all([
        Order.aggregate([
          {
            $group: {
              _id: null,
              // Total Revenue
              totalRevenue: {
                // --- 💡 FIX 3: Use the correct 'cond' variable ---
                $sum: {
                  $cond: [ successfulOrderCond, "$totalAmount", 0 ]
                }
              },
              // Total "Successful" Orders
              totalSuccessfulOrders: {
                // --- 💡 FIX 4: Use the correct 'cond' variable ---
                $sum: {
                  $cond: [ successfulOrderCond, 1, 0 ]
                }
              },
              // Total Pending Amount
              totalPendingAmount: {
                $sum: {
                  $cond: [
                    { $and: [
                        { $eq: ["$paymentStatus", "pending"] },
                        { $ne: ["$paymentMethod", "COD"] }
                    ]},
                    "$totalAmount", 0
                  ]
                }
              },
              // Total Failed Amount
              totalFailedAmount: {
                $sum: {
                  $cond: [ { $eq: ["$paymentStatus", "failed"] }, "$totalAmount", 0 ]
                }
              },
              // Total Orders (all)
              totalOrders: { $sum: 1 },
            }
          },
          {
            $project: {
              _id: 0,
              totalRevenue: 1,
              totalSuccessfulOrders: 1,
              totalPendingAmount: 1,
              totalFailedAmount: 1,
              totalOrders: 1,
              averageOrderValue: {
                $cond: [
                  { $eq: ["$totalSuccessfulOrders", 0] },
                  0,
                  { $divide: ["$totalRevenue", "$totalSuccessfulOrders"] }
                ]
              }
            }
          }
        ]),
        User.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Author.countDocuments(),
        Order.aggregate([
          // Use 'filter' variable for $match
          { $match: { 
              createdAt: { $gte: currentMonthStart },
              ...successfulOrderFilter
          } },
          { $group: {
              _id: null,
              monthlyRevenue: { $sum: "$totalAmount" },
              monthlyOrders: { $sum: 1 },
          } },
        ]),
        Order.aggregate([
          // Use 'filter' variable for $match
          { $match: { 
              createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
              ...successfulOrderFilter
          } },
          { $group: {
              _id: null,
              previousMonthRevenue: { $sum: "$totalAmount" },
              previousMonthOrders: { $sum: 1 },
          } },
        ]),
      ]),

      // Monthly Sales Data (Last 6 months)
      Order.aggregate([
        // Use 'filter' variable for $match
        { $match: { 
            createdAt: { $gte: sixMonthsAgo },
            ...successfulOrderFilter
        } },
        { $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
        } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent Orders (Last 5 successful)
      // Use 'filter' variable for find()
      Order.find(successfulOrderFilter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber user totalAmount orderStatus createdAt"),
      
      // Recent Subscribers (Last 5)
      Subscriber.find({ isActive: true })
        .sort({ subscribedAt: -1 })
        .limit(5)
        .select("email subscribedAt"),

      // Top Selling Products
      Order.aggregate([
        { $match: successfulOrderFilter }, // Use 'filter' variable for $match
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.priceAtOrder"] },
            },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            name: "$product.name",
            images: "$product.images",
            totalSold: 1,
            totalRevenue: 1,
          },
        },
      ]),

      // User Registrations (Last 6 months)
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Coupon Statistics
      Coupon.aggregate([
        {
          $group: {
            _id: null,
            totalCoupons: { $sum: 1 },
            activeCoupons: {
              $sum: {
                $cond: [
                  { $and: ["$isActive", { $gt: ["$expiryDate", new Date()] }] },
                  1, 0,
                ],
              },
            },
            totalUsage: { $sum: "$usedCount" },
          },
        },
      ]),

      // Subscriber Statistics
      Promise.all([
        Subscriber.countDocuments({ isActive: true }),
        Subscriber.countDocuments({
          isActive: true,
          subscribedAt: { $gte: currentMonthStart },
        }),
        Subscriber.aggregate([
          { $match: { 
              isActive: true,
              subscribedAt: { $gte: sixMonthsAgo }
          } },
          {
            $group: {
              _id: {
                year: { $year: "$subscribedAt" },
                month: { $month: "$subscribedAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]),
    ]);

    // Process total stats
    const [
      orderStats,
      totalUsers,
      totalProducts,
      totalCategories,
      totalAuthors,
      currentMonthStats,
      previousMonthStats,
    ] = totalStats;

    // Process subscriber stats
    const [totalSubscribers, newSubscribersThisMonth, subscriberGrowthData] =
      subscriberStats;

    const orderStatsData = orderStats[0] || {};
    const totalRevenue = orderStatsData.totalRevenue || 0;
    const totalOrders = orderStatsData.totalOrders || 0;
    const totalSuccessfulOrders = orderStatsData.totalSuccessfulOrders || 0;
    const averageOrderValue = orderStatsData.averageOrderValue || 0;
    const totalPendingAmount = orderStatsData.totalPendingAmount || 0;
    const totalFailedAmount = orderStatsData.totalFailedAmount || 0;
    
    const monthlyRevenue = currentMonthStats[0]?.monthlyRevenue || 0;
    const monthlyOrders = currentMonthStats[0]?.monthlyOrders || 0;
    const previousMonthRevenue =
      previousMonthStats[0]?.previousMonthRevenue || 0;
    const previousMonthOrders = previousMonthStats[0]?.previousMonthOrders || 0;

    // Calculate growth percentages
    const revenueGrowth =
      previousMonthRevenue > 0
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : (monthlyRevenue > 0 ? 100 : 0);

    const ordersGrowth =
      previousMonthOrders > 0
        ? ((monthlyOrders - previousMonthOrders) / previousMonthOrders) * 100
        : (monthlyOrders > 0 ? 100 : 0);

    // Process monthly sales data
    const monthlySalesData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthData = monthlySales.find(
        (m) => m._id.year === year && m._id.month === month
      );
      return {
        month: date.toLocaleString("default", { month: "short" }),
        revenue: monthData?.revenue || 0,
        orders: monthData?.orders || 0,
      };
    }).reverse();

    // Process user registration data
    const userRegistrationData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthData = userRegistrations.find(
        (m) => m._id.year === year && m._id.month === month
      );
      return {
        month: date.toLocaleString("default", { month: "short" }),
        users: monthData?.count || 0,
      };
    }).reverse();

    // Process subscriber growth data
    const subscriberChartData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthData = subscriberGrowthData.find(
        (m) => m._id.year === year && m._id.month === month
      );
      return {
        month: date.toLocaleString("default", { month: "short" }),
        subscribers: monthData?.count || 0,
      };
    }).reverse();

    // Process coupon stats
    const couponData = couponStats[0] || {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsage: 0,
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          totalSuccessfulOrders,
          totalPendingAmount,
          totalFailedAmount,
          totalUsers,
          totalProducts,
          totalCategories,
          totalAuthors,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        },
        monthly: {
          revenue: monthlyRevenue,
          orders: monthlyOrders,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          ordersGrowth: Math.round(ordersGrowth * 100) / 100,
        },
        charts: {
          sales: monthlySalesData,
          users: userRegistrationData,
          subscribers: subscriberChartData,
        },
        recent: {
          orders: recentOrders,
          products: topProducts,
          subscribers: recentSubscribers,
        },
        coupons: couponData,
        subscribers: {
          totalSubscribers,
          newThisMonth: newSubscribersThisMonth,
          growthData: subscriberChartData,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics",
      error: error.message,
    });
  }
};

// Add this function to get coupon statistics
export const getCouponStats = async (req, res) => {
  try {
    const coupons = await Coupon.find();

    const stats = {
      total: coupons.length,
      active: coupons.filter(
        (coupon) => coupon.isActive && new Date(coupon.expiryDate) > new Date()
      ).length,
      expired: coupons.filter(
        (coupon) => new Date(coupon.expiryDate) <= new Date()
      ).length,
      totalUsage: coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0),
      mostUsed: await Coupon.find().sort({ usedCount: -1 }).limit(1),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get coupon stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching coupon statistics",
    });
  }
};
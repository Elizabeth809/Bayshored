import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Author from '../models/authorModel.js';

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Current date and date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYearStart = new Date(now.getFullYear(), 0, 1);

    // Execute all aggregations in parallel
    const [
      totalStats,
      monthlySales,
      recentOrders,
      topProducts,
      userRegistrations
    ] = await Promise.all([
      // Total Statistics
      Promise.all([
        Order.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalOrders: { $sum: 1 },
              averageOrderValue: { $avg: '$totalAmount' }
            }
          }
        ]),
        User.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Author.countDocuments(),
        Order.aggregate([
          { $match: { createdAt: { $gte: currentMonthStart } } },
          {
            $group: {
              _id: null,
              monthlyRevenue: { $sum: '$totalAmount' },
              monthlyOrders: { $sum: 1 }
            }
          }
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
          {
            $group: {
              _id: null,
              previousMonthRevenue: { $sum: '$totalAmount' },
              previousMonthOrders: { $sum: 1 }
            }
          }
        ])
      ]),

      // Monthly Sales Data (Last 6 months)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Recent Orders (Last 10)
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber user totalAmount orderStatus createdAt'),

      // Top Selling Products
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            name: '$product.name',
            image: '$product.image',
            totalSold: 1,
            totalRevenue: 1
          }
        }
      ]),

      // User Registrations (Last 6 months)
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Process total stats
    const [
      orderStats,
      totalUsers,
      totalProducts,
      totalCategories,
      totalAuthors,
      currentMonthStats,
      previousMonthStats
    ] = totalStats;

    const totalRevenue = orderStats[0]?.totalRevenue || 0;
    const totalOrders = orderStats[0]?.totalOrders || 0;
    const averageOrderValue = orderStats[0]?.averageOrderValue || 0;
    const monthlyRevenue = currentMonthStats[0]?.monthlyRevenue || 0;
    const monthlyOrders = currentMonthStats[0]?.monthlyOrders || 0;
    const previousMonthRevenue = previousMonthStats[0]?.previousMonthRevenue || 0;
    const previousMonthOrders = previousMonthStats[0]?.previousMonthOrders || 0;

    // Calculate growth percentages
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;
    
    const ordersGrowth = previousMonthOrders > 0 
      ? ((monthlyOrders - previousMonthOrders) / previousMonthOrders) * 100 
      : 0;

    // Process monthly sales data
    const monthlySalesData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthData = monthlySales.find(m => 
        m._id.year === year && m._id.month === month
      );
      
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: monthData?.revenue || 0,
        orders: monthData?.orders || 0
      };
    }).reverse();

    // Process user registration data
    const userRegistrationData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthData = userRegistrations.find(m => 
        m._id.year === year && m._id.month === month
      );
      
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        users: monthData?.count || 0
      };
    }).reverse();

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          totalUsers,
          totalProducts,
          totalCategories,
          totalAuthors,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100
        },
        monthly: {
          revenue: monthlyRevenue,
          orders: monthlyOrders,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          ordersGrowth: Math.round(ordersGrowth * 100) / 100
        },
        charts: {
          sales: monthlySalesData,
          users: userRegistrationData
        },
        recent: {
          orders: recentOrders,
          products: topProducts
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: error.message
    });
  }
};
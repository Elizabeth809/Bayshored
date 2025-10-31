import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import LoadingSpinner from '../components/AdminLoadingSpinner';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';
import {
  TrendingUp,
  Package,
  Users,
  Image,
  Tag,
  UserCheck,
  Mail,
  DollarSign,
  ShoppingCart,
  Award,
  Star
} from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await fetchDashboardData();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 !mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center !mx-auto !mb-4">
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 !mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const { overview, monthly, charts, recent, coupons, subscribers } = dashboardData;

  // Sales Chart Data
  const salesChartData = {
    labels: charts.sales.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: charts.sales.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Orders',
        data: charts.sales.map(item => item.orders),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const salesChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Orders'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Overview (Last 6 Months)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  // Users Chart Data
  const usersChartData = {
    labels: charts.users.map(item => item.month),
    datasets: [
      {
        label: 'New Users',
        data: charts.users.map(item => item.users),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const usersChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Registrations (Last 6 Months)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Subscribers Chart Data
  const subscribersChartData = {
    labels: charts.subscribers.map(item => item.month),
    datasets: [
      {
        label: 'New Subscribers',
        data: charts.subscribers.map(item => item.subscribers),
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: 'rgb(236, 72, 153)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const subscribersChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'New Subscribers (Last 6 Months)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Top Products Chart Data
  const topProductsData = {
    labels: recent.products.map(product => 
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
    ),
    datasets: [
      {
        label: 'Revenue Generated',
        data: recent.products.map(product => product.totalRevenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const topProductsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Products by Revenue',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Revenue: ${formatPrice(context.raw)}`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="!space-y-6 !p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 !mt-2">Welcome to your admin dashboard</p>
          </div>
          <div className="flex items-center !space-x-2 bg-white rounded-xl !px-4 !py-2 shadow-sm border border-gray-200">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Live Stats</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatPrice(overview.totalRevenue)}
            subtitle="All time revenue"
            icon={<DollarSign className="w-6 h-6" />}
            trend={monthly.revenueGrowth}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={formatNumber(overview.totalOrders)}
            subtitle="All time orders"
            icon={<ShoppingCart className="w-6 h-6" />}
            trend={monthly.ordersGrowth}
            color="green"
          />
          <StatCard
            title="Total Users"
            value={formatNumber(overview.totalUsers)}
            subtitle="Registered users"
            icon={<Users className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Total Products"
            value={formatNumber(overview.totalProducts)}
            subtitle="Available artworks"
            icon={<Image className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Categories"
            value={formatNumber(overview.totalCategories)}
            subtitle="Product categories"
            icon={<Tag className="w-6 h-6" />}
            color="indigo"
          />
          <StatCard
            title="Artists"
            value={formatNumber(overview.totalAuthors)}
            subtitle="Featured artists"
            icon={<UserCheck className="w-6 h-6" />}
            color="pink"
          />
          
          {/* Coupon Stats */}
          <StatCard
            title="Total Coupons"
            value={formatNumber(coupons?.totalCoupons || 0)}
            subtitle="All coupons"
            icon={<Award className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Active Coupons"
            value={formatNumber(coupons?.activeCoupons || 0)}
            subtitle="Currently valid"
            icon={<Star className="w-6 h-6" />}
            color="amber"
          />
        </div>

        {/* Third Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Coupon Uses"
            value={formatNumber(coupons?.totalUsage || 0)}
            subtitle="Total discounts applied"
            icon={<TrendingUp className="w-6 h-6" />}
            color="cyan"
          />
          <StatCard
            title="Subscribers"
            value={formatNumber(subscribers?.totalSubscribers || 0)}
            subtitle="Newsletter subscribers"
            icon={<Mail className="w-6 h-6" />}
            color="violet"
          />
          <StatCard
            title="New Subscribers"
            value={formatNumber(subscribers?.newThisMonth || 0)}
            subtitle="This month"
            icon={<Users className="w-6 h-6" />}
            color="rose"
          />
          <StatCard
            title="Avg Order Value"
            value={formatPrice(overview.averageOrderValue)}
            subtitle="Average per order"
            icon={<DollarSign className="w-6 h-6" />}
            color="lime"
          />
        </div>

        {/* Monthly Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6 lg:col-span-2">
            <div className="flex items-center justify-between !mb-6">
              <h3 className="text-xl font-bold text-gray-900">Monthly Performance</h3>
              <div className="flex items-center !space-x-4">
                <div className="flex items-center !space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Current Month</span>
                </div>
                <div className="flex items-center !space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-600">Previous Month</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatPrice(monthly.revenue)}</div>
                <p className="text-gray-600 !mt-1">Monthly Revenue</p>
                <div className={`inline-flex items-center !px-3 !py-1 rounded-full text-sm font-medium !mt-2 ${
                  monthly.revenueGrowth >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {monthly.revenueGrowth >= 0 ? '↗' : '↘'} {Math.abs(monthly.revenueGrowth).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{monthly.orders}</div>
                <p className="text-gray-600 !mt-1">Monthly Orders</p>
                <div className={`inline-flex items-center !px-3 !py-1 rounded-full text-sm font-medium !mt-2 ${
                  monthly.ordersGrowth >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {monthly.ordersGrowth >= 0 ? '↗' : '↘'} {Math.abs(monthly.ordersGrowth).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 !mt-6 !pt-6">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatPrice(overview.averageOrderValue)}</div>
                  <p className="text-gray-600 text-sm">Average Order Value</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{coupons?.activeCoupons || 0}</div>
                  <p className="text-gray-600 text-sm">Active Coupons</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{subscribers?.totalSubscribers || 0}</div>
                  <p className="text-gray-600 text-sm">Total Subscribers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <h3 className="text-xl font-bold text-gray-900 !mb-6">Quick Insights</h3>
            <div className="!space-y-4">
              <div className="flex items-center justify-between !p-3 bg-blue-50 rounded-xl">
                <span className="text-sm font-medium text-blue-900">Conversion Rate</span>
                <span className="text-lg font-bold text-blue-600">{(overview.totalOrders / overview.totalUsers * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between !p-3 bg-green-50 rounded-xl">
                <span className="text-sm font-medium text-green-900">Customer Value</span>
                <span className="text-lg font-bold text-green-600">{formatPrice(overview.totalRevenue / overview.totalUsers)}</span>
              </div>
              <div className="flex items-center justify-between !p-3 bg-purple-50 rounded-xl">
                <span className="text-sm font-medium text-purple-900">Inventory Items</span>
                <span className="text-lg font-bold text-purple-600">{overview.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between !p-3 bg-cyan-50 rounded-xl">
                <span className="text-sm font-medium text-cyan-900">Coupon Usage Rate</span>
                <span className="text-lg font-bold text-cyan-600">
                  {coupons?.totalCoupons > 0 
                    ? Math.round((coupons.totalUsage / coupons.totalCoupons) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <Line data={salesChartData} options={salesChartOptions} height={300} />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <Bar data={usersChartData} options={usersChartOptions} height={300} />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <Bar data={subscribersChartData} options={subscribersChartOptions} height={300} />
          </div>
        </div>

        {/* Recent Data & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <div className="flex items-center justify-between !mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
              <span className="text-sm text-blue-600 font-medium">Last 10 orders</span>
            </div>
            <div className="!space-y-4">
              {recent.orders.map(order => (
                <div key={order._id} className="flex items-center justify-between !p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center !space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      order.orderStatus === 'delivered' ? 'bg-green-500' :
                      order.orderStatus === 'shipped' ? 'bg-blue-500' :
                      order.orderStatus === 'processing' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.user?.name || 'Unknown User'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                    <span className={`inline-flex items-center !px-2 !py-1 rounded-full text-xs font-medium ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
            <div className="flex items-center justify-between !mb-6">
              <h3 className="text-xl font-bold text-gray-900">Top Performing Products</h3>
              <span className="text-sm text-blue-600 font-medium">By revenue</span>
            </div>
            <div className="!space-y-4">
              {recent.products.map((product, index) => {
                const productImage = product.images?.[0] || '/placeholder-image.jpg';
                return (
                  <div key={index} className="flex items-center !space-x-4 !p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div className="relative">
                      <img 
                        src={productImage} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {product.name}
                      </p>
                      <div className="flex items-center !space-x-4 !mt-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">{product.totalSold}</span> sold
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">{formatPrice(product.totalRevenue)}</span> revenue
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {Math.round((product.totalRevenue / recent.products.reduce((sum, p) => sum + p.totalRevenue, 0)) * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6">
          <div className="flex items-center justify-between !mb-6">
            <h3 className="text-xl font-bold text-gray-900">Product Performance Analysis</h3>
            <span className="text-sm text-blue-600 font-medium">Revenue distribution</span>
          </div>
          <div className="h-80">
            <Doughnut data={topProductsData} options={topProductsOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ title, value, subtitle, icon, trend, color = 'gray' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-600',
    violet: 'from-violet-500 to-violet-600',
    rose: 'from-rose-500 to-rose-600',
    lime: 'from-lime-500 to-lime-600',
    gray: 'from-gray-500 to-gray-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 !p-6 transform hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 !mt-1">{value}</p>
          <p className="text-sm text-gray-500 !mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center !mt-4 text-sm font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
            trend >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {trend >= 0 ? '↗' : '↘'}
          </div>
          {Math.abs(trend).toFixed(1)}%
          <span className="text-gray-500 !ml-1">from last month</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
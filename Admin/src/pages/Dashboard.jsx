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
  const [couponStats, setCouponStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Define fetchCouponStats first
  const fetchCouponStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const activeCoupons = data.data.filter(coupon =>
          coupon.isActive && new Date(coupon.expiryDate) > new Date()
        );
        const totalDiscounts = data.data.reduce((sum, coupon) => sum + coupon.usedCount, 0);
        setCouponStats({
          totalCoupons: data.data.length,
          activeCoupons: activeCoupons.length,
          totalDiscounts
        });
      }
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/dashboard', {
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
        await Promise.all([fetchDashboardData(), fetchCouponStats()]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { overview, monthly, charts, recent } = dashboardData;

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
        tension: 0.4
      },
      {
        label: 'Orders',
        data: charts.sales.map(item => item.orders),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4
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
        text: 'Sales Overview (Last 6 Months)'
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
        borderWidth: 2
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
        text: 'User Registrations (Last 6 Months)'
      }
    }
  };

  // Top Products Chart Data
  const topProductsData = {
    labels: recent.products.map(product => product.name),
    datasets: [
      {
        label: 'Units Sold',
        data: recent.products.map(product => product.totalSold),
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

  return (
    <div className="!space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 !mt-1">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatPrice(overview.totalRevenue)}
          subtitle="All time"
          icon="💰"
          trend={monthly.revenueGrowth}
        />
        <StatCard
          title="Total Orders"
          value={overview.totalOrders.toString()}
          subtitle="All time"
          icon="📦"
          trend={monthly.ordersGrowth}
        />
        <StatCard
          title="Total Users"
          value={overview.totalUsers.toString()}
          subtitle="Registered users"
          icon="👥"
        />
        <StatCard
          title="Total Products"
          value={overview.totalProducts.toString()}
          subtitle="Available artworks"
          icon="🖼️"
        />
        {couponStats && (
          <>
            <StatCard
              title="Total Coupons"
              value={couponStats.totalCoupons.toString()}
              subtitle="Created coupons"
              icon="🎫"
            />
            <StatCard
              title="Active Coupons"
              value={couponStats.activeCoupons.toString()}
              subtitle="Currently valid"
              icon="✅"
            />
          </>
        )}
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-4">This Month</h3>
          <div className="!space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold text-gray-900">{formatPrice(monthly.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orders</span>
              <span className="font-semibold text-gray-900">{monthly.orders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-gray-900">{formatPrice(overview.averageOrderValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-4">Quick Stats</h3>
          <div className="!space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Categories</span>
              <span className="font-semibold text-gray-900">{overview.totalCategories}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Artists</span>
              <span className="font-semibold text-gray-900">{overview.totalAuthors}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <Line data={salesChartData} options={salesChartOptions} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <Bar data={usersChartData} options={usersChartOptions} />
        </div>
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-4">Recent Orders</h3>
          <div className="!space-y-3">
            {recent.orders.map(order => (
              <div key={order._id} className="flex justify-between items-center !p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-flex items-center !px-2 !py-1 rounded-full text-xs ${
                    order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-4">Top Selling Products</h3>
          <div className="!space-y-3">
            {recent.products.map((product, index) => (
              <div key={index} className="flex items-center !space-x-3 !p-3 bg-gray-50 rounded-lg">
                <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                  <p className="text-xs text-gray-600">{product.totalSold} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">{formatPrice(product.totalRevenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 !mt-1">{value}</p>
          <p className="text-sm text-gray-500 !mt-1">{subtitle}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center !mt-3 text-sm ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
          <span className="text-gray-500 !ml-1">from last month</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
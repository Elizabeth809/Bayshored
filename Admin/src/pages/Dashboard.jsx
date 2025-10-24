import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Categories', value: '12', change: '+2', changeType: 'positive' },
    { name: 'Total Authors', value: '8', change: '+1', changeType: 'positive' },
    { name: 'Total Products', value: '45', change: '+5', changeType: 'positive' },
    { name: 'Pending Orders', value: '3', change: '-1', changeType: 'negative' },
  ];

  return (
    <div className="!space-y-6">
      <div className="bg-white rounded-lg shadow-sm !p-6">
        <h1 className="text-2xl font-bold text-gray-900 !mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm !p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900 !mt-1">{stat.value}</p>
              </div>
              <div className={`!px-2 !py-1 rounded-full text-xs font-medium ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm !p-6">
        <h2 className="text-lg font-semibold text-gray-900 !mb-4">Recent Activity</h2>
        <div className="!space-y-3">
          <div className="flex items-center justify-between !py-2">
            <div className="flex items-center !space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">New category "Digital Art" added</span>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between !py-2">
            <div className="flex items-center !space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Author profile updated</span>
            </div>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between !py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">New order received</span>
            </div>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
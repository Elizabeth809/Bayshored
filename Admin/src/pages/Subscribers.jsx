import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    search: '',
    page: 1,
    limit: 10
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchSubscribers();
  }, [filters, token]); // Added token as a dependency

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/subscribers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // Check for HTTP errors (like 401, 403, 404)
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subscribers');
      }

      // Handle successful response
      if (data.success) {
        setSubscribers(data.data);
        setStats(data.stats);
        
        // Set pagination state from the root of the data object
        setPagination({
          page: data.currentPage,
          totalPages: data.totalPages,
          total: data.total
        });
      } else {
        // Handle server-side errors (success: false)
        throw new Error(data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      alert(`Error: ${error.message}`); // Show error to the admin
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (subscriberId) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete subscriber');
      }

      if (data.success) {
        fetchSubscribers(); // Refresh list after successful delete
      } else {
        throw new Error(data.message || 'Failed to delete subscriber');
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const exportSubscribers = async () => {
    try {
      // Fetch all active subscribers for export
      const params = new URLSearchParams({
        limit: 10000,
        status: 'active'
      });
      
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/subscribers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export subscribers');
      }

      if (data.success) {
        const csvContent = [
          ['Name', 'Email', 'Status', 'Subscribed At', 'Source'],
          ...data.data.map(sub => [
            sub.name,
            sub.email,
            sub.isActive ? 'Active' : 'Inactive',
            new Date(sub.subscribedAt).toLocaleDateString(),
            sub.source
          ])
        ].map(row => row.map(item => `"${item}"`).join(',')).join('\n'); // Ensure values are quoted for CSV

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(data.message || 'Failed to export subscribers');
      }
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-600 !mt-1">Manage your newsletter subscribers</p>
        </div>
        <div className="flex !space-x-3">
          <button
            onClick={exportSubscribers}
            className="bg-green-600 text-white !px-4 !py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900 !mt-1">{stats.totalSubscribers}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900 !mt-1">{stats.activeSubscribers}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900 !mt-1">{stats.newThisMonth}</p>
              </div>
              <div className="text-2xl">🆕</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Items Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center !py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : subscribers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed On
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-gray-50">
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscriber.name}</div>
                      <div className="text-sm text-gray-500">{subscriber.email}</div>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${
                        subscriber.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {subscriber.source}
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowGrap text-sm font-medium">
                      <button
                        onClick={() => deleteSubscriber(subscriber._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center !py-12">
            <div className="text-gray-400 !mb-4">
              <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 !mb-2">No subscribers found</h3>
            <p className="text-gray-500">Try adjusting your filters or check for errors.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex !space-x-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`!px-4 !py-2 border rounded-lg ${
                  filters.page === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page === pagination.totalPages}
              className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribers;
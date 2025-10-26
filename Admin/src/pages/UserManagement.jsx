import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner'; // Assuming you have this
import Modal from '../components/Modal'; // Assuming you have this

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`http://localhost:5000/api/v1/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setPagination({
          total: data.total,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          alert('User deleted successfully');
          fetchUsers(); // Refresh the list
        } else {
          alert(data.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user.');
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUpdate = (updatedUser) => {
    setUsers(users.map(user => (user._id === updatedUser._id ? updatedUser : user)));
    fetchUsers(); // Or just update in-state
    closeModal();
  };

  return (
    <div className="!space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center !!py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm">
                      <span className={`!px-2 !py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm">
                      <span className={`!px-2 !py-0.5 rounded-full text-xs font-medium ${
                        user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.isVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
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
          <p className="text-center text-gray-500 !py-12">No users found.</p>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <UserEditModal
          user={selectedUser}
          onClose={closeModal}
          onUpdate={handleUpdate}
          token={token}
        />
      )}
    </div>
  );
};

// Sub-component for the Edit Modal
const UserEditModal = ({ user, onClose, onUpdate, token }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/v1/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        onUpdate(data.data);
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="!space-y-4 !p-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full !mt-1 !px-3 !py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full !mt-1 !px-3 !py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full !mt-1 !px-3 !py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full !mt-1 !px-3 !py-2 border border-gray-300 rounded-lg"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            id="isVerified"
            name="isVerified"
            type="checkbox"
            checked={formData.isVerified}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="isVerified" className="!ml-2 block text-sm text-gray-900">
            Is Verified
          </label>
        </div>
        <div className="flex justify-end !space-x-3 !pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-700 !px-4 !py-2 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white !px-4 !py-2 rounded-lg disabled:bg-gray-300 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserManagement;
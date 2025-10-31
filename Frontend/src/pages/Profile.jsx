import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  User,
  MapPin,
  Shield,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const { user, token, updateUser } = useAuth(); // Now updateUser is available
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
    if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [user, activeTab]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (data.success) {
        // Update the user in context with the new data
        updateUser(data.data);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = `fixed top-4 right-4 !px-6 !py-3 rounded-xl shadow-lg z-50 transform transition-all duration-500 animate-bounce-in flex items-center !space-x-2 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`;
      
      setTimeout(() => {
        toast.className = 'hidden';
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Toast Notification */}
      <div
        id="toast"
        className="hidden"
      >
        <div id="toastMessage" className="flex items-center !space-x-2">
          <CheckCircle size={20} />
          <span></span>
        </div>
      </div>

      <div className="max-w-6xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Header */}
        <div className="text-center !mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center !mx-auto !mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {user?.name}
          </h1>
          <p className="text-gray-600 !mt-2 text-lg">Welcome to your personal space</p>
          <div className="flex justify-center !space-x-6 !mt-4">
            <Link
              to="/orders"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-6 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              View My Orders
            </Link>
            <Link
              to="/store"
              className="bg-white text-gray-700 !px-6 !py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-8">
              <nav className="!p-6">
                <div className="!space-y-2">
                  {[
                    { id: 'personal', label: 'Personal Info', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'addresses', label: 'My Addresses', icon: MapPin }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center !space-x-3 !p-4 rounded-xl transition-all duration-300 ${activeTab === item.id
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200 shadow-md'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="!p-8">
                {loading ? (
                  <div className="flex justify-center !py-12">
                    <LoadingSpinner size="large" />
                  </div>
                ) : activeTab === 'personal' ? (
                  <PersonalInfoTab
                    userData={userData}
                    setUserData={setUserData}
                    onSave={handleSaveProfile}
                    saving={saving}
                    user={user}
                  />
                ) : activeTab === 'security' ? (
                  <SecurityTab token={token} showToast={showToast} />
                ) : activeTab === 'addresses' ? (
                  <AddressesTab
                    addresses={addresses}
                    fetchAddresses={fetchAddresses}
                    token={token}
                    showToast={showToast}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Personal Info Tab Component
const PersonalInfoTab = ({ userData, setUserData, onSave, saving, user }) => {
  const hasChanges = userData.name !== user?.name || 
                    userData.email !== user?.email || 
                    userData.phoneNumber !== user?.phoneNumber;

  return (
    <div className="!space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
          <p className="text-gray-600">Update your personal details and preferences</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed font-medium flex items-center !space-x-2 shadow-lg"
        >
          {saving ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <Save size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl !p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6 flex items-center !space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Basic Information</span>
          </h3>

          <div className="!space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 !mb-2 flex items-center !space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 !mb-2 flex items-center !space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={userData.phoneNumber}
                onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl !p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6 flex items-center !space-x-2">
            <User className="w-5 h-5 text-green-600" />
            <span>Account Information</span>
          </h3>
          
          <div className="!space-y-4">
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Account Status</p>
              <div className="flex items-center !space-x-2 !mt-1">
                <div className={`w-2 h-2 rounded-full ${user?.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-medium text-gray-900">
                  {user?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
            
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Account Role</p>
              <p className="font-medium text-gray-900 capitalize">
                {user?.role || 'Customer'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Tab Component
const SecurityTab = ({ token, showToast }) => {
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Password changed successfully!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="!space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-gray-600">Manage your account security and privacy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Change Password */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl !p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6 flex items-center !space-x-2">
            <Lock className="w-5 h-5 text-red-600" />
            <span>Change Password</span>
          </h3>
          
          <form onSubmit={handleChangePassword} className="!space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 !pr-12"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 !pr-12"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 !pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white !py-3 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-medium flex items-center justify-center !space-x-2"
            >
              {changingPassword ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Lock size={18} />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl !p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6 flex items-center !space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Security Tips</span>
          </h3>
          
          <div className="!space-y-4">
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900">Use a strong password</p>
              <p className="text-sm text-gray-600 !mt-1">Include uppercase, lowercase, numbers, and symbols</p>
            </div>
            
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900">Don't reuse passwords</p>
              <p className="text-sm text-gray-600 !mt-1">Use unique passwords for different accounts</p>
            </div>
            
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900">Enable 2FA</p>
              <p className="text-sm text-gray-600 !mt-1">Add an extra layer of security to your account</p>
            </div>
            
            <div className="!p-4 bg-white rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900">Regular updates</p>
              <p className="text-sm text-gray-600 !mt-1">Change your password every 3-6 months</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Addresses Tab Component
const AddressesTab = ({ addresses, fetchAddresses, token, showToast }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    flatNo: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phoneNo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingAddress
        ? `${CLIENT_BASE_URL}/api/v1/user/addresses/${editingAddress._id}`
        : `${CLIENT_BASE_URL}/api/v1/user/addresses`;

      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses();
        setShowAddForm(false);
        setEditingAddress(null);
        setFormData({
          flatNo: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          phoneNo: ''
        });

        showToast(`Address ${editingAddress ? 'updated' : 'added'} successfully!`, 'success');
      } else {
        showToast(data.message || 'Failed to save address', 'error');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showToast('Failed to save address', 'error');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      flatNo: address.flatNo,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phoneNo: address.phoneNo
    });
    setShowAddForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses();
        showToast('Address deleted successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to delete address', 'error');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showToast('Failed to delete address', 'error');
    }
  };

  return (
    <div className="!space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Addresses</h2>
          <p className="text-gray-600">Manage your shipping addresses</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAddress(null);
            setFormData({
              flatNo: '',
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'India',
              phoneNo: ''
            });
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-6 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium flex items-center !space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Add New Address</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 !p-6 transform transition-all duration-500 animate-slide-up">
          <div className="flex items-center justify-between !mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingAddress(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Flat/House No', name: 'flatNo', type: 'text' },
              { label: 'Street', name: 'street', type: 'text' },
              { label: 'City', name: 'city', type: 'text' },
              { label: 'State', name: 'state', type: 'text' },
              { label: 'ZIP Code', name: 'zipCode', type: 'text' },
              { label: 'Phone Number', name: 'phoneNo', type: 'tel' }
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 !mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full !px-4 !py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div className="md:col-span-2 flex !space-x-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium flex items-center !space-x-2"
              >
                <Save size={18} />
                <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                }}
                className="bg-gray-200 text-gray-700 !px-6 !py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address, index) => (
          <div
            key={address._id}
            className="bg-white rounded-2xl border border-gray-200 !p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between !mb-4">
              <div className="flex-1">
                <div className="flex items-center !space-x-2 !mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Address {index + 1}</h3>
                </div>
                <div className="!space-y-2 text-gray-600">
                  <p className="font-medium">{address.flatNo}, {address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                  <p className="text-sm text-gray-500">📞 {address.phoneNo}</p>
                </div>
              </div>
              <div className="flex !space-x-2">
                <button
                  onClick={() => handleEdit(address)}
                  className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                  title="Edit address"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(address._id)}
                  className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                  title="Delete address"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showAddForm && (
        <div className="text-center !py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center !mx-auto !mb-4">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 !mb-2">No addresses saved</h3>
          <p className="text-gray-600 !mb-6">Add your first address to get started with shopping</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium"
          >
            Add Your First Address
          </button>
        </div>
      )}
    </div>
  );
};

// Add CSS animations
const styles = `
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slide-up {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  .animate-bounce-in {
    animation: bounce-in 0.6s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.5s ease-out;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default Profile;
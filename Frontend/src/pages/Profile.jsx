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
  EyeOff,
  Home,
  Building,
  AlertCircle,
  RefreshCw,
  Star,
  ChevronRight,
  ArrowRight,
  Package,
  ShoppingBag
} from 'lucide-react';

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToastState, setShowToastState] = useState({ show: false, message: '', type: 'success' });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
      if (user.addresses) {
        setAddresses(user.addresses);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

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
    setShowToastState({ show: true, message, type });
    setTimeout(() => {
      setShowToastState({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User, description: 'Manage your details' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password & safety' },
    { id: 'addresses', label: 'Addresses', icon: MapPin, description: 'Shipping locations' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notification */}
      <div 
        className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${
          showToastState.show 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0'
        }`}
      >
        <div className={`flex items-center space-x-3 px-6 py-4 border-2 ${
          showToastState.type === 'success' 
            ? 'border-gray-900 bg-gray-900 text-white' 
            : 'border-gray-900 bg-white text-gray-900'
        }`}>
          <CheckCircle size={18} />
          <span className="font-medium">{showToastState.message}</span>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Profile Info */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="w-28 h-28 border-2 border-gray-900 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-gray-600">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-light text-gray-900">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all duration-300">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div>
                <h1 className="text-3xl lg:text-4xl font-light text-gray-900 tracking-tight">
                  {user?.name || 'Welcome'}
                </h1>
                <p className="text-gray-500 mt-1 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className={`inline-flex items-center space-x-1.5 text-sm ${user?.isVerified ? 'text-gray-900' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${user?.isVerified ? 'bg-gray-900' : 'bg-gray-400'}`}></span>
                    <span>{user?.isVerified ? 'Verified Account' : 'Unverified'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/orders"
                className="group flex items-center space-x-3 border-2 border-gray-900 bg-gray-900 text-white px-6 py-4 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">My Orders</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/store"
                className="group flex items-center space-x-3 border-2 border-gray-900 text-gray-900 px-6 py-4 cursor-pointer hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">Shop Now</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">
                Account Settings
              </h2>
              <nav className="space-y-2">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between p-5 cursor-pointer transition-all duration-300 group ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'} />
                        <div className="text-left">
                          <span className="font-medium block">{item.label}</span>
                          <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight 
                        size={18} 
                        className={`transform transition-all duration-300 ${
                          isActive ? 'text-white' : 'text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>

              {/* Account Stats */}
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">
                  Quick Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-gray-100 hover:border-gray-900 transition-colors duration-300 cursor-default">
                    <p className="text-2xl font-light text-gray-900">{user?.addresses?.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Addresses</p>
                  </div>
                  <div className="p-4 border-2 border-gray-100 hover:border-gray-900 transition-colors duration-300 cursor-default">
                    <p className="text-2xl font-light text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).getFullYear() : '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Member Since</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-gray-900 border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading...</p>
                </div>
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
  );
};

// Personal Info Tab Component
const PersonalInfoTab = ({ userData, setUserData, onSave, saving, user }) => {
  const hasChanges = userData.name !== user?.name || 
                    userData.email !== user?.email || 
                    userData.phoneNumber !== user?.phoneNumber;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-light text-gray-900">Personal Information</h2>
          <p className="text-gray-500 mt-1">Update your account details and preferences</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center justify-center space-x-2 border-2 border-gray-900 bg-gray-900 text-white px-8 py-3 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:text-white"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
          ) : (
            <>
              <Save size={18} />
              <span className="font-medium">Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          <div className="border-2 border-gray-100 p-8 hover:border-gray-200 transition-colors duration-300">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-8 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Basic Details</span>
            </h3>

            <div className="space-y-8">
              <div>
                <label className="block text-sm text-gray-500 mb-3">Full Name</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3 flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={userData.phoneNumber}
                  onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Account Info */}
        <div className="space-y-6">
          <div className="border-2 border-gray-100 p-6 hover:border-gray-200 transition-colors duration-300">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-6 flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Account Status</span>
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${user?.isVerified ? 'bg-gray-900' : 'bg-gray-400'}`}></span>
                  <span className="font-medium text-gray-900">
                    {user?.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-gray-500">Addresses</span>
                <span className="font-medium text-gray-900">
                  {user?.addresses?.length || 0} saved
                </span>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className="border-2 border-gray-900 p-6 bg-gray-900 text-white">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <p className="text-gray-300 text-sm mb-4">
              Contact our support team for assistance with your account.
            </p>
            <button className="text-sm underline underline-offset-4 cursor-pointer hover:no-underline transition-all duration-300">
              Get Support →
            </button>
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
    <div>
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-light text-gray-900">Security Settings</h2>
        <p className="text-gray-500 mt-1">Manage your password and account security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Change Password Form */}
        <div className="lg:col-span-2">
          <div className="border-2 border-gray-100 p-8 hover:border-gray-200 transition-colors duration-300">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-8 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-500 mb-3">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 pr-12"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-300"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 pr-12"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-300"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-3">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 text-gray-900 pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full flex items-center justify-center space-x-2 border-2 border-gray-900 bg-gray-900 text-white py-4 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span className="font-medium">Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Tips */}
        <div className="space-y-6">
          <div className="border-2 border-gray-100 p-6 hover:border-gray-200 transition-colors duration-300">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-6 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security Tips</span>
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'Use strong passwords', desc: 'Mix letters, numbers & symbols' },
                { title: 'Unique passwords', desc: 'Different for each account' },
                { title: 'Enable 2FA', desc: 'Extra security layer' },
                { title: 'Update regularly', desc: 'Change every 3-6 months' }
              ].map((tip, index) => (
                <div 
                  key={index} 
                  className="py-4 border-b border-gray-100 last:border-0 group cursor-default"
                >
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 flex items-center justify-center border border-gray-200 text-xs text-gray-500 flex-shrink-0 group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
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
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  const [formData, setFormData] = useState({
    label: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    stateCode: '',
    zipCode: '',
    phoneNumber: '',
    isResidential: true,
    isDefault: false
  });

  const resetFormData = () => {
    setFormData({
      label: '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      stateCode: '',
      zipCode: '',
      phoneNumber: '',
      isResidential: true,
      isDefault: false
    });
    setValidationResult(null);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      streetLine1: address.streetLine1 || address.street || '',
      streetLine2: address.streetLine2 || address.apartment || '',
      city: address.city || '',
      stateCode: address.stateCode || address.state || '',
      zipCode: address.zipCode || '',
      phoneNumber: address.phoneNumber || address.phoneNo || '',
      isResidential: address.isResidential !== false,
      isDefault: address.isDefault || false
    });
    setValidationResult(null);
    setShowAddForm(true);
  };

  const validateAddress = async () => {
    const { streetLine1, city, stateCode, zipCode } = formData;
    
    if (!streetLine1 || !city || !stateCode || !zipCode) {
      showToast('Please fill in all required fields first', 'error');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/orders/validate-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: {
            streetLine1: formData.streetLine1,
            streetLine2: formData.streetLine2,
            city: formData.city,
            stateCode: formData.stateCode,
            zipCode: formData.zipCode,
            isResidential: formData.isResidential
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setValidationResult(data.data);
        if (data.data.normalizedAddress && data.data.isValid) {
          showToast('Address validated successfully!', 'success');
        } else {
          showToast('Address validation warning - please verify', 'error');
        }
      } else {
        setValidationResult({
          isValid: false,
          warning: data.message || 'Validation failed'
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setValidationResult({
        isValid: false,
        warning: 'Could not validate address'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { streetLine1, city, stateCode, zipCode, phoneNumber } = formData;

    if (!streetLine1 || !city || !stateCode || !zipCode || !phoneNumber) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      showToast('Please enter a valid US ZIP code', 'error');
      return;
    }

    if (!US_STATES.find(s => s.code === stateCode)) {
      showToast('Please select a valid US state', 'error');
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editingAddress
        ? `${CLIENT_BASE_URL}/api/v1/user/addresses/${editingAddress._id}`
        : `${CLIENT_BASE_URL}/api/v1/user/addresses`;

      const method = editingAddress ? 'PUT' : 'POST';

      const addressData = {
        ...formData,
        phoneNumber: cleanedPhone,
        countryCode: 'US',
        fedexValidated: validationResult?.isValid || false,
        fedexClassification: validationResult?.classification || null,
        normalizedAddress: validationResult?.normalizedAddress || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses();
        setShowAddForm(false);
        setEditingAddress(null);
        resetFormData();
        showToast(`Address ${editingAddress ? 'updated' : 'added'} successfully!`, 'success');
      } else {
        showToast(data.message || 'Failed to save address', 'error');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showToast('Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-light text-gray-900">My Addresses</h2>
          <p className="text-gray-500 mt-1">Manage your shipping addresses</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingAddress(null);
              resetFormData();
            }}
            className="inline-flex items-center justify-center space-x-2 border-2 border-gray-900 bg-gray-900 text-white px-6 py-3 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            <Plus size={18} />
            <span className="font-medium">Add Address</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="border-2 border-gray-900 mb-10 overflow-hidden">
          <div className="bg-gray-900 text-white px-8 py-5 flex items-center justify-between">
            <h3 className="font-medium text-lg">
              {editingAddress ? 'Edit Address' : 'New Address'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingAddress(null);
                resetFormData();
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-white hover:text-gray-900 cursor-pointer transition-all duration-300"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Label */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="Home, Office, etc."
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isResidential: true })}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 border-2 cursor-pointer transition-all duration-300 ${
                      formData.isResidential
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-900'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isResidential: false })}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 border-2 cursor-pointer transition-all duration-300 ${
                      !formData.isResidential
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-900'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Office</span>
                  </button>
                </div>
              </div>

              {/* Street 1 */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-500 mb-3">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.streetLine1}
                  onChange={(e) => setFormData({ ...formData, streetLine1: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="123 Main Street"
                />
              </div>

              {/* Street 2 */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">Apt, Suite, Unit</label>
                <input
                  type="text"
                  value={formData.streetLine2}
                  onChange={(e) => setFormData({ ...formData, streetLine2: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="Apt 4B"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="Los Angeles"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">State *</label>
                <select
                  required
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300 cursor-pointer appearance-none"
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm text-gray-500 mb-3">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, '');
                    setFormData({ ...formData, zipCode: value });
                  }}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="90210"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Default Toggle */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <label className="flex items-center space-x-4 cursor-pointer group">
                <div 
                  className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-300 ${
                    formData.isDefault 
                      ? 'bg-gray-900 border-gray-900' 
                      : 'border-gray-300 group-hover:border-gray-900'
                  }`}
                  onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                >
                  {formData.isDefault && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="text-gray-700">Set as default address</span>
              </label>
            </div>

            {/* Validation */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900">Validate Address</h4>
                  <p className="text-sm text-gray-500">Verify for accurate delivery</p>
                </div>
                <button
                  type="button"
                  onClick={validateAddress}
                  disabled={validating}
                  className="inline-flex items-center space-x-2 border-2 border-gray-200 text-gray-700 px-5 py-2.5 cursor-pointer hover:border-gray-900 hover:text-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent animate-spin"></div>
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Validate</span>
                    </>
                  )}
                </button>
              </div>

              {validationResult && (
                <div className={`p-5 border-2 ${
                  validationResult.isValid
                    ? 'border-gray-900'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${validationResult.isValid ? 'text-gray-900' : 'text-gray-600'}`}>
                        {validationResult.isValid ? 'Address Verified' : 'Verification Warning'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {validationResult.isValid 
                          ? `Type: ${validationResult.classification || 'Standard'}`
                          : validationResult.warning || 'Please check address details'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                  resetFormData();
                }}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-4 cursor-pointer hover:border-gray-900 hover:text-gray-900 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 border-2 border-gray-900 bg-gray-900 text-white py-4 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {addresses.map((address, index) => (
            <div
              key={address._id || index}
              className="border-2 border-gray-100 hover:border-gray-900 transition-all duration-300 group"
            >
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 border border-gray-200 flex items-center justify-center group-hover:border-gray-900 group-hover:bg-gray-900 transition-all duration-300">
                    {address.isResidential !== false ? (
                      <Home className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300" />
                    ) : (
                      <Building className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                      <span>{address.label || (address.isResidential !== false ? 'Home' : 'Office')}</span>
                      {address.isDefault && (
                        <span className="text-xs border border-gray-900 px-2 py-0.5 font-normal">
                          Default
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {address.isResidential !== false ? 'Residential' : 'Business'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEdit(address)}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-all duration-300"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-all duration-300"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="text-gray-600">
                    <p className="text-gray-900 font-medium">
                      {address.streetLine1 || address.street}
                    </p>
                    {(address.streetLine2 || address.apartment) && (
                      <p className="text-sm">{address.streetLine2 || address.apartment}</p>
                    )}
                    <p className="mt-1">
                      {address.city}, {address.stateCode || address.state} {address.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{formatPhoneNumber(address.phoneNumber || address.phoneNo)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm ? (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="w-20 h-20 border-2 border-gray-200 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">No addresses yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Add your first shipping address to make checkout faster
          </p>
          <button
            onClick={() => {
              setShowAddForm(true);
              resetFormData();
            }}
            className="inline-flex items-center space-x-2 border-2 border-gray-900 bg-gray-900 text-white px-8 py-4 cursor-pointer hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            <Plus size={18} />
            <span className="font-medium">Add Your First Address</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
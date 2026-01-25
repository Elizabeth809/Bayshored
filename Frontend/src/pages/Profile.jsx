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
  Star
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

// Get state name from code
const getStateName = (code) => {
  const state = US_STATES.find(s => s.code === code);
  return state ? state.name : code;
};

// Format phone number
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
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = `fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-500 flex items-center space-x-2 ${
        type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`;
      
      setTimeout(() => {
        toast.className = 'hidden';
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Toast Notification */}
      <div id="toast" className="hidden">
        <div id="toastMessage" className="flex items-center space-x-2">
          <CheckCircle size={20} />
          <span></span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
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
                <Camera className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {user?.name}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Welcome to your personal space</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link
              to="/orders"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              View My Orders
            </Link>
            <Link
              to="/store"
              className="bg-white text-gray-700 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all transform hover:scale-105 font-medium shadow-lg"
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
              <nav className="p-6">
                <div className="space-y-2">
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
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
                          activeTab === item.id
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200 shadow-md'
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
              <div className="p-8">
                {loading ? (
                  <div className="flex justify-center py-12">
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
          <p className="text-gray-600">Update your personal details</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed font-medium flex items-center space-x-2 shadow-lg"
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
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span>Basic Information</span>
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={userData.phoneNumber}
                onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Star className="w-5 h-5 text-emerald-600" />
            <span>Account Information</span>
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Account Status</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${user?.isVerified ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                <span className="font-medium text-gray-900">
                  {user?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">Saved Addresses</p>
              <p className="font-medium text-gray-900">
                {user?.addresses?.length || 0} address{(user?.addresses?.length || 0) !== 1 ? 'es' : ''}
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-gray-600">Manage your account security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Change Password */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Change Password</span>
          </h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-12"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-12"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 pr-12"
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-medium flex items-center justify-center space-x-2"
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
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>Security Tips</span>
          </h3>
          
          <div className="space-y-4">
            {[
              { title: 'Use a strong password', desc: 'Include uppercase, lowercase, numbers, and symbols' },
              { title: "Don't reuse passwords", desc: 'Use unique passwords for different accounts' },
              { title: 'Enable 2FA', desc: 'Add an extra layer of security' },
              { title: 'Regular updates', desc: 'Change your password every 3-6 months' }
            ].map((tip, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="font-medium text-gray-900 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span>{tip.title}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1 pl-4">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Addresses Tab Component - Updated for US addresses with FedEx validation
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

  // Validate address with FedEx
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
        
        // If normalized address is available, offer to use it
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

    // Validate required fields
    if (!streetLine1 || !city || !stateCode || !zipCode || !phoneNumber) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      showToast('Please enter a valid US ZIP code', 'error');
      return;
    }

    // Validate state code
    if (!US_STATES.find(s => s.code === stateCode)) {
      showToast('Please select a valid US state', 'error');
      return;
    }

    // Validate phone number
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
        // Store FedEx validation result if available
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Addresses</h2>
          <p className="text-gray-600">Manage your US shipping addresses</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAddress(null);
            resetFormData();
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 font-medium flex items-center space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Add/Edit Address Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingAddress ? 'Edit Address' : 'Add New US Address'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingAddress(null);
                resetFormData();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Label (Optional)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Home, Office, etc."
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Street Line 1 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.streetLine1}
                  onChange={(e) => setFormData({ ...formData, streetLine1: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="123 Main Street"
                />
              </div>

              {/* Street Line 2 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment, Suite, Unit (Optional)
                </label>
                <input
                  type="text"
                  value={formData.streetLine2}
                  onChange={(e) => setFormData({ ...formData, streetLine2: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Apt 4B, Suite 100, etc."
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Los Angeles"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  required
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ZIP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, '');
                    setFormData({ ...formData, zipCode: value });
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="90210"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Format: 12345 or 12345-6789</p>
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isResidential: true })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center space-x-2 ${
                      formData.isResidential
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Residential</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isResidential: false })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center space-x-2 ${
                      !formData.isResidential
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Business</span>
                  </button>
                </div>
              </div>

              {/* Default Address Toggle */}
              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">Set as default address</span>
                </label>
              </div>
            </div>

            {/* FedEx Validation */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">FedEx Address Validation</h4>
                  <p className="text-sm text-gray-600">Validate your address for accurate delivery</p>
                </div>
                <button
                  type="button"
                  onClick={validateAddress}
                  disabled={validating}
                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {validating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Validate Address</span>
                    </>
                  )}
                </button>
              </div>

              {validationResult && (
                <div className={`p-4 rounded-xl ${
                  validationResult.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${validationResult.isValid ? 'text-green-800' : 'text-yellow-800'}`}>
                        {validationResult.isValid ? 'Address Validated' : 'Validation Warning'}
                      </p>
                      <p className={`text-sm mt-1 ${validationResult.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                        {validationResult.isValid 
                          ? `Classification: ${validationResult.classification || 'Standard'}`
                          : validationResult.warning || validationResult.messages?.[0] || 'Please verify address details'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                  resetFormData();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address, index) => (
          <div
            key={address._id || index}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  {address.isResidential !== false ? (
                    <Home className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Building className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">
                      {address.label || (address.isResidential !== false ? 'Home' : 'Business')}
                    </h3>
                    {address.isDefault && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    {address.fedexValidated && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {address.isResidential !== false ? 'Residential' : 'Business'} Address
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleEdit(address)}
                  className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition-colors"
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

            <div className="space-y-2 text-gray-600">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
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
              <div className="flex items-center space-x-2 text-sm pt-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{formatPhoneNumber(address.phoneNumber || address.phoneNo)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {addresses.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-12 h-12 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-600 mb-6">Add your first US shipping address to get started</p>
          <button
            onClick={() => {
              setShowAddForm(true);
              resetFormData();
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 font-medium"
          >
            Add Your First Address
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
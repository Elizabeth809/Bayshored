import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';
import {
  User,
  MapPin,
  Settings,
  Shield,
  Bell,
  CreditCard,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  Mail,
  Phone,
  Camera,
  Save,
  X
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
  const { user, token, updateUser } = useAuth();
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
        updateUser(data.data);
        // Show success animation
        document.getElementById('successToast')?.classList.remove('hidden');
        setTimeout(() => {
          document.getElementById('successToast')?.classList.add('hidden');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Success Toast */}
      <div
        id="successToast"
        className="hidden fixed top-4 right-4 bg-green-500 text-white !px-6 !py-3 rounded-xl shadow-lg z-50 transform transition-all duration-500 animate-bounce-in"
      >
        <div className="flex items-center !space-x-2">
          <CheckCircle size={20} />
          <span>Profile updated successfully!</span>
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
                  />
                ) : activeTab === 'addresses' ? (
                  <AddressesTab
                    addresses={addresses}
                    fetchAddresses={fetchAddresses}
                    token={token}
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
const PersonalInfoTab = ({ userData, setUserData, onSave, saving }) => {
  return (
    <div className="!space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
          <p className="text-gray-600">Update your personal details and preferences</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white !px-8 !py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-medium flex items-center !space-x-2 shadow-lg"
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
      </div>
    </div>
  );
};

// Addresses Tab Component
const AddressesTab = ({ addresses, fetchAddresses, token }) => {
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

        // Show success message
        document.getElementById('addressSuccess')?.classList.remove('hidden');
        setTimeout(() => {
          document.getElementById('addressSuccess')?.classList.add('hidden');
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving address:', error);
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
      }
    } catch (error) {
      console.error('Error deleting address:', error);
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

      {/* Success Message */}
      <div
        id="addressSuccess"
        className="hidden bg-green-50 border border-green-200 text-green-700 !px-4 !py-3 rounded-xl"
      >
        Address {editingAddress ? 'updated' : 'added'} successfully!
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

// Add this missing icon component
const FileText = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

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
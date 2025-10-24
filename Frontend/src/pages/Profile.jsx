import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MERN Art</h1>
            </div>
            <div className="flex items-center !space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-gray-900 !px-3 !py-2 rounded-md text-sm font-medium"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white !px-4 !py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-3xl !mx-auto !py-12 !px-4 sm:!px-6 lg:!px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="!px-6 !py-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 !mb-2">Profile</h2>
              <p className="text-gray-600">Your account information</p>
            </div>

            <div className="!mt-8 border-t border-gray-200 !pt-8">
              <dl className="divide-y divide-gray-200">
                <div className="!py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{user?.name}</dd>
                </div>
                <div className="!py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{user?.email}</dd>
                </div>
                <div className="!py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="text-sm text-gray-900">{user?.phoneNumber}</dd>
                </div>
                <div className="!py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-sm text-gray-900 capitalize">{user?.role}</dd>
                </div>
                <div className="!py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                  <dd className="text-sm text-gray-900">
                    {user?.isVerified ? (
                      <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Not Verified
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="!mt-8 flex justify-center !space-x-4">
              <button
                onClick={() => navigate('/store')}
                className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Go to Store
              </button>
              <button
                onClick={() => navigate('/')}
                className="border border-gray-300 text-gray-700 !px-6 !py-2 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
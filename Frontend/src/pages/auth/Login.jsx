import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showResendOtp, setShowResendOtp] = useState(false);

  const { login, sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');

  const result = await login(formData.email, formData.password);

  if (result.success) {
    // Check if requiresVerification exists
    if (result.requiresVerification) {
      // Show message and redirect to OTP verification
      setMessage('Please verify your account. Redirecting to OTP verification...');
      
      // Navigate immediately to OTP verification page
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            email: formData.email,
            fromLogin: true // Important flag
          } 
        });
      }, 1000);
    } else {
      // Normal successful login
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    }
  } else {
    // Handle failed login
    setMessage(result.message);
    
    // Check if it's an unverified account error
    if (result.message?.toLowerCase().includes('verify') || 
        result.message?.toLowerCase().includes('unverified') ||
        result.message?.toLowerCase().includes('otp')) {
      // Show option to go to OTP verification
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            email: formData.email,
            fromLogin: true
          } 
        });
      }, 1500);
    }
  }

  setLoading(false);
};

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await sendOTP(formData.email);
    
    if (result.success) {
      setMessage('New OTP sent to your email!');
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            email: formData.email,
            fromLogin: true
          } 
        });
      }, 1000);
    } else {
      setMessage(result.message || 'Failed to send OTP');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center !py-12 sm:!px-6 lg:!px-8">
      <div className="sm:!mx-auto sm:w-full sm:max-w-md">
        <h2 className="!mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="!mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="!mt-8 sm:!mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white !py-8 !px-4 shadow sm:rounded-lg sm:!px-10">
          <form className="!space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`!p-3 rounded-md ${message.includes('successful') || message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
                {showResendOtp && (
                  <div className="!mt-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 underline"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Click here to send OTP again'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="!mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full !px-3 !py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="!mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full !px-3 !py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center !py-2 !px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
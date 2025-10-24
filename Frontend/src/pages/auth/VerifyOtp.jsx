import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate('/register');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (otp.length !== 6) {
      setMessage('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    const result = await verifyOtp(email, otp);

    if (result.success) {
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center !py-12 sm:!px-6 lg:!px-8">
      <div className="sm:!mx-auto sm:w-full sm:max-w-md">
        <h2 className="!mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p className="!mt-2 text-center text-sm text-gray-600">
          We've sent a 6-digit OTP to {email}
        </p>
      </div>

      <div className="!mt-8 sm:!mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white !py-8 !px-4 shadow sm:rounded-lg sm:px-10">
          <form className="!space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`!p-3 rounded-md ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                6-Digit OTP
              </label>
              <div className="!mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full !px-3 !py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center !py-2 !px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => navigate('/register')}
              >
                Back to Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
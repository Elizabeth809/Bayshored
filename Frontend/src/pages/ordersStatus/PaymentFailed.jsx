import { useLocation, Link } from 'react-router-dom';

const PaymentFailed = () => {
  const location = useLocation();
  const { orderId, error } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center !px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 !p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center !mx-auto !mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 !mb-2">Payment Failed</h1>
        <p className="text-gray-600 !mb-4">
          We couldn't process your payment. Please try again.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg !p-3 !mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="!space-y-3">
          <Link
            to="/cart"
            className="block w-full bg-blue-600 text-white !py-3 !px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </Link>
          <Link
            to="/store"
            className="block w-full bg-gray-200 text-gray-700 !py-3 !px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="!mt-6 text-sm text-gray-500">
          <p>Having trouble? <a href="mailto:support@mernart.com" className="text-blue-600 hover:text-blue-800">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OrderSuccess = () => {
  const location = useLocation();
  const { orderId, paymentId, orderNumber } = location.state || {};
  const { user } = useAuth();

  useEffect(() => {
    // Track conversion or analytics here
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        value: 0, // You might want to pass the amount here
        currency: 'USD',
        items: [] // Add items if available
      });
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center !px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 !p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center !mx-auto !mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 !mb-2">Payment Successful!</h1>
        <p className="text-gray-600 !mb-6">
          Thank you for your order. Your payment has been processed successfully.
        </p>

        <div className="bg-gray-50 rounded-lg !p-4 !mb-6 text-left">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Order Number:</div>
            <div className="font-medium text-gray-900">#{orderNumber}</div>
            
            <div className="text-gray-600">Payment ID:</div>
            <div className="font-medium text-gray-900">{paymentId}</div>
            
            <div className="text-gray-600">Status:</div>
            <div className="font-medium text-green-600">Confirmed</div>
          </div>
        </div>

        <p className="text-gray-600 !mb-6">
          We've sent a confirmation email to <strong>{user?.email}</strong> with your order details and invoice.
        </p>

        <div className="!space-y-3">
          <Link
            to="/profile"
            className="block w-full bg-blue-600 text-white !py-3 !px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Order Details
          </Link>
          <Link
            to="/store"
            className="block w-full bg-gray-200 text-gray-700 !py-3 !px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="!mt-6 text-sm text-gray-500">
          <p>Need help? <a href="mailto:support@mernart.com" className="text-blue-600 hover:text-blue-800">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const initiatePayment = async (orderData) => {
    setLoading(true);
    setPaymentError('');

    try {
      // 1. Create Razorpay order
      const response = await fetch('http://localhost:5000/api/v1/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderData._id,
          amount: orderData.totalAmount,
          currency: 'USD'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      // 2. Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // 3. Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || data.data.key,
          amount: data.data.amount,
          currency: data.data.currency,
          name: 'MERN Art Gallery',
          description: `Order #${orderData.orderNumber}`,
          image: '/logo.png', // Add your logo
          order_id: data.data.id,
          handler: async function (response) {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData._id
            });
          },
          prefill: {
            name: orderData.user?.name || '',
            email: orderData.user?.email || '',
            contact: orderData.shippingAddress.phoneNo || ''
          },
          notes: {
            orderId: orderData._id,
            orderNumber: orderData.orderNumber
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: function() {
              handlePaymentFailure(orderData._id, {
                code: 'USER_CLOSED',
                description: 'User closed the payment modal'
              });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        throw new Error('Failed to load Razorpay SDK');
      };

    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentError(error.message);
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/payments/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to success page
        navigate('/order-success', { 
          state: { 
            orderId: data.data.order,
            paymentId: data.data.paymentId,
            orderNumber: data.data.orderNumber
          }
        });
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentError(error.message);
      navigate('/payment-failed', { 
        state: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = async (orderId, error) => {
    try {
      await fetch('http://localhost:5000/api/v1/payments/payment-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          error
        })
      });

      navigate('/payment-failed', { 
        state: { 
          orderId,
          error: error.description 
        }
      });
    } catch (error) {
      console.error('Failed to record payment failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    paymentError,
    initiatePayment,
    verifyPayment,
    handlePaymentFailure
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
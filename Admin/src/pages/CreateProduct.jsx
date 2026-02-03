import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';

const CreateProduct = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleSave = async (formData) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Product created successfully!' });
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create product' });
      }
    } catch (error) {
      console.error('Create product error:', error);
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div className="!space-y-6">
      {/* Header */}
      <div className="flex items-center !space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="!p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
          <p className="text-gray-600 !mt-1">Add a new artwork to your catalog</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`!p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center !space-x-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Product Form */}
      <ProductForm
        product={null}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
};

export default CreateProduct;
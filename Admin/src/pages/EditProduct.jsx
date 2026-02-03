import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';

const EditProduct = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Product not found' });
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      setMessage({ type: 'error', text: 'Failed to fetch product' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Product updated successfully!' });
        setProduct(data.data);
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update product' });
      }
    } catch (error) {
      console.error('Update product error:', error);
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!product && !loading) {
    return (
      <div className="text-center !py-12">
        <svg className="!mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="!mt-4 text-lg font-medium text-gray-900">Product Not Found</h3>
        <p className="!mt-2 text-gray-500">The product you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/products')}
          className="!mt-4 bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="!space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600 !mt-1">
              Editing: <span className="font-medium">{product?.name}</span>
            </p>
          </div>
        </div>

        {/* Product Info */}
        {product?.slug && (
          <div className="flex items-center !space-x-4">
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center !space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>View Product</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
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

      {/* Product Summary Card */}
      {product && (
        <div className="bg-white rounded-lg shadow-sm !p-4">
          <div className="flex items-center !space-x-4">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/64?text=No+Image';
              }}
            />
            <div className="flex-1">
              <div className="flex items-center !space-x-2 flex-wrap gap-2">
                <span className={`!px-2 !py-1 text-xs font-medium rounded-full ${
                  product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.active ? 'Active' : 'Inactive'}
                </span>
                {product.featured && (
                  <span className="!px-2 !py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Featured
                  </span>
                )}
                {product.askForPrice && (
                  <span className="!px-2 !py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    Quote Only
                  </span>
                )}
                {product.shipping?.freeShipping && (
                  <span className="!px-2 !py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Free Shipping
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 !mt-1">
                Stock: {product.stock} • Views: {product.viewCount} • Sold: {product.soldCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Form */}
      <ProductForm
        product={product}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    </div>
  );
};

export default EditProduct;
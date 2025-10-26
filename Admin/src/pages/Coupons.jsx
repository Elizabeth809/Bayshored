import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { token } = useAuth();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage('');

    try {
      const url = editingCoupon 
        ? `http://localhost:5000/api/v1/coupons/${editingCoupon._id}`
        : 'http://localhost:5000/api/v1/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        expiryDate: formData.expiryDate
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        setModalOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        setMessage(data.message || 'Failed to save coupon');
      }
    } catch (error) {
      setMessage('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Coupon deleted successfully!');
        fetchCoupons();
      } else {
        setMessage(data.message || 'Failed to delete coupon');
      }
    } catch (error) {
      setMessage('Network error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      expiryDate: '',
      usageLimit: '',
      isActive: true
    });
    setEditingCoupon(null);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      expiryDate: coupon.expiryDate.split('T')[0],
      usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getUsagePercentage = (coupon) => {
    if (!coupon.usageLimit) return 0;
    return Math.round((coupon.usedCount / coupon.usageLimit) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 !mt-1">Create and manage discount coupons</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Coupon
        </button>
      </div>

      {message && (
        <div className={`!p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon._id} className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6">
            {/* Coupon Header */}
            <div className="flex justify-between items-start !mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{coupon.code}</h3>
                <p className={`text-sm ${
                  coupon.isActive && !isExpired(coupon.expiryDate) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {!coupon.isActive ? 'Inactive' : 
                   isExpired(coupon.expiryDate) ? 'Expired' : 'Active'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {coupon.discountType === 'percentage' 
                    ? `${coupon.discountValue}%` 
                    : `$${coupon.discountValue}`}
                </p>
                <p className="text-sm text-gray-600">OFF</p>
              </div>
            </div>

            {/* Coupon Details */}
            <div className="!space-y-2 text-sm text-gray-600 !mb-4">
              <div className="flex justify-between">
                <span>Min Order:</span>
                <span>${coupon.minOrderAmount}</span>
              </div>
              {coupon.maxDiscountAmount && (
                <div className="flex justify-between">
                  <span>Max Discount:</span>
                  <span>${coupon.maxDiscountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Expires:</span>
                <span>{formatDate(coupon.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Used:</span>
                <span>{coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</span>
              </div>
            </div>

            {/* Usage Progress Bar */}
            {coupon.usageLimit && (
              <div className="!mb-4">
                <div className="flex justify-between text-xs text-gray-600 !mb-1">
                  <span>Usage</span>
                  <span>{getUsagePercentage(coupon)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(coupon)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex !space-x-2">
              <button
                onClick={() => openEditModal(coupon)}
                className="flex-1 bg-gray-100 text-gray-700 !py-2 !px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(coupon._id)}
                className="flex-1 bg-red-100 text-red-700 !py-2 !px-3 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center !py-12">
          <div className="text-gray-400 !mb-4">
            <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 !mb-2">No coupons created</h3>
          <p className="text-gray-500">Create your first coupon to offer discounts</p>
        </div>
      )}

      {/* Coupon Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
      >
        <form onSubmit={handleSubmit} className="!space-y-4 !p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="SUMMER20"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="0"
                step={formData.discountType === 'percentage' ? "1" : "0.01"}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.discountType === 'percentage' ? "20" : "15.00"}
              />
            </div>

            {/* Minimum Order Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Minimum Order Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Max Discount Amount (for percentage only) */}
            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No limit"
                />
              </div>
            )}

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="No limit"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="!ml-2 text-sm text-gray-700">
              Active Coupon
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg !p-4">
            <h4 className="font-medium text-gray-900 !mb-2">Preview</h4>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{formData.code || 'COUPONCODE'}</span>
              <span className="text-xl font-bold text-blue-600">
                {formData.discountValue 
                  ? (formData.discountType === 'percentage' 
                      ? `${formData.discountValue}% OFF` 
                      : `$${formData.discountValue} OFF`)
                  : 'DISCOUNT'}
              </span>
            </div>
            {formData.minOrderAmount && (
              <p className="text-sm text-gray-600 !mt-1">
                Min. order: ${formData.minOrderAmount}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end !space-x-3 !pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="!px-4 !py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center"
            >
              {formLoading && <LoadingSpinner size="small" className="!mr-2" />}
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Coupons;
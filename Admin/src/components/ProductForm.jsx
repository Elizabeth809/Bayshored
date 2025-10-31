import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ADMIN_BASE_URL } from './adminApiUrl';

const ProductForm = ({ product, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrpPrice: '',
    discountPrice: '',
    stock: '',
    category: '',
    author: '',
    medium: '',
    dimensions: {
      height: '',
      width: '',
      depth: ''
    },
    metaTitle: '',
    metaDescription: '',
    tags: '',
    featured: false,
    active: true,
    offer: {
      isActive: false,
      discountPercentage: '',
      validUntil: ''
    }
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});

  const { token } = useAuth();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        mrpPrice: product.mrpPrice || '',
        discountPrice: product.discountPrice || '',
        stock: product.stock || '',
        category: product.category?._id || '',
        author: product.author?._id || '',
        medium: product.medium || '',
        dimensions: {
          height: product.dimensions?.height || '',
          width: product.dimensions?.width || '',
          depth: product.dimensions?.depth || ''
        },
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        tags: product.tags?.join(', ') || '',
        featured: product.featured || false,
        active: product.active !== undefined ? product.active : true,
        offer: product.offer || {
          isActive: false,
          discountPercentage: '',
          validUntil: ''
        }
      });
      setImagePreviews(product.images || []);
    }
  }, [product]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoadingData(true);
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        fetch(`${ADMIN_BASE_URL}/api/v1/categories`),
        fetch(`${ADMIN_BASE_URL}/api/v1/authors`)
      ]);

      const categoriesData = await categoriesRes.json();
      const authorsData = await authorsRes.json();

      if (categoriesData.success) setCategories(categoriesData.data);
      if (authorsData.success) setAuthors(authorsData.data);
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('offer.')) {
      const offerField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        offer: {
          ...prev.offer,
          [offerField]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + imagePreviews.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = [...imageFiles];
    const newImagePreviews = [...imagePreviews];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newImageFiles.push(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          newImagePreviews.push(reader.result);
          setImagePreviews([...newImagePreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setImageFiles(newImageFiles);
  };

  const removeImage = (index) => {
    const newImageFiles = [...imageFiles];
    const newImagePreviews = [...imagePreviews];

    newImageFiles.splice(index, 1);
    newImagePreviews.splice(index, 1);

    setImageFiles(newImageFiles);
    setImagePreviews(newImagePreviews);
  };

  const calculateDiscountPercentage = () => {
    if (formData.mrpPrice && formData.discountPrice) {
      const mrp = parseFloat(formData.mrpPrice);
      const discount = parseFloat(formData.discountPrice);
      if (discount < mrp && mrp > 0) {
        return Math.round(((mrp - discount) / mrp) * 100);
      }
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.mrpPrice || formData.mrpPrice <= 0) newErrors.mrpPrice = 'Valid MRP price is required';
    if (formData.discountPrice && formData.discountPrice > formData.mrpPrice) {
      newErrors.discountPrice = 'Discount price cannot be greater than MRP price';
    }
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.author) newErrors.author = 'Author is required';
    if (!formData.medium.trim()) newErrors.medium = 'Medium is required';
    if (!formData.dimensions.height || formData.dimensions.height <= 0) newErrors.height = 'Valid height is required';
    if (!formData.dimensions.width || formData.dimensions.width <= 0) newErrors.width = 'Valid width is required';
    if (imageFiles.length === 0 && imagePreviews.length === 0 && !product) {
      newErrors.images = 'At least one product image is required';
    }

    // Offer validation
    if (formData.offer.isActive) {
      if (!formData.offer.discountPercentage || formData.offer.discountPercentage <= 0) {
        newErrors.discountPercentage = 'Discount percentage is required when offer is active';
      }
      if (!formData.offer.validUntil) {
        newErrors.validUntil = 'Valid until date is required when offer is active';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = new FormData();

    // Append basic fields
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('mrpPrice', formData.mrpPrice);
    submitData.append('discountPrice', formData.discountPrice || '');
    submitData.append('stock', formData.stock);
    submitData.append('category', formData.category);
    submitData.append('author', formData.author);
    submitData.append('medium', formData.medium);
    submitData.append('dimensions', JSON.stringify(formData.dimensions));
    submitData.append('metaTitle', formData.metaTitle);
    submitData.append('metaDescription', formData.metaDescription);
    submitData.append('tags', formData.tags);
    submitData.append('featured', formData.featured);
    submitData.append('active', formData.active);
    submitData.append('offer', JSON.stringify(formData.offer));

    // Append images if new files are selected
    imageFiles.forEach(file => {
      submitData.append('images', file);
    });

    await onSave(submitData);
  };

  const discountPercentage = calculateDiscountPercentage();

  if (loadingData) {
    return (
      <div className="flex justify-center items-center !py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="!space-y-6 max-h-96 overflow-y-auto !p-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Product Images {!product && <span className="text-red-500">*</span>}
          <span className="text-xs text-gray-500 !ml-2">(Max 5 images)</span>
        </label>

        {/* Image Previews */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 !mb-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-32 w-full object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}

          {imagePreviews.length < 5 && (
            <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
              <div className="text-center">
                <svg className="!mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-500">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </label>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={imagePreviews.length >= 5}
        />
        <p className="text-xs text-gray-500 !mt-1">
          Recommended: Square images, 800x800px, max 5MB each
        </p>
        {errors.images && (
          <p className="text-red-500 text-xs !mt-1">{errors.images}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs !mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter product description"
            />
            {errors.description && (
              <p className="text-red-500 text-xs !mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                MRP Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="mrpPrice"
                step="0.01"
                min="0"
                value={formData.mrpPrice}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.mrpPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="0.00"
              />
              {errors.mrpPrice && (
                <p className="text-red-500 text-xs !mt-1">{errors.mrpPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Price ($)
              </label>
              <input
                type="number"
                name="discountPrice"
                step="0.01"
                min="0"
                value={formData.discountPrice}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.discountPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="0.00"
              />
              {errors.discountPrice && (
                <p className="text-red-500 text-xs !mt-1">{errors.discountPrice}</p>
              )}
              {discountPercentage > 0 && (
                <p className="text-green-600 text-xs !mt-1">
                  {discountPercentage}% discount
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="0"
            />
            {errors.stock && (
              <p className="text-red-500 text-xs !mt-1">{errors.stock}</p>
            )}
          </div>
        </div>

        {/* Art Details */}
        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Art Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs !mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Author <span className="text-red-500">*</span>
            </label>
            <select
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.author ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select an author</option>
              {authors.map(author => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>
            {errors.author && (
              <p className="text-red-500 text-xs !mt-1">{errors.author}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Medium <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="medium"
              value={formData.medium}
              onChange={handleInputChange}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.medium ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="e.g., Oil on canvas, Watercolor"
            />
            {errors.medium && (
              <p className="text-red-500 text-xs !mt-1">{errors.medium}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Height (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="dimensions.height"
                min="1"
                value={formData.dimensions.height}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="H"
              />
              {errors.height && (
                <p className="text-red-500 text-xs !mt-1">{errors.height}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Width (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="dimensions.width"
                min="1"
                value={formData.dimensions.width}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.width ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="W"
              />
              {errors.width && (
                <p className="text-red-500 text-xs !mt-1">{errors.width}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Depth (cm)
              </label>
              <input
                type="number"
                name="dimensions.depth"
                min="0"
                value={formData.dimensions.depth}
                onChange={handleInputChange}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="D"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offer Settings */}
      <div className="border-t !pt-6">
        <h3 className="text-lg font-medium text-gray-900 !mb-4">Offer Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="offer.isActive"
              checked={formData.offer.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="!ml-2 text-sm text-gray-700">Active Offer</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Discount Percentage
            </label>
            <input
              type="number"
              name="offer.discountPercentage"
              min="1"
              max="100"
              value={formData.offer.discountPercentage}
              onChange={handleInputChange}
              disabled={!formData.offer.isActive}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.discountPercentage ? 'border-red-500' : 'border-gray-300'
                } ${!formData.offer.isActive ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="0"
            />
            {errors.discountPercentage && (
              <p className="text-red-500 text-xs !mt-1">{errors.discountPercentage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Valid Until
            </label>
            <input
              type="date"
              name="offer.validUntil"
              value={formData.offer.validUntil}
              onChange={handleInputChange}
              disabled={!formData.offer.isActive}
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.validUntil ? 'border-red-500' : 'border-gray-300'
                } ${!formData.offer.isActive ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.validUntil && (
              <p className="text-red-500 text-xs !mt-1">{errors.validUntil}</p>
            )}
          </div>
        </div>
      </div>

      {/* SEO & Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Meta Title
            </label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleInputChange}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Meta title for SEO (max 60 chars)"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 !mt-1">
              {formData.metaTitle.length}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Meta Description
            </label>
            <textarea
              name="metaDescription"
              rows={3}
              value={formData.metaDescription}
              onChange={handleInputChange}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Meta description for SEO (max 160 chars)"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 !mt-1">
              {formData.metaDescription.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Separate tags with commas (e.g., abstract, modern, colorful)"
            />
          </div>
        </div>

        <div className="!space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>

          <div className="!space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="!ml-2 text-sm text-gray-700">Featured Product</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="!ml-2 text-sm text-gray-700">Active Product</span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end !space-x-3 !pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="!px-6 !py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 cursor-pointer"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center cursor-pointer"
        >
          {loading && <LoadingSpinner size="small" className="mr-2" />}
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
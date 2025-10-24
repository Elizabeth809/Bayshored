import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProductForm = ({ product, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
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
    active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
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
        price: product.price || '',
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
        active: product.active !== undefined ? product.active : true
      });
      setImagePreview(product.image || '');
    }
  }, [product]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoadingData(true);
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/categories'),
        fetch('http://localhost:5000/api/v1/authors')
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.author) newErrors.author = 'Author is required';
    if (!formData.medium.trim()) newErrors.medium = 'Medium is required';
    if (!formData.dimensions.height || formData.dimensions.height <= 0) newErrors.height = 'Valid height is required';
    if (!formData.dimensions.width || formData.dimensions.width <= 0) newErrors.width = 'Valid width is required';
    if (!imageFile && !product) newErrors.image = 'Product image is required';

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
    submitData.append('price', formData.price);
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

    // Append image if new file is selected
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    await onSave(submitData);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center !py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="!space-y-6 max-h-96 overflow-y-auto !pr-4">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Product Image {!product && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center !space-x-6">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-32 w-32 object-cover rounded-lg border border-gray-300"
              />
            ) : (
              <div className="h-32 w-32 bg-gray-200 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 !mt-1">
              Recommended: Square image, 800x800px, max 5MB
            </p>
            {errors.image && (
              <p className="text-red-500 text-xs !mt-1">{errors.image}</p>
            )}
          </div>
        </div>
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
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
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
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
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
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-red-500 text-xs !mt-1">{errors.price}</p>
              )}
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
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-red-500 text-xs !mt-1">{errors.stock}</p>
              )}
            </div>
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
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
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
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.author ? 'border-red-500' : 'border-gray-300'
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
              className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.medium ? 'border-red-500' : 'border-gray-300'
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
                name="height"
                min="1"
                value={formData.dimensions.height}
                onChange={handleDimensionChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.height ? 'border-red-500' : 'border-gray-300'
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
                name="width"
                min="1"
                value={formData.dimensions.width}
                onChange={handleDimensionChange}
                className={`w-full !px-3 !py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.width ? 'border-red-500' : 'border-gray-300'
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
                name="depth"
                min="0"
                value={formData.dimensions.depth}
                onChange={handleDimensionChange}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="D"
              />
            </div>
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
          className="!px-6 !py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center"
        >
          {loading && <LoadingSpinner size="small" className="!mr-2" />}
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
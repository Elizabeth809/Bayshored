import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ADMIN_BASE_URL } from './adminApiUrl';

const ProductForm = ({ product, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    shortDescription: '',
    
    // Pricing (USD)
    mrpPrice: '',
    discountPrice: '',
    askForPrice: false,
    
    // Inventory
    stock: '1',
    lowStockThreshold: '2',
    trackInventory: true,
    
    // Categorization
    category: '',
    author: '',
    tags: '',
    
    // Artwork Dimensions (US default: inches)
    dimensions: {
      height: '',
      width: '',
      depth: '',
      unit: 'in'
    },
    
    // Shipping Information (for FedEx)
    shipping: {
      weight: {
        value: '',
        unit: 'lb'
      },
      packageDimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'in'
      },
      isFragile: true,
      requiresSignature: true,
      insuranceRequired: true,
      packagingType: 'box',
      specialHandling: '',
      freeShipping: false,
      freeShippingMinAmount: '',
      shippingClass: 'standard',
      originZipCode: ''
    },
    
    // Art-specific fields
    medium: '',
    style: '',
    subject: '',
    yearCreated: '',
    isOriginal: true,
    isFramed: false,
    frameDetails: '',
    certificateOfAuthenticity: false,
    
    // SEO
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: ''
    },
    
    // Offer/Discount
    offer: {
      isActive: false,
      discountPercentage: '',
      validFrom: '',
      validUntil: ''
    },
    
    // Status flags
    featured: false,
    active: true
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');

  const { token } = useAuth();

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        mrpPrice: product.mrpPrice || '',
        discountPrice: product.discountPrice || '',
        askForPrice: product.askForPrice || false,
        stock: product.stock?.toString() || '1',
        lowStockThreshold: product.lowStockThreshold?.toString() || '2',
        trackInventory: product.trackInventory !== undefined ? product.trackInventory : true,
        category: product.category?._id || '',
        author: product.author?._id || '',
        tags: product.tags?.join(', ') || '',
        
        dimensions: {
          height: product.dimensions?.height?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          depth: product.dimensions?.depth?.toString() || '',
          unit: product.dimensions?.unit || 'in'
        },
        
        shipping: {
          weight: {
            value: product.shipping?.weight?.value?.toString() || '',
            unit: product.shipping?.weight?.unit || 'lb'
          },
          packageDimensions: {
            length: product.shipping?.packageDimensions?.length?.toString() || '',
            width: product.shipping?.packageDimensions?.width?.toString() || '',
            height: product.shipping?.packageDimensions?.height?.toString() || '',
            unit: product.shipping?.packageDimensions?.unit || 'in'
          },
          isFragile: product.shipping?.isFragile !== undefined ? product.shipping.isFragile : true,
          requiresSignature: product.shipping?.requiresSignature !== undefined ? product.shipping.requiresSignature : true,
          insuranceRequired: product.shipping?.insuranceRequired !== undefined ? product.shipping.insuranceRequired : true,
          packagingType: product.shipping?.packagingType || 'box',
          specialHandling: product.shipping?.specialHandling || '',
          freeShipping: product.shipping?.freeShipping || false,
          freeShippingMinAmount: product.shipping?.freeShippingMinAmount?.toString() || '',
          shippingClass: product.shipping?.shippingClass || 'standard',
          originZipCode: product.shipping?.originZipCode || ''
        },
        
        medium: product.medium || '',
        style: product.style || '',
        subject: product.subject || '',
        yearCreated: product.yearCreated?.toString() || '',
        isOriginal: product.isOriginal !== undefined ? product.isOriginal : true,
        isFramed: product.isFramed || false,
        frameDetails: product.frameDetails || '',
        certificateOfAuthenticity: product.certificateOfAuthenticity || false,
        
        seo: {
          metaTitle: product.seo?.metaTitle || '',
          metaDescription: product.seo?.metaDescription || '',
          metaKeywords: product.seo?.metaKeywords?.join(', ') || ''
        },
        
        offer: {
          isActive: product.offer?.isActive || false,
          discountPercentage: product.offer?.discountPercentage?.toString() || '',
          validFrom: formatDateForInput(product.offer?.validFrom),
          validUntil: formatDateForInput(product.offer?.validUntil)
        },
        
        featured: product.featured || false,
        active: product.active !== undefined ? product.active : true
      });

      setExistingImages(product.images || []);
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
    const keys = name.split('.');

    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
      return newData;
    });

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = imagePreviews.length + files.length;

    if (totalImages > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImageFiles(prev => [...prev, file]);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    const isExistingImage = index < existingImages.length;

    if (isExistingImage) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newFileIndex = index - existingImages.length;
      setImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }

    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

  const formatUSD = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    // Price validation
    if (!formData.askForPrice) {
      if (!formData.mrpPrice || parseFloat(formData.mrpPrice) <= 0) {
        newErrors.mrpPrice = 'Valid price is required';
      }
      if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.mrpPrice)) {
        newErrors.discountPrice = 'Sale price must be less than regular price';
      }
    }

    // Stock validation
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    // Category and Author
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.author) newErrors.author = 'Artist is required';
    if (!formData.medium.trim()) newErrors.medium = 'Medium is required';

    // Artwork Dimensions
    if (!formData.dimensions.height || parseFloat(formData.dimensions.height) < 0.1) {
      newErrors['dimensions.height'] = 'Valid height is required';
    }
    if (!formData.dimensions.width || parseFloat(formData.dimensions.width) < 0.1) {
      newErrors['dimensions.width'] = 'Valid width is required';
    }

    // Shipping validation
    if (!formData.shipping.weight.value || parseFloat(formData.shipping.weight.value) <= 0) {
      newErrors['shipping.weight.value'] = 'Valid weight is required';
    }
    if (!formData.shipping.packageDimensions.length || parseFloat(formData.shipping.packageDimensions.length) < 0.1) {
      newErrors['shipping.packageDimensions.length'] = 'Valid package length is required';
    }
    if (!formData.shipping.packageDimensions.width || parseFloat(formData.shipping.packageDimensions.width) < 0.1) {
      newErrors['shipping.packageDimensions.width'] = 'Valid package width is required';
    }
    if (!formData.shipping.packageDimensions.height || parseFloat(formData.shipping.packageDimensions.height) < 0.1) {
      newErrors['shipping.packageDimensions.height'] = 'Valid package height is required';
    }

    // Image validation
    if (imagePreviews.length === 0 && !product) {
      newErrors.images = 'At least one product image is required';
    }

    // Offer validation
    if (formData.offer.isActive && !formData.askForPrice) {
      if (!formData.offer.validUntil) {
        newErrors['offer.validUntil'] = 'End date is required for active offers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const submitData = new FormData();

    // Basic fields
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('shortDescription', formData.shortDescription);

    // Pricing
    submitData.append('askForPrice', formData.askForPrice);
    if (formData.askForPrice) {
      submitData.append('mrpPrice', '0');
    } else {
      submitData.append('mrpPrice', formData.mrpPrice || '0');
      if (formData.discountPrice) {
        submitData.append('discountPrice', formData.discountPrice);
      }
    }

    // Inventory
    submitData.append('stock', formData.stock);
    submitData.append('lowStockThreshold', formData.lowStockThreshold);
    submitData.append('trackInventory', formData.trackInventory);

    // Categorization
    submitData.append('category', formData.category);
    submitData.append('author', formData.author);
    submitData.append('tags', formData.tags);

    // Dimensions
    submitData.append('dimensions', JSON.stringify(formData.dimensions));

    // Shipping
    submitData.append('shipping', JSON.stringify(formData.shipping));

    // Art-specific
    submitData.append('medium', formData.medium);
    submitData.append('style', formData.style);
    submitData.append('subject', formData.subject);
    if (formData.yearCreated) submitData.append('yearCreated', formData.yearCreated);
    submitData.append('isOriginal', formData.isOriginal);
    submitData.append('isFramed', formData.isFramed);
    if (formData.frameDetails) submitData.append('frameDetails', formData.frameDetails);
    submitData.append('certificateOfAuthenticity', formData.certificateOfAuthenticity);

    // SEO
    const seoData = {
      metaTitle: formData.seo.metaTitle,
      metaDescription: formData.seo.metaDescription,
      metaKeywords: formData.seo.metaKeywords ? formData.seo.metaKeywords.split(',').map(k => k.trim()).filter(k => k) : []
    };
    submitData.append('seo', JSON.stringify(seoData));

    // Offer
    const offerData = {
      isActive: formData.offer.isActive,
      discountPercentage: formData.offer.discountPercentage || 0,
      validFrom: formData.offer.validFrom || null,
      validUntil: formData.offer.validUntil || null
    };
    submitData.append('offer', JSON.stringify(offerData));

    // Status
    submitData.append('featured', formData.featured);
    submitData.append('active', formData.active);

    // Images
    imageFiles.forEach(file => {
      submitData.append('images', file);
    });

    await onSave(submitData);
  };

  const discountPercentage = calculateDiscountPercentage();

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'artwork', label: 'Artwork', icon: '🎨' },
    { id: 'shipping', label: 'Shipping', icon: '📦' },
    { id: 'pricing', label: 'Pricing', icon: '💵' },
    { id: 'seo', label: 'SEO & Status', icon: '⚙️' },
    { id: 'images', label: 'Images', icon: '🖼️' }
  ];

  if (loadingData) {
    return (
      <div className="flex justify-center items-center !py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="!space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-lg shadow-sm !p-4 sticky top-0 z-10">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`!px-4 !py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="!mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== BASIC INFO SECTION ==================== */}
      {activeSection === 'basic' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6">📝 Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter artwork name"
              />
              {errors.name && <p className="text-red-500 text-xs !mt-1">{errors.name}</p>}
              <p className="text-xs text-gray-500 !mt-1">{formData.name.length}/100 characters</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleInputChange}
                maxLength={2000}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your artwork in detail..."
              />
              {errors.description && <p className="text-red-500 text-xs !mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-500 !mt-1">{formData.description.length}/2,000 characters</p>
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Short Description
              </label>
              <textarea
                name="shortDescription"
                rows={2}
                value={formData.shortDescription}
                onChange={handleInputChange}
                maxLength={300}
                className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description for product listings..."
              />
              <p className="text-xs text-gray-500 !mt-1">{formData.shortDescription.length}/300 characters</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs !mt-1">{errors.category}</p>}
            </div>

            {/* Author/Artist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Artist <span className="text-red-500">*</span>
              </label>
              <select
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.author ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Artist</option>
                {authors.map(auth => (
                  <option key={auth._id} value={auth._id}>{auth.name}</option>
                ))}
              </select>
              {errors.author && <p className="text-red-500 text-xs !mt-1">{errors.author}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.stock && <p className="text-red-500 text-xs !mt-1">{errors.stock}</p>}
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
              <p className="text-xs text-gray-500 !mt-1">Get notified when stock falls below this</p>
            </div>

            {/* Track Inventory */}
            <div className="md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="!ml-3 text-sm text-gray-700">Track inventory for this product</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ARTWORK SECTION ==================== */}
      {activeSection === 'artwork' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6">🎨 Artwork Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Medium */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Medium <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="medium"
                value={formData.medium}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.medium ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Oil on Canvas"
              />
              {errors.medium && <p className="text-red-500 text-xs !mt-1">{errors.medium}</p>}
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Style
              </label>
              <input
                type="text"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Abstract, Contemporary"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Landscape, Portrait"
              />
            </div>

            {/* Year Created */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">
                Year Created
              </label>
              <input
                type="number"
                name="yearCreated"
                min="1000"
                max={new Date().getFullYear()}
                value={formData.yearCreated}
                onChange={handleInputChange}
                className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
          </div>

          {/* Artwork Dimensions */}
          <div className="!mt-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Artwork Dimensions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Height <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="dimensions.height"
                  min="0.1"
                  step="0.1"
                  value={formData.dimensions.height}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['dimensions.height'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Height"
                />
                {errors['dimensions.height'] && <p className="text-red-500 text-xs !mt-1">{errors['dimensions.height']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Width <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="dimensions.width"
                  min="0.1"
                  step="0.1"
                  value={formData.dimensions.width}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['dimensions.width'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Width"
                />
                {errors['dimensions.width'] && <p className="text-red-500 text-xs !mt-1">{errors['dimensions.width']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Depth
                </label>
                <input
                  type="number"
                  name="dimensions.depth"
                  min="0"
                  step="0.1"
                  value={formData.dimensions.depth}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Depth"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Unit
                </label>
                <select
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in">Inches (in)</option>
                  <option value="cm">Centimeters (cm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Framing */}
          <div className="!mt-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Framing</h4>
            <div className="!space-y-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFramed"
                  checked={formData.isFramed}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="!ml-3 text-sm text-gray-700">This artwork is framed</span>
              </label>

              {formData.isFramed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 !mb-1">
                    Frame Details
                  </label>
                  <input
                    type="text"
                    name="frameDetails"
                    value={formData.frameDetails}
                    onChange={handleInputChange}
                    maxLength={200}
                    className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Black wood frame, 2 inch profile"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Authenticity */}
          <div className="!mt-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Authenticity & Certification</h4>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isOriginal"
                  checked={formData.isOriginal}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="!ml-3 text-sm text-gray-700">Original Artwork</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="certificateOfAuthenticity"
                  checked={formData.certificateOfAuthenticity}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="!ml-3 text-sm text-gray-700">Includes Certificate of Authenticity (COA)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SHIPPING SECTION ==================== */}
      {activeSection === 'shipping' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6">📦 Shipping Information (for FedEx)</h3>

          {/* Package Weight */}
          <div className="!mb-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Package Weight</h4>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Weight <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shipping.weight.value"
                  min="0.01"
                  step="0.01"
                  value={formData.shipping.weight.value}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['shipping.weight.value'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors['shipping.weight.value'] && (
                  <p className="text-red-500 text-xs !mt-1">{errors['shipping.weight.value']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Unit
                </label>
                <select
                  name="shipping.weight.unit"
                  value={formData.shipping.weight.unit}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="lb">Pounds (lb)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="!mb-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Package Dimensions (Box Size)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Length <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shipping.packageDimensions.length"
                  min="0.1"
                  step="0.1"
                  value={formData.shipping.packageDimensions.length}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['shipping.packageDimensions.length'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Length"
                />
                {errors['shipping.packageDimensions.length'] && (
                  <p className="text-red-500 text-xs !mt-1">{errors['shipping.packageDimensions.length']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Width <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shipping.packageDimensions.width"
                  min="0.1"
                  step="0.1"
                  value={formData.shipping.packageDimensions.width}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['shipping.packageDimensions.width'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Width"
                />
                {errors['shipping.packageDimensions.width'] && (
                  <p className="text-red-500 text-xs !mt-1">{errors['shipping.packageDimensions.width']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Height <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shipping.packageDimensions.height"
                  min="0.1"
                  step="0.1"
                  value={formData.shipping.packageDimensions.height}
                  onChange={handleInputChange}
                  className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['shipping.packageDimensions.height'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Height"
                />
                {errors['shipping.packageDimensions.height'] && (
                  <p className="text-red-500 text-xs !mt-1">{errors['shipping.packageDimensions.height']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Unit
                </label>
                <select
                  name="shipping.packageDimensions.unit"
                  value={formData.shipping.packageDimensions.unit}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in">Inches (in)</option>
                  <option value="cm">Centimeters (cm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipping Options */}
          <div className="!mb-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Shipping Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Packaging Type
                </label>
                <select
                  name="shipping.packagingType"
                  value={formData.shipping.packagingType}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="box">Box</option>
                  <option value="tube">Tube (Rolled)</option>
                  <option value="crate">Wooden Crate</option>
                  <option value="flat">Flat Package</option>
                  <option value="custom">Custom Packaging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Shipping Class
                </label>
                <select
                  name="shipping.shippingClass"
                  value={formData.shipping.shippingClass}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="priority">Priority</option>
                  <option value="overnight">Overnight</option>
                  <option value="freight">Freight (Large Items)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Origin ZIP Code
                </label>
                <input
                  type="text"
                  name="shipping.originZipCode"
                  value={formData.shipping.originZipCode}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 90210"
                />
                <p className="text-xs text-gray-500 !mt-1">Leave blank to use store default</p>
              </div>
            </div>
          </div>

          {/* Special Handling */}
          <div className="!mb-8">
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Special Handling Instructions
            </label>
            <textarea
              name="shipping.specialHandling"
              rows={3}
              maxLength={500}
              value={formData.shipping.specialHandling}
              onChange={handleInputChange}
              className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special instructions for handling this artwork..."
            />
            <p className="text-xs text-gray-500 !mt-1">{formData.shipping.specialHandling.length}/500 characters</p>
          </div>

          {/* Free Shipping */}
          <div className="!mb-8 bg-green-50 !p-4 rounded-lg border border-green-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="shipping.freeShipping"
                checked={formData.shipping.freeShipping}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="!ml-3 text-sm font-medium text-green-800">🚚 Offer Free Shipping</span>
            </label>

            {formData.shipping.freeShipping && (
              <div className="!mt-4">
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Minimum Order Amount for Free Shipping (Optional)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="shipping.freeShippingMinAmount"
                    min="0"
                    step="0.01"
                    value={formData.shipping.freeShippingMinAmount}
                    onChange={handleInputChange}
                    className="w-full !pl-8 !pr-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 !mt-1">Leave at 0 for unconditional free shipping</p>
              </div>
            )}
          </div>

          {/* Shipping Flags */}
          <div>
            <h4 className="text-md font-medium text-gray-800 !mb-4">Shipping Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center cursor-pointer bg-red-50 !p-4 rounded-lg border border-red-200">
                <input
                  type="checkbox"
                  name="shipping.isFragile"
                  checked={formData.shipping.isFragile}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="!ml-3 text-sm text-red-800">⚠️ Fragile - Handle with Care</span>
              </label>

              <label className="flex items-center cursor-pointer bg-blue-50 !p-4 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  name="shipping.requiresSignature"
                  checked={formData.shipping.requiresSignature}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="!ml-3 text-sm text-blue-800">✍️ Signature Required</span>
              </label>

              <label className="flex items-center cursor-pointer bg-yellow-50 !p-4 rounded-lg border border-yellow-200">
                <input
                  type="checkbox"
                  name="shipping.insuranceRequired"
                  checked={formData.shipping.insuranceRequired}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="!ml-3 text-sm text-yellow-800">🛡️ Insurance Required</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRICING SECTION ==================== */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6">💵 Pricing & Offers</h3>

          {/* Ask for Price Toggle */}
          <div className="!mb-8 bg-purple-50 !p-4 rounded-lg border border-purple-200">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="askForPrice"
                checked={formData.askForPrice}
                onChange={handleInputChange}
                className="w-5 h-5 !mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="!ml-3">
                <span className="text-sm font-medium text-purple-800">Enable "Request Quote" Mode</span>
                <p className="text-xs text-purple-600 !mt-1">
                  Customers will request a quote instead of seeing prices. Great for high-value or custom artwork.
                </p>
              </div>
            </label>
          </div>

          {/* Price Fields */}
          {!formData.askForPrice ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 !mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 !mb-1">
                    Regular Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="mrpPrice"
                      step="0.01"
                      min="0"
                      value={formData.mrpPrice}
                      onChange={handleInputChange}
                      className={`w-full !pl-8 !pr-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.mrpPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.mrpPrice && <p className="text-red-500 text-xs !mt-1">{errors.mrpPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 !mb-1">
                    Sale Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="discountPrice"
                      step="0.01"
                      min="0"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                      className={`w-full !pl-8 !pr-4 !py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.discountPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.discountPrice && <p className="text-red-500 text-xs !mt-1">{errors.discountPrice}</p>}
                  {discountPercentage > 0 && (
                    <p className="text-green-600 text-sm !mt-1 font-medium">
                      🎉 {discountPercentage}% OFF - Customers save {formatUSD(formData.mrpPrice - formData.discountPrice)}
                    </p>
                  )}
                </div>
              </div>

              {/* Offer/Sale Settings */}
              <div className="border-t !pt-6">
                <h4 className="text-md font-medium text-gray-800 !mb-4">Special Offer / Sale</h4>

                <label className="flex items-center cursor-pointer !mb-4">
                  <input
                    type="checkbox"
                    name="offer.isActive"
                    checked={formData.offer.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="!ml-3 text-sm text-gray-700">🏷️ Enable Special Offer</span>
                </label>

                {formData.offer.isActive && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 !p-4 rounded-lg border border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">
                        Discount %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="offer.discountPercentage"
                          min="1"
                          max="100"
                          value={formData.offer.discountPercentage}
                          onChange={handleInputChange}
                          className="w-full !px-4 !py-3 !pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="offer.validFrom"
                        value={formData.offer.validFrom}
                        onChange={handleInputChange}
                        className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 !mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="offer.validUntil"
                        value={formData.offer.validUntil}
                        onChange={handleInputChange}
                        className={`w-full !px-4 !py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          errors['offer.validUntil'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors['offer.validUntil'] && (
                        <p className="text-red-500 text-xs !mt-1">{errors['offer.validUntil']}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg !p-6 text-center">
              <div className="text-4xl !mb-3">💬</div>
              <p className="text-lg font-medium text-blue-800">Quote Request Mode Active</p>
              <p className="text-sm text-blue-600 !mt-2">
                Pricing fields are hidden. Customers will see a "Request Quote" button and can submit their contact information to inquire about pricing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== SEO & STATUS SECTION ==================== */}
      {activeSection === 'seo' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-6">⚙️ SEO & Status</h3>

          {/* SEO Fields */}
          <div className="!mb-8">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Search Engine Optimization</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="seo.metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={handleInputChange}
                  maxLength={60}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO title for search engines"
                />
                <p className="text-xs text-gray-500 !mt-1">{formData.seo.metaTitle.length}/60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Meta Description
                </label>
                <textarea
                  name="seo.metaDescription"
                  rows={2}
                  value={formData.seo.metaDescription}
                  onChange={handleInputChange}
                  maxLength={160}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description for search engine results"
                />
                <p className="text-xs text-gray-500 !mt-1">{formData.seo.metaDescription.length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-1">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="seo.metaKeywords"
                  value={formData.seo.metaKeywords}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="art, painting, abstract, contemporary (comma separated)"
                />
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
                  className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="abstract, modern, colorful, large (comma separated)"
                />
                <p className="text-xs text-gray-500 !mt-1">Help customers find this product</p>
              </div>
            </div>
          </div>

          {/* Product Status */}
          <div className="border-t !pt-6">
            <h4 className="text-md font-medium text-gray-800 !mb-4">Product Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center cursor-pointer bg-gray-50 !p-4 rounded-lg hover:bg-gray-100 border border-gray-200">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="!ml-3">
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <p className="text-xs text-gray-500">Visible on the website</p>
                </div>
              </label>

              <label className="flex items-center cursor-pointer bg-gray-50 !p-4 rounded-lg hover:bg-gray-100 border border-gray-200">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="!ml-3">
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                  <p className="text-xs text-gray-500">Show on homepage featured section</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== IMAGES SECTION ==================== */}
      {activeSection === 'images' && (
        <div className="bg-white rounded-lg shadow-sm !p-6">
          <h3 className="text-lg font-semibold text-gray-900 !mb-2">
            🖼️ Product Images {!product && <span className="text-red-500">*</span>}
          </h3>
          <p className="text-sm text-gray-600 !mb-6">
            Upload up to 5 high-quality images. The first image will be the main product image.
          </p>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 !mb-6">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={preview}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs !px-2 !py-1 rounded font-medium">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            {imagePreviews.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-500 !mt-2">Add Image</span>
                <span className="text-xs text-gray-400 !mt-1">{5 - imagePreviews.length} remaining</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {errors.images && (
            <p className="text-red-500 text-sm !mb-4">{errors.images}</p>
          )}

          <div className="bg-gray-50 !p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 !mb-2">📸 Image Guidelines:</p>
            <ul className="text-sm text-gray-500 !space-y-1">
              <li>• Use high-resolution images (recommended: 1000×1000px or larger)</li>
              <li>• Square format works best for consistent display</li>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Accepted formats: JPG, PNG, WebP</li>
              <li>• Show the artwork from multiple angles if possible</li>
            </ul>
          </div>
        </div>
      )}

      {/* ==================== FORM ACTIONS ==================== */}
      <div className="bg-white rounded-lg shadow-sm !p-6 sticky bottom-0 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {product ? `Editing: ${product.name}` : 'Creating new product'}
          </p>
          <div className="flex !space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="!px-6 !py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white !px-8 !py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center font-medium cursor-pointer"
            >
              {loading && <LoadingSpinner size="small" className="!mr-2" />}
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
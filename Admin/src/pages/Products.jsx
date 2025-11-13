import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductForm from '../components/ProductForm';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'askForPrice'

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    featured: '',
    active: '',
    onSale: '',
    askForPrice: '',
    sortBy: 'createdAt_desc',
    limit: 10,
    page: 1
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  const { token } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchFilterData();
  }, [filters, activeTab]);

  const fetchFilterData = async () => {
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
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      // Add askForPrice filter based on active tab
      if (activeTab === 'askForPrice') {
        queryParams.append('askForPrice', 'true');
      }

      console.log('Fetching products with params:', Object.fromEntries(queryParams));

      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalProducts(data.total);
      } else {
        setMessage(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'limit' ? 1 : prev.page // Reset to page 1 when changing limit
    }));
  };

  const handleSearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      author: '',
      featured: '',
      active: '',
      onSale: '',
      askForPrice: '',
      sortBy: 'createdAt_desc',
      limit: 10,
      page: 1
    });
  };

  const handleCreateProduct = async (formData) => {
    setFormLoading(true);
    setMessage('');

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
        setMessage('Product created successfully!');
        setModalOpen(false);
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to create product');
      }
    } catch (error) {
      setMessage('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (formData) => {
    setFormLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Product updated successfully!');
        setModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to update product');
      }
    } catch (error) {
      setMessage('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      await handleUpdateProduct(formData);
    } else {
      await handleCreateProduct(formData);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Product deleted successfully!');
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to delete product');
      }
    } catch (error) {
      setMessage('Network error occurred');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getDiscountPercentage = (product) => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const hasActiveOffer = (product) => {
    return product.offer?.isActive === true;
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`!px-3 !py-1 rounded-lg ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center !space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="!px-3 !py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="!px-3 !py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  // Count products with ask for price enabled
  const askForPriceCount = products.filter(product => product.askForPrice).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 !mt-1">Manage your art products and inventory</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center cursor-pointer"
        >
          <svg className="w-5 h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
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

      {/* Tabs for All Products vs Ask for Price Products */}
      <div className="bg-white shadow-sm rounded-lg !p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex !space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`!py-2 !px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Products
              <span className="!ml-2 !py-0.5 !px-2 text-xs bg-gray-100 rounded-full">
                {totalProducts}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('askForPrice')}
              className={`!py-2 !px-1 border-b-2 font-medium text-sm ${
                activeTab === 'askForPrice'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ask for Price
              <span className="!ml-2 !py-0.5 !px-2 text-xs bg-purple-100 text-purple-800 rounded-full">
                {askForPriceCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Info message for Ask for Price tab */}
        {activeTab === 'askForPrice' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg !p-4 !mt-4">
            <div className="flex items-start !space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">Ask for Price Products</p>
                <p className="text-xs text-purple-600 !mt-1">
                  These products have the "Ask for Price" feature enabled. Customers will see a special button to request pricing information instead of seeing the price directly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm rounded-lg !p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 !mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, tags..."
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Author</label>
            <select
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Authors</option>
              {authors.map(author => (
                <option key={author._id} value={author._id}>{author.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Status</label>
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 !mb-4">
          {/* Featured Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Featured</label>
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Products</option>
              <option value="true">Featured Only</option>
              <option value="false">Not Featured</option>
            </select>
          </div>

          {/* Offer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Offer</label>
            <select
              value={filters.onSale}
              onChange={(e) => handleFilterChange('onSale', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Offers</option>
              <option value="true">Active Offers</option>
              <option value="false">No Offers</option>
            </select>
          </div>

          {/* Ask for Price Filter - Only show in All Products tab */}
          {activeTab === 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Ask for Price</label>
              <select
                value={filters.askForPrice}
                onChange={(e) => handleFilterChange('askForPrice', e.target.value)}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="true">Ask for Price Only</option>
                <option value="false">Priced Products</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
              <option value="discount_desc">Highest Discount</option>
            </select>
          </div>

          {/* Items Per Page - Only show if Ask for Price filter is hidden */}
          {activeTab !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Items Per Page</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 transition duration-200 flex items-center cursor-pointer"
          >
            <svg className="w-4 h-4 !mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Clear Filters
          </button>
          
          <div className="text-sm text-gray-600">
            Showing {products.length} of {totalProducts} products
            {activeTab === 'askForPrice' && ` (${askForPriceCount} with Ask for Price)`}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="!ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.medium}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category?.name}</div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.author?.name}</div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.askForPrice ? (
                        <div className="flex items-center !space-x-2">
                          <span className="inline-flex items-center !px-2 !py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Ask for Price
                          </span>
                        </div>
                      ) : product.discountPrice ? (
                        <div className="flex items-center !space-x-2">
                          <span className="text-red-600">{formatPrice(product.discountPrice)}</span>
                          <span className="text-gray-400 line-through text-sm">{formatPrice(product.mrpPrice)}</span>
                          <span className="text-green-600 text-xs font-bold">
                            {getDiscountPercentage(product)}% OFF
                          </span>
                        </div>
                      ) : (
                        formatPrice(product.mrpPrice || product.price)
                      )}
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      product.stock > 10 ? 'text-green-600' : 
                      product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.stock}
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="flex items-center !space-x-2">
                      <span className={`inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${
                        product.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                      {product.featured && (
                        <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Featured
                        </span>
                      )}
                      {hasActiveOffer(product) && (
                        <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Offer
                        </span>
                      )}
                      {product.askForPrice && (
                        <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Ask for Price
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-blue-600 hover:text-blue-900 transition duration-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900 transition duration-200 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="!px-6 !py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            {renderPagination()}
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center !py-12">
            <div className="text-gray-400 !mb-4">
              {activeTab === 'askForPrice' ? (
                <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <p className="text-gray-500 !mb-2">
              {activeTab === 'askForPrice' 
                ? 'No products with Ask for Price feature enabled' 
                : 'No products found'
              }
            </p>
            <p className="text-gray-400 text-sm">
              {activeTab === 'askForPrice' 
                ? 'Enable Ask for Price feature in product settings to see them here' 
                : 'Get started by creating your first product'
              }
            </p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={closeModal}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
};

export default Products;
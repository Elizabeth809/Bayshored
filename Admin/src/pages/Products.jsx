import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    featured: '',
    active: '',
    onSale: '',
    askForPrice: '',
    inStock: '',
    sortBy: 'createdAt_desc',
    limit: 10,
    page: 1
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  const navigate = useNavigate();
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

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      if (activeTab === 'askForPrice') {
        queryParams.set('askForPrice', 'true');
      }

      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      page: key === 'page' ? value : 1
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
      inStock: '',
      sortBy: 'createdAt_desc',
      limit: 10,
      page: 1
    });
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
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to delete product');
      }
    } catch (error) {
      setMessage('Network error occurred');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getDiscountPercentage = (product) => {
    if (product.mrpPrice && product.discountPrice && product.discountPrice < product.mrpPrice) {
      return Math.round(((product.mrpPrice - product.discountPrice) / product.mrpPrice) * 100);
    }
    return 0;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handleFilterChange('page', 1)}
          className="!px-3 !py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="!px-2">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleFilterChange('page', i)}
          className={`!px-3 !py-2 rounded-lg transition-colors ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="!px-2">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handleFilterChange('page', totalPages)}
          className="!px-3 !py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between !px-6 !py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * filters.limit) + 1} to {Math.min(currentPage * filters.limit, totalProducts)} of {totalProducts} products
        </div>
        <div className="flex items-center !space-x-2">
          <button
            onClick={() => handleFilterChange('page', currentPage - 1)}
            disabled={currentPage === 1}
            className="!px-4 !py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4 !mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="flex items-center !space-x-1">
            {pages}
          </div>
          <button
            onClick={() => handleFilterChange('page', currentPage + 1)}
            disabled={currentPage === totalPages}
            className="!px-4 !py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next
            <svg className="w-4 h-4 !ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="!space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 !mt-1">Manage your art products and inventory</p>
        </div>
        <button
          onClick={() => navigate('/products/create')}
          className="bg-blue-600 text-white !px-6 !py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium shadow-sm"
        >
          <svg className="w-5 h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`!p-4 rounded-lg flex items-center justify-between ${
          message.includes('successfully')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-current opacity-70 hover:opacity-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex !space-x-8 !px-6" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab('all');
                setFilters(prev => ({ ...prev, page: 1 }));
              }}
              className={`!py-4 !px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Products
              <span className="!ml-2 !py-0.5 !px-2.5 text-xs rounded-full bg-gray-100 text-gray-900">
                {totalProducts}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('askForPrice');
                setFilters(prev => ({ ...prev, page: 1 }));
              }}
              className={`!py-4 !px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'askForPrice'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ask for Price
              <span className="!ml-2 !py-0.5 !px-2.5 text-xs rounded-full bg-purple-100 text-purple-800">
                {products.filter(p => p.askForPrice).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="!p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 !mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search products..."
                  className="w-full !pl-10 !pr-4 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 !mb-1">Author</label>
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Authors</option>
                {authors.map(auth => (
                  <option key={auth._id} value={auth._id}>{auth.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
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
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="!mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured === 'true'}
                onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="!ml-2 text-sm text-gray-700">Featured Only</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onSale === 'true'}
                onChange={(e) => handleFilterChange('onSale', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="!ml-2 text-sm text-gray-700">On Sale</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock === 'true'}
                onChange={(e) => handleFilterChange('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="!ml-2 text-sm text-gray-700">In Stock</span>
            </label>

            <div className="!ml-auto flex items-center gap-4">
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="!px-3 !py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
              >
                <svg className="w-4 h-4 !mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center !py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center !py-12">
            <svg className="!mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="!mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="!mt-2 text-gray-500">
              {activeTab === 'askForPrice'
                ? 'No products with Ask for Price enabled'
                : 'Get started by creating your first product'}
            </p>
            <button
              onClick={() => navigate('/products/create')}
              className="!mt-4 bg-blue-600 text-white !px-6 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Product
            </button>
          </div>
        ) : (
          <>
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
                      Price
                    </th>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="!px-6 !py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="!px-6 !py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images?.[0]}
                              alt={product.name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="!ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.author?.name} • {product.medium}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="!px-6 !py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.category?.name}</span>
                      </td>
                      <td className="!px-6 !py-4 whitespace-nowrap">
                        {product.askForPrice ? (
                          <span className="inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Ask for Price
                          </span>
                        ) : (
                          <div>
                            {product.discountPrice ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-600">
                                  {formatPrice(product.discountPrice)}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(product.mrpPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
                                {formatPrice(product.mrpPrice)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="!px-6 !py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          product.stock > product.lowStockThreshold
                            ? 'text-green-600'
                            : product.stock > 0
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {product.stock}
                          {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                            <span className="!ml-1 text-xs">(Low)</span>
                          )}
                        </span>
                      </td>
                      <td className="!px-6 !py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className={`inline-flex items-center !px-2 !py-0.5 rounded-full text-xs font-medium ${
                            product.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                          {product.featured && (
                            <span className="inline-flex items-center !px-2 !py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Featured
                            </span>
                          )}
                          {product.offer?.isActive && (
                            <span className="inline-flex items-center !px-2 !py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {getDiscountPercentage(product)}% Off
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="!px-6 !py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end !space-x-2">
                          <button
                            onClick={() => navigate(`/products/edit/${product._id}`)}
                            className="text-blue-600 hover:text-blue-900 !p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-900 !p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
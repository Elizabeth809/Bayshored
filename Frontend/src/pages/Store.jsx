import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { CLIENT_BASE_URL } from '../components/others/clientApiUrl';

const Store = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories') ? searchParams.get('categories').split(',') : []
  );
  const [selectedAuthors, setSelectedAuthors] = useState(
    searchParams.get('authors') ? searchParams.get('authors').split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [search, selectedCategories, selectedAuthors, sortBy, priceRange, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (selectedAuthors.length > 0) params.append('author', selectedAuthors.join(','));
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', currentPage);
      params.append('limit', '12');

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/categories`);
      const data = await response.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/authors`);
      const data = await response.json();
      if (data.success) setAuthors(data.data);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const updateURL = () => {
    const params = {};
    
    if (search) params.search = search;
    if (selectedCategories.length > 0) params.categories = selectedCategories.join(',');
    if (selectedAuthors.length > 0) params.authors = selectedAuthors.join(',');
    if (priceRange.min) params.minPrice = priceRange.min;
    if (priceRange.max) params.maxPrice = priceRange.max;
    if (sortBy) params.sortBy = sortBy;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    setCurrentPage(1);
  };

  const handleAuthorChange = (authorId) => {
    setSelectedAuthors(prev =>
      prev.includes(authorId)
        ? prev.filter(id => id !== authorId)
        : [...prev, authorId]
    );
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (field, value) => {
    setPriceRange(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setPriceRange({ min: '', max: '' });
    setSortBy('createdAt_desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || selectedAuthors.length > 0 || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Header */}
        <div className="!mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Art Store</h1>
          <p className="text-gray-600 !mt-2">Discover unique artworks from talented artists</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6 sticky top-8">
              <div className="flex items-center justify-between !mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="!mb-6">
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search artworks..."
                  className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Price Range */}
              <div className="!mb-6">
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                    className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                    className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="!mb-6">
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  Categories
                </label>
                <div className="!space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category._id)}
                        onChange={() => handleCategoryChange(category._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="!ml-2 text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Authors */}
              <div className="!mb-6">
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  Artists
                </label>
                <div className="!space-y-2 max-h-48 overflow-y-auto">
                  {authors.map(author => (
                    <label key={author._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAuthors.includes(author._id)}
                        onChange={() => handleAuthorChange(author._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="!ml-2 text-sm text-gray-700">{author.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 !mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt_desc">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A-Z</option>
                  <option value="name_desc">Name: Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between !mb-6">
              <div>
                <p className="text-gray-600">
                  Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                  {hasActiveFilters && ' (filtered)'}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center !py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center !mt-12">
                    <div className="flex !space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`!px-4 !py-2 border rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center !py-12">
                <div className="text-gray-400 !mb-4">
                  <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 !mb-2">No products found</h3>
                <p className="text-gray-500 !mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
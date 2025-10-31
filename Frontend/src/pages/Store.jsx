import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/others/LoadingSpinner';
import { 
  Filter, 
  X, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
  const [featured, setFeatured] = useState(searchParams.get('featured') || '');
  const [onSale, setOnSale] = useState(searchParams.get('onSale') || '');

  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Dropdown states for searchable selects
  const [categorySearch, setCategorySearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [search, selectedCategories, selectedAuthors, sortBy, priceRange, featured, onSale, currentPage]);

  const fetchProducts = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    
    // Add all parameters
    if (search) params.append('search', search);
    if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
    if (selectedAuthors.length > 0) params.append('author', selectedAuthors.join(','));
    if (priceRange.min) params.append('minPrice', priceRange.min);
    if (priceRange.max) params.append('maxPrice', priceRange.max);
    if (featured) params.append('featured', featured);
    if (onSale) params.append('onSale', onSale);
    if (sortBy) params.append('sortBy', sortBy);
    params.append('page', currentPage.toString());
    params.append('limit', '12');

    console.log('🔍 Fetching products with params:', Object.fromEntries(params));

    const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?${params}`);
    const data = await response.json();

    console.log('📦 API Response:', data);

    if (data.success) {
      setProducts(data.data);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
    } else {
      console.error('API Error:', data.message);
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
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
    if (featured) params.featured = featured;
    if (onSale) params.onSale = onSale;
    if (sortBy) params.sortBy = sortBy;
    if (currentPage > 1) params.page = currentPage.toString();

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

  const handleFeaturedChange = (value) => {
    setFeatured(value);
    setCurrentPage(1);
  };

  const handleOnSaleChange = (value) => {
    setOnSale(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setPriceRange({ min: '', max: '' });
    setFeatured('');
    setOnSale('');
    setSortBy('createdAt_desc');
    setCurrentPage(1);
    setCategorySearch('');
    setAuthorSearch('');
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || selectedAuthors.length > 0 || 
                          priceRange.min || priceRange.max || featured || onSale;

  // Filter categories and authors based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(authorSearch.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (!event.target.closest('.author-dropdown')) {
        setShowAuthorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

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
          onClick={() => setCurrentPage(i)}
          className={`!px-3 !py-1 rounded-lg ${
            currentPage === i
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between !mt-8 !space-y-4 sm:!space-y-0">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, totalProducts)} of {totalProducts} products
        </div>
        <div className="flex items-center !space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          {pages}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Filters sidebar component
  const FiltersSidebar = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 !p-6 sticky top-8">
      <div className="flex items-center justify-between !mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="!mb-6">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="createdAt_desc">Newest First</option>
          <option value="createdAt_asc">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
          <option value="name_desc">Name: Z-A</option>
          <option value="discount_desc">Highest Discount</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="!mb-6">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceRangeChange('min', e.target.value)}
            className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceRangeChange('max', e.target.value)}
            className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
      </div>

      {/* Featured Filter */}
      <div className="!mb-6">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Featured
        </label>
        <select
          value={featured}
          onChange={(e) => handleFeaturedChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Products</option>
          <option value="true">Featured Only</option>
          <option value="false">Not Featured</option>
        </select>
      </div>

      {/* On Sale Filter */}
      <div className="!mb-6">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Special Offers
        </label>
        <select
          value={onSale}
          onChange={(e) => handleOnSaleChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Products</option>
          <option value="true">On Sale Only</option>
          <option value="false">Not On Sale</option>
        </select>
      </div>

      {/* Categories with Search */}
      <div className="!mb-6 category-dropdown">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Categories
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            onFocus={() => setShowCategoryDropdown(true)}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {showCategoryDropdown ? (
            <ChevronUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          ) : (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          )}
          
          {showCategoryDropdown && (
            <div className="absolute z-10 w-full !mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="!p-2 !space-y-1">
                {filteredCategories.map(category => (
                  <label key={category._id} className="flex items-center !p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="!ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="!p-2 text-sm text-gray-500 text-center">No categories found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 !mt-2">
            {selectedCategories.map(catId => {
              const category = categories.find(c => c._id === catId);
              return category ? (
                <span key={catId} className="bg-blue-100 text-blue-800 !px-2 !py-1 rounded-full text-xs flex items-center">
                  {category.name}
                  <button
                    onClick={() => handleCategoryChange(catId)}
                    className="!ml-1 hover:text-blue-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Authors with Search */}
      <div className="!mb-6 author-dropdown">
        <label className="block text-sm font-medium text-gray-700 !mb-2">
          Artists
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search artists..."
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            onFocus={() => setShowAuthorDropdown(true)}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {showAuthorDropdown ? (
            <ChevronUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          ) : (
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          )}
          
          {showAuthorDropdown && (
            <div className="absolute z-10 w-full !mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="!p-2 !space-y-1">
                {filteredAuthors.map(author => (
                  <label key={author._id} className="flex items-center !p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author._id)}
                      onChange={() => handleAuthorChange(author._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="!ml-2 text-sm text-gray-700">{author.name}</span>
                  </label>
                ))}
                {filteredAuthors.length === 0 && (
                  <div className="!p-2 text-sm text-gray-500 text-center">No artists found</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Selected Authors */}
        {selectedAuthors.length > 0 && (
          <div className="flex flex-wrap gap-1 !mt-2">
            {selectedAuthors.map(authorId => {
              const author = authors.find(a => a._id === authorId);
              return author ? (
                <span key={authorId} className="bg-green-100 text-green-800 !px-2 !py-1 rounded-full text-xs flex items-center">
                  {author.name}
                  <button
                    onClick={() => handleAuthorChange(authorId)}
                    className="!ml-1 hover:text-green-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 left-0 w-80 bg-white overflow-y-auto">
            <div className="!p-4">
              <div className="flex items-center justify-between !mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="!p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <FiltersSidebar />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Header */}
        <div className="!mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Art Store</h1>
          <p className="text-gray-600 !mt-2">Discover unique artworks from talented artists</p>
        </div>

        {/* Mobile Search and Filter Bar */}
        <div className="lg:hidden flex !space-x-4 !mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artworks..."
              className="w-full !pl-10 !pr-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="!px-4 !py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center !space-x-2"
          >
            <Filter size={20} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                !
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <FiltersSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Desktop Search Bar */}
            <div className="hidden lg:block relative !mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artworks by name, description, or tags..."
                className="w-full !pl-10 !pr-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between !mb-6">
              <div>
                <p className="text-gray-600">
                  Showing {products.length} of {totalProducts} products
                  {hasActiveFilters && ' (filtered)'}
                </p>
              </div>
              <div className="hidden lg:block text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 !mb-6">
                {search && (
                  <span className="bg-blue-100 text-blue-800 !px-3 !py-1 rounded-full text-sm flex items-center">
                    Search: "{search}"
                    <button
                      onClick={() => setSearch('')}
                      className="!ml-2 hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {priceRange.min && (
                  <span className="bg-purple-100 text-purple-800 !px-3 !py-1 rounded-full text-sm flex items-center">
                    Min: ${priceRange.min}
                    <button
                      onClick={() => handlePriceRangeChange('min', '')}
                      className="!ml-2 hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {priceRange.max && (
                  <span className="bg-purple-100 text-purple-800 !px-3 !py-1 rounded-full text-sm flex items-center">
                    Max: ${priceRange.max}
                    <button
                      onClick={() => handlePriceRangeChange('max', '')}
                      className="!ml-2 hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {featured && (
                  <span className="bg-orange-100 text-orange-800 !px-3 !py-1 rounded-full text-sm flex items-center">
                    {featured === 'true' ? 'Featured' : 'Not Featured'}
                    <button
                      onClick={() => setFeatured('')}
                      className="!ml-2 hover:text-orange-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                {onSale && (
                  <span className="bg-red-100 text-red-800 !px-3 !py-1 rounded-full text-sm flex items-center">
                    {onSale === 'true' ? 'On Sale' : 'Not On Sale'}
                    <button
                      onClick={() => setOnSale('')}
                      className="!ml-2 hover:text-red-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}

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
                {renderPagination()}
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
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
import { motion, AnimatePresence } from 'framer-motion';

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

  // Main filter panel state (for mobile and desktop)
  const [showFilters, setShowFilters] = useState(false);
  
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
  
  // Close filter panel on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilters(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when filters are open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showFilters]);

  // --- Data Fetching (Unchanged) ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
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

      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?${params}`);
      const data = await response.json();

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

  // --- URL and Filter Handlers (Unchanged) ---
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
    setSearchParams(params, { replace: true });
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(authorSearch.toLowerCase())
  );

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

  // --- Background Dots ---
  const generateDots = () => {
    const dots = [];
    const numDots = 30;
    for (let i = 0; i < numDots; i++) {
      const size = Math.random() * 20 + 10;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 5 + 5;
      dots.push(
        <div
          key={i}
          className="animated-dot"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        ></div>
      );
    }
    return dots;
  };

  // --- Re-styled Components ---

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
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            currentPage === i
              ? 'bg-green-700 text-white border border-green-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-neutral-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between !mt-12 !pt-8 border-t border-neutral-200 !space-y-4 sm:!space-y-0 font-playfair">
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold">{(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, totalProducts)}</span> of <span className="font-bold">{totalProducts}</span> products
        </div>
        <div className="flex items-center !space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold"
          >
            Previous
          </button>
          {pages}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="!px-4 !py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 font-semibold"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Renamed to FiltersPanel, will be used by modal/drawer
  const FiltersPanel = () => (
    <div className="!p-6 font-playfair">
      <div className="flex items-center justify-between !mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-green-700 hover:text-green-800 font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="!mb-6">
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
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
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceRangeChange('min', e.target.value)}
            className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceRangeChange('max', e.target.value)}
            className="!px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
            min="0"
          />
        </div>
      </div>

      {/* Featured Filter */}
      <div className="!mb-6">
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Featured
        </label>
        <select
          value={featured}
          onChange={(e) => handleFeaturedChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
        >
          <option value="">All Products</option>
          <option value="true">Featured Only</option>
          <option value="false">Not Featured</option>
        </select>
      </div>

      {/* On Sale Filter */}
      <div className="!mb-6">
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Special Offers
        </label>
        <select
          value={onSale}
          onChange={(e) => handleOnSaleChange(e.target.value)}
          className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
        >
          <option value="">All Products</option>
          <option value="true">On Sale Only</option>
          <option value="false">Not On Sale</option>
        </select>
      </div>

      {/* Categories with Search */}
      <div className="!mb-6 category-dropdown">
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Categories
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            onFocus={() => setShowCategoryDropdown(true)}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
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
                  <label key={category._id} className="flex items-center !p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                      className="rounded border-gray-300 text-green-700 focus:ring-green-600"
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
                <span key={catId} className="bg-green-100 text-green-800 !px-2 !py-1 rounded-full text-xs flex items-center">
                  {category.name}
                  <button
                    onClick={() => handleCategoryChange(catId)}
                    className="ml-1 hover:text-green-900"
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
        <label className="block text-base font-semibold text-gray-700 !mb-2">
          Artists
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search artists..."
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            onFocus={() => setShowAuthorDropdown(true)}
            className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
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
                  <label key={author._id} className="flex items-center !p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author._id)}
                      onChange={() => handleAuthorChange(author._id)}
                      className="rounded border-gray-300 text-green-700 focus:ring-green-600"
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
    <div className="min-h-screen bg-neutral-50 relative overflow-x-hidden font-playfair">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {generateDots()}
      </div>

      {/* Filter Overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            
            {/* Mobile Drawer */}
            <motion.div
              className="fixed inset-y-0 left-0 w-80 bg-white overflow-y-auto z-50 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-4 right-4 !p-2 hover:bg-gray-100 rounded-lg z-10"
              >
                <X size={24} />
              </button>
              <FiltersPanel />
            </motion.div>
            
            {/* Desktop Modal */}
            <motion.div
              className="hidden lg:flex fixed inset-0 z-50 items-center justify-center !p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-4 right-4 !p-2 hover:bg-gray-100 rounded-lg z-10"
                >
                  <X size={24} />
                </button>
                <FiltersPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8 !py-8">
        {/* Header */}
        <div className="!mb-8 text-center">
          <h1 className="font-parisienne text-6xl font-bold text-gray-900">Our Art Store</h1>
          <p className="text-gray-600 !mt-2 text-lg">Discover unique artworks from talented artists</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="sticky top-4 z-20 bg-neutral-50/80 backdrop-blur-sm !py-4 !mb-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artworks, artists, or tags..."
                className="w-full !pl-12 !pr-4 !py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="!px-4 !py-3 border border-gray-300 rounded-lg hover:bg-neutral-100 flex items-center gap-2 bg-white font-semibold shadow-sm transition-colors"
            >
              <Filter size={20} className="text-green-700" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {
                    (search ? 1 : 0) + 
                    selectedCategories.length + 
                    selectedAuthors.length + 
                    (priceRange.min ? 1 : 0) + 
                    (priceRange.max ? 1 : 0) + 
                    (featured ? 1 : 0) + 
                    (onSale ? 1 : 0)
                  }
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Quick Filters: Categories */}
        <div className="!mb-4">
          <h3 className="font-semibold text-gray-700 !mb-2 text-sm uppercase tracking-wider">Categories</h3>
          <div className="flex overflow-x-auto !pb-2 gap-2">
            {categories.map(category => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category._id)}
                className={`!px-4 !py-2 rounded-full font-semibold text-sm transition-colors border whitespace-nowrap ${
                  selectedCategories.includes(category._id)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-neutral-50 hover:border-gray-400'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Filters: Artists */}
        <div className="!mb-8">
           <h3 className="font-semibold text-gray-700 !mb-2 text-sm uppercase tracking-wider">Artists</h3>
           <div className="flex overflow-x-auto !pb-2 gap-2">
            {authors.map(author => (
              <button
                key={author._id}
                onClick={() => handleAuthorChange(author._id)}
                className={`!px-4 !py-2 rounded-full font-semibold text-sm transition-colors border whitespace-nowrap ${
                  selectedAuthors.includes(author._id)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-neutral-50 hover:border-gray-400'
                }`}
              >
                {author.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 !mb-6 !pb-6 border-b border-neutral-200">
              <span className="text-sm font-semibold text-gray-700 self-center">Active:</span>
              {search && (
                <span className="bg-neutral-200 text-gray-800 !px-3 !py-1 rounded-full text-sm flex items-center gap-1">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-black"><X size={14} /></button>
                </span>
              )}
              {priceRange.min && (
                <span className="bg-neutral-200 text-gray-800 !px-3 !py-1 rounded-full text-sm flex items-center gap-1">
                  Min: ${priceRange.min}
                  <button onClick={() => handlePriceRangeChange('min', '')} className="hover:text-black"><X size={14} /></button>
                </span>
              )}
              {priceRange.max && (
                <span className="bg-neutral-200 text-gray-800 !px-3 !py-1 rounded-full text-sm flex items-center gap-1">
                  Max: ${priceRange.max}
                  <button onClick={() => handlePriceRangeChange('max', '')} className="hover:text-black"><X size={14} /></button>
                </span>
              )}
              {/* Other active filters can be added here (e.g., featured, onSale) */}
              <button onClick={clearFilters} className="text-green-700 hover:underline text-sm font-semibold ml-2">Clear All</button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center !py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="text-center !py-12 bg-white rounded-lg shadow-md border border-neutral-200">
              <div className="text-gray-400 !mb-4">
                <svg className="!mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 !mb-2">No products found</h3>
              <p className="text-gray-500 !mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="bg-green-700 text-white !px-5 !py-2 rounded-lg hover:bg-green-800 transition-colors font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store;
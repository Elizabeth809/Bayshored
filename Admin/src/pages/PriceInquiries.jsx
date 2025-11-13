import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  MessageCircle,
  X,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { ADMIN_BASE_URL } from '../components/adminApiUrl';
import { motion, AnimatePresence } from 'framer-motion';

const PriceInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [statusStats, setStatusStats] = useState({
    pending: 0,
    contacted: 0,
    resolved: 0,
    total: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'createdAt_desc',
    dateFrom: '',
    dateTo: '',
    limit: 10
  });

  // Modal states
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Response form state
  const [responseForm, setResponseForm] = useState({
    subject: '',
    message: ''
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchInquiries();
  }, [filters]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/price-inquiries?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.data);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalInquiries(data.total);
        setStatusStats(data.statusStats);
      } else {
        setMessage(data.message || 'Failed to fetch inquiries');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setMessage('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'limit' ? 1 : prev.page
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
      status: 'all',
      sortBy: 'createdAt_desc',
      dateFrom: '',
      dateTo: '',
      limit: 10
    });
  };

  const handleViewInquiry = async (inquiryId) => {
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/price-inquiries/${inquiryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedInquiry(data.data);
        setViewModalOpen(true);
      } else {
        setMessage(data.message || 'Failed to fetch inquiry details');
      }
    } catch (error) {
      console.error('Error fetching inquiry details:', error);
      setMessage('Failed to fetch inquiry details');
    }
  };

  const handleUpdateStatus = async (inquiryId, status) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/price-inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Status updated successfully!');
        fetchInquiries();
      } else {
        setMessage(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/price-inquiries/${selectedInquiry._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Inquiry deleted successfully!');
        setDeleteModalOpen(false);
        setSelectedInquiry(null);
        fetchInquiries();
      } else {
        setMessage(data.message || 'Failed to delete inquiry');
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      setMessage('Failed to delete inquiry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${ADMIN_BASE_URL}/api/v1/price-inquiries/${selectedInquiry._id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseForm)
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Response sent successfully!');
        setRespondModalOpen(false);
        setResponseForm({ subject: '', message: '' });
        fetchInquiries();
      } else {
        setMessage(data.message || 'Failed to send response');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      setMessage('Failed to send response');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDeleteModalOpen(true);
  };

  const openRespondModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseForm({
      subject: `Regarding your inquiry about ${inquiry.product.name}`,
      message: ''
    });
    setRespondModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      contacted: { color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center !px-2.5 !py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} className="!mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
          onClick={() => handleFilterChange('page', i)}
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
          onClick={() => handleFilterChange('page', currentPage - 1)}
          disabled={currentPage === 1}
          className="!px-3 !py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handleFilterChange('page', currentPage + 1)}
          disabled={currentPage === totalPages}
          className="!px-3 !py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Price Inquiries</h1>
          <p className="text-gray-600 !mt-1">Manage customer price inquiries and responses</p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white !p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 !p-3 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div className="!ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{statusStats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white !p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 !p-3 rounded-lg">
              <MessageCircle className="text-green-600" size={24} />
            </div>
            <div className="!ml-4">
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-2xl font-bold text-gray-900">{statusStats.contacted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white !p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 !p-3 rounded-lg">
              <CheckCircle className="text-purple-600" size={24} />
            </div>
            <div className="!ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{statusStats.resolved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white !p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-gray-100 !p-3 rounded-lg">
              <User className="text-gray-600" size={24} />
            </div>
            <div className="!ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statusStats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm rounded-lg !p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 !mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, email, product..."
                className="w-full !pl-10 !pr-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
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
            </select>
          </div>

          {/* Items Per Page */}
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
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 !mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 !px-4 !py-2 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center justify-center cursor-pointer"
            >
              <Filter size={16} className="!mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {inquiries.length} of {totalInquiries} inquiries
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id} className="hover:bg-gray-50">
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{inquiry.fullName}</div>
                      <div className="text-sm text-gray-500">{inquiry.purpose}</div>
                    </div>
                  </td>
                  <td className="!px-6 !py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={inquiry.product?.images?.[0] || inquiry.product?.image}
                          alt={inquiry.product?.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="!ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {inquiry.product?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center !space-x-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{inquiry.email}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center !space-x-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{inquiry.mobile}</span>
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(inquiry.createdAt)}</div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    {getStatusBadge(inquiry.status)}
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-2">
                    <button
                      onClick={() => handleViewInquiry(inquiry._id)}
                      className="text-blue-600 hover:text-blue-900 transition duration-200 cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openRespondModal(inquiry)}
                      className="text-green-600 hover:text-green-900 transition duration-200 cursor-pointer"
                      title="Respond"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(inquiry)}
                      className="text-red-600 hover:text-red-900 transition duration-200 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={16} />
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

        {inquiries.length === 0 && (
          <div className="text-center !py-12">
            <div className="text-gray-400 !mb-4">
              <MessageCircle size={48} className="!mx-auto" />
            </div>
            <p className="text-gray-500 !mb-2">No price inquiries found</p>
            <p className="text-gray-400 text-sm">
              {filters.search || filters.status !== 'all' ? 'Try adjusting your filters' : 'Price inquiries will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* View Inquiry Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedInquiry && (
          <motion.div
            className="!fixed !inset-0 !bg-black/50 !z-50 !flex !items-center !justify-center !p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewModalOpen(false)}
          >
            <motion.div
              className="!bg-white !rounded-2xl !max-w-2xl !w-full !max-h-[90vh] !overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="!p-6">
                <div className="flex justify-between items-center !mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Inquiry Details</h3>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="!space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 !mb-4">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 !mb-1">Full Name</label>
                        <p className="text-gray-900">{selectedInquiry.fullName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 !mb-1">Purpose</label>
                        <p className="text-gray-900 capitalize">{selectedInquiry.purpose}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 !mb-1">Email</label>
                        <p className="text-gray-900">{selectedInquiry.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 !mb-1">Mobile</label>
                        <p className="text-gray-900">{selectedInquiry.mobile}</p>
                      </div>
                      {selectedInquiry.budget && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 !mb-1">Budget</label>
                          <p className="text-gray-900">{selectedInquiry.budget}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 !mb-4">Product Information</h4>
                    <div className="flex items-start !space-x-4">
                      <img
                        src={selectedInquiry.product?.images?.[0] || selectedInquiry.product?.image}
                        alt={selectedInquiry.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <h5 className="font-semibold text-gray-900">{selectedInquiry.product?.name}</h5>
                        <p className="text-gray-600">by {selectedInquiry.product?.author?.name}</p>
                        <p className="text-gray-600 text-sm">{selectedInquiry.product?.medium}</p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedInquiry.message && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 !mb-2">Customer Message</h4>
                      <p className="text-gray-700 bg-gray-50 !p-4 rounded-lg">{selectedInquiry.message}</p>
                    </div>
                  )}

                  {/* Status Management */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 !mb-4">Status Management</h4>
                    <div className="flex !space-x-3">
                      <button
                        onClick={() => handleUpdateStatus(selectedInquiry._id, 'pending')}
                        disabled={actionLoading || selectedInquiry.status === 'pending'}
                        className={`!px-4 !py-2 rounded-lg transition-colors ${
                          selectedInquiry.status === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        } disabled:opacity-50`}
                      >
                        Mark Pending
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedInquiry._id, 'contacted')}
                        disabled={actionLoading || selectedInquiry.status === 'contacted'}
                        className={`!px-4 !py-2 rounded-lg transition-colors ${
                          selectedInquiry.status === 'contacted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        } disabled:opacity-50`}
                      >
                        Mark Contacted
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedInquiry._id, 'resolved')}
                        disabled={actionLoading || selectedInquiry.status === 'resolved'}
                        className={`!px-4 !py-2 rounded-lg transition-colors ${
                          selectedInquiry.status === 'resolved'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Respond Modal */}
      <AnimatePresence>
        {respondModalOpen && selectedInquiry && (
          <motion.div
            className="!fixed !inset-0 !bg-black/50 !z-50 !flex !items-center !justify-center !p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRespondModalOpen(false)}
          >
            <motion.div
              className="!bg-white !rounded-2xl !max-w-2xl !w-full !max-h-[90vh] !overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="!p-6">
                <div className="flex justify-between items-center !mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Respond to Inquiry</h3>
                  <button
                    onClick={() => setRespondModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleRespond} className="!space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 !mb-1">
                      To
                    </label>
                    <p className="text-gray-900">{selectedInquiry.fullName} &lt;{selectedInquiry.email}&gt;</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 !mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={responseForm.subject}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 !mb-1">
                      Message
                    </label>
                    <textarea
                      value={responseForm.message}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                      rows="8"
                      className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your response message here..."
                    />
                  </div>

                  <div className="flex space-x-3 justify-end !pt-4">
                    <button
                      type="button"
                      onClick={() => setRespondModalOpen(false)}
                      className="!px-4 !py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="!px-4 !py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading && <LoadingSpinner size="small" />}
                      Send Response
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && selectedInquiry && (
          <motion.div
            className="!fixed !inset-0 !bg-black/50 !z-50 !flex !items-center !justify-center !p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              className="!bg-white !rounded-2xl !max-w-md !w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="!p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="!mt-3 text-lg font-semibold text-gray-900 text-center">Delete Inquiry</h3>
                <p className="!mt-2 text-sm text-gray-500 text-center">
                  Are you sure you want to delete this price inquiry from {selectedInquiry.fullName}? This action cannot be undone.
                </p>
                <div className="!mt-6 flex space-x-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 !px-4 !py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteInquiry}
                    disabled={actionLoading}
                    className="flex-1 !px-4 !py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading && <LoadingSpinner size="small" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceInquiries;
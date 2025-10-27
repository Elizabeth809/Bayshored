import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AuthorForm from '../components/AuthorForm';
import AdminLoadingSpinner from '../components/AdminLoadingSpinner';

const PLACEHOLDER_IMAGE = 'https://placehold.co/40x40/EFEFEF/AAAAAA&text=NA';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { token } = useAuth();

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/v1/authors');
      const data = await response.json();
      
      if (data.success) {
        setAuthors(data.data);
      } else {
        setMessage('Failed to fetch authors: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      setMessage('Network error occurred while fetching authors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuthor = async (formData) => {
    setFormLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/v1/authors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Author created successfully!');
        setModalOpen(false);
        fetchAuthors();
      } else {
        setMessage(data.message || 'Failed to create author');
      }
    } catch (error) {
       console.error('Create author error:', error);
      setMessage('Network error occurred during creation');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAuthor = async (formData) => {
    setFormLoading(true);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/v1/authors/${editingAuthor._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Author updated successfully!');
        setModalOpen(false);
        setEditingAuthor(null);
        fetchAuthors(); 
      } else {
        setMessage(data.message || 'Failed to update author');
      }
    } catch (error) {
      console.error('Update author error:', error);
      setMessage('Network error occurred during update');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveAuthor = async (formData) => {
    if (editingAuthor) {
      await handleUpdateAuthor(formData);
    } else {
      await handleCreateAuthor(formData);
    }
  };

  const handleDelete = async (authorId) => {
    if (!window.confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
      return;
    }
     setMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/v1/authors/${authorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Author deleted successfully!');
        fetchAuthors();
      } else {
        setMessage(data.message || 'Failed to delete author');
      }
    } catch (error) {
       console.error('Delete author error:', error);
      setMessage('Network error occurred during deletion');
    }
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setMessage('');
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAuthor(null);
    setMessage(''); 
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAuthor(null);
  };

  if (loading && authors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <AdminLoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Authors Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center cursor-pointer"
        >
          <svg className="w-5 h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Author
        </button>
      </div>

      {/* Message Area */}
      {message && (
        <div className={`!p-4 rounded-lg text-sm ${
          message.includes('successfully')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`} role="alert">
          {message}
        </div>
      )}

      {/* Table Area */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bio
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && authors.length > 0 && (
                 <tr><td colSpan="5" className="text-center py-4"><AdminLoadingSpinner /></td></tr>
              )}
              {!loading && authors.map((author) => (
                <tr key={author._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover bg-gray-200"
                          src={author.profileImage || PLACEHOLDER_IMAGE} 
                          alt={author.name}
                          onError={(e) => { e.target.onerror = null; e.target.src=PLACEHOLDER_IMAGE }}
                        />
                      </div>
                      <div className="!ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {author.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate max-w-[200px]" title={author.email}>{author.email || '-'}</div>
                    <div className="text-sm text-blue-500 hover:text-blue-700 truncate max-w-[200px]" title={author.website}>
                      {author.website ? <a href={author.website} target="_blank" rel="noopener noreferrer">{author.website}</a> : '-'}
                    </div>
                  </td>
                  <td className="!px-6 !py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={author.bio}>
                       {author.bio || '-'}
                    </div>
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(author.createdAt).toLocaleDateString()}
                  </td>
                  <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-3"> {/* Increased space */}
                    <button
                      onClick={() => openEditModal(author)}
                      className="text-indigo-600 hover:text-indigo-900 transition duration-200 cursor-pointer"
                      title={`Edit ${author.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(author._id)}
                      className="text-red-600 hover:text-red-900 transition duration-200 cursor-pointer"
                       title={`Delete ${author.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Authors Message */}
        {!loading && authors.length === 0 && (
          <div className="text-center !py-12">
            <div className="text-gray-400 !mb-4">
              <svg className="!mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-500">No authors found. Click "Add New Author" to get started!</p>
          </div>
        )}
      </div>

      {/* Author Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingAuthor ? 'Edit Author' : 'Add New Author'}
        size="large"
      >
        <AuthorForm
          key={editingAuthor ? editingAuthor._id : 'new'}
          author={editingAuthor}
          onSave={handleSaveAuthor}
          onCancel={closeModal}
          loading={formLoading}
          errorMessage={!message.includes('successfully') ? message : ''} // Pass only error messages to form
        />
      </Modal>
    </div>
  );
};

export default Authors;
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState({ name: '', bio: '', profileImage: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { token } = useAuth();

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/authors');
      const data = await response.json();
      
      if (data.success) {
        setAuthors(data.data);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      setMessage('Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage('');

    try {
      const url = editingAuthor 
        ? `http://localhost:5000/api/v1/authors/${editingAuthor._id}`
        : 'http://localhost:5000/api/v1/authors';
      
      const method = editingAuthor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(editingAuthor ? 'Author updated successfully!' : 'Author created successfully!');
        setModalOpen(false);
        resetForm();
        fetchAuthors();
      } else {
        setMessage(data.message || 'Failed to save author');
      }
    } catch (error) {
      setMessage('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (authorId) => {
    if (!window.confirm('Are you sure you want to delete this author?')) {
      return;
    }

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
      setMessage('Network error occurred');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', bio: '', profileImage: '' });
    setEditingAuthor(null);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      bio: author.bio,
      profileImage: author.profileImage || ''
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
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
        <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 cursor-pointer"
        >
          Add New Author
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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
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
            {authors.map((author) => (
              <tr key={author._id} className="hover:bg-gray-50">
                <td className="!px-6 !py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{author.name}</div>
                </td>
                <td className="!px-6 !py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">{author.bio}</div>
                </td>
                <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(author.createdAt).toLocaleDateString()}
                </td>
                <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium !space-x-2">
                  <button
                    onClick={() => openEditModal(author)}
                    className="text-blue-600 hover:text-blue-900 transition duration-200 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(author._id)}
                    className="text-red-600 hover:text-red-900 transition duration-200 cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {authors.length === 0 && (
          <div className="text-center !py-12">
            <p className="text-gray-500">No authors found. Create your first author!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAuthor ? 'Edit Author' : 'Add New Author'}
      >
        <form onSubmit={handleSubmit} className="!space-y-4 !p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Author Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              value={formData.profileImage}
              onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 !mb-1">
              Bio
            </label>
            <textarea
              required
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author biography"
            />
          </div>

          <div className="flex justify-end !space-x-3 !pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="!px-4 !py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center cursor-pointer"
            >
              {formLoading && <LoadingSpinner size="small" className="!mr-2" />}
              {editingAuthor ? 'Update' : 'Create'} Author
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Authors;
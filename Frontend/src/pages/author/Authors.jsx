import React, { useState, useEffect } from 'react';
import AuthorCard from '../../components/Author/AuthorCard'; // Adjust path as needed
import LoadingSpinner from '../../components/others/LoadingSpinner'; // Adjust path as needed
import { CLIENT_BASE_URL } from '../../components/others/clientApiUrl';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    setError('');
    try {
      // Use relative path because of Vite proxy
      const response = await fetch(`${CLIENT_BASE_URL}/api/v1/authors`); 
      const data = await response.json();
      
      if (data.success) {
        setAuthors(data.data);
      } else {
        setError(data.message || 'Failed to fetch authors');
      }
    } catch (err) {
      console.error('Error fetching authors:', err);
      setError('An error occurred while fetching authors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white !py-12">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 !mb-4">
          Meet Our Artists
        </h1>
        <p className="text-lg text-center text-gray-600 !mb-12 max-w-2xl !mx-auto">
          Discover the talented individuals behind the stunning artworks in our collection.
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 !p-4 rounded-lg border border-red-200">
            <p>Error: {error}</p>
            <button 
              onClick={fetchAuthors} 
              className="!mt-4 !px-4 !py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : authors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {authors.map((author) => (
              <AuthorCard key={author._id} author={author} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 !py-16">
            <p>No authors found at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Authors;
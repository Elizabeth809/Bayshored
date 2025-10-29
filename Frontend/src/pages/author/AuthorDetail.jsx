import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/others/LoadingSpinner'; // Adjust path
import ProductCard from '../../components/Products/ProductCard'; // Adjust path (You should have this already)
import { Mail, Link as LinkIcon, Instagram, Facebook, Twitter } from 'lucide-react';
import { CLIENT_BASE_URL } from '../../components/others/clientApiUrl';

// Define a placeholder image URL
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200?text=NA';

const AuthorDetail = () => {
  const { authorId } = useParams(); // Get author ID from URL parameter
  const [author, setAuthor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Fetch Author Details
  useEffect(() => {
    const fetchAuthorDetails = async () => {
      setLoadingAuthor(true);
      setError('');
      try {
        const response = await fetch(`${CLIENT_BASE_URL}/api/v1/authors/${authorId}`);
        const data = await response.json();
        if (data.success) {
          setAuthor(data.data);
        } else {
          setError(data.message || 'Author not found');
        }
      } catch (err) {
        console.error('Error fetching author details:', err);
        setError('Failed to load author details.');
      } finally {
        setLoadingAuthor(false);
      }
    };

    fetchAuthorDetails();
  }, [authorId]);

  // Fetch Products by Author
  useEffect(() => {
    // Only fetch products if author details are loaded successfully
    if (author) {
      const fetchAuthorProducts = async () => {
        setLoadingProducts(true);
        //setError(''); // Keep previous errors if any
        try {
          // --- IMPORTANT: Ensure your backend supports this ---
          // Assuming /api/v1/products?author=AUTHOR_ID fetches products by author
          const response = await fetch(`${CLIENT_BASE_URL}/api/v1/products?author=${authorId}`); 
          // --- END IMPORTANT ---
          
          const data = await response.json();
          if (data.success) {
            setProducts(data.data);
          } else {
             console.warn('Failed to fetch products for author:', data.message);
             setProducts([]); // Set empty if fetch fails but author exists
          }
        } catch (err) {
          console.error('Error fetching author products:', err);
          // Don't set main error, just log it or show a specific product error
        } finally {
          setLoadingProducts(false);
        }
      };
      
      fetchAuthorProducts();
    } else {
        // If author failed to load, don't try loading products
        setLoadingProducts(false);
        setProducts([]);
    }
  }, [author, authorId]); // Depend on author object

  if (loadingAuthor) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center text-center p-4">
        <div>
           <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Author</h2>
           <p className="text-gray-600 mb-6">{error || 'The requested author could not be found.'}</p>
           <Link to="/artists" className="text-blue-600 hover:underline">
             &larr; Back to Artists List
           </Link>
        </div>
      </div>
    );
  }

  const imageUrl = author.profileImage || PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-gray-50 !py-12">
      <div className="max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
        
        {/* Author Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 !p-8 !mb-12 overflow-hidden relative">
           {/* Optional: Add a subtle background pattern or gradient */}
           <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30 z-0"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={author.name}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200"
                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE }}
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 !mb-2">{author.name}</h1>
              <p className="text-gray-600 leading-relaxed !mb-6">{author.bio}</p>
              
              {/* Contact & Social Links */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                {author.email && (
                  <a href={`mailto:${author.email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <Mail size={16} /> {author.email}
                  </a>
                )}
                {author.website && (
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <LinkIcon size={16} /> Visit Website
                  </a>
                )}
                {author.socialMedia?.instagram && (
                  <a href={author.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-pink-600 transition-colors" title="Instagram">
                    <Instagram size={16} /> Instagram
                  </a>
                )}
                 {author.socialMedia?.facebook && (
                  <a href={author.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-700 transition-colors" title="Facebook">
                    <Facebook size={16} /> Facebook
                  </a>
                )}
                 {author.socialMedia?.twitter && (
                  <a href={author.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-sky-500 transition-colors" title="Twitter">
                    <Twitter size={16} /> Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Artworks Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 !mb-8 text-center md:text-left">
            Artworks by {author.name}
          </h2>

          {loadingProducts ? (
             <div className="flex justify-center items-center h-40">
               <LoadingSpinner />
             </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 bg-white !p-8 rounded-lg shadow-sm border border-gray-200">
              <p>No artworks found for this artist at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorDetail;
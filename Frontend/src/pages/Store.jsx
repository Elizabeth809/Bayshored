import { useAuth } from '../context/AuthContext';

const Store = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !py-12 !px-4 sm:!px-6 lg:!px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center !mb-8">Art Store</h1>
        <p className="text-center text-gray-600 !mb-12">
          {isAuthenticated 
            ? 'Welcome to our art store! Browse our collection.' 
            : 'Please login to start shopping.'}
        </p>
        
        <div className="text-center">
          <div className="bg-white !p-8 rounded-lg shadow-md max-w-md !mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 !mb-4">Store Coming Soon</h2>
            <p className="text-gray-600">
              Our art collection is being curated. Check back soon for amazing artworks!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
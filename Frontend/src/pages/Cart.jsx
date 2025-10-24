import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl !mx-auto !py-12 !px-4 sm:!px-6 lg:!px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center !mb-8">Shopping Cart</h1>
        
        <div className="text-center">
          <div className="bg-white !p-8 rounded-lg shadow-md max-w-md !mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 !mb-4">
              {isAuthenticated ? 'Your Cart is Empty' : 'Please Login'}
            </h2>
            <p className="text-gray-600">
              {isAuthenticated 
                ? 'Add some amazing artworks to your cart!' 
                : 'You need to be logged in to view your cart.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
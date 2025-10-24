import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Link 
      to={`/product/${product.slug}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="!p-4">
        <div className="!mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 !mt-1">{product.author?.name}</p>
        </div>

        <div className="flex items-center justify-between !mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-gray-500">
            {product.dimensions?.height} × {product.dimensions?.width} cm
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 !mb-3">
          <span>{product.medium}</span>
          <span className={`!px-2 !py-1 rounded-full text-xs ${
            product.stock > 10 
              ? 'bg-green-100 text-green-800' 
              : product.stock > 0 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-blue-600 text-white !py-2 !px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
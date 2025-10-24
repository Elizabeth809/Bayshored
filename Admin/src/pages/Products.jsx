const Products = () => {
  return (
    <div className="!space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="bg-blue-600 text-white !px-4 !py-2 rounded-lg hover:bg-blue-700 transition duration-200">
          Add New Product
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm !p-8 text-center">
        <p className="text-gray-500">Products management coming soon...</p>
      </div>
    </div>
  );
};

export default Products;
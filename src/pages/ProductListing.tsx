import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, Grid, List, Star, Heart } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

const ProductListing = () => {
  const { category } = useParams();
  const { products, getProductsByCategory } = useProducts();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const displayProducts = useMemo(() => {
    let filteredProducts = category ? getProductsByCategory(category) : products;

    // Apply price filter
    filteredProducts = filteredProducts.filter(
      product => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply size filter
    if (selectedSizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.sizes.some(size => selectedSizes.includes(size))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        return [...filteredProducts].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...filteredProducts].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...filteredProducts].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...filteredProducts].reverse();
      default:
        return filteredProducts;
    }
  }, [products, category, getProductsByCategory, priceRange, selectedSizes, sortBy]);

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ') : 'All Products';

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryTitle}</h1>
          <p className="text-gray-600">Discover our premium collection of {categoryTitle.toLowerCase()}</p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <span className="text-gray-600">{displayProducts.length} products</span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>

            <div className="flex bg-white rounded-lg shadow">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-yellow-500 text-white' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-yellow-500 text-white' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1 rounded border ${
                          selectedSizes.includes(size)
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className={`${showFilters ? 'lg:w-3/4' : 'w-full'}`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow group">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-red-50 transition-colors">
                        <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                      </button>
                      {product.originalPrice && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{product.rating}</span>
                        </div>
                      </div>
                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white text-center py-2 rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/4">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 md:h-32 object-cover rounded-lg"
                        />
                      </div>
                      <div className="md:w-3/4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                          <button className="p-2 hover:bg-gray-100 rounded-full">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-gray-600 mb-4">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{product.rating} ({product.reviews} reviews)</span>
                            </div>
                          </div>
                          <Link
                            to={`/product/${product.id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {displayProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
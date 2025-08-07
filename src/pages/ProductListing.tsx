import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Filter, Grid, List, Star, Heart } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ProductListing = () => {
  const { category } = useParams();
  const location = useLocation();
  const { products } = useProducts();
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, 'categories'));
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, []);

  // Get search and sort term from URL
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('search')?.toLowerCase() || '';
  const sortParam = searchParams.get('sort') || '';

  // Filter and sort products by category, search term, and sort param
  const displayProducts = useMemo(() => {
    let filtered = selectedCategory === 'all'
      ? products
      : products.filter(p => p.category === selectedCategory);
    if (searchTerm) {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
      );
    }
    // Sorting logic
    if (sortParam === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortParam === 'rating-desc') {
      filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortParam === 'rating-asc') {
      filtered = [...filtered].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }
    return filtered;
  }, [products, selectedCategory, searchTerm, sortParam]);

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ') : 'All Products';

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">{categoryTitle}</h1>
          <p className="text-text-secondary">Discover our premium collection of {categoryTitle.toLowerCase()}</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <span className="text-text-secondary">{displayProducts.length} products</span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortParam ? sortParam : 'featured'}
              onChange={(e) => {
                const value = e.target.value;
                // Update sort param in URL
                const params = new URLSearchParams(location.search);
                if (value === 'featured') {
                  params.delete('sort');
                } else if (value === 'price-low') {
                  params.set('sort', 'price-asc');
                } else if (value === 'price-high') {
                  params.set('sort', 'price-desc');
                } else if (value === 'rating') {
                  params.set('sort', 'rating-desc');
                } else if (value === 'newest') {
                  params.set('sort', 'newest');
                }
                navigate({
                  pathname: location.pathname,
                  search: params.toString()
                });
              }}
              className="bg-card px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>

            <div className="flex bg-card rounded-lg shadow">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600'}`}
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
              <div className="bg-card rounded-lg shadow p-6">
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
                    <div className="flex justify-between text-sm text-text-secondary">
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
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
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
                  <div key={product.id} className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow group">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          try {
                            await addDoc(collection(db, 'wishlists'), {
                              userId: user.uid,
                              productId: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.images[0],
                              addedAt: new Date()
                            });
                            setToastMessage('Added to wishlist!');
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          } catch (error) {
                            console.error('Error adding to wishlist:', error);
                            setToastMessage('Failed to add to wishlist');
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          }
                        }}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-red-50 transition-colors">
                        <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                      </button>
                      {product.originalPrice && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-text-primary mb-2">{product.name}</h3>
                      <p className="text-text-secondary text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-text-primary">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-text-secondary">{product.rating}</span>
                        </div>
                      </div>
                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full bg-primary hover:bg-primary-dark text-white text-center py-2 rounded-lg font-medium transition-colors"
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
                  <div key={product.id} className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6">
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
                          <h3 className="text-xl font-semibold text-text-primary">{product.name}</h3>
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!user) {
                                navigate('/login');
                                return;
                              }
                              try {
                                await addDoc(collection(db, 'wishlists'), {
                                  userId: user.uid,
                                  productId: product.id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.images[0],
                                  addedAt: new Date()
                                });
                                setToastMessage('Added to wishlist!');
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 2000);
                              } catch (error) {
                                console.error('Error adding to wishlist:', error);
                                setToastMessage('Failed to add to wishlist');
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 2000);
                              }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full">
                            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                          </button>
                        </div>
                        <p className="text-text-secondary mb-4">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-text-primary">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-text-secondary">{product.rating} ({product.reviews} reviews)</span>
                            </div>
                          </div>
                          <Link
                            to={`/product/${product.id}`}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
                <p className="text-text-secondary text-lg">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 text-base sm:text-lg font-semibold animate-fadeIn max-w-sm sm:max-w-none mx-auto">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ProductListing;
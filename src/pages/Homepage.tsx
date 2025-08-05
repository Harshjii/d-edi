import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Truck, Shield, Headphones, RotateCcw } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

// Utility to get all unique categories from products
const useProductCategories = () => {
  const { products } = useProducts();
  return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
};

const Homepage = () => {
  const { getFeaturedProducts } = useProducts();
  const featuredProducts = getFeaturedProducts();
  const categories = useProductCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 via-red-500 to-red-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeInUp">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight drop-shadow-lg">
                <span className="block text-yellow-300 animate-gradient">D-EDI</span>
                <span className="block">Premium Fashion Collection</span>
              </h1>
              <p className="text-xl lg:text-2xl text-yellow-100 leading-relaxed">
                Discover exclusive custom clothing with modern designs and Indian ethnic flair. Shop like a pro, feel unique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-50 transition-colors flex items-center justify-center group shadow-lg hover:scale-105"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/products/ethnic"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-red-600 transition-colors flex items-center justify-center shadow-lg hover:scale-105"
                >
                  Ethnic Collection
                </Link>
              </div>
              <div className="flex items-center space-x-8 text-yellow-100">
                <div className="text-center">
                  <div className="text-3xl font-bold">{featuredProducts.length}</div>
                  <div className="text-sm">Featured Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{categories.length}</div>
                  <div className="text-sm">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="text-sm">Rating</div>
                </div>
              </div>
            </div>
            <div className="relative animate-fadeInUp flex justify-center">
              <img
                src="https://images.pexels.com/photos/8422805/pexels-photo-8422805.jpeg"
                alt="Fashion Model"
                className="rounded-2xl shadow-2xl object-cover w-full h-96 lg:h-[600px] animate-zoomIn border-4 border-yellow-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group animate-fadeInUp">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders above ₹999</p>
            </div>
            <div className="text-center group animate-fadeInUp">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure payment processing</p>
            </div>
            <div className="text-center group animate-fadeInUp">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <RotateCcw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-600">30-day hassle-free returns</p>
            </div>
            <div className="text-center group animate-fadeInUp">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round the clock customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Discover our premium collection of clothing</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.length === 0 ? (
              <div className="text-center py-12 col-span-4">
                <p className="text-gray-500 text-lg">No categories found. Add products to see categories.</p>
              </div>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/products/${cat}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white animate-fadeInUp border-2 border-gray-100 hover:border-yellow-400"
                >
                  <div className="aspect-w-3 aspect-h-4">
                    <img
                      src={
                        cat === 'mens' ? 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg'
                        : cat === 'womens' ? 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'
                        : cat === 'kids' ? 'https://images.pexels.com/photos/8720680/pexels-photo-8720680.jpeg'
                        : 'https://images.pexels.com/photos/8422805/pexels-photo-8422805.jpeg'
                      }
                      alt={cat}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                    <p className="text-gray-200">Shop the latest in {cat}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600">Handpicked items from our latest collection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.slice(0, 6).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden animate-fadeInUp border-2 border-gray-100 hover:border-yellow-400"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
                  />
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{product.rating} ({product.reviews})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="bg-gradient-to-r from-yellow-500 to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-red-700 transition-all inline-flex items-center group shadow-lg hover:scale-105"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-red-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 text-blue-100">Get the latest updates on new arrivals and exclusive offers</p>
          <div className="max-w-md mx-auto flex shadow-lg rounded-lg overflow-hidden animate-fadeInUp">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 px-8 py-4 rounded-r-lg font-semibold transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
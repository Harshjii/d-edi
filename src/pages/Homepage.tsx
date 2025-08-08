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

  // ** IMPORTANT: Replace this with the URL of your video from Catbox.moe **
  const catboxVideoUrl = "https://files.catbox.moe/s1ds5h.mp4"; 
  
  // ** (Optional) You can create and upload a poster image to Catbox as well **
  const posterImageUrl = "..assets/frame-1.png"; 

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-primary-dark opacity-80 z-10"></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={posterImageUrl}
          className="absolute z-0 w-full h-full object-cover"
          src={catboxVideoUrl}
        >
          Your browser does not support the video tag.
        </video>
        <div className="relative z-20 container mx-auto px-4 animate-fadeInUp">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-4 text-shadow-lg">
            Style Redefined
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl text-secondary-light mb-8 text-shadow">
            Discover exclusive custom clothing with modern designs and Indian ethnic flair. Shop like a pro, feel unique.
          </p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-r from-accent to-accent-dark text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 animate-background-pan"
            style={{ backgroundSize: '200%' }}
          >
            Explore The Collection
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center group animate-fadeInUp">
              <div className="flex items-center justify-center mb-4">
                <Truck className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
              <p className="text-text-secondary">On all orders over ₹499</p>
            </div>
            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
              <p className="text-text-secondary">Protected by Stripe & SSL</p>
            </div>
            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-center mb-4">
                <RotateCcw className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Returns</h3>
              <p className="text-text-secondary">10-day money-back guarantee</p>
            </div>
            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center justify-center mb-4">
                <Headphones className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
              <p className="text-text-secondary">Always here to help you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">Shop by Category</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              From timeless classics to modern trends, find your perfect fit.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, index) => (
              <Link
                key={cat}
                to={`/products/${cat}`}
                className="group relative block overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <img
                  src={
                    cat === 'mens' ? 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                    : cat === 'womens' ? 'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                    : cat === 'kids' ? 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                    : 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                  }
                  alt={cat}
                  className="w-full h-96 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-3xl font-bold text-white mb-2">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                  <div className="flex items-center text-accent-light font-semibold">
                    Shop Now <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">Featured Products</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Handpicked items from our latest collection, just for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden animate-fadeInUp border border-gray-100"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative overflow-hidden">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </Link>
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      SALE
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-text-primary h-14">
                    <Link to={`/product/${product.id}`} className="hover:text-accent transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-text-primary">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-md text-gray-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-text-secondary">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              to="/products"
              className="text-accent font-bold text-lg inline-flex items-center group"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

       {/* Newsletter Section */}
       <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Join Our Community</h2>
          <p className="text-xl mb-8 text-secondary-light">Get the latest updates on new arrivals and exclusive offers.</p>
          <div className="max-w-md mx-auto flex shadow-lg rounded-full overflow-hidden animate-fadeInUp border-2 border-primary-light">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-l-full text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="bg-accent hover:bg-accent-dark px-8 py-4 rounded-r-full font-semibold transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
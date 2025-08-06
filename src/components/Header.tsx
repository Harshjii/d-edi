import React, { useState, useEffect } from 'react';
import logo from '../assets/lbb.jpg';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, Heart, ChevronDown, Home, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

// ProfileMenu component for user dropdown
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      const menu = document.getElementById('profile-menu-dropdown');
      if (menu && !menu.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 text-gray-700 hover:text-yellow-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden md:block font-medium">{user.name || user.email?.split('@')[0] || 'User'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id="profile-menu-dropdown"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4 mr-3" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchDisabled, setSearchDisabled] = useState(false);
  
  // Get unique categories from Firebase products
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return uniqueCategories;
  }, [products]);
  
  // Track route changes to disable search
  const [lastPath, setLastPath] = useState(window.location.pathname);
  useEffect(() => {
    if (window.location.pathname !== lastPath) {
      setSearchDisabled(true);
      setSearchTerm("");
      setTimeout(() => setSearchDisabled(false), 500);
      setLastPath(window.location.pathname);
    }
  }, [window.location.pathname, lastPath]);

  // Dynamic search: fetch products from Firebase
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let url = '/products';
    if (selectedCategory) {
      url += `/${encodeURIComponent(selectedCategory)}`;
    }
    const params = [];
    if (searchTerm.trim()) {
      params.push(`search=${encodeURIComponent(searchTerm.trim())}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    navigate(url);
    setIsMenuOpen(false); // Close mobile menu after search
  };

  // YouTube-style navigation links with dynamic categories
  const navigationLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/products", label: "All Products", icon: Package },
    ...categories.map(category => ({
      to: `/products/${category}`,
      label: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
      icon: Package
    }))
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs sm:text-sm font-medium">
            Free shipping on orders above ₹999 | Follow us @deepjotclothingstore
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src={logo}
              alt="D-EDI Logo"
              className="w-8 h-8 lg:w-12 lg:h-12 object-contain rounded-lg border-2 border-yellow-400 shadow-lg"
            />
            <span className="text-xl lg:text-3xl font-bold text-navy-900 tracking-wide">D-EDI</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
            <form className="relative w-full flex space-x-2" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all"
                  disabled={searchDisabled}
                />
                <button type="submit" className="absolute left-3 top-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-700 font-medium shadow-sm min-w-[140px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Desktop User Menu */}
            <div className="hidden sm:block">
              {user ? (
                <ProfileMenu user={user} onLogout={handleLogout} />
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-yellow-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:block font-medium">Login</span>
                </Link>
              )}
            </div>

            {/* Wishlist */}
            <Link 
              to="/wishlist" 
              className="p-2 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors relative"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* YouTube-style Categories Bar - Desktop */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
            {navigationLinks.slice(0, 8).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-yellow-500 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-yellow-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {navigationLinks.length > 8 && (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-yellow-600 transition-colors">
                  <span>More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {navigationLinks.slice(8).map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-slideDown">
            <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Mobile Search */}
              <div className="px-2">
                <form className="space-y-3" onSubmit={handleSearch}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm"
                      disabled={searchDisabled}
                    />
                    <button type="submit" className="absolute left-3 top-3">
                      <Search className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-700 font-medium shadow-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat: string) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                </form>
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-1 px-2">
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-colors ${
                        isActive 
                          ? 'bg-yellow-500 text-white shadow-md' 
                          : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Section */}
              <div className="border-t border-gray-100 pt-4 px-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 font-medium rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Dashboard</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 font-medium rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-3 text-center border border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-semibold rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
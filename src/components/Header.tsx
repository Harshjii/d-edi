import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// ProfileMenu component for user dropdown
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  React.useEffect(() => {
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
        className="flex items-center space-x-2 text-gray-700 hover:text-yellow-600"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <User className="w-6 h-6" />
        <span className="hidden md:block">{user.name}</span>
      </button>
      {open && (
        <div
          id="profile-menu-dropdown"
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
        >
          <Link
            to="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
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
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">Free shipping on orders above ₹999 | Follow us @deepjotclothingstore</p>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-2xl font-bold text-navy-900">D-EDI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Home</Link>
            <Link to="/products/t-shirts" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">T-Shirts</Link>
            <Link to="/products/dresses" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Dresses</Link>
            <Link to="/products/ethnic" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Ethnic Wear</Link>
            <Link to="/products" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">All Products</Link>
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <ProfileMenu user={user} onLogout={handleLogout} />
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-yellow-600">
                <User className="w-6 h-6" />
              </Link>
            )}

            <Link to="/wishlist" className="text-gray-700 hover:text-yellow-600">
              <Heart className="w-6 h-6" />
            </Link>

            <Link to="/cart" className="relative text-gray-700 hover:text-yellow-600">
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              <Link to="/" className="text-gray-700 hover:text-yellow-600 font-medium">Home</Link>
              <Link to="/products/t-shirts" className="text-gray-700 hover:text-yellow-600 font-medium">T-Shirts</Link>
              <Link to="/products/dresses" className="text-gray-700 hover:text-yellow-600 font-medium">Dresses</Link>
              <Link to="/products/ethnic" className="text-gray-700 hover:text-yellow-600 font-medium">Ethnic Wear</Link>
              <Link to="/products" className="text-gray-700 hover:text-yellow-600 font-medium">All Products</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
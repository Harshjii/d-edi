import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/lbb.jpg';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, Heart, ChevronDown, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

// ProfileMenu component for user dropdown
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Fetch full user details from Firestore for the dropdown
  const [fullUser, setFullUser] = useState(user);

  useEffect(() => {
    let ignore = false;
    async function fetchUserDetails() {
      if (!user?.uid) return;
      try {
        const { db } = await import('../firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && !ignore) {
          setFullUser({ ...user, ...userDoc.data() });
        }
      } catch (e) {
        // fallback to auth user
        setFullUser(user);
      }
    }
    fetchUserDetails();
    return () => { ignore = true; };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        className="flex items-center space-x-2 text-text-primary hover:text-accent p-2 rounded-lg hover:bg-background transition-all duration-300"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden md:block font-medium">{fullUser.name || fullUser.email?.split('@')[0] || 'User'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed bg-card rounded-xl shadow-xl border border-gray-200 py-2 z-[70] w-56"
             style={{
               top: profileMenuRef.current ?
                 profileMenuRef.current.getBoundingClientRect().bottom + 8 + 'px' : '100%',
               left: profileMenuRef.current ?
                 Math.max(8, profileMenuRef.current.getBoundingClientRect().right - 224) + 'px' : 'auto'
             }}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-text-primary">{fullUser.name || 'User'}</p>
            <p className="text-sm text-text-secondary truncate">{fullUser.email}</p>
            {fullUser.phone && (
              <p className="text-xs text-gray-400 truncate">Phone: {fullUser.phone}</p>
            )}
            {fullUser.address && (
              <p className="text-xs text-gray-400 truncate">Address: {fullUser.address}</p>
            )}
            {fullUser.role && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                fullUser.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {fullUser.role}
              </span>
            )}
          </div>
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-sm text-text-primary hover:bg-background transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            Dashboard
          </Link>
          {fullUser.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center px-4 py-3 text-sm text-text-primary hover:bg-background transition-colors"
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
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchDisabled, setSearchDisabled] = useState(false);

  // Get unique categories from products
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    setCategories(cats);
  }, [products]);

  // Track route changes to disable search
  const [lastPath, setLastPath] = useState(window.location.pathname);
  useEffect(() => {
    if (window.location.pathname !== lastPath) {
      setSearchDisabled(true);
      setTimeout(() => setSearchDisabled(false), 500);
      setLastPath(window.location.pathname);
    }
  }, [window.location.pathname, lastPath]);

  // Dynamic search
  const handleSearch = (e) => {
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
  };

  // Responsive mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showDesktopCategories, setShowDesktopCategories] = useState(false);
  const desktopSearchInputRef = useRef(null);
  const desktopCategoryDropdownRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // For closing on outside click or Escape
  useEffect(() => {
    function handleClick(e) {
      if (showSearchInput && desktopSearchInputRef.current && !desktopSearchInputRef.current.contains(e.target) && !e.target.closest('[aria-label="Toggle search"]')) {
        setShowSearchInput(false);
      }
      if (showDesktopCategories && desktopCategoryDropdownRef.current && !desktopCategoryDropdownRef.current.contains(e.target)) {
        setShowDesktopCategories(false);
      }
    }
  
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setShowSearchInput(false);
        setShowDesktopCategories(false);
      }
    }
  
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSearchInput, showDesktopCategories]);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-card shadow-lg border-b border-gray-200">
      {/* Top banner */}
      <div className="bg-primary-dark text-white py-2 text-center text-xs sm:text-sm font-medium">
        Free shipping on orders above ₹499 | Follow us @d_edi9
      </div>
      {/* Main header */}
      <div className="w-full px-2 lg:px-8 py-2 relative">
      {/* Desktop nav links */}
      <div className="hidden lg:flex items-center w-full h-16 gap-4 px-3 xl:px-8">
        <Link to="/" className="flex items-center space-x-2 mr-2">
          <img src={logo} alt="D-EDI Logo" className="w-10 h-10 object-contain rounded-lg border-2 border-accent shadow-lg" />
          <span className="text-xl font-bold text-primary-dark tracking-wide">D-EDI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-text-primary hover:text-accent font-medium transition-all duration-300">Home</Link>
          <Link to="/products" className="text-text-primary hover:text-accent font-medium transition-all duration-300">Products</Link>
          <a href="/#featured-products" className="text-text-primary hover:text-accent font-medium transition-all duration-300">Featured Products</a>
        </nav>
        <div className="flex-1" />
        <Link to="/cart" className="relative p-2 text-text-primary hover:text-accent rounded-lg hover:bg-background transition-colors">
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-primary-dark w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">{cartItemsCount}</span>}
        </Link>
        <form className={`flex items-center transition-all duration-300 bg-background rounded-lg shadow-sm border border-gray-200 relative ${showSearchInput ? 'w-full max-w-md px-2 ml-2' : 'w-0 px-0 ml-0 overflow-hidden'} h-10`} onSubmit={handleSearch} ref={desktopSearchInputRef}>
          {showSearchInput && <Search className="w-5 h-5 text-gray-400 absolute left-3" />}
          <input type="text" placeholder="Search for products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none" disabled={searchDisabled} autoFocus={showSearchInput} />
        </form>
        <button className={`p-2 ml-1 text-text-primary hover:text-accent rounded-lg hover:bg-background transition-colors`} onClick={() => setShowSearchInput(v => !v)} aria-label="Toggle search">
          {showSearchInput ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
        </button>
        {user ? <ProfileMenu user={user} onLogout={handleLogout} /> : <Link to="/login" className="p-2 ml-1 text-text-primary hover:text-accent rounded-lg hover:bg-background transition-colors"><User className="w-6 h-6" /></Link>}
      </div>
      
      {/* Redesigned Mobile header */}
      <div className="flex lg:hidden items-center w-full h-14 relative px-2">
        {/* Default Header View */}
        <div className={`flex items-center justify-between w-full transition-opacity duration-300 ${showSearchInput ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Left: Hamburger */}
          <button className="p-2 text-text-primary hover:text-accent rounded-lg hover:bg-background" onClick={() => setShowMobileMenu(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Center: Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="D-EDI Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="text-lg font-bold text-primary-dark tracking-wide">D-EDI</span>
          </Link>

          {/* Right: Icons */}
          <div className="flex items-center gap-1">
            <button className="p-2 text-text-primary hover:text-accent rounded-lg hover:bg-background" onClick={() => setShowSearchInput(true)} aria-label="Toggle search">
              <Search className="w-6 h-6" />
            </button>
            <Link to="/cart" className="relative p-2 text-text-primary hover:text-accent rounded-lg hover:bg-background">
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && <span className="absolute top-0 right-0 bg-accent text-primary-dark w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold">{cartItemsCount}</span>}
            </Link>
            {user ? <ProfileMenu user={user} onLogout={handleLogout} /> : <Link to="/login" className="p-2 text-text-primary hover:text-accent rounded-lg hover:bg-background"><User className="w-6 h-6" /></Link>}
          </div>
        </div>
        
        {/* Search Overlay View */}
        <div className={`absolute inset-0 flex items-center bg-card transition-opacity duration-300 ${showSearchInput ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
          <form className="w-full flex items-center" onSubmit={handleSearch} ref={mobileSearchInputRef}>
            <div className="flex items-center w-full h-10 px-2 bg-background rounded-lg border border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-full pl-2 bg-transparent focus:outline-none" disabled={searchDisabled} autoFocus={showSearchInput}/>
            </div>
            <button type="button" className="p-2 text-text-primary" onClick={() => setShowSearchInput(false)}>
              <X className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
          <div className="bg-card shadow-lg w-64 max-w-full h-full p-6 overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500" onClick={() => setShowMobileMenu(false)}><X size={24} /></button>
            <div className="mt-8">
              <h3 className="text-lg font-bold text-accent flex items-center mb-4"><Menu className="w-5 h-5 mr-2" />Menu</h3>
              <Link to="/" className="block px-4 py-3 text-text-primary hover:text-accent hover:bg-background font-medium rounded-lg" onClick={() => setShowMobileMenu(false)}>Home</Link>
              <Link to="/dashboard#wishlist" className="block px-4 py-3 text-text-primary hover:text-accent hover:bg-background font-medium rounded-lg" onClick={() => setShowMobileMenu(false)}>Wishlist</Link>
              <Link to="/cart" className="block px-4 py-3 text-text-primary hover:text-accent hover:bg-background font-medium rounded-lg" onClick={() => setShowMobileMenu(false)}>Cart</Link>
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-bold text-accent flex items-center mb-4"><Tag className="w-5 h-5 mr-2" />Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link key={cat} to={`/products/${cat}`} className="block px-4 py-2 text-text-primary hover:bg-background hover:text-accent rounded-lg" onClick={() => setShowMobileMenu(false)}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileMenu(false)} />
        </div>
      )}
    </div>
    </header>
  );
};

export default Header;
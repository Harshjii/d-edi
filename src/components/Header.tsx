import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/lbb.jpg';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, Heart, ChevronDown } from 'lucide-react';
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
        className="flex items-center space-x-2 text-gray-700 hover:text-yellow-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden md:block font-medium">{fullUser.name || fullUser.email?.split('@')[0] || 'User'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fixed bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[70] w-56"
             style={{
               top: profileMenuRef.current ? 
                 profileMenuRef.current.getBoundingClientRect().bottom + 8 + 'px' : '100%',
               left: profileMenuRef.current ? 
                 Math.max(8, profileMenuRef.current.getBoundingClientRect().right - 224) + 'px' : 'auto'
             }}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{fullUser.name || 'User'}</p>
            <p className="text-sm text-gray-500 truncate">{fullUser.email}</p>
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
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            Dashboard
          </Link>
          {fullUser.role === 'admin' && (
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
      // Don't clear search term, just disable temporarily
      setTimeout(() => setSearchDisabled(false), 500);
      setLastPath(window.location.pathname);
    }
  }, [window.location.pathname, lastPath]);

  // Dynamic search: fetch products from Firebase
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
    // Keep search input open and don't clear search term
  };

  // Responsive mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Expanding search input state
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showDesktopCategories, setShowDesktopCategories] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  // Separate refs for desktop and mobile search forms and dropdowns
  const desktopSearchInputRef = useRef(null);
  const desktopCategoryDropdownRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileCategoryDropdownRef = useRef(null);

  // For closing on outside click or Escape
  useEffect(() => {
    function handleClick(e) {
      const isDesktop = window.innerWidth >= 1024;
      
      // Handle desktop category dropdown
      if (showDesktopCategories && desktopCategoryDropdownRef.current) {
        if (!desktopCategoryDropdownRef.current.contains(e.target)) {
          setShowDesktopCategories(false);
        }
      }
      
      // Handle mobile category dropdown
      if (showMobileCategories && mobileCategoryDropdownRef.current) {
        if (!mobileCategoryDropdownRef.current.contains(e.target)) {
          setShowMobileCategories(false);
        }
      }
      
      // Handle search input closing
      if (showSearchInput) {
        const form = isDesktop ? desktopSearchInputRef.current : mobileSearchInputRef.current;
        if (form && !form.contains(e.target)) {
          setShowSearchInput(false);
        }
      }
    }
    
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setShowSearchInput(false);
        setShowDesktopCategories(false);
        setShowMobileCategories(false);
      }
    }
    
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSearchInput, showDesktopCategories, showMobileCategories]);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 text-center text-xs sm:text-sm font-medium">
        Free shipping on orders above ₹999 | Follow us @deepjotclothingstore
      </div>
      {/* Main header */}
      <div className="w-full px-2 lg:px-8 py-2 relative">
      {/* Desktop nav links (Home, Products, Featured Products) */}
      <div className="hidden lg:flex items-center w-full h-16 gap-4 px-3 xl:px-8 whitespace-nowrap overflow-x-auto">
        <Link to="/" className="flex items-center space-x-2 mr-2 min-w-fit">
          <img
            src={logo}
            alt="D-EDI Logo"
            className="w-10 h-10 object-contain rounded-lg border-2 border-yellow-400 shadow-lg"
          />
          <span className="text-xl font-bold text-navy-900 tracking-wide">D-EDI</span>
        </Link>
        <nav className="flex items-center gap-4 min-w-fit">
          <Link to="/" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Products</Link>
          <Link to="/featured" className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">Featured Products</Link>
        </nav>
        <div className="flex-1" />
        {/* Cart Icon */}
        <Link 
          to="/cart" 
          className="relative p-2 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label={`Shopping Cart with ${cartItemsCount} items`}
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
              {cartItemsCount}
            </span>
          )}
        </Link>
        {/* Search, Profile (desktop) */}
        <form
          className={`flex items-center transition-all duration-300 bg-white rounded-lg shadow-md border border-gray-200 relative ${showSearchInput ? 'w-full max-w-xs sm:max-w-sm md:max-w-md px-2 ml-2' : 'w-0 px-0 ml-0 overflow-hidden'} h-10 min-w-0`}
          style={{marginLeft: showSearchInput ? 8 : 0, marginRight: showSearchInput ? 8 : 0}}
          onSubmit={handleSearch}
          ref={desktopSearchInputRef}
        >
          {/* Only show the search icon inside the input when expanded */}
          {showSearchInput && (
            <span className="absolute left-3 top-2.5 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </span>
          )}
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-16 py-2 bg-transparent focus:outline-none text-base min-w-0"
            disabled={searchDisabled}
            autoFocus={showSearchInput}
            onKeyDown={e => { if (e.key === 'Escape') { setShowSearchInput(false); setShowDesktopCategories(false); } }}
          />
          {/* Category Dropdown */}
          <div className="relative" ref={desktopCategoryDropdownRef}>
            <button 
              type="button" 
              className="flex items-center px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded" 
              onClick={e => {
                e.preventDefault(); 
                e.stopPropagation();
                setShowDesktopCategories(v => !v);
              }}
            >
              <span className="text-xs mr-1">{selectedCategory ? (selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('-', ' ')) : 'All'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDesktopCategories ? 'rotate-180' : ''}`} />
            </button>
            {showDesktopCategories && (
              <div className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[70] max-h-64 overflow-y-auto w-48"
                   style={{
                     top: desktopCategoryDropdownRef.current ? 
                       desktopCategoryDropdownRef.current.getBoundingClientRect().bottom + 8 + 'px' : '100%',
                     left: desktopCategoryDropdownRef.current ? 
                       Math.max(8, desktopCategoryDropdownRef.current.getBoundingClientRect().right - 192) + 'px' : 'auto'
                   }}>
                <button 
                  type="button"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 text-sm" 
                  onClick={() => { 
                    setSelectedCategory(''); 
                    setShowDesktopCategories(false); 
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 text-sm"
                    onClick={() => { 
                      setSelectedCategory(cat); 
                      setShowDesktopCategories(false); 
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
        <button
          className={`p-2 ml-1 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0 ${showSearchInput ? 'bg-yellow-100' : ''}`}
          onClick={() => {
            if (!showSearchInput) {
              setShowSearchInput(true);
              setTimeout(() => {
                if (desktopSearchInputRef.current) {
                  const input = desktopSearchInputRef.current.querySelector('input');
                  if (input) input.focus();
                }
              }, 50);
            }
          }}
          aria-label="Open search"
          tabIndex={showSearchInput ? -1 : 0}
          style={{zIndex: 20}}
          disabled={showSearchInput}
        >
          <Search className="w-6 h-6" />
        </button>
        {user ? (
          <ProfileMenu user={user} onLogout={handleLogout} />
        ) : (
          <Link to="/login" className="p-2 ml-1 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
            <User className="w-6 h-6" />
          </Link>
        )}
      </div>
      {/* Mobile: single-line header */}
      <div className="flex lg:hidden items-center w-full h-14 gap-3 relative px-2">
        {/* Hamburger */}
        <button className="p-2 mr-1 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0" onClick={() => setShowMobileMenu(v => !v)}>
          <Menu className="w-6 h-6" />
        </button>
        {/* Expanding Search Input */}
        <form
          className={`flex items-center transition-all duration-300 bg-white rounded-lg shadow-md border border-gray-200 relative ${showSearchInput ? 'w-full max-w-xs sm:max-w-sm md:max-w-md px-2 ml-2' : 'w-0 px-0 ml-0 overflow-hidden'} h-10`}
          style={{marginLeft: showSearchInput ? 8 : 0, marginRight: showSearchInput ? 8 : 0}}
          onSubmit={handleSearch}
          ref={mobileSearchInputRef}
        >
          <span className="absolute left-3 top-2.5 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-16 py-2 bg-transparent focus:outline-none text-base"
            disabled={searchDisabled}
            autoFocus={showSearchInput}
            onKeyDown={e => { if (e.key === 'Escape') { setShowSearchInput(false); setShowMobileCategories(false); } }}
          />
          {/* Category Dropdown */}
          <div className="relative" ref={mobileCategoryDropdownRef}>
            <button 
              type="button" 
              className="flex items-center px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded" 
              onClick={e => {
                e.preventDefault(); 
                e.stopPropagation();
                setShowMobileCategories(v => !v);
              }}
            >
              <span className="text-xs mr-1">{selectedCategory ? (selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('-', ' ')) : 'All'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMobileCategories ? 'rotate-180' : ''}`} />
            </button>
            {showMobileCategories && (
              <div className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[70] max-h-64 overflow-y-auto w-48"
                   style={{
                     top: mobileCategoryDropdownRef.current ? 
                       mobileCategoryDropdownRef.current.getBoundingClientRect().bottom + 8 + 'px' : '100%',
                     left: mobileCategoryDropdownRef.current ? 
                       Math.max(8, mobileCategoryDropdownRef.current.getBoundingClientRect().right - 192) + 'px' : 'auto'
                   }}>
                <button 
                  type="button"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 text-sm" 
                  onClick={() => { 
                    setSelectedCategory(''); 
                    setShowMobileCategories(false); 
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 text-sm"
                    onClick={() => { 
                      setSelectedCategory(cat); 
                      setShowMobileCategories(false); 
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
        {/* Spacer to push icons right when search is open */}
        <div className="flex-1" />
        {/* Search Icon */}
        <button
          className={`p-2 ml-1 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0 ${showSearchInput ? 'bg-yellow-100' : ''}`}
          onClick={() => {
            if (!showSearchInput) {
              setShowSearchInput(true);
              setTimeout(() => {
                if (mobileSearchInputRef.current) {
                  const input = mobileSearchInputRef.current.querySelector('input');
                  if (input) input.focus();
                }
              }, 50);
            }
          }}
          aria-label="Open search"
          tabIndex={showSearchInput ? -1 : 0}
          style={{zIndex: 20}}
          disabled={showSearchInput}
        >
          <Search className="w-6 h-6" />
        </button>
        {/* Profile Icon */}
        {user ? (
          <ProfileMenu user={user} onLogout={handleLogout} />
        ) : (
          <Link to="/login" className="p-2 ml-1 text-gray-700 hover:text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
            <User className="w-6 h-6" />
          </Link>
        )}
      </div>
        {/* Mobile Categories Dropdown and Navigation */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex flex-col">
            <div className="bg-white shadow-lg w-64 max-w-full h-full p-6 overflow-y-auto relative">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowMobileMenu(false)}>&times;</button>
              
              {/* Categories Section */}
              <h3 className="text-lg font-bold mb-4 text-yellow-700 flex items-center"><Menu className="w-5 h-5 mr-2" />Categories</h3>
              <div className="mb-6">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products/${cat}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 text-base rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </Link>
                ))}
              </div>
              
              <div className="border-t pt-4">
                {/* Profile Section */}
                {user ? (
                  <div className="mb-4">
                    <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-yellow-600 rounded-lg transition-colors mb-1"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Dashboard
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-yellow-600 rounded-lg transition-colors mb-1"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-3"
                    >
                      <X className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="block px-4 py-3 text-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors mb-3" onClick={() => setShowMobileMenu(false)}>
                    Login
                  </Link>
                )}
                
                {/* Navigation Links */}
                <Link to="/wishlist" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 font-medium rounded-lg transition-colors" onClick={() => setShowMobileMenu(false)}>
                  Wishlist
                </Link>
                <Link to="/cart" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 font-medium rounded-lg transition-colors" onClick={() => setShowMobileMenu(false)}>
                  Cart
                </Link>
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Users, ShoppingCart, TrendingUp, X, Upload, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot, where, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { uploadToCloudinary } from '../utils/cloudinary';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Users pagination
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    shippingCharges: '',
    category: '',
    sizes: [],
    colors: [],
    images: [],
    inStock: true,
    rating: 5,
    reviews: 0,
    tags: [],
    featured: false
  });

  // Image upload state
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchOrders();
    fetchUsers();
  }, [user, navigate]);

  // Fetch users with pagination
  useEffect(() => {
    fetchUsers();
  }, [usersPage, usersSearch]);

  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('date', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date()
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q;
      
      if (usersSearch.trim()) {
        // Search by email or name
        q = query(
          usersRef,
          where('email', '>=', usersSearch.toLowerCase()),
          where('email', '<=', usersSearch.toLowerCase() + '\uf8ff'),
          orderBy('email'),
          limit(usersPerPage)
        );
      } else {
        q = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          limit(usersPerPage)
        );
      }

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setUsers(usersData);
      
      // Get total count for pagination
      const totalSnapshot = await getDocs(collection(db, 'users'));
      setTotalUsers(totalSnapshot.size);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadToCloudinary(file, 'products');
        return result.url;
      });

      const urls = await Promise.all(uploadPromises);
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
        shippingCharges: productForm.shippingCharges ? parseFloat(productForm.shippingCharges) : 0,
        rating: parseFloat(productForm.rating) || 5,
        reviews: parseInt(productForm.reviews) || 0
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      shippingCharges: '',
      category: '',
      sizes: [],
      colors: [],
      images: [],
      inStock: true,
      rating: 5,
      reviews: 0,
      tags: [],
      featured: false
    });
    setImageFiles([]);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      shippingCharges: product.shippingCharges?.toString() || '',
      rating: product.rating.toString(),
      reviews: product.reviews.toString()
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const toggleArrayItem = (array, item, setter) => {
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
    setter(prev => ({ ...prev, [array === productForm.sizes ? 'sizes' : 'colors']: newArray }));
  };

  // Enhanced dashboard stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const activeUsers = users.filter(user => {
    const lastLogin = user.lastLogin?.toDate?.() || user.createdAt?.toDate?.();
    if (!lastLogin) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastLogin > thirtyDaysAgo;
  }).length;

  // Enhanced analytics data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const salesData = last7Days.map(date => {
    const dayOrders = orders.filter(order => {
      const orderDate = order.date instanceof Date ? order.date : new Date(order.date);
      return orderDate.toISOString().split('T')[0] === date;
    });
    const sales = dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      sales,
      orders: dayOrders.length
    };
  });

  // Category distribution
  const categoryData = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const COLORS = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  // Order status distribution
  const orderStatusData = orders.reduce((acc, order) => {
    const status = order.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusChartData = Object.entries(orderStatusData).map(([name, value]) => ({
    name,
    value
  }));

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users }
  ];

  const totalUsersPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <p className="text-blue-100 mt-2">Manage your D-EDI store</p>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mb-8">
          <div className="flex overflow-x-auto scrollbar-hide space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors whitespace-nowrap min-w-max ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Revenue</h3>
                <p className="text-xl md:text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Orders</h3>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">+8% from last month</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Products</h3>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">+5 new this week</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Active Users</h3>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{activeUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            </div>

            {/* Enhanced Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Sales Overview (Last 7 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'sales' ? `₹${value}` : value,
                        name === 'sales' ? 'Revenue' : 'Orders'
                      ]} />
                      <Bar dataKey="sales" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customerName || order.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.amount}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.date.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Products Management</h2>
              <button
                onClick={() => setShowProductModal(true)}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Orders Management</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customerName || order.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.date.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.amount}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab with Pagination */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Users Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={usersSearch}
                    onChange={(e) => {
                      setUsersSearch(e.target.value);
                      setUsersPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading users...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name || 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role || 'user'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastLogin ? user.lastLogin.toDate().toLocaleDateString() : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalUsersPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                          disabled={usersPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setUsersPage(Math.min(totalUsersPages, usersPage + 1))}
                          disabled={usersPage === totalUsersPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(usersPage - 1) * usersPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(usersPage * usersPerPage, totalUsers)}
                            </span>{' '}
                            of <span className="font-medium">{totalUsers}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                              disabled={usersPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            {Array.from({ length: Math.min(5, totalUsersPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setUsersPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    usersPage === pageNum
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setUsersPage(Math.min(totalUsersPages, usersPage + 1))}
                              disabled={usersPage === totalUsersPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowProductModal(false)}></div>
            
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between p-4 md:p-6 border-b">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="mens">Men's</option>
                      <option value="womens">Women's</option>
                      <option value="kids">Kids</option>
                      <option value="t-shirts">T-Shirts</option>
                      <option value="dresses">Dresses</option>
                      <option value="ethnic">Ethnic Wear</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
                    <input
                      type="number"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Charges (₹)</label>
                    <input
                      type="number"
                      value={productForm.shippingCharges}
                      onChange={(e) => setProductForm(prev => ({ ...prev, shippingCharges: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={productForm.rating}
                      onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleArrayItem(productForm.sizes, size, setProductForm)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          productForm.sizes.includes(size)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleArrayItem(productForm.colors, color, setProductForm)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          productForm.colors.includes(color)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {uploading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Uploading images...</span>
                      </div>
                    )}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {productForm.images.map((url, index) => (
                          <div key={index} className="relative">
                            <img src={url} alt={`Product ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setProductForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, inStock: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-500 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-500 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
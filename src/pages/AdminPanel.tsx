import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Users, ShoppingCart, TrendingUp, X, Upload, Save, Search, ChevronLeft, ChevronRight, Check, CheckCircle, XCircle, Eye, MessageSquare, DollarSign, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot, where, Timestamp, doc, updateDoc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { uploadToCloudinary } from '../utils/cloudinary';
import { deleteUser } from 'firebase/auth';

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
  const [pendingReviews, setPendingReviews] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [colorInput, setColorInput] = useState('');


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

  // Order and User modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Product delete modal
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const [orderStatus, setOrderStatus] = useState("");


  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchOrders();
    fetchUsers();
    fetchCategories();
    if (activeTab === 'reviews') fetchPendingReviews();
  }, [user, navigate, activeTab]);

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

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      const docRef = await addDoc(collection(db, 'categories'), { name: newCategory });
      setCategories([...categories, { id: docRef.id, name: newCategory }]);
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Replace the fetchUsers function with the version from AdminPanelReference.tsx
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setTotalUsers(usersData.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Fetch pending reviews
  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const reviews = await Promise.all(
        snapshot.docs.map(async (reviewDoc) => {
          const data = reviewDoc.data();
          let productName = '';
          let productImage = '';
          if (data.productId) {
            const productSnap = await getDocs(
              query(collection(db, 'products'), where('__name__', '==', data.productId))
            );
            if (!productSnap.empty) {
              const prod = productSnap.docs[0].data();
              productName = prod.name || '';
              productImage = prod.images?.[0] || '';
            }
          }
          return {
            id: reviewDoc.id,
            ...data,
            productName,
            productImage,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        })
      );
      setPendingReviews(reviews);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      setPendingReviews([]);
    } finally {
      setLoading(false);
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
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'categories', label: 'Categories', icon: Tag }
  ];

  const totalUsersPages = Math.ceil(totalUsers / usersPerPage);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setShowOrderModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status: 'approved' });
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleRejectReview = async (reviewId) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status: 'rejected' });
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  // Add Mark as Delivered handler
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        lastUpdated: new Date(),
        // Optionally, add to orderHistory if you track it
      });
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };


    const handleApprovePayment = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: 'Approved' });
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setShowTransactionModal(false);
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  const handleDisapprovePayment = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: 'Disapproved' });
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setShowTransactionModal(false);
    } catch (error) {
      console.error('Error disapproving payment:', error);
    }
  };


  // Product delete handler
  const handleDeleteProduct = async (productId) => {
    // Immediately close the modal before starting async work
    setShowDeleteProductModal(false);
    setProductToDelete(null);
    try {
      await deleteProduct(productId);
      setToastMessage('Product deleted successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setToastMessage('Error deleting product');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // User delete handler 
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      setToastMessage('User deleted successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setToastMessage('Error deleting user');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    }
  };

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
                        onClick={() => {
                          setProductToDelete(product);
                          setShowDeleteProductModal(true);
                        }}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
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
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            title="View Order"
                          >
                            <Eye className="w-5 h-5 inline" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Order Modal (detailed, responsive) */}
            {showOrderModal && selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-2 sm:mx-4 relative overflow-y-auto max-h-[90vh]">
                  <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowOrderModal(false)}>&times;</button>
                  <h3 className="text-xl font-bold mb-4 px-4 pt-6 sm:pt-8">Order #{selectedOrder.id.slice(-8)}</h3>
                  <div className="px-4 pb-6 space-y-2 text-gray-700 text-sm sm:text-base">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>Customer: <span className="font-medium">{selectedOrder.customerName || selectedOrder.email}</span></div>
                      <div>Status: <span className="font-medium">{selectedOrder.status}</span></div>
                      <div>First Name: <span className="font-medium">{selectedOrder.firstName}</span></div>
                      <div>Last Name: <span className="font-medium">{selectedOrder.lastName}</span></div>
                      <div>Email: <span className="font-medium">{selectedOrder.email}</span></div>
                      <div>Phone: <span className="font-medium">{selectedOrder.phone}</span></div>
                      <div>Date: <span className="font-medium">{selectedOrder.date?.toLocaleDateString?.() || ''}</span></div>
                      <div>Payment Method: <span className="font-medium">{selectedOrder.paymentMethod || ''}</span></div>
                      <div>Payment Status: <span className="font-medium">{selectedOrder.paymentStatus || ''}</span></div>
                      <div>Subtotal: <span className="font-medium">₹{selectedOrder.subtotal}</span></div>
                      <div>GST: <span className="font-medium">₹{selectedOrder.gst}</span></div>
                      <div>Shipping Charges: <span className="font-medium">₹{selectedOrder.shippingCharges}</span></div>
                      <div>Total Amount: <span className="font-medium">₹{selectedOrder.amount}</span></div>
                      <div>Total Items: <span className="font-medium">{selectedOrder.totalItems}</span></div>
                    </div>
                    <div>Order Notes: <span className="font-medium">{selectedOrder.orderNotes}</span></div>
                    <div className="font-semibold mt-2">Shipping Address</div>
                    <div className="text-gray-600">{selectedOrder.shippingAddress?.fullAddress || ''}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>City: <span className="font-medium">{selectedOrder.shippingAddress?.city || ''}</span></div>
                      <div>State: <span className="font-medium">{selectedOrder.shippingAddress?.state || ''}</span></div>
                      <div>PIN Code: <span className="font-medium">{selectedOrder.shippingAddress?.pincode || ''}</span></div>
                    </div>
                    <div>Formatted Address: <span className="font-medium">{selectedOrder.shippingAddress?.formattedAddress || ''}</span></div>
                    <div className="font-semibold mt-2">Items:</div>
                    <ul className="pl-4 list-disc text-gray-700">
                      {selectedOrder.items?.map((item, idx) => (
                        <li key={idx} className="mb-1">
                          <span className="font-medium">{item.name}</span> x {item.quantity} (₹{item.price}) 
                          <span className="ml-2 text-xs text-gray-500">Size: {item.size}, Color: {item.color}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <select
                            value={orderStatus}
                            onChange={(e) => setOrderStatus(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                      <button
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder.id, orderStatus);
                          setShowOrderModal(false);
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => setShowOrderModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                          <th className="px-4 py-3"></th>
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
                              {
                                user.createdAt
                                  ? (
                                      // Handle Firestore Timestamp, Date, or string
                                      typeof user.createdAt.toDate === 'function'
                                        ? user.createdAt.toDate().toLocaleDateString()
                                        : user.createdAt instanceof Date
                                          ? user.createdAt.toLocaleDateString()
                                          : typeof user.createdAt === 'string'
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : 'N/A'
                                    )
                                  : 'N/A'
                              }
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastLogin ? user.lastLogin.toDate().toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="flex space-x-4">
                                <button
                                  onClick={() => handleViewUser(user)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {user.role !== 'admin' && (
                                  <button
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setShowDeleteUserModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Pending Reviews</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-3">
                            {review.productImage && (
                              <img src={review.productImage} alt={review.productName} className="w-10 h-10 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{review.productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {review.userName || review.userId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="text-yellow-500">
                              {Array.from({ length: typeof review.rating === 'number' ? review.rating : parseInt(review.rating) || 0 }, (_, i) => (
                                <svg key={i} className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.121-6.535L1 6.545l6.545-.954L10 0l2.454 5.591L19 6.545l-4.243 4.905 1.121 6.535z" />
                                </svg>
                              ))}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <p className="line-clamp-2">{review.comment}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveReview(review.id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Approve Review"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRejectReview(review.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Reject Review"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            {/* Optionally add media view button here */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Pending Transactions</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.filter(order => order.paymentStatus === 'Pending Approval').map((order) => (
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
                           <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                           <button
                            onClick={() => {
                              setSelectedTransaction(order);
                              setShowTransactionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Transaction"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
         {/* Category Manager Tab */}
         {activeTab === 'categories' && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Category Management</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New category name"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Add Category
                </button>
              </div>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
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
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
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
                  <div className="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-lg">
                    {productForm.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-2 py-1 rounded">
                        {color}
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({
                              ...prev,
                              colors: prev.colors.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-white hover:text-gray-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes(',')) {
                          const newColors = value.split(',')
                            .map(c => c.trim())
                            .filter(c => c && !productForm.colors.includes(c));
                          if (newColors.length > 0) {
                            setProductForm(prev => ({
                              ...prev,
                              colors: [...prev.colors, ...newColors]
                            }));
                          }
                          setColorInput('');
                        } else {
                          setColorInput(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && colorInput.trim()) {
                          e.preventDefault();
                          const newColor = colorInput.trim();
                          if (!productForm.colors.includes(newColor)) {
                            setProductForm(prev => ({
                              ...prev,
                              colors: [...prev.colors, newColor]
                            }));
                          }
                          setColorInput('');
                        }
                      }}
                      className="flex-1 bg-transparent focus:outline-none"
                      placeholder="Add colors..."
                    />
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

      {/* Order Modal (detailed, responsive) */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-2 sm:mx-4 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowOrderModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4 px-4 pt-6 sm:pt-8">Order #{selectedOrder.id.slice(-8)}</h3>
            <div className="px-4 pb-6 space-y-2 text-gray-700 text-sm sm:text-base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Customer: <span className="font-medium">{selectedOrder.customerName || selectedOrder.email}</span></div>
                <div>Status: <span className="font-medium">{selectedOrder.status}</span></div>
                <div>First Name: <span className="font-medium">{selectedOrder.firstName}</span></div>
                <div>Last Name: <span className="font-medium">{selectedOrder.lastName}</span></div>
                <div>Email: <span className="font-medium">{selectedOrder.email}</span></div>
                <div>Phone: <span className="font-medium">{selectedOrder.phone}</span></div>
                <div>Date: <span className="font-medium">{selectedOrder.date?.toLocaleDateString?.() || ''}</span></div>
                <div>Payment Method: <span className="font-medium">{selectedOrder.paymentMethod || ''}</span></div>
                <div>Payment Status: <span className="font-medium">{selectedOrder.paymentStatus || ''}</span></div>
                <div>Subtotal: <span className="font-medium">₹{selectedOrder.subtotal}</span></div>
                <div>GST: <span className="font-medium">₹{selectedOrder.gst}</span></div>
                <div>Shipping Charges: <span className="font-medium">₹{selectedOrder.shippingCharges}</span></div>
                <div>Total Amount: <span className="font-medium">₹{selectedOrder.amount}</span></div>
                <div>Total Items: <span className="font-medium">{selectedOrder.totalItems}</span></div>
              </div>
              <div>Order Notes: <span className="font-medium">{selectedOrder.orderNotes}</span></div>
              <div className="font-semibold mt-2">Shipping Address</div>
              <div className="text-gray-600">{selectedOrder.shippingAddress?.fullAddress || ''}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>City: <span className="font-medium">{selectedOrder.shippingAddress?.city || ''}</span></div>
                <div>State: <span className="font-medium">{selectedOrder.shippingAddress?.state || ''}</span></div>
                <div>PIN Code: <span className="font-medium">{selectedOrder.shippingAddress?.pincode || ''}</span></div>
              </div>
              <div>Formatted Address: <span className="font-medium">{selectedOrder.shippingAddress?.formattedAddress || ''}</span></div>
              <div className="font-semibold mt-2">Items:</div>
              <ul className="pl-4 list-disc text-gray-700">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="mb-1">
                    <span className="font-medium">{item.name}</span> x {item.quantity} (₹{item.price}) 
                    <span className="ml-2 text-xs text-gray-500">Size: {item.size}, Color: {item.color}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  >
                      <option value="Order Confirmed">Order Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                  </select>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, orderStatus);
                    setShowOrderModal(false);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal (detailed, responsive) */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-2 sm:mx-4 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowUserModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4 px-4 pt-6 sm:pt-8">User: {selectedUser.name || selectedUser.email}</h3>
            <div className="px-4 pb-6 space-y-6 text-gray-700 text-sm sm:text-base">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.role || 'user'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium">
                      {selectedUser.createdAt
                        ? (selectedUser.createdAt.seconds
                            ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString()
                            : (selectedUser.createdAt instanceof Date
                                ? selectedUser.createdAt.toLocaleDateString()
                                : (typeof selectedUser.createdAt === 'string'
                                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                                    : 'N/A')))
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-medium text-xs break-all">{selectedUser.id}</p>
                  </div>
                </div>
              </div>
              {/* Address Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Addresses</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedUser.addresses) && selectedUser.addresses.length > 0 ? (
                    selectedUser.addresses.map((addr: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white rounded px-3 py-2 border">
                        <span>{addr}</span>
                        {selectedUser.role !== 'admin' && (
                          <button
                            onClick={async () => {
                              // Remove address from Firestore and update modal state
                              try {
                                const { db } = await import('../firebase');
                                const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
                                await updateDoc(doc(db, 'users', selectedUser.id), {
                                  addresses: arrayRemove(addr)
                                });
                                setSelectedUser((prev: any) => ({
                                  ...prev,
                                  addresses: prev.addresses.filter((a: string) => a !== addr)
                                }));
                              } catch (e) {
                                // Optionally show error
                              }
                            }}
                            className="text-red-500 hover:underline text-xs ml-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No addresses found.</div>
                  )}
                </div>
              </div>
              {/* User Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">User Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{orders.filter(order => order.userId === selectedUser.id).length}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{orders.filter(order => order.userId === selectedUser.id).reduce((sum, order) => sum + (order.amount || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {orders.filter(order => order.userId === selectedUser.id && order.status === 'Delivered').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed Orders</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal (minimal, for demonstration) */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => { setShowDeleteUserModal(false); setUserToDelete(null); }}>&times;</button>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Delete User Account
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete the account for <strong>{userToDelete.name || userToDelete.email}</strong>?<br />
                This action cannot be undone and will permanently remove all user data.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(userToDelete.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-2 sm:mx-4 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowTransactionModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4 px-4 pt-6 sm:pt-8">Transaction Details</h3>
            <div className="px-4 pb-6 space-y-2 text-gray-700 text-sm sm:text-base">
              <div>Transaction ID: <span className="font-medium">{selectedTransaction.transactionId}</span></div>
              <div>Order ID: <span className="font-medium">#{selectedTransaction.id.slice(-8)}</span></div>
              <div>Customer: <span className="font-medium">{selectedTransaction.customerName || selectedTransaction.email}</span></div>
              <div>Amount: <span className="font-medium">₹{selectedTransaction.amount}</span></div>
              <div>Payment Method: <span className="font-medium">{selectedTransaction.paymentMethod}</span></div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => handleDisapprovePayment(selectedTransaction.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Disapprove
                </button>
                <button
                  onClick={() => handleApprovePayment(selectedTransaction.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Delete Product Confirmation Modal */}
      {showDeleteProductModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" 
              onClick={() => { 
                setShowDeleteProductModal(false); 
                setProductToDelete(null); 
              }}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Delete Product
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{productToDelete.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setShowDeleteProductModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(productToDelete.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
           )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
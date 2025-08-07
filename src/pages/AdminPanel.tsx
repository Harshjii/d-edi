import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Users, ShoppingCart, TrendingUp, X, Upload, Save, Eye, Check, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, startAfter, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Review } from '../types/review';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { uploadToCloudinary, optimizeImage } from '../utils/cloudinary';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Order and User modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  type Order = {
    id: string;
    userId: string;
    orderId?: string;
    customerName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    date: Date;
    status: string;
    amount: number;
    subtotal: number;
    gst: number;
    shippingCharges: number;
    shippingAddress: {
      fullAddress: string;
      city: string;
      state: string;
      pincode: string;
      formattedAddress: string;
    };
    paymentMethod: string;
    paymentStatus: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      size: string;
      color: string;
      image: string;
      subtotal: number;
      shippingCharges: number;
    }>;
    totalItems: number;
    orderHistory: Array<{
      status: string;
      date: Date;
      comment: string;
    }>;
    orderNotes?: string;
    lastUpdated: Date;
  };
  
  type User = {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    createdAt?: Date | null;
    phone?: string;
    address?: string;
    [key: string]: any;
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Store last documents for pagination
  const [lastOrderDoc, setLastOrderDoc] = useState<any>(null);

  // User pagination states
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastUserDoc, setLastUserDoc] = useState<any>(null);

  // Product form state
  type ProductForm = {
    name: string;
    description: string;
    price: string;
    originalPrice: string;
    shippingCharges: string;
    category: string;
    sizes: string[];
    colors: string[];
    images: string[];
    inStock: boolean;
    rating: string;
    reviews: string;
    tags: string[];
    featured: boolean;
  };
  const [productForm, setProductForm] = useState<ProductForm>({
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
    rating: '5',
    reviews: '0',
    tags: [],
    featured: false
  });

  // Image upload state
  const [uploading, setUploading] = useState(false);

  // Add new state for overview data
  const [overviewData, setOverviewData] = useState({
    recentOrders: [],
    totalRevenue: 0,
    totalOrders: 0,
    dailySales: {}
  });

  // First useEffect for tab changes and initial loading
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (activeTab === 'dashboard') {
      fetchOverviewData();
    } else if (activeTab === 'orders') {
      if (currentOrdersPage === 1) {
        setLastOrderDoc(null);
      }
      fetchOrders(currentOrdersPage, ordersPerPage);
    } else if (activeTab === 'users') {
      if (currentUsersPage === 1) {
        setLastUserDoc(null);
      }
      fetchUsers(currentUsersPage, usersPerPage);
    } else if (activeTab === 'reviews') {
      fetchPendingReviews();
    }
  }, [user, navigate, activeTab]);

  // Separate useEffect for orders pagination
  useEffect(() => {
    if (activeTab === 'orders' && user && user.role === 'admin') {
      fetchOrders(currentOrdersPage, ordersPerPage);
    }
  }, [currentOrdersPage, ordersPerPage]);

  // Separate useEffect for users pagination
  useEffect(() => {
    if (activeTab === 'users' && user && user.role === 'admin') {
      fetchUsers(currentUsersPage, usersPerPage);
    }
  }, [currentUsersPage, usersPerPage]);

  // New function to fetch overview data
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('date', '>=', sevenDaysAgo),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));

      // Calculate daily sales
      const dailySales = {};
      ordersData.forEach(order => {
        const dateStr = order.date.toISOString().slice(0, 10);
        dailySales[dateStr] = (dailySales[dateStr] || 0) + (order.amount || 0);
      });

      setOverviewData({
        recentOrders: ordersData,
        totalRevenue: ordersData.reduce((sum, order) => sum + (order.amount || 0), 0),
        totalOrders: ordersData.length,
        dailySales
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Updated fetch orders function with proper pagination
  const fetchOrders = async (page: number = 1, itemsPerPage: number = ordersPerPage) => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      
      // Get total count
      const totalSnapshot = await getDocs(collection(db, 'orders'));
      setTotalOrders(totalSnapshot.docs.length);

      // Create pagination query
      let ordersQuery;
      if (lastOrderDoc && page > 1) {
        ordersQuery = query(
          ordersRef,
          orderBy('date', 'desc'),
          startAfter(lastOrderDoc),
          limit(itemsPerPage)
        );
      } else {
        ordersQuery = query(
          ordersRef,
          orderBy('date', 'desc'),
          limit(itemsPerPage)
        );
      }

      const snapshot = await getDocs(ordersQuery);
      
      // Store the last document for next pagination
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastOrderDoc(lastVisible);

      const ordersData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let userData = null;
          if (data.userId) {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          }
          return {
            id: docSnap.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            userData
          };
        })
      );

      setOrders(ordersData);
      setHasMoreOrders(ordersData.length === itemsPerPage);
      setCurrentOrdersPage(page);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Add proper error handling
      setOrders([]);
      setHasMoreOrders(false);
    } finally {
      setLoading(false);
    }
  };

  // Replace the existing fetchUsers function with this one
  const fetchUsers = async (page: number = 1, itemsPerPage: number = usersPerPage) => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      
      // Get total count
      const totalSnapshot = await getDocs(collection(db, 'users'));
      setTotalUsers(totalSnapshot.docs.length);

      // Create pagination query
      let usersQuery;
      if (lastUserDoc && page > 1) {
        usersQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastUserDoc),
          limit(itemsPerPage)
        );
      } else {
        usersQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          limit(itemsPerPage)
        );
      }

      const snapshot = await getDocs(usersQuery);
      
      // Store the last document for next pagination
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastUserDoc(lastVisible);

      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);
      setHasMoreUsers(usersData.length === itemsPerPage);
      setCurrentUsersPage(page);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setHasMoreUsers(false);
    } finally {
      setLoading(false);
    }
  };

  // Add this handler function
  const handleUsersPerPageChange = (value: number) => {
    setUsersPerPage(value);
    setCurrentUsersPage(1);
    setLastUserDoc(null);
    fetchUsers(1, value);
  };

  const handleUsersPageChange = (page: number) => {
    fetchUsers(page);
  };

  // Add handleImageUpload function using Cloudinary
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadToCloudinary(file, 'products')
      );

      const results = await Promise.all(uploadPromises);
      const urls = results.map(result => result.url);
      
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  // Add fetchPendingReviews function
  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
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
          const productRef = doc(db, 'products', data.productId); // Fixed: Using doc correctly
          const productDoc = await getDoc(productRef);
          const productData = productDoc.data();
          
          return {
            id: reviewDoc.id,
            ...data,
            productName: productData?.name || 'Unknown Product',
            productImage: productData?.images[0] || null,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Review;
        })
      );
      
      setPendingReviews(reviews);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add review handling functions
  const handleApproveReview = async (reviewId: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: 'approved'
      });
      setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: 'rejected'
      });
      setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  // Add handleDeleteUser function
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Add handleMarkAsDelivered function
  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Delivered',
        'orderHistory': arrayUnion({
          status: 'Delivered',
          date: new Date(),
          comment: 'Order marked as delivered by admin'
        })
      });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'Delivered' }
          : order
      ));
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    }
  };

  // Add toggleArrayItem function
  const toggleArrayItem = (e: React.MouseEvent, array: string[], item: string, setter: Function, field: string) => {
    e.preventDefault();
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
    setter(prev => ({ ...prev, [field]: newArray }));
  };

  // --- Update useEffect to call fetchUsers when users tab is active ---
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (activeTab === 'dashboard') {
      fetchOverviewData();
    } else if (activeTab === 'orders') {
      setLastOrderDoc(null);
      fetchOrders(currentOrdersPage, ordersPerPage);
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reviews') {
      fetchPendingReviews();
    }
  }, [user, navigate, activeTab, currentOrdersPage, ordersPerPage]);

  // Add this before the return statement, after all hooks and functions
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare }
  ];

  // --- Replace Users Tab rendering with the simple table from AdminPanelReference.tsx ---
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Revenue</h3>
                <p className="text-xl md:text-2xl font-bold text-green-600">₹{overviewData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Orders</h3>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{overviewData.totalOrders}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Products</h3>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{products.length}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-sm md:text-base text-gray-600 mb-2">Total Users</h3>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{users.length}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(overviewData.dailySales).map(([date, sales]) => ({
                        name: date,
                        sales,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Object.entries(overviewData.dailySales).map(([date, sales]) => ({
                        name: date,
                        sales,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Orders Management</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={ordersPerPage}
                  onChange={(e) => handleOrdersPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-600">Loading orders...</div>
              </div>
            ) : (
              <>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id.slice(-8)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.customerName || `${order.firstName} ${order.lastName}` || order.email}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.date ? order.date.toLocaleDateString() : 'N/A'}
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
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {order.status !== 'Delivered' && (
                                  <button
                                    onClick={() => handleMarkAsDelivered(order.id)}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title="Mark as Delivered"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Orders Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    Showing {((currentOrdersPage - 1) * ordersPerPage) + 1} to {Math.min(currentOrdersPage * ordersPerPage, (currentOrdersPage - 1) * ordersPerPage + orders.length)} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOrdersPageChange(Math.max(1, currentOrdersPage - 1))}
                      disabled={currentOrdersPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentOrdersPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                      Page {currentOrdersPage}
                    </span>
                    <button
                      onClick={() => handleOrdersPageChange(currentOrdersPage + 1)}
                      disabled={!hasMoreOrders}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        !hasMoreOrders
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Users Management</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={usersPerPage}
                  onChange={(e) => handleUsersPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-600">Loading users...</div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                              {user.createdAt
                                ? (user.createdAt.seconds
                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                    : (user.createdAt instanceof Date
                                        ? user.createdAt.toLocaleDateString()
                                        : 'N/A'))
                              : 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
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
                </div>

                {/* Users Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    Showing {((currentUsersPage - 1) * usersPerPage) + 1} to {Math.min(currentUsersPage * usersPerPage, (currentUsersPage - 1) * usersPerPage + users.length)} of {totalUsers} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUsersPageChange(Math.max(1, currentUsersPage - 1))}
                      disabled={currentUsersPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentUsersPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                      Page {currentUsersPage}
                    </span>
                    <button
                      onClick={() => handleUsersPageChange(currentUsersPage + 1)}
                      disabled={!hasMoreUsers}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        !hasMoreUsers
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
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
                          {review.customerName || review.customerEmail}
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
                            {review.media && review.media.length > 0 && (
                              <button
                                onClick={() => handleViewMedia(review)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Media"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
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
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowOrderModal(false)}></div>
            
            <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between p-4 md:p-6 border-b">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Order Details - #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedOrder.customerName || `${selectedOrder.firstName} ${selectedOrder.lastName}` || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedOrder.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedOrder.phone || (selectedOrder.shippingAddress?.phone) || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">{selectedOrder.date ? selectedOrder.date.toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-green-600">₹{selectedOrder.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Address</p>
                      <p className="font-medium">{selectedOrder.shippingAddress?.fullAddress || selectedOrder.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium">{selectedOrder.shippingAddress?.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-medium">{selectedOrder.shippingAddress?.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">PIN Code</p>
                      <p className="font-medium">{selectedOrder.shippingAddress?.pincode || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Formatted Address</p>
                    <p className="font-medium mt-1">{selectedOrder.shippingAddress?.formattedAddress || selectedOrder.address}</p>
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                            <p className="text-sm text-gray-600">Size: {item.size || 'N/A'}, Color: {item.color || 'N/A'}</p>
                          </div>
                          <p className="font-medium">₹{item.price || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedOrder.status !== 'Delivered' && (
                    <button
                      onClick={() => {
                        handleMarkAsDelivered(selectedOrder.id);
                        setShowOrderModal(false);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Delivered</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowUserModal(false)}></div>
            
            <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between p-4 md:p-6 border-b">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  User Details - {selectedUser.name || selectedUser.email}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-6">
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
                      <p className="font-medium">{selectedUser.createdAt ? (selectedUser.createdAt instanceof Date ? selectedUser.createdAt.toLocaleDateString() : (typeof selectedUser.createdAt === 'string' ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A')) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-medium text-xs">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{selectedUser.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Address Information</h4>
                  <div className="text-sm text-gray-700">
                    <p>{selectedUser.address || 'N/A'}</p>
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

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedUser.role !== 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setUserToDelete(selectedUser);
                        setShowDeleteUserModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete User</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteUserModal(false)}></div>
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Delete User Account
                </h3>
                
                <p className="text-sm text-gray-600 text-center mb-6">
                  Are you sure you want to delete the account for <strong>{userToDelete.name || userToDelete.email}</strong>? 
                  This action cannot be undone and will permanently remove all user data.
                </p>

                <div className="flex space-x-3">
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
        </div>
      )}

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

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
                    <div className="flex flex-wrap gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <button
                          key={size}
                          type="button" // Important: Specify button type
                          onClick={(e) => toggleArrayItem(e, productForm.sizes, size, setProductForm, 'sizes')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                            productForm.sizes.includes(size)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{size}</span>
                          {productForm.sizes.includes(size) && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                    <div className="flex flex-wrap gap-2">
                      {['Red', 'Green', 'Blue', 'Black', 'White'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={(e) => toggleArrayItem(e, productForm.colors, color, setProductForm, 'colors')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                            productForm.colors.includes(color)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{color}</span>
                          {productForm.colors.includes(color) && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      multiple
                    />
                    <div className="flex flex-wrap gap-2">
                      {productForm.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={image} alt={`Product Image ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => setProductForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Product</span>
                      </>
                    )}
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
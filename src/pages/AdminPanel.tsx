import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { storage } from '../firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Package, ShoppingCart, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// services/orderService.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
// Fetch customers from Firebase
export const fetchCustomers = async () => {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      role: data.role ?? '',
      ...data
    };
  });
};

export const fetchOrders = async () => {
  const ordersRef = collection(db, "orders");
  const snapshot = await getDocs(ordersRef);
  // Ensure each order includes all expected fields, especially 'amount'
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      amount: data.amount ?? 0,
      customerName: data.customerName ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      paymentMethod: data.paymentMethod ?? '',
      date: data.date ?? null,
      status: data.status ?? '',
      items: data.items ?? [],
      ...data
    };
  });
};



const AdminPanel = () => {
  // State for customers
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  // State for orders, loading, revenue, and selected order (for modal)
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  // ...existing code...
  // ...existing code...
  // Pagination state for orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);
  const totalOrderPages = Math.ceil(orders.length / ordersPageSize);
  const paginatedOrders = orders.slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize);
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    shippingCharges: number;
    category: string;
    sizes: string[];
    colors: string[];
    images: string[];
    inStock: boolean;
    rating: number;
    reviews: number;
    tags: string[];
    featured: boolean;
  }>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    shippingCharges: 0,
    category: '',
    sizes: [],
    colors: [],
    images: [],
    inStock: true,
    rating: 0,
    reviews: 0,
    tags: [],
    featured: false
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const url = `https://api.cloudinary.com/v1_1/d-edi/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    // Use your actual Cloudinary upload preset
    formData.append('upload_preset', 'd-edi');
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
    return data.secure_url;
  };


    useEffect(() => {
    // Fetch customers and orders only once on mount
    setLoadingCustomers(true);
    fetchCustomers()
      .then(fetchedCustomers => {
        setCustomers(fetchedCustomers);
        setLoadingCustomers(false);
      })
      .catch((err) => {
        console.error('Error fetching customers:', err);
        toast.error('Error fetching customers: ' + (err?.message || err), { position: 'top-right', autoClose: 3000 });
        setLoadingCustomers(false);
      });

    setLoadingOrders(true);
    fetchOrders()
      .then(fetchedOrders => {
        setOrders(fetchedOrders);
        // Calculate total revenue from all orders
        const revenue = fetchedOrders.reduce((sum, order) => sum + (order.amount ? Number(order.amount) : 0), 0);
        setTotalRevenue(revenue);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error('Error fetching orders:', err);
        toast.error('Error fetching orders: ' + (err?.message || err), { position: 'top-right', autoClose: 3000 });
        setLoadingOrders(false);
      });
}, []);


  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = '';
    try {
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      await addProduct({ ...newProduct, images: imageUrl ? [imageUrl] : [] });
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        shippingCharges: 0,
        category: '',
        sizes: [],
        colors: [],
        images: [],
        inStock: true,
        rating: 0,
        reviews: 0,
        tags: [],
        featured: false
      });
      setImageFile(null);
      setShowAddProduct(false);
      toast.success('Product added successfully!', { position: 'top-right', autoClose: 2000 });
    } catch (err) {
      toast.error('Failed to add product: ' + (err as Error).message, { position: 'top-right', autoClose: 2000 });
    }
  };


  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleViewProduct = (product: any) => {
    setViewingProduct(product);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
  };

  const handleCloseProductModal = () => {
    setViewingProduct(null);
    setEditingProduct(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-red-600 to-yellow-600 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-red-100">Manage your D-EDI store</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Admin Menu</h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-red-50 text-red-600 border-l-4 border-red-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Store Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Total Products</h3>
                        <p className="text-3xl font-bold">{products.length}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Total Orders</h3>
                        <p className="text-3xl font-bold">{orders.length}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Total Revenue</h3>
                        <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Product Management</h2>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {showAddProduct && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative transform transition-all duration-300 scale-100 animate-slideUp">
                          <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-colors"
                            onClick={() => setShowAddProduct(false)}
                            aria-label="Close"
                          >
                            &times;
                          </button>
                          <h3 className="text-2xl font-bold mb-6 text-red-700">Add New Product</h3>
                          <form onSubmit={handleAddProduct} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                  type="text"
                                  value={newProduct.name}
                                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={newProduct.category}
                                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder="e.g. mens, womens, kids, t-shirts, dresses, ethnic"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input
                                  type="number"
                                  value={newProduct.price}
                                  onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                                <input
                                  type="number"
                                  value={newProduct.originalPrice}
                                  onChange={(e) => setNewProduct({ ...newProduct, originalPrice: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges (₹)</label>
                                <input
                                  type="number"
                                  value={newProduct.shippingCharges}
                                  onChange={(e) => setNewProduct({ ...newProduct, shippingCharges: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                              <div className="flex flex-wrap gap-3">
                                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                  <label key={size} className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      value={size}
                                      checked={newProduct.sizes.includes(size)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setNewProduct({ ...newProduct, sizes: [...newProduct.sizes, size] });
                                        } else {
                                          setNewProduct({ ...newProduct, sizes: newProduct.sizes.filter(s => s !== size) });
                                        }
                                      }}
                                      className="rounded border-gray-300 text-red-500"
                                    />
                                    <span>{size}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                              <div className="flex flex-wrap gap-3">
                                {['Red', 'Blue', 'Green', 'Black', 'White'].map(color => (
                                  <label key={color} className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      value={color}
                                      checked={newProduct.colors.includes(color)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setNewProduct({ ...newProduct, colors: [...newProduct.colors, color] });
                                        } else {
                                          setNewProduct({ ...newProduct, colors: newProduct.colors.filter(c => c !== color) });
                                        }
                                      }}
                                      className="rounded border-gray-300 text-red-500"
                                    />
                                    <span>{color}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newProduct.featured}
                                  onChange={(e) => setNewProduct({ ...newProduct, featured: e.target.checked })}
                                  className="rounded border-gray-300 text-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                              </label>
                            </div>
                            <div className="flex space-x-4">
                              <button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                              >
                                Add Product
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddProduct(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Shipping</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id} className="border-t">
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <p className="text-sm text-gray-600">ID: {product.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 capitalize">
                                {product.category.replace('-', ' ')}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium">₹{product.price}</td>
                              <td className="px-4 py-4 text-sm font-medium">₹{product.shippingCharges ?? 0}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex space-x-2">
                                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => handleViewProduct(product)}>
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" onClick={() => handleEditProduct(product)}>
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteProduct(product.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
  <div>
    <h2 className="text-2xl font-bold mb-6">Order Management</h2>

    {loadingOrders ? (
      <p className="text-gray-500">Loading orders...</p>
    ) : orders.length === 0 ? (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No orders found</p>
      </div>
    ) : (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="mr-2 font-medium text-gray-700">Rows per page:</label>
            <select
              value={ordersPageSize}
              onChange={e => {
                setOrdersPageSize(Number(e.target.value));
                setOrdersPage(1);
              }}
              className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
              onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
              disabled={ordersPage === 1}
            >
              Prev
            </button>
            <span className="font-medium text-gray-700">Page {ordersPage} of {totalOrderPages}</span>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
              onClick={() => setOrdersPage(p => Math.min(totalOrderPages, p + 1))}
              disabled={ordersPage === totalOrderPages}
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Order ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Customer</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Total</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="border-t group hover:bg-gray-50 relative">
                  <td className="px-4 py-2 text-sm">{order.id}</td>
                  <td className="px-4 py-2 text-sm">{order.customerName || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm font-medium">
                    ₹{order.amount ? Number(order.amount).toFixed(2) : '0.00'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {order.date?.toDate ? order.date.toDate().toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      className="px-5 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-md hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                      onClick={() => handleViewOrder(order)}
                      aria-label="View order details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}

                {activeTab === 'customers' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Customer Management</h2>
                    {loadingCustomers ? (
                      <p className="text-gray-500">Loading customers...</p>
                    ) : customers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No customers found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto border border-gray-200 rounded">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                              <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                              <th className="px-4 py-2 text-left text-sm font-semibold">Phone</th>
                              <th className="px-4 py-2 text-left text-sm font-semibold">Address</th>
                              <th className="px-4 py-2 text-left text-sm font-semibold">Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.map((customer) => (
                              <tr key={customer.id} className="border-t group hover:bg-gray-50 relative">
                                <td className="px-4 py-2 text-sm">{customer.name || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm">{customer.email || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm">{customer.phone || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm">{customer.address || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm">{customer.role || 'user'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing order details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative transform transition-all duration-300 scale-100 animate-slideUp">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-colors"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-green-700">Order Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Order ID:</span>
                <span>{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Customer Name:</span>
                <span>{selectedOrder.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Email:</span>
                <span>{selectedOrder.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Phone:</span>
                <span>{selectedOrder.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Address:</span>
                <span>{selectedOrder.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Payment Method:</span>
                <span>{selectedOrder.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Amount:</span>
                <span>₹{selectedOrder.amount ? Number(selectedOrder.amount).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Status:</span>
                <span>{selectedOrder.status || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Date:</span>
                <span>{selectedOrder.date?.toDate ? selectedOrder.date.toDate().toLocaleDateString() : '—'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Items:</span>
                <ul className="mt-2 ml-4 list-disc text-gray-600">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.name} x{item.quantity} — ₹{item.price}
                      </li>
                    ))
                  ) : (
                    <li>No items found</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing product details */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative transform transition-all duration-300 scale-100 animate-slideUp">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-colors"
              onClick={handleCloseProductModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-blue-700">Product Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Product ID:</span>
                <span>{viewingProduct.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Name:</span>
                <span>{viewingProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Category:</span>
                <span>{viewingProduct.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Price:</span>
                <span>₹{viewingProduct.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Original Price:</span>
                <span>₹{viewingProduct.originalPrice ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Shipping Charges:</span>
                <span>₹{viewingProduct.shippingCharges ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">In Stock:</span>
                <span>{viewingProduct.inStock ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Featured:</span>
                <span>{viewingProduct.featured ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="mt-2 text-gray-600">{viewingProduct.description}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Sizes:</span>
                <span className="ml-2 text-gray-600">{viewingProduct.sizes?.join(', ') || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Colors:</span>
                <span className="ml-2 text-gray-600">{viewingProduct.colors?.join(', ') || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Tags:</span>
                <span className="ml-2 text-gray-600">{viewingProduct.tags?.join(', ') || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Images:</span>
                <div className="flex gap-2 mt-2">
                  {viewingProduct.images?.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt="Product" className="w-16 h-16 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing product details */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative transform transition-all duration-300 scale-100 animate-slideUp">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-colors"
              onClick={handleCloseProductModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-yellow-700">Edit Product</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updateProduct(editingProduct.id, editingProduct);
                handleCloseProductModal();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.shippingCharges}
                    onChange={e => setEditingProduct({ ...editingProduct, shippingCharges: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured}
                    onChange={e => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="rounded border-gray-300 text-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
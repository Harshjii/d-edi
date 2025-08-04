import React, { useState } from 'react';
// import { storage } from '../firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Package, ShoppingCart, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

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
    const url = `https://api.cloudinary.com/v1_1/dfkupnkuc/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsinged_present');
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
    return data.secure_url;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = '';
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
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
                        <p className="text-3xl font-bold">24</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-semibold">Total Revenue</h3>
                        <p className="text-3xl font-bold">₹45,230</p>
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
                      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
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
                              <select
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                              >
                                <option value="">Select Category</option>
                                <option value="t-shirts">T-Shirts</option>
                                <option value="dresses">Dresses</option>
                                <option value="ethnic">Ethnic Wear</option>
                              </select>
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
                                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
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
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                    </div>
                  </div>
                )}

                {activeTab === 'customers' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Customer Management</h2>
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No customers yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
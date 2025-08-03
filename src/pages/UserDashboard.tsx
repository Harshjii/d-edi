import React, { useState } from 'react';
import { User, Package, Heart, MapPin, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  const mockOrders = [
    {
      id: 'ORD001',
      date: '2024-01-15',
      status: 'Delivered',
      total: 2499,
      items: [
        { name: 'Ethnic Kurta Set', quantity: 1, price: 2499 }
      ]
    },
    {
      id: 'ORD002',
      date: '2024-01-10',
      status: 'Shipped',
      total: 1598,
      items: [
        { name: 'Premium Cotton T-Shirt', quantity: 2, price: 899 }
      ]
    }
  ];

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'profile', label: 'Profile Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-yellow-500 to-red-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-yellow-100">Manage your account and track your orders</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Account</h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-yellow-50 text-yellow-600 border-l-4 border-yellow-500'
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
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">Order #{order.id}</h3>
                              <p className="text-gray-600">Placed on {order.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t">
                            <span className="font-semibold">Total: ₹{order.total}</span>
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
                              Track Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Your wishlist is empty</p>
                      <p className="text-gray-400">Start adding items you love!</p>
                    </div>
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Saved Addresses</h2>
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      Add New Address
                    </button>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      Add Payment Method
                    </button>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                    <form className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          defaultValue={user?.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        Save Changes
                      </button>
                    </form>
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

export default UserDashboard;
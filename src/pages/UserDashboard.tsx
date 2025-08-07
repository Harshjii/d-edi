import React, { useState, useEffect } from 'react';
import { User, Package, Heart, MapPin, CreditCard, Settings, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [profileEdit, setProfileEdit] = useState(profile);
  const [addressInput, setAddressInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const navigate = useNavigate();
  // Wishlist state
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  // Notification state
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);


  // Fetch wishlist
  React.useEffect(() => {
    if (!user?.uid) return;
    setWishlistLoading(true);
    const fetchWishlist = async () => {
      try {
        const q = query(
          collection(db, 'wishlists'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const wishlistData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWishlist(wishlistData);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setWishlistLoading(false);
      }
    };
    fetchWishlist();
  }, [user?.uid]);


  // Fetch user profile from Firestore
  React.useEffect(() => {
    if (!user?.uid) return;
    setProfileLoading(true);
    getDoc(doc(db, 'users', user.uid)).then((snapshot: any) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data());
        setProfileEdit(snapshot.data());
      } else {
        // If user doc doesn't exist, create it from Google Auth info
        const newProfile = {
          name: user.email || '',
          email: user.email || '',
          phone: ''
        };
        setDoc(doc(db, 'users', user.uid), newProfile);
        setProfile(newProfile);
        setProfileEdit(newProfile);
      }
      setProfileLoading(false);
    });
  }, [user?.uid]);

  // Fetch addresses
  React.useEffect(() => {
    if (!user?.uid) return;
    setAddressLoading(true);
    getDoc(doc(db, 'users', user.uid)).then((snapshot: any) => {
      const data = snapshot.data();
      setAddresses(data?.addresses || []);
      setAddressLoading(false);
    });
  }, [user?.uid]);

  // Fetch payment methods
  React.useEffect(() => {
    if (!user?.uid) return;
    setPaymentLoading(true);
    getDoc(doc(db, 'users', user.uid)).then((snapshot: any) => {
      const data = snapshot.data();
      setPayments(data?.payments || []);
      setPaymentLoading(false);
    });
  }, [user?.uid]);

  // Fetch orders
  React.useEffect(() => {
    if (!user?.uid) return;
    setLoadingOrders(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
    getDocs(q).then((snapshot: any) => {
      const userOrders = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
        };
      });
      setOrders(userOrders);
      setLoadingOrders(false);
    }).catch(() => setLoadingOrders(false));
  }, [user?.uid]);

  // Profile update handler
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), profileEdit);
    setProfile(profileEdit);
  };

  // Address add handler
  const handleAddAddress = async () => {
    if (!addressInput || !user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), {
      addresses: arrayUnion(addressInput)
    });
    setAddresses([...addresses, addressInput]);
    setAddressInput('');
  };

  // Address remove handler
  const handleRemoveAddress = async (addr: string) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), {
      addresses: arrayRemove(addr)
    });
    setAddresses(addresses.filter(a => a !== addr));
  };

  // Payment add handler
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    let newPayment;
    if (paymentType === 'card') {
      if (!cardDetails.cardNumber.match(/^\d{16}$/) || !cardDetails.name || !cardDetails.expiry.match(/^\d{2}\/\d{2}$/)) return;
      newPayment = {
        type: 'card',
        last4: cardDetails.cardNumber.slice(-4),
        name: cardDetails.name,
        expiry: cardDetails.expiry
      };
    } else {
      if (!upiId.match(/^\w+@[a-zA-Z]+$/)) return;
      newPayment = {
        type: 'upi',
        upiId
      };
    }
    await updateDoc(doc(db, 'users', user.uid), {
      payments: arrayUnion(newPayment)
    });
    setPayments([...payments, newPayment]);
    setShowPaymentModal(false);
    setCardDetails({ cardNumber: '', name: '', expiry: '', cvv: '' });
    setUpiId('');
  };

  // Payment remove handler
  const handleRemovePayment = async (pay: string) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), {
      payments: arrayRemove(pay)
    });
    setPayments(payments.filter(p => p !== pay));
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'profile', label: 'Profile Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-8 mb-8 text-white animate-fadeInUp">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-dark" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.email || 'User'}!</h1>
              <p className="text-gray-300">Manage your account and track your orders</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 animate-fadeInUp">
            <div className="bg-card rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Account</h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-background'
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

          <div className="lg:col-span-3 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            <div className="bg-card rounded-lg shadow">
              <div className="p-6">
                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-text-primary">My Orders</h2>
                    {loadingOrders ? (
                      <p className="text-text-secondary">Loading orders...</p>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-text-secondary">No orders found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-text-primary">{order.items.map(item => item.name).join(', ')}</h3>
                                <p className="text-text-secondary">Placed on {order.date.toLocaleDateString()}</p>
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
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-text-secondary">
                                  <span>{item.name} x {item.quantity}</span>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t">
                              <span className="font-semibold text-text-primary">
                                Total: ₹
                                {/* Fix: Use order.amount if present, else fallback to sum of items */}
                                {typeof order.amount === 'number'
                                  ? order.amount
                                  : order.items.reduce(
                                      (sum: number, item: any) => sum + (item.price * item.quantity), 0
                                    )
                                }
                              </span>
                              <button
                                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                                onClick={() => navigate(`/track/${order.id}`)}
                              >
                                Track Order
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-text-primary">My Wishlist</h2>
                    {wishlistLoading ? (
                      <p className="text-text-secondary">Loading wishlist...</p>
                    ) : wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-text-secondary">Your wishlist is empty</p>
                        <p className="text-gray-400">Start adding items you love!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.map((item) => (
                          <div key={item.id} className="bg-card rounded-lg shadow-sm overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                            <div className="p-4">
                              <h3 className="font-semibold text-text-primary mb-2">{item.name}</h3>
                              <p className="text-text-primary font-bold mb-4">₹{item.price}</p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.location.href = `/product/${item.productId}`}
                                  className="flex-1 bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    deleteDoc(doc(db, 'wishlists', item.id)).then(() => {
                                      setWishlist(prev => prev.filter(i => i.id !== item.id));
                                    });
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-text-primary">Saved Addresses</h2>
                    {addressLoading ? (
                      <p className="text-text-secondary">Loading addresses...</p>
                    ) : (
                      <div>
                        <ul className="mb-4 space-y-2">
                          {addresses.map((addr: string, idx: number) => (
                            <li key={idx} className="flex justify-between items-center p-3 bg-background rounded-lg">
                              <span className="text-text-secondary">{addr}</span>
                              <button onClick={() => handleRemoveAddress(addr)} className="text-red-500 hover:underline">Remove</button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={addressInput}
                            onChange={e => setAddressInput(e.target.value)}
                            className="flex-grow px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                            placeholder="Add new address"
                          />
                          <button onClick={handleAddAddress} className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium">Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-text-primary">Payment Methods</h2>
                    {paymentLoading ? (
                      <p className="text-text-secondary">Loading payment methods...</p>
                    ) : (
                      <div>
                        <ul className="mb-4 space-y-2">
                          {payments.map((pay: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center p-3 bg-background rounded-lg">
                              <span className="flex items-center gap-2 text-text-secondary">
                                {pay.type === 'card' ? <CreditCard className="w-5 h-5 text-blue-600" /> : <span className="text-green-600 font-bold">UPI</span>}
                                {pay.type === 'card'
                                  ? `Card ending in ${pay.last4} (${pay.expiry})`
                                  : `UPI: ${pay.upiId}`}
                              </span>
                              <button onClick={() => handleRemovePayment(pay)} className="text-red-500 hover:underline">Remove</button>
                            </li>
                          ))}
                        </ul>
                        <button onClick={() => setShowPaymentModal(true)} className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium">Add Payment Method</button>
                        {showPaymentModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
                            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                              <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowPaymentModal(false)}>&times;</button>
                              <h3 className="text-xl font-bold mb-4 text-primary-dark">Add Payment Method</h3>
                              <div className="mb-4 flex gap-4">
                                <button onClick={() => setPaymentType('card')} className={`px-4 py-2 rounded-lg font-medium ${paymentType === 'card' ? 'bg-accent text-white' : 'bg-gray-100 text-text-secondary'}`}>Card</button>
                                <button onClick={() => setPaymentType('upi')} className={`px-4 py-2 rounded-lg font-medium ${paymentType === 'upi' ? 'bg-accent text-white' : 'bg-gray-100 text-text-secondary'}`}>UPI</button>
                              </div>
                              <form onSubmit={handleAddPayment} className="space-y-4">
                                {paymentType === 'card' ? (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-text-secondary mb-1">Card Number</label>
                                      <input type="text" maxLength={16} value={cardDetails.cardNumber.replace(/\D/g, '')} onChange={e => setCardDetails({ ...cardDetails, cardNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent" placeholder="1234 5678 9012 3456" required />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-text-secondary mb-1">Name on Card</label>
                                      <input type="text" value={cardDetails.name} onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent" required />
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="flex-1">
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Expiry (MM/YY)</label>
                                        <input type="text" maxLength={5} value={cardDetails.expiry} onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value.replace(/[^\d\/]/g, '') })} className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent" placeholder="MM/YY" required />
                                      </div>
                                      <div className="flex-1">
                                        <label className="block text-sm font-medium text-text-secondary mb-1">CVV</label>
                                        <input type="password" maxLength={3} value={cardDetails.cvv} onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent" required />
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">UPI ID</label>
                                    <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent" placeholder="yourupi@bank" required />
                                  </div>
                                )}
                                <button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium">Add</button>
                              </form>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-text-primary">Profile Settings</h2>
                    {profileLoading ? (
                      <p className="text-text-secondary">Loading profile...</p>
                    ) : (
                      <form className="space-y-6" onSubmit={handleProfileSave}>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                          <input
                            type="text"
                            value={profileEdit.name}
                            onChange={e => setProfileEdit({ ...profileEdit, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                          <input
                            type="email"
                            value={profileEdit.email}
                            onChange={e => setProfileEdit({ ...profileEdit, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                          <input
                            type="tel"
                            value={profileEdit.phone}
                            onChange={e => setProfileEdit({ ...profileEdit, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                          />
                        </div>
                        <button type="submit" className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium transition-colors">
                          Save Changes
                        </button>
                      </form>
                    )}
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
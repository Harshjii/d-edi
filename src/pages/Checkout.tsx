import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Phone, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { auth , db } from '../firebase'; // adjust the path based on your structure
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { getProductById } = useProducts();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'card'
  });

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);



  // Check if cart is loaded
  useEffect(() => {
    // Give some time for cart context to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [cartItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Function to calculate total price and check stock
    const calculateOrderDetails = () => {
    if (!cartItems || cartItems.length === 0) {
      return {
        subtotal: 0,
        gst: 0,
        shippingCharges: 0,
        total: 0,
        hasOutOfStock: false
      };
    }

    // Get maximum shipping charge
    const shippingCharges = Math.max(...cartItems.map(item => item.shippingCharges || 0));

    // Calculate subtotal and check stock
    const { subtotal, hasOutOfStock } = cartItems.reduce((acc, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      const product = getProductById(item.id);
      
      return {
        subtotal: acc.subtotal + (itemPrice * itemQuantity),
        hasOutOfStock: acc.hasOutOfStock || !product?.inStock
      };
    }, { subtotal: 0, hasOutOfStock: false });

    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst + shippingCharges;

    return {
      subtotal,
      gst,
      shippingCharges,
      total,
      hasOutOfStock
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      setNotification({ type: 'error', message: 'You must be logged in to place an order.' });
      setIsSubmitting(false);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setNotification({ type: 'error', message: 'Your cart is empty.' });
      setIsSubmitting(false);
      return;
    }

    // Get order details
    const orderDetails = calculateOrderDetails();
    
    if (orderDetails.hasOutOfStock) {
      setNotification({ type: 'error', message: 'Some items in your cart are out of stock' });
      setIsSubmitting(false);
      return;
    }

    // Validation - ensure we have a valid total
    if (orderDetails.total <= 0) {
      setNotification({ type: 'error', message: 'Invalid order amount. Please check your cart.' });
      setIsSubmitting(false);
      return;
    }

    // Debug logs
    console.log('cartItems:', cartItems);
    console.log('Order details:', orderDetails);

    const order = {
      // User and Order Identification
      userId: user.uid,
      orderId: Math.random().toString(36).substring(2, 15),
      
      // Customer Information
      customerName: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,

      // Address Information
      shippingAddress: {
        fullAddress: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        formattedAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`
      },

      // Payment and Status
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === 'cod' ? 'Pending' : 'Paid',
      date: Timestamp.now(),
      status: 'Processing',
      lastUpdated: Timestamp.now(),

      // Order Details
      amount: orderDetails.total,
      subtotal: orderDetails.subtotal,
      gst: orderDetails.gst,
      shippingCharges: orderDetails.shippingCharges,
      
      // Order Summary
      totalItems: cartItems.reduce((sum, item) => sum + Number(item.quantity), 0),
      orderNotes: '',
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        size: item.size || '',
        color: item.color || '',
        image: item.image || '',
        subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 0),
        shippingCharges: item.shippingCharges || 0
      })),
      
      // Track Order History
      orderHistory: [{
        status: 'Processing',
        date: Timestamp.now(),
        comment: 'Order placed successfully'
      }]
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log('Order created with ID:', docRef.id);
      
      setNotification({ type: 'success', message: 'Order placed successfully!' });
      clearCart();
      
      setTimeout(() => {
        setNotification(null);
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      setNotification({ type: 'error', message: 'Something went wrong. Please try again.' });
    }
    
    setIsSubmitting(false);
  };

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const orderDetails = calculateOrderDetails();

  // Show loading spinner while cart is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading checkout...</h2>
        </div>
      </div>
    );
  }

  // Show message if cart is empty (only after loading is complete)
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Notification Pop-up */}
      {notification && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all transform animate-bounce
              ${notification.type === 'success' 
                ? 'bg-green-500 border-l-4 border-green-600' 
                : 'bg-red-500 border-l-4 border-red-600'
              }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✓' : '⚠'}
              </span>
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Information
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Select State</option>
                      <option value="maharashtra">Maharashtra</option>
                      <option value="delhi">Delhi</option>
                      <option value="karnataka">Karnataka</option>
                      <option value="tamil-nadu">Tamil Nadu</option>
                      <option value="gujarat">Gujarat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <label htmlFor="card" className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Credit/Debit Card
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="upi"
                    name="paymentMethod"
                    value="upi"
                    checked={formData.paymentMethod === 'upi'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <label htmlFor="upi">UPI</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cod"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <label htmlFor="cod">Cash on Delivery</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.size}, {item.color}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">₹{(Number(item.price) * Number(item.quantity)) || 0}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orderDetails.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{orderDetails.shippingCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{orderDetails.gst}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{orderDetails.total}</span>
                </div>
                {orderDetails.hasOutOfStock && (
                  <div className="text-red-600 text-sm font-medium">
                    Some items in your cart are out of stock
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || orderDetails.hasOutOfStock}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSubmitting || orderDetails.hasOutOfStock
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isSubmitting 
                  ? 'Placing Order...' 
                  : orderDetails.hasOutOfStock 
                    ? 'Some items are out of stock'
                    : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
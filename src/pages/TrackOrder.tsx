import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Package, CheckCircle, Truck, XCircle, MapPin, CreditCard } from 'lucide-react';

const TrackOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        }
      } catch (error) {
        setOrder(null);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Order not found</div>
      </div>
    );
  }

  const statuses = ["Payment Approval", "Order Confirmed", "Shipped", "Out for Delivery", "Delivered"];
  let currentStatusIndex = statuses.indexOf(order.status);
  if (currentStatusIndex === -1 && order.paymentStatus === "Pending Approval") {
    currentStatusIndex = 0;
  } else if (currentStatusIndex === -1) {
    currentStatusIndex = 1; // Default to Order Confirmed if status is unknown but payment is approved
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-4xl mx-auto animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Track Order</h2>
              <p className="text-gray-500 text-sm sm:text-base">Order #{order.id.slice(-8)}</p>
            </div>
            <Link to="/dashboard" className="text-yellow-600 hover:underline font-semibold mt-2 sm:mt-0">Back to Dashboard</Link>
          </div>

          {/* Timeline for larger screens */}
          <div className="my-8 hidden sm:block">
            <div className="flex justify-between items-center">
              {statuses.map((status, index) => (
                <div key={status} className="flex-1 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${index <= currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className={`mt-2 font-semibold transition-colors duration-500 ${index <= currentStatusIndex ? 'text-green-600' : 'text-gray-500'}`}>{status}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-[-2.5rem] mx-auto w-11/12">
              <div className="h-1 bg-gray-300 rounded-full"></div>
              <div
                className="absolute top-0 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Timeline for smaller screens */}
          <div className="my-8 sm:hidden">
            <div className="flex flex-col items-center">
              {statuses.map((status, index) => (
                <div key={status} className="flex items-center w-full mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${index <= currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className={`ml-4 font-semibold transition-colors duration-500 ${index <= currentStatusIndex ? 'text-green-600' : 'text-gray-500'}`}>{status}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Order Details</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>Placed On:</strong> {order.date?.toDate ? order.date.toDate().toLocaleDateString() : ''}</p>
                <p><strong>Total Amount:</strong> ₹{order.amount}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Shipping To</h3>
              <div className="text-gray-600">
                <p className="font-semibold">{order.customerName}</p>
                <p>{order.shippingAddress?.fullAddress}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Items in your order</h3>
            <div className="space-y-4">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center bg-gray-50 p-4 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4"/>
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
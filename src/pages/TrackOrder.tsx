import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle } from 'lucide-react';

const TrackOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animatedStatusIndex, setAnimatedStatusIndex] = useState(-1);

  const statuses = ["Payment Approval", "Order Confirmed", "Shipped", "Out for Delivery", "Delivered"];

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          setOrder(orderData);

          const finalStatusIndex = statuses.indexOf(orderData.status);

          if (finalStatusIndex > -1) {
            // Animate each status in sync with the green line
            let i = 0;
            const animateStep = () => {
              setAnimatedStatusIndex(i);
              if (i < finalStatusIndex) {
                setTimeout(() => {
                  i++;
                  animateStep();
                }, 350);
              }
            };
            animateStep();
          }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-text-secondary text-center">
          <p>Order not found.</p>
          <Link to="/dashboard" className="text-accent hover:underline font-semibold mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const finalStatusIndex = statuses.indexOf(order.status);
  const progressPercentage = finalStatusIndex >= 0 
    ? (finalStatusIndex / (statuses.length - 1)) * 100 
    : 0;
  
  // Calculate total animation time to sync the progress bar
  const totalAnimationTime = finalStatusIndex * 350 + 300; // Total time for all icons to pop

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-lg p-4 sm:p-8 max-w-4xl mx-auto animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Track Order</h2>
              <p className="text-text-secondary text-sm sm:text-base">Order #{order.id.slice(-8)}</p>
            </div>
            <Link to="/dashboard" className="text-accent hover:underline font-semibold mt-2 sm:mt-0">Back to Dashboard</Link>
          </div>

          <div className="w-full px-4 sm:px-0">
            <div className="relative flex justify-between items-center">
              {/* Timeline background */}
              <div className="absolute top-6 left-0 w-full h-1 -translate-y-1/2 bg-gray-300 z-0">
                {/* Green bar synced with pop animation */}
                <div
                  className="h-full bg-green-500 z-10"
                  style={{
                    width:
                      animatedStatusIndex >= 0
                        ? `calc(${(animatedStatusIndex) / (statuses.length - 1) * 100}% + ${(animatedStatusIndex === statuses.length - 1) ? '0px' : '24px'})`
                        : '0%',
                    transition: `width 350ms cubic-bezier(0.4,0,0.2,1)`
                  }}
                ></div>
              </div>
              {statuses.map((status, index) => (
                <div key={status} className="relative z-20 text-center flex-1">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${index <= animatedStatusIndex ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <CheckCircle
                      className={`w-6 h-6 text-white transition-transform duration-300 ${index <= animatedStatusIndex ? 'animate-icon-pop' : 'scale-0'}`}
                    />
                  </div>
                  <p className={`mt-2 font-semibold text-xs sm:text-sm transition-colors duration-300 ${index <= animatedStatusIndex ? 'text-green-600' : 'text-text-secondary'}`}>{status}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-primary">Order Details</h3>
              <div className="space-y-2 text-text-secondary">
                <p><strong>Placed On:</strong> {order.date?.toDate ? order.date.toDate().toLocaleDateString() : ''}</p>
                <p><strong>Total Amount:</strong> ₹{order.amount}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-primary">Shipping To</h3>
              <div className="text-text-secondary">
                <p className="font-semibold">{order.customerName}</p>
                <p>{order.shippingAddress?.fullAddress}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Items in your order</h3>
            <div className="space-y-4">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center bg-background p-4 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4"/>
                  <div className="flex-grow">
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-text-primary">₹{item.price * item.quantity}</p>
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
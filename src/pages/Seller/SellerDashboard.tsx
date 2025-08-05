import React from 'react'
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import SellerLayout from '../../components/Layout/SellerLayout'
import StatsCard from '../../components/UI/StatsCard'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useProducts } from '../../hooks/useProducts'
import { useOrders } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'

export default function SellerDashboard() {
  const { products, loading: productsLoading } = useProducts()
  const { orders, loading: ordersLoading } = useOrders()
  const { user } = useAuth()

  // Filter data for current seller
  const sellerProducts = products.filter(p => p.seller_id === user?.id)
  const sellerOrders = orders.filter(o => o.seller_id === user?.id)
  const totalRevenue = sellerOrders.reduce((sum, order) => sum + order.amount, 0)
  const recentOrders = sellerOrders.slice(0, 5)

  const stats = [
    {
      title: 'Total Products',
      value: sellerProducts.length,
      icon: ShoppingBagIcon,
      change: { value: '12%', type: 'increase' as const }
    },
    {
      title: 'Total Orders',
      value: sellerOrders.length,
      icon: ShoppingCartIcon,
      change: { value: '8%', type: 'increase' as const }
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: { value: '15%', type: 'increase' as const }
    },
    {
      title: 'Product Views',
      value: '2.4K',
      icon: EyeIcon,
      change: { value: '5%', type: 'decrease' as const }
    }
  ]

  if (productsLoading || ordersLoading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </SellerLayout>
    )
  }

  return (
    <SellerLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Seller Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back! Here's an overview of your store performance.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm flex items-center">
                  {stat.change.type === 'increase' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`font-medium ${
                      stat.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change.value}
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Orders
              </h3>
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₹{order.amount}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Products
              </h3>
              {sellerProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No products yet</p>
              ) : (
                <div className="space-y-4">
                  {sellerProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center space-x-4">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">₹{product.price}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  )
}
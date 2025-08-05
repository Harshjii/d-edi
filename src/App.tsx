import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AuthCallback from './components/Auth/AuthCallback'

// Auth pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// Public pages
import Landing from './pages/Public/Landing'

// Dashboard pages
import Dashboard from './pages/Dashboard/Dashboard'
import ProductList from './pages/Products/ProductList'
import OrderList from './pages/Orders/OrderList'

// Seller pages
import SellerDashboard from './pages/Seller/SellerDashboard'
import SellerProducts from './pages/Seller/SellerProducts'
import SellerOrders from './pages/Seller/SellerOrders'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          
          {/* Public routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Customer routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute requiredRole="user">
                <ProductList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute requiredRole="user">
                <OrderList />
              </ProtectedRoute>
            }
          />
          
          {/* Seller routes */}
          <Route
            path="/seller-portal-x7g9"
            element={
              <ProtectedRoute requiredRole="admin">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller-portal-x7g9/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <SellerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller-portal-x7g9/orders"
            element={
              <ProtectedRoute requiredRole="admin">
                <SellerOrders />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback routes */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
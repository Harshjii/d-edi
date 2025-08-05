import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../UI/LoadingSpinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && profile) {
      // Redirect based on role
      if (profile.role === 'admin') {
        navigate('/seller-portal-x7g9', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [profile, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
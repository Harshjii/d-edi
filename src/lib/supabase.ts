import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Database types
export interface Product {
  id: string
  seller_id: string
  name: string
  description: string
  price: number
  original_price?: number
  shipping_charges?: number
  image_url: string
  category: string
  sizes: string[]
  colors: string[]
  in_stock: boolean
  stock_quantity: number
  rating: number
  reviews: number
  tags: string[]
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  seller_id: string
  customer_name: string
  email: string
  phone: string
  address: string
  payment_method: string
  amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  seller_id: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'user' | 'admin'
  google_id?: string
  created_at: string
  updated_at: string
}
import { createClient } from '@supabase/supabase-js'

// Vite uses import.meta.env and requires VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  name: string
  price: number
  stock: number
  category: string
  created_at?: string
}

export type Sale = {
  id: string
  items: any[]
  total: number
  profit: number
  customer_phone?: string
  created_at?: string
}

export type Expense = {
  id: string
  category: string
  amount: number
  description: string
  date: string
  created_at?: string
}

export type Customer = {
  phone: string
  name: string
  total_spent: number
  last_visit: string
  created_at?: string
}

export const CATEGORIES = [
  'General',
  'Writing',
  'Paper',
  'Notebooks',
  'Art Supplies',
  'Office',
  'Xerox/Printing',
  'Other'
]

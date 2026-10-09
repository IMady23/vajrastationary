export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'HIDDEN'
export type ProductUnit = 'pcs' | 'box' | 'ream' | 'roll' | 'bottle' | 'pack'

export type Product = {
  id: string
  product_name: string
  canonical_name: string
  brand?: string | null
  model?: string | null
  variant?: string | null
  category: string
  subcategory?: string | null
  unit: ProductUnit
  barcode?: string | null
  sku?: string | null
  image_url?: string | null
  status: ProductStatus
  created_at?: string
  updated_at?: string
  // Legacy aliases for backward compatibility with existing components
  name?: string
  price?: number
  stock?: number
  quantity?: number
}

export type Location = {
  id: string
  name: string
  address?: string
  type: 'SHOP' | 'WAREHOUSE' | 'BRANCH'
  created_at?: string
}

export type Inventory = {
  id: string
  product_id: string
  location_id: string
  current_stock: number
  minimum_stock: number
  reorder_quantity: number
  purchase_price: number
  selling_price: number
  supplier_id?: string | null
  shelf_location?: string
  updated_at?: string
}

export type Supplier = {
  id: string
  name: string
  contact?: string
  address?: string
  created_at?: string
}

export type StockMovement = {
  movement_id: string
  product_id: string
  location_id: string
  user_id?: string
  action: 'IN' | 'OUT' | 'ADJUST'
  quantity_before: number
  quantity_after: number
  purchase_price?: number
  supplier_id?: string
  invoice_number?: string
  notes?: string
  timestamp?: string
}

export type ScanHistory = {
  scan_id: string
  image_url?: string
  ai_prediction: any
  ai_confidence: number
  ai_provider: string
  user_action: 'ACCEPTED' | 'REJECTED' | 'CORRECTED'
  final_product_id?: string
  timestamp?: string
}

export type RecognitionSource = 'LOCAL' | 'GEMINI' | 'CACHED' | 'OPENAI' | 'OPENROUTER'

export interface RecognitionHistoryItem {
  id?: string
  captured_image?: string
  predicted_name: string
  selected_product_id?: string | null
  confidence: number
  recognition_source?: RecognitionSource
  recognition_time_ms?: number
  device?: string
  user_corrected?: boolean
  user_accepted?: boolean
  matched?: boolean
  failure_reason?: string | null
  created_at?: string
  tokens_used?: number
}

export interface LearningCorrection {
  id?: string
  original_predicted_name: string
  corrected_product_id: string
  corrected_product_name: string
  scan_image_url?: string
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

export type InventorySettings = {
  shopName: string
  address?: string
  upiId?: string
  whatsappMessage?: string
  taxRate: number
  isShopOpen: boolean
  currency?: string
  theme?: 'dark' | 'light'
}

export type CategoryConfig = {
  name: string
  badgeClass: string
  textColor: string
  dotColor: string
}

export const STATIONERY_CATEGORIES: CategoryConfig[] = [
  { name: 'Pens', badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/30', textColor: 'text-blue-400', dotColor: 'bg-blue-400' },
  { name: 'Pencils', badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30', textColor: 'text-cyan-400', dotColor: 'bg-cyan-400' },
  { name: 'Notebooks', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', textColor: 'text-emerald-400', dotColor: 'bg-emerald-400' },
  { name: 'Books', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/30', textColor: 'text-green-400', dotColor: 'bg-green-400' },
  { name: 'Files', badgeClass: 'bg-teal-500/10 text-teal-400 border border-teal-500/30', textColor: 'text-teal-400', dotColor: 'bg-teal-400' },
  { name: 'Paper', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', textColor: 'text-amber-400', dotColor: 'bg-amber-400' },
  { name: 'Art Supplies', badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/30', textColor: 'text-purple-400', dotColor: 'bg-purple-400' },
  { name: 'Craft Materials', badgeClass: 'bg-pink-500/10 text-pink-400 border border-pink-500/30', textColor: 'text-pink-400', dotColor: 'bg-pink-400' },
  { name: 'Printing', badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/30', textColor: 'text-orange-400', dotColor: 'bg-orange-400' },
  { name: 'Xerox', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/30', textColor: 'text-red-400', dotColor: 'bg-red-400' },
  { name: 'Office Supplies', badgeClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30', textColor: 'text-indigo-400', dotColor: 'bg-indigo-400' },
  { name: 'Others', badgeClass: 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30', textColor: 'text-[#C5A059]', dotColor: 'bg-[#C5A059]' }
]

export const CATEGORIES = STATIONERY_CATEGORIES.map(c => c.name)

export function getCategoryStyle(categoryName: string): CategoryConfig {
  const found = STATIONERY_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
  return found || {
    name: categoryName || 'Others',
    badgeClass: 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30',
    textColor: 'text-[#C5A059]',
    dotColor: 'bg-[#C5A059]'
  }
}

/**
 * Normalizes raw database/API row to ensure backward compatibility while supporting new schemas.
 * In a real backend call, you'll join Product + Inventory.
 */
export function normalizeProduct(row: any): Product {
  const sellingPrice = Number(row.selling_price ?? row.price ?? 0)
  const qty = Number(row.current_stock ?? row.quantity ?? row.stock ?? 0)
  
  const status: ProductStatus = row.status
    ? row.status
    : qty <= 0
      ? 'OUT_OF_STOCK'
      : 'ACTIVE'

  return {
    id: String(row.id || ''),
    product_name: String(row.product_name || row.name || ''),
    name: String(row.product_name || row.name || ''),
    canonical_name: String(row.canonical_name || ''),
    brand: row.brand ? String(row.brand) : null,
    model: row.model ? String(row.model) : null,
    variant: row.variant ? String(row.variant) : null,
    category: String(row.category || 'Others'),
    subcategory: row.subcategory ? String(row.subcategory) : null,
    unit: row.unit || 'pcs',
    barcode: row.barcode ? String(row.barcode) : null,
    sku: row.sku ? String(row.sku) : null,
    image_url: row.image_url || row.primary_image || null,
    status,
    selling_price: sellingPrice,
    price: sellingPrice,
    current_stock: qty,
    quantity: qty,
    stock: qty,
    minimum_stock: Number(row.minimum_stock || 0),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
  }
}

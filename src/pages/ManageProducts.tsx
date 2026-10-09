import { useState, useEffect } from 'react'
import { type Product, getCategoryStyle } from '../types'
import { ProductService } from '../services/ProductService'
import { Edit2, Trash2, Search, Package, Plus, Minus, Lock, ArrowRight, Eye, MapPin, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { LowStockBadge, ProductStatusBadge } from '../components/ui/LowStockBadge'

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'low-stock'>('all')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Security
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    if (searchParams.get('filter') === 'low-stock') {
      setFilterTab('low-stock')
    }
  }, [searchParams])

  useEffect(() => {
    const savedPin = localStorage.getItem('vajra_security_pin')
    if (savedPin && savedPin.length === 4) {
      setIsLocked(true)
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await ProductService.getProducts()
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await ProductService.deleteProduct(id)
      setProducts(products.filter((p) => p.id !== id))
      showToast('Product deleted', 'success')
    } catch (error) {
      showToast('Error deleting product', 'error')
    }
  }

  const updateStock = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta)
    try {
      await ProductService.updateProduct(id, { quantity: newStock, stock: newStock })
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, quantity: newStock, stock: newStock } : p
        )
      )
    } catch (error) {
      showToast('Error updating stock', 'error')
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const savedPin = localStorage.getItem('vajra_security_pin')
    if (pinInput === savedPin) {
      setIsLocked(false)
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 2000)
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.shelf_location && p.shelf_location.toLowerCase().includes(q))

    const qty = p.quantity ?? p.stock
    const matchesFilter = filterTab === 'low-stock' ? qty < 10 : true

    return matchesSearch && matchesFilter
  })

  if (isLocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 w-full max-w-sm text-center space-y-8"
        >
          <div className="inline-flex p-4 bg-brand rounded-2xl">
            <Lock className="w-8 h-8 text-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Inventory Locked</h2>
            <p className="text-sm text-white/40">Enter your 4-digit security PIN to continue.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div
              onClick={() => document.getElementById('pin-hidden-input')?.focus()}
              className="flex justify-center gap-3 cursor-pointer"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    pinError
                      ? 'border-red-500 bg-red-500/10'
                      : pinInput.length > i
                      ? 'border-brand bg-brand/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {pinInput.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            <input
              id="pin-hidden-input"
              autoFocus
              type="tel"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setPinInput(val)
              }}
              className="absolute opacity-0 pointer-events-none"
            />

            <button
              type="submit"
              className="w-full bg-brand text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Unlock <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="text-white/20 hover:text-white text-xs font-bold transition-all"
          >
            Cancel & Return Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">Manage Inventory</h2>
          <p className="text-muted">Shop inventory catalog with photo thumbnails & shelf locations.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/add"
            className="inline-flex items-center gap-2 bg-brand text-black px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add New Item
          </Link>
        </div>
      </div>

      {/* Inventory Health Dashboard Card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass p-4 rounded-2xl border border-glass">
          <div className="text-[10px] uppercase font-black text-muted">Total Products</div>
          <div className="text-2xl font-black text-white mt-1">{products.length}</div>
        </div>
        <div className="glass p-4 rounded-2xl border border-glass">
          <div className="text-[10px] uppercase font-black text-amber-400">Missing Images</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {products.filter((p) => !p.primary_image).length}
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-glass">
          <div className="text-[10px] uppercase font-black text-blue-400">Missing Shelf Location</div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {products.filter((p) => !p.shelf_location).length}
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-glass">
          <div className="text-[10px] uppercase font-black text-purple-400">Never Scanned</div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {products.filter((p) => !p.scan_count || p.scan_count === 0).length}
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-glass">
          <div className="text-[10px] uppercase font-black text-red-400">Low Stock (&lt;10)</div>
          <div className="text-2xl font-black text-red-400 mt-1">
            {products.filter((p) => (p.quantity ?? p.stock) < 10).length}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        {/* Top Search & Filter Bar */}
        <div className="p-6 border-b border-glass flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search by name, brand, shelf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-glass rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
            />
          </div>

          <div className="flex items-center gap-2 bg-input p-1 rounded-2xl border border-glass w-full md:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all ${
                filterTab === 'all' ? 'bg-brand text-black' : 'text-muted hover:text-primary'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setFilterTab('low-stock')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                filterTab === 'low-stock'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock (&lt;10)
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest font-black text-muted border-b border-glass bg-white/[0.01]">
                <th className="px-6 py-4">Product & Shelf</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-muted font-bold">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-muted font-bold">
                    No matching stationery products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const catStyle = getCategoryStyle(product.category)
                  const qty = product.quantity ?? product.stock

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-white/5 transition-colors group ${
                        qty < 10 ? 'bg-red-500/[0.03]' : ''
                      }`}
                    >
                      {/* Product & Shelf */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-input border border-glass overflow-hidden shrink-0 flex items-center justify-center">
                            {product.primary_image ? (
                              <img
                                src={product.primary_image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-brand/40" />
                            )}
                          </div>

                          <div>
                            <div className="font-black text-primary flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.brand && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                                  {product.brand}
                                </span>
                              )}
                            </div>
                            {product.shelf_location && (
                              <div className="text-[11px] text-blue-300 font-bold mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-400" />
                                {product.shelf_location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${catStyle.badgeClass}`}>
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <span className="font-black text-brand text-base">
                          ₹{product.selling_price ?? product.price}
                        </span>
                      </td>

                      {/* Stock inline controls */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-input rounded-xl p-1 border border-glass">
                            <button
                              onClick={() => updateStock(product.id, qty, -1)}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                              title="Decrease stock by 1"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-black">{qty}</span>
                            <button
                              onClick={() => updateStock(product.id, qty, 1)}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                              title="Increase stock by 1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <LowStockBadge quantity={qty} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <ProductStatusBadge status={product.status} quantity={qty} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${product.id}`}
                            className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-primary transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/edit/${product.id}`}
                            className="p-2 hover:bg-brand/15 rounded-xl text-muted hover:text-brand transition-all"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-500/15 rounded-xl text-muted hover:text-red-500 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

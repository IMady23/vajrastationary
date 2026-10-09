import { useState, useEffect, useMemo } from 'react'
import { Package, AlertTriangle, Search, Plus, Camera, IndianRupee, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { type Product, type Sale, getCategoryStyle } from '../types'
import { getRecentSearches } from '../lib/recentSearches'
import { ProductService } from '../services/ProductService'
import { AnalyticsService } from '../services/AnalyticsService'
import { RecognitionService } from '../services/RecognitionService'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [recentSearches, setRecentSearches] = useState<Product[]>([])
  const [recentRecognitions, setRecentRecognitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, salesData, recognitionsData] = await Promise.all([
          ProductService.getProducts(),
          AnalyticsService.getSales(20),
          RecognitionService.getRecognitionHistory(5)
        ])

        if (productsData) setProducts(productsData)
        if (salesData) setSales(salesData)
        if (recognitionsData) setRecentRecognitions(recognitionsData)
        setRecentSearches(getRecentSearches())
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats = useMemo(() => {
    const totalProducts = products.length
    const lowStockCount = products.filter((p) => (p.quantity ?? p.stock) < 10).length
    const outOfStockCount = products.filter((p) => (p.quantity ?? p.stock) <= 0).length
    const todaySales = sales.reduce((sum, s) => sum + (s.total || 0), 0)

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      todaySales,
    }
  }, [products, sales])

  const recentlyAdded = useMemo(() => products.slice(0, 6), [products])

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">Shop Overview</h2>
          <p className="text-muted font-medium">Fast daily stationery lookups, stock alerts & quick actions.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/manage')}
          className="glass glass-hover rounded-3xl p-6 space-y-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-brand rounded-2xl shadow-lg">
              <Package className="w-6 h-6 text-black" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted font-black">Total Products</div>
            <div className="text-3xl font-black text-primary mt-1">{stats.totalProducts}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/manage?filter=low-stock')}
          className="glass glass-hover rounded-3xl p-6 space-y-4 cursor-pointer border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-red-400 font-black">Low Stock (&lt;10)</div>
            <div className="text-3xl font-black text-red-400 mt-1">{stats.lowStockCount}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/')}
          className="glass glass-hover rounded-3xl p-6 space-y-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted font-black">Recent Lookups</div>
            <div className="text-3xl font-black text-primary mt-1">{recentSearches.length} items</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
              <IndianRupee className="w-6 h-6 text-black" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted font-black">Recent Transactions</div>
            <div className="text-3xl font-black text-green-400 mt-1">₹{stats.todaySales.toLocaleString()}</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand">Quick Daily Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/add"
            className="p-4 rounded-2xl bg-white/5 hover:bg-brand hover:text-black transition-all group border border-glass flex flex-col items-center justify-center gap-2 text-center"
          >
            <Plus className="w-6 h-6 text-brand group-hover:text-black transition-colors" />
            <span className="font-black text-sm">➕ Add Product</span>
          </Link>

          <Link
            to="/ai-camera"
            className="p-4 rounded-2xl bg-brand/10 hover:bg-brand hover:text-black transition-all border border-brand/50 flex flex-col items-center justify-center gap-2 text-center group"
          >
            <Camera className="w-6 h-6 text-brand group-hover:text-black transition-colors" />
            <span className="font-black text-sm">📷 Launch AI Camera</span>
            <span className="text-[9px] uppercase tracking-wider text-brand group-hover:text-black font-extrabold">Local-First Vision</span>
          </Link>

          <Link
            to="/manage?filter=low-stock"
            className="p-4 rounded-2xl bg-white/5 hover:bg-red-500/15 transition-all border border-red-500/30 flex flex-col items-center justify-center gap-2 text-center"
          >
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="font-black text-sm text-red-400">⚠ Low Stock</span>
          </Link>

          <Link
            to="/"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-glass flex flex-col items-center justify-center gap-2 text-center"
          >
            <Search className="w-6 h-6 text-blue-400" />
            <span className="font-black text-sm">🔍 Search Products</span>
          </Link>
        </div>
      </div>

      {/* Grid: Recently Searched & Recently Added */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Searched */}
        <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" />
              Recently Searched
            </h3>
            <span className="text-xs text-muted font-bold">Fast 1-click lookup</span>
          </div>

          {recentSearches.length === 0 ? (
            <div className="py-12 text-center text-muted font-medium text-sm">
              No recent searches yet. Items you search will appear here!
            </div>
          ) : (
            <div className="space-y-3">
              {recentSearches.slice(0, 5).map((product) => {
                const catStyle = getCategoryStyle(product.category)
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-input border border-glass overflow-hidden shrink-0 flex items-center justify-center">
                        {product.primary_image ? (
                          <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-brand/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-primary truncate group-hover:text-brand transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${catStyle.badgeClass}`}>
                            {product.category}
                          </span>
                          {product.shelf_location && (
                            <span className="text-[10px] text-muted font-bold flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {product.shelf_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black text-brand flex items-center justify-end">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {product.selling_price ?? product.price}
                        </div>
                        <div className="text-[10px] font-bold text-muted">
                          Stock: {product.quantity ?? product.stock}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recently Added Products */}
        <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" />
              Recently Added Items
            </h3>
            <Link to="/manage" className="text-xs text-brand font-bold hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted">Loading items...</div>
          ) : recentlyAdded.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">No items in database yet.</div>
          ) : (
            <div className="space-y-3">
              {recentlyAdded.map((product) => {
                const catStyle = getCategoryStyle(product.category)
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-input border border-glass overflow-hidden shrink-0 flex items-center justify-center">
                        {product.primary_image ? (
                          <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-brand/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-primary truncate group-hover:text-brand transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${catStyle.badgeClass}`}>
                            {product.category}
                          </span>
                          {product.shelf_location && (
                            <span className="text-[10px] text-muted font-bold">📍 {product.shelf_location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-brand flex items-center justify-end">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {product.selling_price ?? product.price}
                      </div>
                      <div className={`text-[10px] font-bold ${(product.quantity ?? product.stock) < 10 ? 'text-red-400' : 'text-muted'}`}>
                        Stock: {product.quantity ?? product.stock}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent AI Activity Widget */}
      <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            Recent AI Product Scans
          </h3>
          <Link to="/ai-camera" className="text-xs text-brand font-bold hover:underline">
            Launch Camera
          </Link>
        </div>

        {recentRecognitions.length === 0 ? (
          <div className="py-8 text-center text-muted font-medium text-sm">
            No AI scans recorded yet. Use the AI Camera to recognize shelf items.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecognitions.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-input border border-glass overflow-hidden shrink-0 flex items-center justify-center">
                    {item.captured_image ? (
                      <img src={item.captured_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-brand/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-primary truncate">
                      {item.predicted_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand/20 text-brand">
                        {item.recognition_source || 'LOCAL'}
                      </span>
                      <span className="text-[10px] text-muted font-bold">
                        {Math.round((item.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

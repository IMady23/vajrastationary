import { useState, useMemo, useEffect } from 'react'
import { Package, IndianRupee, ChevronRight, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Product, STATIONERY_CATEGORIES, getCategoryStyle } from '../types'
import { ProductService } from '../services/ProductService'
import { useCart } from '../context/CartContext'
import { Box, SortAsc, AlertTriangle } from 'lucide-react'
import QuickPrint from '../components/QuickPrint'
import SearchAutocomplete from '../components/SearchAutocomplete'
import { useNavigate } from 'react-router-dom'
import { addRecentSearch } from '../lib/recentSearches'

export default function Home() {
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showSplash, setShowSplash] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'stock-low'>('name')

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await ProductService.getProducts()
        setProducts(data)
      } catch (e) {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        const billBtn = document.querySelector('[aria-label="Open Cart"]') as HTMLButtonElement
        billBtn?.click()
      }
      if (e.key === 'Escape') {
        setQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = query.toLowerCase()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.shelf_location && p.shelf_location.toLowerCase().includes(q))

      let matchesCategory = true
      if (selectedCategory === 'Low Stock (<10)') {
        matchesCategory = (p.quantity ?? p.stock) < 10
      } else if (selectedCategory !== 'All') {
        matchesCategory = p.category === selectedCategory
      }

      return matchesSearch && matchesCategory
    })

    if (sortBy === 'price-low') result.sort((a, b) => a.selling_price - b.selling_price)
    if (sortBy === 'price-high') result.sort((a, b) => b.selling_price - a.selling_price)
    if (sortBy === 'stock-low') result.sort((a, b) => a.quantity - b.quantity)
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name))

    return result
  }, [query, products, selectedCategory, sortBy])

  return (
    <div className="space-y-8 pb-16">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050b18] flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.8
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Vajra Logo" 
                className="w-64 h-64 md:w-96 md:h-96 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(197,160,89,0.3)]"
                onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   const parent = e.currentTarget.parentElement;
                   if (parent) {
                     const fallback = document.createElement('div');
                     fallback.className = 'text-6xl md:text-8xl font-black gold-gradient text-center tracking-tighter';
                     fallback.innerText = 'VAJRA';
                     parent.appendChild(fallback);
                   }
                }}
              />
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8"
              >
                <h2 className="text-2xl font-black gold-gradient tracking-[0.2em]">STATIONERY & XEROX</h2>
                <div className="h-1 w-12 bg-brand mx-auto mt-4 rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Hero Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 pt-4 md:pt-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tight text-primary uppercase"
        >
          <span className="gold-gradient">Vajra</span> Stationery
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-base font-medium"
        >
          Customer asks → Instant Search → Show Price & Shelf Location.
        </motion.p>

        {/* Search Autocomplete Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="pt-3"
        >
          <SearchAutocomplete 
            products={products}
            query={query}
            setQuery={setQuery}
          />
        </motion.div>
      </div>

      {/* Filter Chips & Sort */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-black transition-all duration-300 border flex items-center gap-2 ${
              selectedCategory === 'All'
                ? "bg-brand text-black border-brand shadow-lg"
                : "glass text-muted border-glass hover:text-primary"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> All Products
          </button>

          <button
            onClick={() => setSelectedCategory('Low Stock (<10)')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-black transition-all duration-300 border flex items-center gap-2 ${
              selectedCategory === 'Low Stock (<10)'
                ? "bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                : "glass text-red-400 border-red-500/30 hover:bg-red-500/10"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock (&lt;10)
          </button>

          {STATIONERY_CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-2 ${
                selectedCategory === cat.name
                  ? "bg-brand text-black shadow-lg"
                  : `glass hover:scale-105 ${cat.badgeClass}`
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
          <SortAsc className="w-4 h-4 text-muted ml-3" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-black p-2 outline-none text-white cursor-pointer"
          >
            <option value="name" className="bg-[#0c1e3e]">Sort: Name</option>
            <option value="price-low" className="bg-[#0c1e3e]">Price: Low to High</option>
            <option value="price-high" className="bg-[#0c1e3e]">Price: High to Low</option>
            <option value="stock-low" className="bg-[#0c1e3e]">Low Stock First</option>
          </select>
        </div>
      </div>

      <QuickPrint />

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => {
            const catStyle = getCategoryStyle(product.category)
            const qty = product.quantity ?? product.stock

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                onClick={() => {
                  addRecentSearch(product)
                  navigate(`/product/${product.id}`)
                }}
                className={`glass glass-hover rounded-3xl p-6 group cursor-pointer flex flex-col justify-between transition-all ${
                  qty < 10 ? 'border-red-500/40 hover:border-red-400' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    {/* Thumbnail Image */}
                    <div className="w-16 h-16 rounded-2xl bg-input border border-glass overflow-hidden shrink-0 flex items-center justify-center">
                      {product.primary_image ? (
                        <img 
                          src={product.primary_image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <Package className="w-8 h-8 text-brand/40" />
                      )}
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end text-brand text-2xl font-black">
                        <IndianRupee className="w-5 h-5 mr-0.5" />
                        {product.selling_price ?? product.price}
                      </div>
                      <div className="text-[10px] uppercase text-muted font-black tracking-widest">
                        Per Unit
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-primary line-clamp-1 group-hover:text-brand transition-colors">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/80 shrink-0">
                          {product.brand}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${catStyle.badgeClass}`}>
                        {product.category}
                      </span>

                      {product.shelf_location && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {product.shelf_location}
                        </span>
                      )}

                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        qty > 10 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                      }`}>
                        {qty > 0 ? `${qty} IN STOCK` : 'OUT OF STOCK'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product)
                      addRecentSearch(product)
                    }}
                    className="px-4 py-2 bg-brand text-black text-xs font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 active:scale-95"
                  >
                    Add to Bill
                  </button>
                  <span className="flex items-center gap-1 text-xs font-black text-muted group-hover:text-primary transition-colors duration-300">
                    Details <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-24 glass rounded-3xl space-y-4">
          <div className="inline-flex p-6 bg-input rounded-full mb-4">
            <Package className="w-12 h-12 text-faint" />
          </div>
          <h3 className="text-2xl font-black text-primary">No products found</h3>
          <p className="text-muted font-medium">Try searching for another item or add a new product.</p>
        </div>
      )}
    </div>
  )
}

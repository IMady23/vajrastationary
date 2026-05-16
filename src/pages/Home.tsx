import { useState, useMemo, useEffect } from 'react'
import { Search, Package, IndianRupee, Tag, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Product, CATEGORIES } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { PenTool, FileText, Printer, Palette, BookOpen, Briefcase, Box, X, SortAsc, Filter } from 'lucide-react'
import QuickPrint from '../components/QuickPrint'

const CATEGORY_ICONS: Record<string, any> = {
  'Writing': PenTool,
  'Paper': FileText,
  'Xerox/Printing': Printer,
  'Art Supplies': Palette,
  'Notebooks': BookOpen,
  'Office': Briefcase,
  'All': Box
}

const SAMPLE_PRODUCTS: Product[] = []

export default function Home() {
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showSplash, setShowSplash] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'stock-low'>('name')

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').order('name')
        if (error) throw error
        if (data) {
          setProducts(data)
        }
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
        // Trigger quick bill toggle if possible
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
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || 
                           p.category.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price)
    if (sortBy === 'stock-low') result.sort((a, b) => a.stock - b.stock)
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name))

    return result
  }, [query, products, selectedCategory, sortBy])

  return (
    <div className="space-y-8">
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
              {/* Use a high-quality placeholder if logo.png isn't there, or the actual logo */}
              <img 
                src="/logo.png" 
                alt="Vajra Logo" 
                className="w-64 h-64 md:w-96 md:h-96 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(197,160,89,0.3)]"
                onError={(e) => {
                   // Fallback to a styled text logo if image fails
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

      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4 pt-4 md:pt-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-7xl font-black tracking-tight text-primary uppercase"
        >
          <span className="gold-gradient">Vajra</span> Stationery
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-lg font-medium"
        >
          Search thousands of products in seconds.
        </motion.p>

        {/* Apple-style Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group pt-4"
        >
          <div className="absolute inset-0 bg-brand/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative glass rounded-2xl flex items-center p-2 focus-within:ring-2 focus-within:ring-brand/50 transition-all duration-300">
            <Search className="w-6 h-6 ml-4 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg placeholder:text-muted/40 text-primary font-bold"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar w-full md:w-auto">
          <CategoryPill 
            label="All" 
            active={selectedCategory === 'All'} 
            onClick={() => setSelectedCategory('All')} 
          />
          {CATEGORIES.map(cat => (
            <CategoryPill 
              key={cat} 
              label={cat} 
              active={selectedCategory === cat} 
              onClick={() => setSelectedCategory(cat)} 
            />
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
          <SortAsc className="w-4 h-4 text-muted ml-3" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-black p-2 outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="stock-low">Low Stock First</option>
          </select>
        </div>
      </div>

      <QuickPrint />

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="glass glass-hover rounded-3xl p-6 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-input rounded-2xl group-hover:bg-brand group-hover:text-black transition-colors duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end text-brand text-2xl font-black">
                    <IndianRupee className="w-5 h-5 mr-0.5" />
                    {product.price}
                  </div>
                  <div className="text-[10px] uppercase text-muted font-black tracking-widest">
                    Per Unit
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-primary line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-muted text-xs font-black flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {product.category}
                  </span>
                  <span className="text-faint">•</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    product.stock > 10 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                  }`}>
                    {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(product)
                  }}
                  className="px-4 py-2 bg-brand text-black text-xs font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 active:scale-95"
                >
                  Add to Bill
                </button>
                <button className="flex items-center gap-1 text-xs font-black text-muted group-hover:text-primary transition-colors duration-300">
                  View Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-24 glass rounded-3xl space-y-4">
          <div className="inline-flex p-6 bg-input rounded-full mb-4">
            <Search className="w-12 h-12 text-faint" />
          </div>
          <h3 className="text-2xl font-black text-primary">No products found</h3>
          <p className="text-muted font-medium">Try searching for something else or add a new product.</p>
        </div>
      )}
    </div>
  )
}

function CategoryPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  const Icon = CATEGORY_ICONS[label] || Box
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 border flex items-center gap-2 ${
        active 
          ? "bg-brand text-black border-brand shadow-lg" 
          : "glass text-muted border-glass hover:text-primary"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Search, Package, IndianRupee, Tag, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Product, CATEGORIES } from '../lib/supabase'
import { useCart } from '../context/CartContext'

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Parker Jotter Ball Pen', price: 250, stock: 15, category: 'Writing' },
  { id: '2', name: 'A4 Printing Paper (500 sheets)', price: 380, stock: 50, category: 'Paper' },
  { id: '3', name: 'Classmate Octane Gel Pen', price: 10, stock: 120, category: 'Writing' },
  { id: '4', name: 'Faber-Castell Color Pencils (24 pack)', price: 450, stock: 8, category: 'Art Supplies' },
  { id: '5', name: 'Hardbound A5 Notebook', price: 120, stock: 25, category: 'Notebooks' },
  { id: '6', name: 'Standard Stapler No. 10', price: 85, stock: 12, category: 'Office' },
  { id: '7', name: 'Color Xerox (A4)', price: 15, stock: 999, category: 'Xerox/Printing' },
  { id: '8', name: 'Lamination (A4)', price: 30, stock: 999, category: 'Xerox/Printing' },
]

export default function Home() {
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').order('name')
        if (error) throw error
        if (data && data.length > 0) {
          setProducts(data)
        } else {
          setProducts(SAMPLE_PRODUCTS)
        }
      } catch (e) {
        setProducts(SAMPLE_PRODUCTS)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || 
                           p.category.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [query, products, selectedCategory])

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4 pt-4 md:pt-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tight text-primary"
        >
          Instant Price Check
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
              placeholder="Search products, brands, or categories..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg placeholder:text-muted/40 text-primary font-bold"
              autoFocus
            />
          </div>
        </motion.div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
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
                    product.stock > 10 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
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
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 border ${
        active 
          ? "bg-brand text-black border-brand shadow-lg" 
          : "glass text-muted border-glass hover:text-primary"
      }`}
    >
      {label}
    </button>
  )
}

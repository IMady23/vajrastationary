import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Package, IndianRupee, Eye, PlusCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Product, getCategoryStyle } from '../types'
import { addRecentSearch } from '../lib/recentSearches'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface SearchAutocompleteProps {
  products: Product[]
  query: string
  setQuery: (q: string) => void
  onSelectProduct?: (product: Product) => void
}

export default function SearchAutocomplete({
  products,
  query,
  setQuery,
  onSelectProduct
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const matchingProducts = React.useMemo(() => {
    if (!query || query.trim().length === 0) return []
    const q = query.toLowerCase()
    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          (p.shelf_location && p.shelf_location.toLowerCase().includes(q))
        )
      })
      .slice(0, 7)
  }, [products, query])

  useEffect(() => {
    setIsOpen(matchingProducts.length > 0 && query.trim().length > 0)
    setSelectedIndex(-1)
  }, [matchingProducts, query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (product: Product) => {
    addRecentSearch(product)
    setIsOpen(false)
    if (onSelectProduct) {
      onSelectProduct(product)
    } else {
      navigate(`/product/${product.id}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < matchingProducts.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingProducts.length - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && matchingProducts[selectedIndex]) {
      e.preventDefault()
      handleSelect(matchingProducts[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full group">
      <div className="absolute inset-0 bg-brand/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
      <div className="relative glass rounded-2xl flex items-center p-2 focus-within:ring-2 focus-within:ring-brand/50 transition-all duration-300">
        <Search className="w-6 h-6 ml-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length > 0 && matchingProducts.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder="Search stationery by name, brand, category, shelf..."
          className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 text-lg placeholder:text-muted/40 text-primary font-bold"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 glass rounded-3xl overflow-hidden shadow-2xl border border-glass divide-y divide-white/5 bg-[#081226]/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-black text-muted flex items-center justify-between">
              <span>Instant Suggestions ({matchingProducts.length})</span>
              <span>Use ↑↓ arrows to navigate</span>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
              {matchingProducts.map((product, idx) => {
                const catStyle = getCategoryStyle(product.category)
                const isSelected = idx === selectedIndex

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-4 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand/15' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Left: Thumbnail & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-input border border-glass overflow-hidden flex items-center justify-center shrink-0">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-brand/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-primary text-base truncate">{product.name}</h4>
                          {product.brand && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/80 shrink-0">
                              {product.brand}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${catStyle.badgeClass}`}>
                            {product.category}
                          </span>
                          {product.shelf_location && (
                            <span className="text-[10px] text-muted font-bold">
                              📍 {product.shelf_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price, Stock & Quick actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-brand flex items-center justify-end">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {product.selling_price ?? product.price}
                        </div>
                        <div
                          className={`text-[10px] font-black ${
                            (product.quantity ?? product.stock) > 10
                              ? 'text-green-400'
                              : 'text-red-400 animate-pulse'
                          }`}
                        >
                          Stock: {product.quantity ?? product.stock}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                            addRecentSearch(product)
                          }}
                          className="p-2 hover:bg-brand hover:text-black rounded-xl text-brand bg-brand/10 transition-all font-bold"
                          title="Add to Bill"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(product)
                          }}
                          className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

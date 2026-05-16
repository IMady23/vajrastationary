import { useState, useEffect } from 'react'
import { supabase, type Product } from '../lib/supabase'
import { Edit2, Trash2, Search, Package, Plus, Minus, Lock, ArrowRight, Download, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Papa from 'papaparse'

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Security
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedPin = localStorage.getItem('vajra_security_pin')
    if (savedPin && savedPin.length === 4) {
      setIsLocked(true)
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      alert('Error deleting product')
    }
  }

  const updateStock = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta)
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', id)
      
      if (error) throw error
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p))
    } catch (error) {
      alert('Error updating stock')
    }
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(products)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'vajra_inventory.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedProducts = results.data.map((row: any) => ({
          name: row.name,
          price: parseFloat(row.price),
          stock: parseInt(row.stock),
          category: row.category || 'General'
        }))

        try {
          const { error } = await supabase.from('products').insert(importedProducts)
          if (error) throw error
          alert(`Successfully imported ${importedProducts.length} products!`)
          window.location.reload()
        } catch (err: any) {
          alert('Error importing: ' + err.message)
        }
      }
    })
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

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
                    pinError ? 'border-red-500 bg-red-500/10' : 
                    pinInput.length > i ? 'border-brand bg-brand/10' : 'border-white/10 bg-white/5'
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

          <button onClick={() => navigate('/')} className="text-white/20 hover:text-white text-xs font-bold transition-all">Cancel & Return Home</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">Manage Inventory</h2>
          <p className="text-white/40">Edit or delete your shop products.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleExportCSV}
             className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
           >
             <Download className="w-4 h-4" /> Export CSV
           </button>
           <label className="px-4 py-2 bg-brand text-black rounded-xl text-xs font-black cursor-pointer hover:scale-105 transition-all flex items-center gap-2">
             <Upload className="w-4 h-4" /> Import CSV
             <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
           </label>
           <Link 
             to="/add" 
             className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-105"
           >
             <Plus className="w-5 h-5" /> Add Product
           </Link>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest font-black text-white/20 border-b border-white/5">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/20">Loading inventory...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/20">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold flex items-center gap-2">
                        <Package className="w-4 h-4 text-brand/40" />
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{product.category}</td>
                    <td className="px-6 py-4">
                      <span className="font-black text-brand">₹{product.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                          <button 
                            onClick={() => updateStock(product.id, product.stock, -1)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-black">{product.stock}</span>
                          <button 
                            onClick={() => updateStock(product.id, product.stock, 1)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${product.stock < 10 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/edit/${product.id}`}
                          className="p-2 hover:bg-brand/10 rounded-xl text-white/40 hover:text-brand transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase, CATEGORIES } from '../lib/supabase'
import { Plus, Package, IndianRupee, Tag, Save, AlertCircle, ListPlus, CheckCircle2, Trash2, PlusCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddProduct() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Single Product State
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('General')

  // Bulk Product State
  const [bulkProducts, setBulkProducts] = useState([
    { name: '', price: '', stock: '', category: 'General' },
    { name: '', price: '', stock: '', category: 'General' },
    { name: '', price: '', stock: '', category: 'General' },
  ])

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('products')
        .insert([{ 
          name, 
          price: parseFloat(price), 
          stock: parseInt(stock), 
          category 
        }])
      
      if (error) throw error
      
      setSuccess(true)
      setName('')
      setPrice('')
      setStock('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async () => {
    const validProducts = bulkProducts.filter(p => p.name && p.price && p.stock)
    if (validProducts.length === 0) return alert("Please fill in at least one product completely.")

    setLoading(true)
    try {
      const { error } = await supabase
        .from('products')
        .insert(validProducts.map(p => ({
          name: p.name,
          price: parseFloat(p.price),
          stock: parseInt(p.stock),
          category: p.category
        })))
      
      if (error) throw error
      
      setSuccess(true)
      setBulkProducts([
        { name: '', price: '', stock: '', category: 'General' },
        { name: '', price: '', stock: '', category: 'General' },
        { name: '', price: '', stock: '', category: 'General' },
      ])
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateBulkProduct = (index: number, field: string, value: string) => {
    const newProducts = [...bulkProducts]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setBulkProducts(newProducts)
  }

  const addBulkRow = () => {
    setBulkProducts([...bulkProducts, { name: '', price: '', stock: '', category: 'General' }])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">Add Inventory</h2>
          <p className="text-muted font-medium">Add new items to your shop database.</p>
        </div>

        <div className="flex p-1 bg-input rounded-2xl border border-glass">
          <button 
            onClick={() => setActiveTab('single')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'single' ? 'bg-brand text-black shadow-lg' : 'text-muted hover:text-primary'}`}
          >
            Single Item
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'bulk' ? 'bg-brand text-black shadow-lg' : 'text-muted hover:text-primary'}`}
          >
            Bulk Add
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'single' ? (
          <motion.div 
            key="single"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass rounded-3xl p-8"
          >
            <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">Product Name</label>
                <div className="relative group">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Parker Jotter Ball Pen"
                    className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">Price (₹)</label>
                <div className="relative group">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="250"
                    className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">Initial Stock</label>
                <div className="relative group">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">Category</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {success ? (
                    <><CheckCircle2 className="w-6 h-6" /> Product Added!</>
                  ) : (
                    <><Save className="w-6 h-6" /> {loading ? "Adding..." : "Add to Inventory"}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="bulk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-black text-muted border-b border-glass">
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-4 py-4 w-24">Price</th>
                    <th className="px-4 py-4 w-24">Stock</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass">
                  {bulkProducts.map((p, idx) => (
                    <tr key={idx} className="bg-white/[0.01]">
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={p.name} 
                          placeholder="Pen Name"
                          onChange={(e) => updateBulkProduct(idx, 'name', e.target.value)}
                          className="w-full bg-transparent border-none outline-none py-2 font-bold text-primary placeholder:text-muted/20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={p.price} 
                          placeholder="0"
                          onChange={(e) => updateBulkProduct(idx, 'price', e.target.value)}
                          className="w-full bg-transparent border-none outline-none py-2 font-black text-brand placeholder:text-brand/20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={p.stock} 
                          placeholder="0"
                          onChange={(e) => updateBulkProduct(idx, 'stock', e.target.value)}
                          className="w-full bg-transparent border-none outline-none py-2 font-bold text-primary placeholder:text-muted/20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select 
                          value={p.category}
                          onChange={(e) => updateBulkProduct(idx, 'category', e.target.value)}
                          className="w-full bg-transparent border-none outline-none py-2 text-xs font-black text-muted cursor-pointer"
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#1a1a1a]">{cat}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => setBulkProducts(bulkProducts.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={addBulkRow}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-brand text-xs font-black flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Add More Rows
              </button>
            </div>

            <button
              onClick={handleBulkSubmit}
              disabled={loading}
              className="w-full bg-brand text-black py-5 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {success ? (
                <><CheckCircle2 className="w-6 h-6" /> Bulk Products Added!</>
              ) : (
                <><ListPlus className="w-6 h-6" /> {loading ? "Saving Items..." : "Save All Products"}</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 glass rounded-3xl bg-brand/5 border-brand/20 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-brand mt-1 shrink-0" />
        <div>
          <h4 className="font-black text-brand">Pro Tip</h4>
          <p className="text-sm text-brand/60 leading-relaxed font-medium">
            Use the <strong>Bulk Add</strong> mode when you have a new shipment of many different items. It's much faster than adding them one by one!
          </p>
        </div>
      </div>
    </div>
  )
}

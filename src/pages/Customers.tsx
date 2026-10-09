import { useState, useEffect } from 'react'
import { Search, UserPlus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Customer } from '../types'
import { AnalyticsService } from '../services/AnalyticsService'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await AnalyticsService.getCustomers()
      setCustomers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await AnalyticsService.saveCustomer({
        name,
        phone,
        total_spent: 0,
        last_visit: new Date().toISOString()
      })
      
      setName('')
      setPhone('')
      setShowAddForm(false)
      fetchCustomers()
    } catch (err: any) {
      alert('Error adding customer: ' + err.message)
    }
  }

  const deleteCustomer = async (phone: string) => {
    if (!confirm('Delete this customer record?')) return
    try {
      setCustomers(customers.filter(c => c.phone !== phone))
    } catch (err) {
      alert('Error deleting customer')
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">Customers</h2>
          <p className="text-muted font-medium">Manage regular customers and loyalty.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand text-black px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-brand/20 transition-all hover:scale-105 flex items-center gap-2"
        >
          {showAddForm ? 'Cancel' : <><UserPlus className="w-5 h-5" /> New Profile</>}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-muted">Customer Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Madhav"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-muted">Phone Number</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 7780548516"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand text-black py-3 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-brand/20">
                  Create Profile
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-glass">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest font-black text-muted border-b border-glass">
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Phone</th>
                <th className="px-8 py-4">Total Spent</th>
                <th className="px-8 py-4">Last Visit</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-muted">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-muted">No customers found.</td></tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.phone} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-black">
                        {customer.name[0].toUpperCase()}
                      </div>
                      <div className="font-bold">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-mono text-sm text-muted">{customer.phone}</td>
                  <td className="px-8 py-4 font-black text-brand">₹{customer.total_spent.toLocaleString()}</td>
                  <td className="px-8 py-4 text-xs text-muted">{new Date(customer.last_visit).toLocaleDateString()}</td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => deleteCustomer(customer.phone)}
                      className="p-2 text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

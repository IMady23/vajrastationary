import { useState, useEffect } from 'react'
import { Plus, Trash2, IndianRupee, Calendar, Tag, CreditCard, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Expense } from '../lib/supabase'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form State
  const [category, setCategory] = useState('Stock Purchase')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
      if (error) throw error
      setExpenses(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('expenses').insert([{
        category,
        amount: parseFloat(amount),
        description,
        date
      }])
      if (error) throw error
      
      setAmount('')
      setDescription('')
      setShowAddForm(false)
      fetchExpenses()
    } catch (err: any) {
      alert('Error adding expense: ' + err.message)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense record?')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err) {
      alert('Error deleting expense')
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">Expenses</h2>
          <p className="text-muted font-medium">Track your shop overheads and spending.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand text-black px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-brand/20 transition-all hover:scale-105 flex items-center gap-2"
        >
          {showAddForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Log Expense</>}
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
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-muted">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                >
                  <option value="Stock Purchase">Stock Purchase</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Staff Salary">Staff Salary</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-muted">Amount (₹)</label>
                <input 
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-muted">Description</label>
                <input 
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Paid for A4 Paper"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand text-black py-3 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-brand/20">
                  Save Expense
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-8 space-y-4">
            <div className="p-3 bg-red-500/10 rounded-2xl w-fit">
              <IndianRupee className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted font-black">Total Outflow</div>
              <div className="text-3xl font-black">₹{totalExpenses.toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted">Accumulated expenses since you started tracking.</p>
          </div>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-3">
          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-black text-muted border-b border-glass">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Description</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass">
                  {loading ? (
                    <tr><td colSpan={5} className="px-8 py-12 text-center text-muted">Loading expenses...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-12 text-center text-muted">No expenses recorded yet.</td></tr>
                  ) : expenses.map((expense) => (
                    <tr key={expense.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-4 text-sm font-medium">{expense.date}</td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-muted">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold">{expense.description}</td>
                      <td className="px-8 py-4 font-black text-red-500">-₹{expense.amount}</td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => deleteExpense(expense.id)}
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
      </div>
    </div>
  )
}

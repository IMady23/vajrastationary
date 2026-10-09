import { useState } from 'react'
import { Printer, Copy, Plus, Minus } from 'lucide-react'
import { useCart } from '../context/CartContext'

const JOB_TYPES = [
  { name: 'Color Print', price: 10, icon: Printer },
  { name: 'B&W Print', price: 2, icon: Printer },
  { name: 'Color Xerox', price: 10, icon: Copy },
  { name: 'B&W Xerox', price: 2, icon: Copy },
]

export default function QuickPrint() {
  const { addToCart } = useCart()
  const [selectedJob, setSelectedJob] = useState(JOB_TYPES[0])
  const [copies, setCopies] = useState(1)
  const [price, setPrice] = useState(selectedJob.price)

  const handleAdd = () => {
    addToCart({
      id: `custom-${Date.now()}`,
      name: `${selectedJob.name}`,
      product_name: `${selectedJob.name}`,
      canonical_name: `${selectedJob.name}`.toLowerCase().replace(/\s+/g, '_'),
      price: Number(price),
      selling_price: Number(price),
      stock: 9999,
      quantity: 9999,
      category: 'Xerox/Printing',
      unit: 'pcs',
      status: 'ACTIVE'
    }, copies)
    
    // Reset
    setCopies(1)
  }

  return (
    <div className="glass rounded-3xl p-6 mb-8 border border-brand/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-4 bg-brand/10 rounded-2xl text-brand">
            <Printer className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black">Quick Print & Xerox</h3>
            <p className="text-muted text-sm font-medium">Add custom jobs instantly</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select 
            value={selectedJob.name}
            onChange={(e) => {
              const job = JOB_TYPES.find(j => j.name === e.target.value) || JOB_TYPES[0]
              setSelectedJob(job)
              setPrice(job.price)
            }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm font-bold focus:ring-2 focus:ring-brand/50 flex-1 md:flex-none"
          >
            {JOB_TYPES.map(j => (
              <option key={j.name} value={j.name} className="bg-[#050b18]">{j.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
            <button onClick={() => setCopies(Math.max(1, copies - 1))} className="p-2 hover:bg-white/10 rounded-lg"><Minus className="w-4 h-4" /></button>
            <span className="w-12 text-center font-black text-sm text-primary">{copies}</span>
            <button onClick={() => setCopies(copies + 1)} className="p-2 hover:bg-white/10 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>

          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">₹</span>
             <input 
               type="number" 
               value={price} 
               onChange={(e) => setPrice(Number(e.target.value))}
               className="w-24 bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 outline-none text-sm font-bold text-primary focus:ring-2 focus:ring-brand/50"
             />
          </div>

          <button 
            onClick={handleAdd}
            className="px-6 py-3 bg-brand text-black font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 active:scale-95 w-full md:w-auto"
          >
            Add Job
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, ShoppingBag, Users, IndianRupee, ArrowUpRight, ArrowDownRight, Package, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, type Sale } from '../lib/supabase'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns'

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    async function fetchSales() {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        if (data) setSales(data)
      } catch (e) {
        console.error('Error fetching sales:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [])

  // Process chart data from real sales
  const chartData = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 })
      const end = endOfWeek(new Date(), { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start, end })

      return days.map(day => {
        const daySales = sales.filter(sale => isSameDay(new Date(sale.created_at!), day))
        const total = daySales.reduce((acc, s) => acc + s.total, 0)
        return {
          name: format(day, 'EEE'),
          sales: total
        }
      })
    } else if (viewMode === 'monthly') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
      
      // Group by weeks or 5-day intervals for monthly view
      const groups = []
      for (let i = 0; i < days.length; i += 5) {
        const slice = days.slice(i, i + 5)
        const total = sales.filter(sale => {
          const d = new Date(sale.created_at!)
          return d >= slice[0] && d <= slice[slice.length - 1]
        }).reduce((acc, s) => acc + s.total, 0)
        
        groups.push({
          name: `${format(slice[0], 'd')}-${format(slice[slice.length - 1], 'd')}`,
          sales: total
        })
      }
      return groups
    } else {
      // Daily (Last 24 hours grouped by 4h intervals)
      return [0, 4, 8, 12, 16, 20].map(hour => {
        const total = sales.filter(sale => {
          const d = new Date(sale.created_at!)
          return isSameDay(d, new Date()) && d.getHours() >= hour && d.getHours() < hour + 4
        }).reduce((acc, s) => acc + s.total, 0)
        return { name: `${hour}:00`, sales: total }
      })
    }
  }, [sales, viewMode])

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0)
    const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0), 0)
    const totalOrders = sales.length
    const uniqueCustomers = new Set(sales.map(s => s.customer_phone).filter(p => p !== 'Walk-in')).size
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    return { totalRevenue, totalProfit, totalOrders, uniqueCustomers, avgOrder }
  }, [sales])

  const categoryStats = useMemo(() => {
    const categories: Record<string, number> = {}
    let totalItems = 0

    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const cat = item.category || 'General'
        categories[cat] = (categories[cat] || 0) + item.quantity
        totalItems += item.quantity
      })
    })

    return Object.entries(categories)
      .map(([label, count]) => ({
        label,
        percent: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5)
  }, [sales])

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">Overview</h2>
          <p className="text-muted font-medium">Real-time performance tracking.</p>
        </div>
        <div className="flex items-center gap-2 bg-input p-1 rounded-2xl border border-glass">
          <button 
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'daily' ? 'bg-brand text-black' : 'text-muted hover:text-primary'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'weekly' ? 'bg-brand text-black' : 'text-muted hover:text-primary'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-brand text-black' : 'text-muted hover:text-primary'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={IndianRupee} 
          label="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          color="bg-brand"
        />
        <StatCard 
          icon={ShoppingBag} 
          label="Total Orders" 
          value={stats.totalOrders} 
          color="bg-blue-500"
        />
        <StatCard 
          icon={Users} 
          label="Unique Customers" 
          value={stats.uniqueCustomers} 
          color="bg-purple-500"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Avg. Order Value" 
          value={`₹${stats.avgOrder}`} 
          color="bg-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">This Week's Sales</h3>
            <TrendingUp className="w-5 h-5 text-brand" />
          </div>
          <div className="h-[300px] w-full">
            {stats.totalOrders === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted gap-4">
                <Search className="w-12 h-12 opacity-20" />
                <p className="font-bold">No sales data yet this week</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffb800" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#ffb800" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-black">Top Categories</h3>
          {categoryStats.length === 0 ? (
            <div className="py-20 text-center text-muted text-sm font-bold">No items sold yet</div>
          ) : (
            <div className="space-y-6">
              {categoryStats.map((cat, i) => (
                <CategoryProgress 
                  key={cat.label} 
                  label={cat.label} 
                  percent={cat.percent} 
                  color={i === 0 ? "bg-brand" : i === 1 ? "bg-blue-500" : "bg-purple-500"} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-glass flex items-center justify-between">
          <h3 className="text-xl font-black">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted font-black border-b border-glass">
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass">
              {loading ? (
                 <tr><td colSpan={5} className="px-8 py-12 text-center text-muted font-bold">Loading transactions...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-muted font-bold">No transactions found. Start billing to see data!</td></tr>
              ) : sales.slice(0, 10).map((sale) => (
                <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4 font-mono text-xs">#{sale.id.slice(0, 8)}</td>
                  <td className="px-8 py-4 font-bold">{sale.customer_phone || 'Walk-in'}</td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full">COMPLETED</span>
                  </td>
                  <td className="px-8 py-4 font-black">₹{sale.total.toLocaleString()}</td>
                  <td className="px-8 py-4 text-xs text-muted">{new Date(sale.created_at!).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 space-y-4 group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 ${color} rounded-2xl shadow-lg`}>
          <Icon className="w-5 h-5 text-black" />
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted font-black">{label}</div>
        <div className="text-2xl font-black">{value}</div>
      </div>
    </motion.div>
  )
}

function CategoryProgress({ label, percent, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
        <span className="text-muted">{label}</span>
        <span className="text-primary">{percent}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  )
}

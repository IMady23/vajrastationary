import { Link, Outlet, useLocation } from 'react-router-dom'
import { Search, PlusCircle, LayoutDashboard, Settings, Package, IndianRupee, Users, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import QuickBill from './QuickBill'
import { ToastProvider } from './ui/Toast'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const navItems = [
  { path: '/', label: 'Search', icon: Search },
  { path: '/dashboard', label: 'Stats', icon: LayoutDashboard },
  { path: '/add', label: 'Add Item', icon: PlusCircle },
  { path: '/manage', label: 'Inventory', icon: Package },
  { path: '/ai-camera', label: 'AI Camera', icon: Camera, badge: 'AI' },
  { path: '/expenses', label: 'Expenses', icon: IndianRupee },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-glass px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full group-hover:bg-brand/40 transition-all" />
                <img src="/logo.png" className="w-12 h-12 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-black font-black';
                      fallback.innerText = 'V';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-primary uppercase">
                  <span className="gold-gradient">Vajra</span> Stationery
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-black">
                  & Xerox Services
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 bg-input p-1 rounded-full border border-glass">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-black transition-all duration-300 relative",
                      isActive 
                        ? "bg-brand text-black shadow-lg" 
                        : "text-muted hover:text-primary hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                    {item.badge && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-tighter",
                        isActive ? "bg-black text-brand" : "bg-brand/20 text-brand border border-brand/30"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Nav */}
        <nav className="lg:hidden sticky bottom-0 z-50 glass border-t border-glass flex justify-around p-3 pb-6">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 relative",
                  isActive ? "text-brand scale-110" : "text-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <QuickBill />
      </div>
    </ToastProvider>
  )
}

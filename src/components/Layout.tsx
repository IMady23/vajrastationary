import { Link, Outlet, useLocation } from 'react-router-dom'
import { Search, PlusCircle, LayoutDashboard, Settings, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import QuickBill from './QuickBill'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const navItems = [
  { path: '/', label: 'Search', icon: Search },
  { path: '/add', label: 'Add', icon: PlusCircle },
  { path: '/manage', label: 'Manage', icon: LayoutDashboard },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-glass px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-brand rounded-xl shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-primary">
                Vajra Stationery
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-black">
                & Xerox Services
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-input p-1 rounded-full border border-glass">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black transition-all duration-300",
                    isActive 
                      ? "bg-brand text-black shadow-lg" 
                      : "text-muted hover:text-primary hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
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
      <nav className="md:hidden sticky bottom-0 z-50 glass border-t border-glass flex justify-around p-4 pb-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-brand scale-110" : "text-muted"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <QuickBill />
    </div>
  )
}

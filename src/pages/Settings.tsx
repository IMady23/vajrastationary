import { useState, useEffect } from 'react'
import { Store, Database, Moon, Bell, Shield, Cloud, CheckCircle2, Smartphone, Mail, Lock, Eye, EyeOff, IndianRupee } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type SettingsTab = 'profile' | 'database' | 'appearance' | 'notifications' | 'security'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [shopName, setShopName] = useState('Vajra Stationery & Xerox')
  const [address, setAddress] = useState('')
  const [upiId, setUpiId] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('Thank you for shopping with us!')
  const [taxRate, setTaxRate] = useState(0)
  const [isShopOpen, setIsShopOpen] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // App Preferences
  const [darkMode, setDarkMode] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [whatsappBilling, setWhatsappBilling] = useState(true)

  // Security
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)

  // Load settings from LocalStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('vajra_shop_name')
    const savedAddress = localStorage.getItem('vajra_shop_address')
    const savedUpi = localStorage.getItem('vajra_shop_upi')
    const savedMsg = localStorage.getItem('vajra_whatsapp_msg')
    const savedTax = localStorage.getItem('vajra_tax_rate')
    const savedStatus = localStorage.getItem('vajra_shop_status')
    const savedTheme = localStorage.getItem('vajra_theme')
    const savedPin = localStorage.getItem('vajra_security_pin')
    
    if (savedName) setShopName(savedName)
    if (savedAddress) setAddress(savedAddress)
    if (savedUpi) setUpiId(savedUpi)
    if (savedMsg) setWhatsappMessage(savedMsg)
    if (savedTax) setTaxRate(Number(savedTax))
    if (savedStatus) setIsShopOpen(savedStatus === 'open')
    if (savedTheme === 'light') {
      setDarkMode(false)
      document.documentElement.classList.add('light')
    }
    if (savedPin) setPin(savedPin)
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('vajra_theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('vajra_theme', 'light')
    }
  }

  const handleSave = () => {
    localStorage.setItem('vajra_shop_name', shopName)
    localStorage.setItem('vajra_shop_address', address)
    localStorage.setItem('vajra_shop_upi', upiId)
    localStorage.setItem('vajra_whatsapp_msg', whatsappMessage)
    localStorage.setItem('vajra_tax_rate', taxRate.toString())
    localStorage.setItem('vajra_shop_status', isShopOpen ? 'open' : 'closed')
    localStorage.setItem('vajra_security_pin', pin)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight">Settings</h2>
        <p className="text-white/40">Configure your shop and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <SettingsTabItem icon={Store} label="Shop Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <SettingsTabItem icon={Database} label="Supabase Link" active={activeTab === 'database'} onClick={() => setActiveTab('database')} />
          <SettingsTabItem icon={Moon} label="Appearance" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <SettingsTabItem icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          <SettingsTabItem icon={Shield} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-3xl p-8 space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Store className="w-5 h-5 text-brand" /> Shop Profile</h3>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Shop Name</label>
                      <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Address</label>
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="alugunoor chowrastha,hyd road..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all min-h-[120px] font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">UPI ID for Payments</label>
                      <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. yourname@okaxis" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Custom WhatsApp Footer</label>
                      <textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium" />
                    </div>
                  </div>
                </section>
                <button onClick={handleSave} className="w-full bg-brand text-black font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                  {saveSuccess ? <><CheckCircle2 className="w-5 h-5" /> Changes Saved!</> : "Save All Changes"}
                </button>
              </motion.div>
            )}

            {activeTab === 'database' && (
              <motion.div key="database" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-3xl p-8 space-y-8">
                <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400"><Cloud /> Database Status</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Connection URL</label>
                    <div className="text-sm font-mono mt-1 text-white/60 truncate">iuvarkauuxohtuuahchh.supabase.co</div>
                  </div>
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <span className="text-sm text-green-500 font-bold">Successfully Connected</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-3xl p-8 space-y-8">
                <h3 className="text-lg font-bold flex items-center gap-2"><Moon /> Appearance</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand rounded-lg"><Moon className="text-black w-4 h-4" /></div>
                      <span className="font-bold">Dark Mode</span>
                    </div>
                    <button onClick={toggleTheme} className={`relative w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-brand' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg"><Store className="text-black w-4 h-4" /></div>
                      <span className="font-bold">Shop Status (Open)</span>
                    </div>
                    <button onClick={() => setIsShopOpen(!isShopOpen)} className={`relative w-12 h-6 rounded-full transition-all ${isShopOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isShopOpen ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                       <IndianRupee className="w-5 h-5 text-brand" />
                       <span className="font-bold">Tax (GST) Rate</span>
                    </div>
                    <div className="flex gap-2">
                       {[0, 5, 12, 18].map(rate => (
                         <button 
                           key={rate} 
                           onClick={() => setTaxRate(rate)}
                           className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${taxRate === rate ? 'bg-brand text-black' : 'bg-white/5 text-muted'}`}
                         >
                           {rate}%
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-3xl p-8 space-y-8">
                <h3 className="text-lg font-bold flex items-center gap-2 text-brand"><Bell /> Notifications</h3>
                <div className="space-y-4">
                  <NotificationToggle icon={Smartphone} label="WhatsApp Billing" desc="Automatically generate WhatsApp bills" active={whatsappBilling} onToggle={() => setWhatsappBilling(!whatsappBilling)} />
                  <NotificationToggle icon={Mail} label="Email Low Stock Alerts" desc="Send email to madhavvadkapuram@gmail.com" active={emailAlerts} onToggle={() => setEmailAlerts(!emailAlerts)} />
                  <NotificationToggle icon={Database} label="Inventory Alerts" desc="Show in-app warnings for low stock" active={stockAlerts} onToggle={() => setStockAlerts(!stockAlerts)} />
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-3xl p-8 space-y-8">
                <h3 className="text-lg font-bold flex items-center gap-2"><Shield /> Security</h3>
                <div className="space-y-4">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Lock className="w-5 h-5 text-brand" />
                           <span className="font-bold">Inventory Lock PIN</span>
                        </div>
                        <button onClick={() => setShowPin(!showPin)} className="text-white/20 hover:text-white transition-colors">
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/40">Enter a 4-digit PIN to lock the "Manage Inventory" page.</p>
                      <input 
                        type={showPin ? "text" : "password"} 
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                        className="w-full py-4 bg-white/10 rounded-xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                      />
                      <button onClick={handleSave} className="w-full py-3 bg-brand text-black font-bold rounded-xl text-xs transition-all active:scale-95">Set PIN Code</button>
                      {pin && <p className="text-[10px] text-brand/60 text-center font-bold">PIN is active! Manage page is now locked.</p>}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({ icon: Icon, label, desc, active, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-xl"><Icon className="w-5 h-5 text-white/60" /></div>
        <div>
          <div className="font-bold text-sm">{label}</div>
          <div className="text-[10px] text-white/20 uppercase tracking-widest">{desc}</div>
        </div>
      </div>
      <button onClick={onToggle} className={`relative w-12 h-6 rounded-full transition-all ${active ? 'bg-brand' : 'bg-white/10'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  )
}

function SettingsTabItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
        active ? "glass text-brand shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </button>
  )
}

import { useState } from 'react'
import { ShoppingCart, X, Trash2, Plus, Minus, MessageCircle, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function QuickBill() {
  const [isOpen, setIsOpen] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()

  const generateWhatsAppLink = () => {
    const shopName = "Vajra Stationery & Xerox"
    let message = `*${shopName} - Bill Summary*\n`
    message += `--------------------------\n`
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`
    })
    
    message += `--------------------------\n`
    message += `*Total: ₹${totalPrice}*\n`
    message += `\nThank you for shopping with us!`

    const encodedMessage = encodeURIComponent(message)
    // Clean the phone number (remove spaces, etc.)
    const cleanPhone = customerPhone.replace(/\D/g, '')
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (cart.length === 0 && !isOpen) return null

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[60] bg-brand text-black p-4 rounded-full shadow-2xl shadow-brand/40 flex items-center gap-2 font-black group"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0a0a]">
            {cart.length}
          </span>
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">
           Quick Bill
        </span>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md glass z-[80] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-black" />
                  </div>
                  <h2 className="text-xl font-black">Quick Bill</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="inline-flex p-4 bg-white/5 rounded-full">
                      <ShoppingCart className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-white/40">Your bill is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      className="glass rounded-2xl p-4 flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="font-bold line-clamp-1">{item.name}</div>
                        <div className="text-xs text-white/40">₹{item.price} per unit</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white/10 rounded-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white/10 rounded-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-6 glass border-t border-white/10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20 ml-1">Customer WhatsApp (Optional)</label>
                  <div className="relative group">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#25D366] transition-colors" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 7780548516"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#25D366]/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                  <span className="text-3xl font-black text-brand flex items-center">
                    <span className="text-lg mr-1 opacity-50">₹</span>{totalPrice}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={async () => {
                      // 1. Process Stock Reduction in Supabase
                      let lowStockAlerts: string[] = []
                      
                      try {
                        for (const item of cart) {
                          const newStock = item.stock - item.quantity
                          const { error } = await supabase
                            .from('products')
                            .update({ stock: newStock })
                            .eq('id', item.id)
                          
                          if (error) throw error
                          
                          if (newStock < 10) {
                            lowStockAlerts.push(`${item.name} (Remaining: ${newStock})`)
                          }
                        }

                        // 2. Generate WhatsApp Link for Customer
                        generateWhatsAppLink()

                        // 3. Handle Low Stock Alerts
                        if (lowStockAlerts.length > 0) {
                          const alertMsg = `LOW STOCK ALERT!\n${lowStockAlerts.join('\n')}`
                          alert(alertMsg)
                          
                          // Optional: Auto-trigger email draft
                          const emailSubject = encodeURIComponent("LOW STOCK ALERT: Vajra Stationery")
                          const emailBody = encodeURIComponent(`The following items are low in stock:\n\n${lowStockAlerts.join('\n')}`)
                          window.open(`mailto:madhavvadkapuram@gmail.com?subject=${emailSubject}&body=${emailBody}`)
                        }
                        
                        // Clear cart after successful transaction
                        clearCart()
                        setIsOpen(false)
                        
                      } catch (e: any) {
                        alert("Error updating inventory: " + e.message)
                      }
                    }}
                    disabled={cart.length === 0 || !customerPhone}
                    className="py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-[#25D366]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Finalize & Send to Customer
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        const shopPhone = '7780548516'
                        const shopName = "Vajra Stationery & Xerox"
                        
                        // 1. Check current stock for warnings
                        let lowStockMsg = ""
                        const { data: currentProducts } = await supabase.from('products').select('name, stock').in('id', cart.map(i => i.id))
                        
                        if (currentProducts) {
                          const lowItems = currentProducts.filter(p => p.stock < 10)
                          if (lowItems.length > 0) {
                            lowStockMsg = `\n\n⚠️ *LOW STOCK ALERT!*`
                            lowItems.forEach(item => {
                              lowStockMsg += `\n- ${item.name}: Only ${item.stock} left!`
                            })
                          }
                        }

                        let message = `*COPY: ${shopName} - Bill Summary*\n`
                        message += `--------------------------\n`
                        cart.forEach((item, index) => {
                          message += `${index + 1}. ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`
                        })
                        message += `--------------------------\n`
                        message += `*Total: ₹${totalPrice}*`
                        message += lowStockMsg
                        
                        const encodedMessage = encodeURIComponent(message)
                        window.open(`https://wa.me/91${shopPhone}?text=${encodedMessage}`, '_blank')
                      }}
                      disabled={cart.length === 0}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4 text-brand" />
                      Send to My Shop
                    </button>
                    
                    <button 
                      onClick={clearCart}
                      className="flex-1 py-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/60 font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Bill
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

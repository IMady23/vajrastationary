import { useState } from 'react'
import { ShoppingCart, X, Trash2, Plus, Minus, MessageCircle, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { ProductService } from '../services/ProductService'
import { AnalyticsService } from '../services/AnalyticsService'
import { generateReceiptPDF } from '../lib/PDFService'
import { QRCodeSVG } from 'qrcode.react'

export default function QuickBill() {
  const [isOpen, setIsOpen] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [showQR, setShowQR] = useState(false)
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()

  const taxRate = Number(localStorage.getItem('vajra_tax_rate') || '0')
  const taxAmount = (totalPrice * taxRate) / 100
  const grandTotal = totalPrice + taxAmount
  const customMessage = localStorage.getItem('vajra_whatsapp_msg') || 'Thank you for shopping!'

  const generateWhatsAppLink = () => {
    const shopName = localStorage.getItem('vajra_shop_name') || 'Vajra Stationery & Xerox'
    let message = `*${shopName} - Bill Summary*\n`
    message += `--------------------------\n`
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`
    })

    if (taxRate > 0) {
      message += `--------------------------\n`
      message += `Tax (${taxRate}%): ₹${taxAmount.toFixed(2)}\n`
    }
    
    message += `--------------------------\n`
    message += `*Total: ₹${grandTotal.toFixed(2)}*\n`
    message += `\n${customMessage}`

    const encodedMessage = encodeURIComponent(message)
    const cleanPhone = customerPhone.replace(/\D/g, '')
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const handleDownloadPDF = () => {
    const shopName = localStorage.getItem('vajra_shop_name') || 'Vajra Stationery & Xerox'
    const address = localStorage.getItem('vajra_shop_address') || ''
    
    generateReceiptPDF({
      shopName,
      address,
      customerPhone,
      customerName,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: grandTotal
    })
  }

  const upiId = localStorage.getItem('vajra_shop_upi')
  const upiUrl = upiId ? `upi://pay?pa=${upiId}&pn=Vajra%20Stationery&am=${totalPrice}&cu=INR` : null

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
                  cart.map((item, index) => {
                    const isDuplicate = cart.some((i, idx) => i.id === item.id && idx !== index)
                    return (
                      <motion.div 
                        layout
                        key={item.id}
                        className={`glass rounded-2xl p-4 flex items-center justify-between group transition-colors ${
                          isDuplicate ? 'bg-brand/10 border-brand/50 ring-1 ring-brand/30 shadow-[0_0_15px_rgba(197,160,89,0.2)]' : ''
                        }`}
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
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-6 glass border-t border-white/10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20 ml-1">Customer Name (Optional)</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Madhav"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>

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
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest px-1">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest px-1">
                      <span>GST ({taxRate}%)</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-brand/10 rounded-2xl border border-brand/20">
                    <span className="text-brand font-black uppercase tracking-widest text-xs">Grand Total</span>
                    <span className="text-3xl font-black text-brand flex items-center">
                      <span className="text-lg mr-1 opacity-50 font-sans italic">₹</span>{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {upiUrl && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <button 
                      onClick={() => setShowQR(!showQR)}
                      className="text-[10px] uppercase font-black text-brand hover:underline"
                    >
                      {showQR ? "Hide Payment QR" : "Show Payment QR"}
                    </button>
                    {showQR && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-2 rounded-xl"
                      >
                        <QRCodeSVG value={upiUrl} size={120} />
                      </motion.div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={async () => {
                      // 1. Process Stock Reduction in Firestore
                      let lowStockAlerts: string[] = []
                      
                      try {
                        for (const item of cart) {
                          if (item.id.startsWith('custom-')) continue;
                          const newStock = Math.max(0, item.stock - item.quantity)
                          await ProductService.updateProduct(item.id, { quantity: newStock, stock: newStock })
                          
                          if (newStock < 10) {
                            lowStockAlerts.push(`${item.name} (Remaining: ${newStock})`)
                          }
                        }

                        // 2. Record the Sale in Firestore
                        await AnalyticsService.createSale({
                          items: cart,
                          total: grandTotal,
                          customer_phone: customerPhone || 'Walk-in',
                          profit: grandTotal * 0.2
                        })

                        // 3. Generate WhatsApp Link for Customer
                        generateWhatsAppLink()

                        // 4. Handle Low Stock Alerts
                        if (lowStockAlerts.length > 0) {
                          const alertMsg = `LOW STOCK ALERT!\n${lowStockAlerts.join('\n')}`
                          alert(alertMsg)
                          
                          const emailSubject = encodeURIComponent("LOW STOCK ALERT: Vajra Stationery")
                          const emailBody = encodeURIComponent(`The following items are low in stock:\n\n${lowStockAlerts.join('\n')}`)
                          window.open(`mailto:madhavvadkapuram@gmail.com?subject=${emailSubject}&body=${emailBody}`)
                        }
                        
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
                        
                        let lowStockMsg = ""
                        const currentProducts = await ProductService.getProducts()
                        const lowItems = currentProducts.filter(p => p.quantity < 10)
                        if (lowItems.length > 0) {
                          lowStockMsg = `\n\n⚠️ *LOW STOCK ALERT!*`
                          lowItems.forEach(item => {
                            lowStockMsg += `\n- ${item.name}: Only ${item.quantity} left!`
                          })
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
                  
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={cart.length === 0}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand" />
                    Download PDF Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

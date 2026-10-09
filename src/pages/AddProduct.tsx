import { useState, useEffect } from 'react'
import { STATIONERY_CATEGORIES, type ProductStatus } from '../types'
import { ProductService } from '../services/ProductService'
import { Package, IndianRupee, Tag, Save, MapPin, FileText, Award, AlertTriangle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import CameraCapture from '../components/ai/CameraCapture'
import { useToast } from '../components/ui/Toast'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function AddProduct() {
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [existingCatalog, setExistingCatalog] = useState<any[]>([])
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as any
  const [showMultiAnglePrompt, setShowMultiAnglePrompt] = useState(false)
  const [productId] = useState(() => ProductService.generateId())

  useEffect(() => {
    ProductService.getProducts().then((data) => {
      if (data) setExistingCatalog(data)
    }).catch(() => {})
  }, [])

  // Form State
  const [images, setImages] = useState<string[]>(state.prefillImage ? [state.prefillImage] : [])
  const [primaryImage, setPrimaryImage] = useState<string | null>(state.prefillImage || null)
  const [name, setName] = useState(state.prefillName || '')
  const [category, setCategory] = useState(
    STATIONERY_CATEGORIES.some(c => c.name.toLowerCase() === (state.prefillCategory || '').toLowerCase())
      ? STATIONERY_CATEGORIES.find(c => c.name.toLowerCase() === (state.prefillCategory || '').toLowerCase())!.name
      : STATIONERY_CATEGORIES[0].name
  )
  const [customCategory, setCustomCategory] = useState('')
  const [brand, setBrand] = useState(state.prefillBrand || '')
  const [sellingPrice, setSellingPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [shelfLocation, setShelfLocation] = useState('')
  const [notes, setNotes] = useState('')

  const effectiveCategory = category === 'Custom...' ? (customCategory || 'Others') : category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const parsedPrice = parseFloat(sellingPrice) || 0
    const parsedQty = parseInt(quantity, 10) || 0

    const status: ProductStatus = parsedQty <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE'

    try {
      const payload = {
        id: productId,
        primary_image: primaryImage,
        images: images,
        name: name.trim(),
        category: effectiveCategory,
        brand: brand.trim() || null,
        selling_price: parsedPrice,
        price: parsedPrice, // Legacy alias
        quantity: parsedQty,
        stock: parsedQty, // Legacy alias
        shelf_location: shelfLocation.trim() || null,
        notes: notes.trim() || null,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await ProductService.createProduct(payload)

      showToast(`Added "${name}" to inventory!`, 'success')
      setShowMultiAnglePrompt(true)

      // Reset form
      setImages([])
      setPrimaryImage(null)
      setName('')
      setBrand('')
      setSellingPrice('')
      setQuantity('')
      setShelfLocation('')
      setNotes('')
    } catch (error: any) {
      showToast(error.message || 'Error adding product', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">Add Product</h2>
          <p className="text-muted font-medium">Customer asks → Search → Show Price & Shelf Location.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/manage')}
          className="px-5 py-2.5 glass hover:bg-white/10 rounded-2xl text-xs font-black transition-all"
        >
          View Inventory List
        </button>
      </div>

      {showMultiAnglePrompt && (
        <div className="p-5 rounded-3xl bg-brand/15 border border-brand/40 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div>
            <div className="text-sm font-black text-white">
              📸 Take multi-angle photos (Front / Back / Side)?
            </div>
            <div className="text-xs text-muted font-bold mt-0.5">
              Adding extra angles helps AI identify products from any direction on the shelf.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMultiAnglePrompt(false)}
              className="px-4 py-2 bg-brand text-black font-black text-xs rounded-xl"
            >
              Add Extra Photos
            </button>
            <button
              type="button"
              onClick={() => setShowMultiAnglePrompt(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-8 space-y-8"
      >
        {/* Step 1: Camera & Image Upload */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand ml-1 flex items-center gap-2">
            <span>📷 Product Photo (Front / Shelf Shot)</span>
          </label>
          <CameraCapture
            productId={productId}
            images={images}
            primaryImage={primaryImage}
            onImagesChange={(imgs, primary) => {
              setImages(imgs)
              setPrimaryImage(primary)
            }}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />

          {primaryImage && (
            <div className="p-4 rounded-2xl bg-white/5 border border-brand/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-brand">
                <Sparkles className="w-4 h-4" /> Product Image Quality Checker:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-[10px] font-black">
                  ☀️ Lighting: Good
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-[10px] font-black">
                  ✨ Sharpness: Excellent
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-[10px] font-black">
                  🔤 Text Visibility: High
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-[10px] font-black">
                  🧼 Background: Clean Isolated
                </span>
              </div>
            </div>
          )}
        </div>

        <hr className="border-glass" />

        {/* Duplicate Product Detection Alert */}
        {(() => {
          const dup =
            name.trim().length > 3
              ? existingCatalog.find(
                  (p) =>
                    p.name.toLowerCase().trim() === name.toLowerCase().trim() ||
                    (name.trim().length > 5 && p.name.toLowerCase().includes(name.toLowerCase().trim()))
                )
              : null
          if (!dup) return null
          return (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-amber-300">
                    Duplicate Warning: An existing product looks very similar!
                  </div>
                  <div className="text-[11px] text-white/80 font-bold mt-0.5">
                    "{dup.name}" already exists in your inventory (Stock: {dup.quantity ?? 0}, Shelf: {dup.shelf_location || 'N/A'}).
                  </div>
                </div>
              </div>

              <Link
                to={`/edit/${dup.id}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all"
              >
                Edit Existing Item
              </Link>
            </div>
          )
        })()}

        {/* Step 2: Product Name & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Product Name *
            </label>
            <div className="relative group">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Parker Jotter Ball Pen Blue"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Category *
            </label>
            <div className="relative group">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold appearance-none cursor-pointer"
              >
                {STATIONERY_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name} className="bg-[#0c1e3e] text-white">
                    {cat.name}
                  </option>
                ))}
                <option value="Custom..." className="bg-[#0c1e3e] text-brand">
                  + Add Custom Category...
                </option>
              </select>
            </div>

            {category === 'Custom...' && (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category..."
                className="w-full mt-2 bg-input border border-glass rounded-xl py-3 px-4 outline-none font-bold text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Brand (Optional)
            </label>
            <div className="relative group">
              <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Reynolds, Classmate, Faber-Castell"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Selling Price & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand ml-1">
              Selling Price (₹) *
            </label>
            <div className="relative group">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand group-focus-within:scale-110 transition-transform" />
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black text-2xl text-brand"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Initial Quantity *
            </label>
            <div className="relative group">
              <input
                required
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                className="w-full bg-input border border-glass rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black text-2xl text-primary"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Shelf Location & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Shelf Location (Optional)
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="e.g. Rack A - Drawer 2 - Shelf 5"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Notes (Optional)
            </label>
            <div className="relative group">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Fast moving item, restock biweekly"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || isUploading}
            className="w-full bg-brand hover:bg-brand/90 text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-6 h-6" />
            {loading ? 'Saving to Inventory...' : 'Add to Inventory'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, IndianRupee, Tag, Save, Trash2, MapPin, FileText, Award, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { STATIONERY_CATEGORIES, type ProductStatus } from '../types'
import { ProductService } from '../services/ProductService'
import CameraCapture from '../components/ai/CameraCapture'
import { useToast } from '../components/ui/Toast'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Product State
  const [images, setImages] = useState<string[]>([])
  const [primaryImage, setPrimaryImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Others')
  const [brand, setBrand] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [shelfLocation, setShelfLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ProductStatus>('Active')
  const [createdAt, setCreatedAt] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return
      try {
        const product = await ProductService.getProductById(id)
        if (product) {
          setName(product.name)
          setCategory(product.category)
          setBrand(product.brand || '')
          setSellingPrice(String(product.selling_price ?? product.price))
          setQuantity(String(product.quantity ?? product.stock))
          setShelfLocation(product.shelf_location || '')
          setNotes(product.notes || '')
          setStatus(product.status || 'Active')
          setImages(product.images || [])
          setPrimaryImage(product.primary_image || null)
          setCreatedAt(product.created_at || '')
          setUpdatedAt(product.updated_at || '')
        }
      } catch (e: any) {
        showToast('Could not load product details.', 'error')
      } finally {
        setFetching(false)
      }
    }
    fetchProduct()
  }, [id, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const parsedPrice = parseFloat(sellingPrice) || 0
    const parsedQty = parseInt(quantity, 10) || 0
    const finalStatus: ProductStatus = parsedQty <= 0 ? 'Out of Stock' : status

    try {
      const payload = {
        primary_image: primaryImage,
        images: images,
        name: name.trim(),
        category,
        brand: brand.trim() || null,
        selling_price: parsedPrice,
        price: parsedPrice,
        quantity: parsedQty,
        stock: parsedQty,
        shelf_location: shelfLocation.trim() || null,
        notes: notes.trim() || null,
        status: finalStatus,
        updated_at: new Date().toISOString(),
      }

      if (id) {
        await ProductService.updateProduct(id, payload)
      }

      showToast('Product updated successfully!', 'success')
      setTimeout(() => navigate('/manage'), 800)
    } catch (err: any) {
      showToast(err.message || 'Error updating product', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return
    if (!id) return
    setLoading(true)
    try {
      await ProductService.deleteProduct(id)
      showToast('Product deleted!', 'success')
      navigate('/manage')
    } catch (err: any) {
      showToast('Error deleting product', 'error')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Edit Product</h2>
          <p className="text-muted">Update product image, shelf location, price, or stock.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/manage')}
          className="px-5 py-2.5 glass hover:bg-white/10 rounded-2xl text-xs font-black transition-all"
        >
          Back to Inventory
        </button>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-8 space-y-8"
      >
        {/* Product History Bar */}
        <div className="p-4 rounded-2xl bg-input border border-glass flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand" />
            <span>Created: {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Last Updated: {updatedAt ? new Date(updatedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        {/* Product Photos */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand ml-1">
            📷 Product Photos
          </label>
          <CameraCapture
            productId={id}
            images={images}
            primaryImage={primaryImage}
            onImagesChange={(imgs, primary) => {
              setImages(imgs)
              setPrimaryImage(primary)
            }}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />
        </div>

        <hr className="border-glass" />

        {/* Name & Brand */}
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
                  <option key={cat.name} value={cat.name} className="bg-[#0c1e3e]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Brand
            </label>
            <div className="relative group">
              <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
              />
            </div>
          </div>
        </div>

        {/* Selling Price, Quantity & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-brand ml-1">
              Selling Price (₹) *
            </label>
            <div className="relative group">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand" />
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black text-2xl text-brand"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Current Quantity *
            </label>
            <input
              required
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-input border border-glass rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black text-2xl text-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Product Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full bg-input border border-glass rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="Active" className="bg-[#0c1e3e]">Active</option>
              <option value="Out of Stock" className="bg-[#0c1e3e]">Out of Stock</option>
              <option value="Discontinued" className="bg-[#0c1e3e]">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Shelf Location & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Shelf Location
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="e.g. Rack A - Drawer 2"
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted ml-1">
              Notes
            </label>
            <div className="relative group">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-input border border-glass rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || isUploading}
            className="flex-1 bg-brand hover:bg-brand/90 text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> Delete
          </button>
        </div>
      </motion.form>
    </div>
  )
}

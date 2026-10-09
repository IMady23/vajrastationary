import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Package, IndianRupee, MapPin, Calendar, Edit2, Trash2, ArrowLeft, PlusCircle, FileText, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import { type Product, getCategoryStyle } from '../types'
import { ProductService } from '../services/ProductService'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/ui/Toast'
import { LowStockBadge, ProductStatusBadge } from '../components/ui/LowStockBadge'
import { addRecentSearch } from '../lib/recentSearches'

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return
      try {
        const data = await ProductService.getProductById(id)
        if (data) {
          setProduct(data)
          addRecentSearch(data)
        }
      } catch (err: any) {
        showToast('Could not load product details.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, showToast])

  const handleDelete = async () => {
    if (!product) return
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      await ProductService.deleteProduct(product.id)
      showToast('Product deleted!', 'success')
      navigate('/manage')
    } catch (err: any) {
      showToast('Error deleting item', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto text-center py-24 glass rounded-3xl space-y-6 p-8">
        <Package className="w-16 h-16 text-muted mx-auto" />
        <h3 className="text-2xl font-black">Product Not Found</h3>
        <p className="text-muted">The item you are looking for may have been deleted.</p>
        <button
          onClick={() => navigate('/manage')}
          className="px-6 py-3 bg-brand text-black font-black rounded-2xl"
        >
          Back to Inventory List
        </button>
      </div>
    )
  }

  const catStyle = getCategoryStyle(product.category)
  const qty = product.quantity ?? product.stock
  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.primary_image
      ? [product.primary_image]
      : []

  const displayImage = allImages[activeImageIndex] || product.primary_image || null

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back link & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <Link
            to={`/edit/${product.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass hover:bg-brand/15 text-white hover:text-brand rounded-2xl font-black text-xs transition-all border border-glass"
          >
            <Edit2 className="w-4 h-4" /> Edit Item
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-xs transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 grid grid-cols-1 md:grid-cols-12 gap-8"
      >
        {/* Left Column: Large Image Viewer (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-square rounded-3xl bg-input border border-glass overflow-hidden flex items-center justify-center relative group">
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-center space-y-3 p-6">
                <Package className="w-16 h-16 text-brand/40 mx-auto" />
                <p className="text-xs font-bold text-muted">No Product Image Uploaded</p>
              </div>
            )}
          </div>

          {/* Multiple Image Selector Thumbnails */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand scale-95 shadow-[0_0_12px_rgba(197,160,89,0.4)]'
                      : 'border-glass opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Full Product Information (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-black px-3 py-1 rounded-full ${catStyle.badgeClass}`}>
                {product.category}
              </span>
              <ProductStatusBadge status={product.status} quantity={qty} />
              <LowStockBadge quantity={qty} />
            </div>

            {/* Name & Brand */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                {product.name}
              </h1>
              {product.brand && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-muted mt-1">
                  <Award className="w-4 h-4 text-brand" />
                  <span>Brand: {product.brand}</span>
                </div>
              )}
            </div>

            {/* Price & Shelf Location Card */}
            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-input border border-glass">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-brand font-black">
                  Selling Price
                </div>
                <div className="text-3xl font-black text-brand mt-1 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {product.selling_price ?? product.price}
                </div>
                <div className="text-[10px] text-muted font-bold mt-0.5">Customer Price</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-black">
                  Current Stock
                </div>
                <div
                  className={`text-3xl font-black mt-1 ${
                    qty > 10 ? 'text-primary' : 'text-red-400 animate-pulse'
                  }`}
                >
                  {qty} units
                </div>
                <div className="text-[10px] text-muted font-bold mt-0.5">
                  {qty <= 0 ? 'Needs immediate restock' : 'Available in shop'}
                </div>
              </div>
            </div>

            {/* Shelf Location */}
            {product.shelf_location && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black">
                    Shop Shelf Location
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {product.shelf_location}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {product.notes && (
              <div className="p-4 rounded-2xl bg-white/5 border border-glass space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted font-black flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand" /> Notes
                </div>
                <p className="text-sm text-white/80 font-medium leading-relaxed">{product.notes}</p>
              </div>
            )}

            {/* Product History */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-muted border-t border-glass">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                <span>
                  Created:{' '}
                  {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>
                  Last Updated:{' '}
                  {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                addToCart(product)
                showToast(`Added "${product.name}" to bill!`, 'success')
              }}
              className="w-full py-4 bg-brand hover:bg-brand/90 text-black font-black rounded-2xl text-lg shadow-xl shadow-brand/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-6 h-6" /> Add to Quick Bill
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

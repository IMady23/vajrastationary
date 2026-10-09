import React, { useState } from 'react'
import { CheckCircle2, Package, Save, RefreshCw, X, AlertTriangle } from 'lucide-react'
import { type Product, type Inventory } from '../../types'
import { ProductService } from '../../services/ProductService'
import { InventoryService } from '../../services/InventoryService'
import { ScanHistoryService } from '../../services/ScanHistoryService'
import { useToast } from '../ui/Toast'
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'
import { app } from '../../firebase/firebase'

interface SmartIntakePanelProps {
  prediction: any
  matchedProduct: Product | null
  imageSrc: string | null
  onComplete: () => void
  onCancel: () => void
}

export default function SmartIntakePanel({ prediction, matchedProduct, imageSrc, onComplete, onCancel }: SmartIntakePanelProps) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const isMatched = !!matchedProduct

  // Matched Mode State
  const [incomingStock, setIncomingStock] = useState('')
  const [purchasePrice, setPurchasePrice] = useState(matchedProduct?.purchase_price?.toString() || '')
  
  // New Product State
  const [unit, setUnit] = useState('pcs')
  const [sellingPrice, setSellingPrice] = useState('')
  const [supplier, setSupplier] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let uploadedImageUrl: string | undefined = undefined

      // Upload Image if available
      if (imageSrc) {
        const storage = getStorage(app)
        const storageRef = ref(storage, `scans/${Date.now()}.jpg`)
        await uploadString(storageRef, imageSrc, 'data_url')
        uploadedImageUrl = await getDownloadURL(storageRef)
      }

      let finalProductId = ''

      if (isMatched) {
        finalProductId = matchedProduct!.id
        // Matched Mode: Add Inventory
        await InventoryService.addStock({
          productId: finalProductId,
          locationId: 'main_shop', // Hardcoded to main_shop initially
          quantityToAdd: Number(incomingStock),
          purchasePrice: Number(purchasePrice),
          supplierId: supplier || undefined
        })
        showToast('Stock added successfully!', 'success')
      } else {
        // New Product Mode
        const newProd = await ProductService.createProduct({
          product_name: prediction.name,
          brand: prediction.brand,
          model: prediction.model,
          variant: prediction.variant,
          category: prediction.category,
          unit: unit as any,
          selling_price: Number(sellingPrice),
          barcode: prediction.barcode || undefined,
          image_url: uploadedImageUrl,
          current_stock: Number(incomingStock)
        })
        
        finalProductId = newProd.id

        await InventoryService.addStock({
          productId: finalProductId,
          locationId: 'main_shop',
          quantityToAdd: Number(incomingStock),
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          supplierId: supplier || undefined
        })
        
        showToast('New product created and stock added!', 'success')
      }

      // Record Scan History
      await ScanHistoryService.recordScan({
        image_url: uploadedImageUrl,
        ai_prediction: prediction,
        ai_confidence: prediction.confidence || 0,
        ai_provider: 'OPENROUTER',
        user_action: 'ACCEPTED',
        final_product_id: finalProductId
      })

      onComplete()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="glass p-6 rounded-3xl border border-white/20 shadow-xl bg-black/40 text-white backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black flex items-center gap-2">
          {isMatched ? <CheckCircle2 className="text-green-400" /> : <Package className="text-brand" />}
          {isMatched ? 'Update Existing Stock' : 'New Product Detected'}
        </h3>
        <button onClick={onCancel} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X className="w-5 h-5" /></button>
      </div>

      <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="font-bold text-lg">{isMatched ? matchedProduct.product_name : prediction.name}</p>
        <p className="text-sm text-muted">{prediction.brand} • {prediction.category}</p>
        {isMatched && (
          <div className="mt-3 flex gap-4 text-sm font-semibold">
            <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">Current Stock: {matchedProduct.current_stock}</span>
            <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">Price: ₹{matchedProduct.selling_price}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!isMatched && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Selling Price (₹)</label>
              <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Unit</label>
              <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="pcs">Pieces</option>
                <option value="box">Box</option>
                <option value="ream">Ream</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Incoming Qty</label>
            <input type="number" className="w-full bg-brand/20 border border-brand/50 rounded-xl p-3 text-white font-bold text-lg" value={incomingStock} onChange={e => setIncomingStock(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Purchase Price (₹)</label>
            <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0" />
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving || !incomingStock}
          className="w-full mt-4 py-4 bg-brand hover:bg-brand-hover text-white font-black rounded-2xl flex justify-center items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          Save to Inventory
        </button>
      </div>
    </div>
  )
}

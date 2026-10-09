import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { type ProductStatus } from '../../types'

export function LowStockBadge({ quantity }: { quantity: number }) {
  if (quantity >= 10) return null

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]">
      <AlertTriangle className="w-3 h-3" />
      {quantity <= 0 ? 'Out of Stock' : `Low Stock (${quantity})`}
    </span>
  )
}

export function ProductStatusBadge({ status, quantity }: { status?: ProductStatus; quantity: number }) {
  const effectiveStatus = status || (quantity <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE')
  const upperStatus = effectiveStatus.toUpperCase().replace(/ /g, '_')

  if (upperStatus === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    )
  }

  if (upperStatus === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" /> Out of Stock
      </span>
    )
  }

  if (upperStatus === 'HIDDEN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <Clock className="w-3 h-3" /> Hidden
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Clock className="w-3 h-3" /> Discontinued
    </span>
  )
}

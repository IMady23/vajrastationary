import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { type Inventory } from '../types'
import { StockMovementService } from './StockMovementService'
import { NotificationService } from './NotificationService'

const COLLECTION_NAME = 'inventory'

export class InventoryService {
  /**
   * Get all inventory records for a specific location
   */
  static async getInventoryByLocation(locationId: string): Promise<Inventory[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('location_id', '==', locationId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Inventory[]
    } catch (error) {
      console.error('Error fetching inventory:', error)
      return []
    }
  }

  /**
   * Get inventory record for a specific product at a specific location
   */
  static async getProductInventory(productId: string, locationId: string): Promise<Inventory | null> {
    try {
      // The ID is typically a composite: product_id_location_id
      const id = `${productId}_${locationId}`
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Inventory
      }
      return null
    } catch (error) {
      console.error('Error fetching product inventory:', error)
      return null
    }
  }

  /**
   * Initialize or update inventory and record the movement
   */
  static async addStock(params: {
    productId: string
    locationId: string
    quantityToAdd: number
    purchasePrice: number
    sellingPrice?: number
    supplierId?: string
    invoiceNumber?: string
    notes?: string
    userId?: string
  }): Promise<void> {
    try {
      const id = `${params.productId}_${params.locationId}`
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      const qtyBefore = docSnap.exists() ? docSnap.data().current_stock : 0
      const qtyAfter = qtyBefore + params.quantityToAdd

      if (docSnap.exists()) {
        // Update existing inventory
        const updates: Partial<Inventory> = {
          current_stock: qtyAfter,
          purchase_price: params.purchasePrice, // Update to latest purchase price
          updated_at: new Date().toISOString()
        }
        if (params.sellingPrice) updates.selling_price = params.sellingPrice
        if (params.supplierId) updates.supplier_id = params.supplierId
        
        await updateDoc(docRef, updates)
      } else {
        // Create new inventory record
        const newRecord: Omit<Inventory, 'id'> = {
          product_id: params.productId,
          location_id: params.locationId,
          current_stock: qtyAfter,
          minimum_stock: 5, // Default
          reorder_quantity: 10, // Default
          purchase_price: params.purchasePrice,
          selling_price: params.sellingPrice || 0,
          supplier_id: params.supplierId || null,
          updated_at: new Date().toISOString()
        }
        await setDoc(docRef, newRecord)
      }

      // Record the movement
      await StockMovementService.recordMovement({
        product_id: params.productId,
        location_id: params.locationId,
        user_id: params.userId,
        action: 'IN',
        quantity_before: qtyBefore,
        quantity_after: qtyAfter,
        purchase_price: params.purchasePrice,
        supplier_id: params.supplierId,
        invoice_number: params.invoiceNumber,
        notes: params.notes
      })

      // Check for low stock notification
      const minStock = docSnap.exists() ? docSnap.data().minimum_stock : 5
      await NotificationService.checkAndGenerateLowStockAlert(params.productId, 'Product', qtyAfter, minStock)
      
      // SYNC TO PRODUCT COLLECTION (For backward compatibility with legacy ManageProducts UI)
      const productRef = doc(db, COLLECTIONS.PRODUCTS, params.productId)
      await updateDoc(productRef, {
        current_stock: qtyAfter,
        quantity: qtyAfter,
        stock: qtyAfter,
        status: qtyAfter > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
      }).catch(e => console.warn('Legacy sync failed:', e))

    } catch (error) {
      console.error('Error adding stock:', error)
      throw error
    }
  }
}

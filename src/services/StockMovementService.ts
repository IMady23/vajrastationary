import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { type StockMovement } from '../types'

const COLLECTION_NAME = 'stock_movements'

export class StockMovementService {
  static async recordMovement(data: Omit<StockMovement, 'movement_id' | 'timestamp'>): Promise<string> {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      )
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...cleanData,
        timestamp: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording stock movement:', error)
      throw error
    }
  }

  static async getMovementsForProduct(productId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('product_id', '==', productId),
        orderBy('timestamp', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        movement_id: doc.id,
        ...doc.data()
      })) as StockMovement[]
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      return []
    }
  }
}

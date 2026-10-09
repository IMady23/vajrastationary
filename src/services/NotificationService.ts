import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/firestore'

export type NotificationType = 'LOW_STOCK' | 'SYSTEM'
export type NotificationStatus = 'UNREAD' | 'READ'

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  status: NotificationStatus
  reference_id?: string // e.g., product_id
  created_at: string
}

const COLLECTION_NAME = 'notifications'

export class NotificationService {
  /**
   * Check if an unread notification already exists for this reference (to prevent spamming)
   */
  private static async hasUnreadNotification(referenceId: string, type: NotificationType): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('reference_id', '==', referenceId),
      where('type', '==', type),
      where('status', '==', 'UNREAD')
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  }

  /**
   * Generates a Low Stock Alert if one doesn't already exist
   */
  static async checkAndGenerateLowStockAlert(productId: string, productName: string, currentStock: number, minStock: number): Promise<void> {
    if (currentStock > minStock) return // Stock is fine

    const alreadyAlerted = await this.hasUnreadNotification(productId, 'LOW_STOCK')
    if (alreadyAlerted) return // Don't spam

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${productName} is running low. Current stock: ${currentStock} (Minimum: ${minStock})`,
        status: 'UNREAD',
        reference_id: productId,
        created_at: serverTimestamp()
      })
    } catch (error) {
      console.error('Failed to generate low stock notification:', error)
    }
  }

  /**
   * Fetch all unread notifications
   */
  static async getUnreadNotifications(): Promise<AppNotification[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'UNREAD')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppNotification[]
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, { status: 'READ' })
  }
}

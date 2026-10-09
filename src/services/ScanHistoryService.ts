import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { type ScanHistory } from '../types'

const COLLECTION_NAME = 'scan_history'

export class ScanHistoryService {
  static async recordScan(data: Omit<ScanHistory, 'scan_id' | 'timestamp'>): Promise<string> {
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
      console.error('Error recording scan history:', error)
      throw error
    }
  }
}

import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db, COLLECTIONS } from '../firebase/firestore'
import { type LearningCorrection } from '../types'

export class LearningService {
  private static get collectionRef() {
    return collection(db, COLLECTIONS.LEARNING_CORRECTIONS)
  }

  /**
   * Logs a user correction when AI misclassifies a stationery product
   */
  static async recordCorrection(
    originalPredictedName: string,
    correctedProductId: string,
    correctedProductName: string,
    scanImageUrl?: string
  ): Promise<string> {
    const payload: Omit<LearningCorrection, 'id'> = {
      original_predicted_name: originalPredictedName,
      corrected_product_id: correctedProductId,
      corrected_product_name: correctedProductName,
      scan_image_url: scanImageUrl,
      created_at: new Date().toISOString()
    }

    try {
      const docRef = await addDoc(this.collectionRef, payload)
      return docRef.id
    } catch (err) {
      console.warn('Failed to record learning correction to Firestore:', err)
      return 'local_corr_' + Date.now()
    }
  }

  /**
   * Fetches recent learning corrections to fine-tune prompts or inspect AI drift
   */
  static async getCorrections(maxItems: number = 50): Promise<LearningCorrection[]> {
    try {
      const q = query(this.collectionRef, orderBy('created_at', 'desc'), limit(maxItems))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<LearningCorrection, 'id'>)
      }))
    } catch (err) {
      console.warn('Failed to fetch learning corrections:', err)
      return []
    }
  }
}

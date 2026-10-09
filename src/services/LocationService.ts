import { collection, doc, getDoc, getDocs, addDoc, updateDoc, serverTimestamp, query } from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { type Location } from '../types'

const COLLECTION_NAME = 'locations'

export class LocationService {
  static async getLocations(): Promise<Location[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[]
    } catch (error) {
      console.error('Error fetching locations:', error)
      return []
    }
  }

  static async getLocation(id: string): Promise<Location | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Location
      }
      return null
    } catch (error) {
      console.error('Error fetching location:', error)
      return null
    }
  }

  static async addLocation(data: Omit<Location, 'id' | 'created_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        created_at: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding location:', error)
      throw error
    }
  }
}

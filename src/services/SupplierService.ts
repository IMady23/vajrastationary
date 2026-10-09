import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { type Supplier } from '../types'

const COLLECTION_NAME = 'suppliers'

export class SupplierService {
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[]
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      return []
    }
  }

  static async getSupplier(id: string): Promise<Supplier | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Supplier
      }
      return null
    } catch (error) {
      console.error('Error fetching supplier:', error)
      return null
    }
  }

  static async addSupplier(data: Omit<Supplier, 'id' | 'created_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        created_at: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding supplier:', error)
      throw error
    }
  }

  static async updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, data)
    } catch (error) {
      console.error('Error updating supplier:', error)
      throw error
    }
  }
}

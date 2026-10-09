import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore 
} from 'firebase/firestore'
import { app } from './firebase'

export const COLLECTIONS = {
  PRODUCTS: 'products',
  RECOGNITIONS: 'recognitions',
  LEARNING_CORRECTIONS: 'learningCorrections',
  INVENTORY_SETTINGS: 'inventorySettings',
  USERS: 'users',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  EXPENSES: 'expenses',
} as const

let dbInstance: Firestore

try {
  // Initialize Firestore with offline persistence supporting multiple browser tabs
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
} catch (e) {
  // Fallback to standard getFirestore if already initialized
  dbInstance = getFirestore(app)
}

export const db = dbInstance

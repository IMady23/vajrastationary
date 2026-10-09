import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBMiayMGHYuASGaY42rLwyRyieXBfxjhXQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vajra-inventory-1e5e4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vajra-inventory-1e5e4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vajra-inventory-1e5e4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1091905474924",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1091905474924:web:6192ddd0945cd33c4a6349",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2T2ZS2YNGW"
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Initialize Firebase Analytics safely in browser environments
export const analytics = typeof window !== 'undefined'
  ? isSupported().then(supported => supported ? getAnalytics(app) : null)
  : null

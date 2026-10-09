import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

export const storage = getStorage(app)

/**
 * Uploads a base64 Data URL or Blob to structured Product image storage:
 * products/{productId}/{angle}.jpg (angle: 'front' | 'back' | 'side' | string)
 */
export async function uploadProductImage(productId: string, dataUrlOrBlob: string | Blob, angle: string = 'front'): Promise<string> {
  const filePath = `products/${productId}/${angle}_${Date.now()}.jpg`
  const storageRef = ref(storage, filePath)

  if (typeof dataUrlOrBlob === 'string') {
    await uploadString(storageRef, dataUrlOrBlob, 'data_url')
  } else {
    await uploadBytes(storageRef, dataUrlOrBlob)
  }

  return await getDownloadURL(storageRef)
}

/**
 * Uploads captured recognition scan photo to structured chronological storage:
 * recognitions/YYYY/MonthName/scan_timestamp.jpg
 */
export async function uploadRecognitionScan(dataUrlOrBlob: string | Blob): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const filePath = `recognitions/${year}/${monthName}/${scanId}.jpg`
  const storageRef = ref(storage, filePath)

  if (typeof dataUrlOrBlob === 'string') {
    await uploadString(storageRef, dataUrlOrBlob, 'data_url')
  } else {
    await uploadBytes(storageRef, dataUrlOrBlob)
  }

  return await getDownloadURL(storageRef)
}
